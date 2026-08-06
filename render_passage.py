"""Render real chapters to audio -- the production path, runnable on a subset.

This is the thing the whole lexicon exists to serve: prose, at speed, with the
Sanskrit terms coming out right *in context*. Clips can't tell us that. A term
can sound perfect alone and wrong in a sentence, because the sentence gives it
stress and rhythm the isolated word doesn't have.

Deliberate choices, matching what was agreed:
  * Footnotes are not read. They're <sup> tags in the source; they come out.
  * Every paragraph is rendered separately, so we get a paragraph -> timestamp
    map for free. That's what a highlight-follows-audio reader would need later.
  * Identical voice, speed and IPA path to render_lexicon_clips.py, so a clip
    John approved is the same sound the book will make.

  python3 render_passage.py Chapter_2                 whole chapter
  python3 render_passage.py Chapter_2 --paras 0:8     just the opening
  python3 render_passage.py --list                    what's available
"""
import argparse, html, json, os, re, subprocess, sys, time
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "audio")
SR = 24000
VOICE, SPEED, LANG = "hm_psi", 0.85, "b"   # Hindi voice, British/English G2P
GAP = 0.35                                  # seconds of silence between paragraphs

# ---------------------------------------------------------------- text

def plain(block_html):
    """The words a narrator should actually say."""
    s = re.sub(r"<sup\b[^>]*>.*?</sup>", "", block_html, flags=re.S)  # footnote refs
    s = re.sub(r"<br\s*/?>", " ", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

# A dash is a pause, and Kokoro does not treat it as one -- it runs straight
# through "acceptance--typical of the French mind in the West-is really", which
# is the sentence that made this necessary. A comma is the closest thing the
# voice does hear: a brief break, no falling intonation. Applied to the spoken
# copy only; the page keeps the author's punctuation.
#
# The single-hyphen case is the awkward one, because this text has 1,518
# legitimate hyphens (near-by, Self-Realization, twenty-five) and only a handful
# of em dashes that lost a character somewhere in their history. What separates
# them is what sits on the right: an English compound never ends in "is", "the"
# or "that", so a function word there means the hyphen was once a dash. "by" is
# deliberately NOT in that list -- it would take "Good-by" and "near-by" with it.
DASH_PAIR = re.compile(r"\s*(?:--+|[—–])\s*")
DASH_FUNC = re.compile(
    r"(?<![A-Za-z-])([A-Za-z]+)-(is|was|are|were|the|and|but|or|that|it|he|she|"
    r"they|we|his|her|their|this|with|as|for|not|had|has|have|in|my|me|you|him|"
    r"them|there|then|when|if|so|yet|from|at|on)(?![A-Za-z-])", re.I)


def pauses(text):
    """Dashes the voice can hear, as commas. Spoken copy only."""
    return DASH_FUNC.sub(r"\1, \2", DASH_PAIR.sub(", ", text))


def dash_hooks(text):
    """The pair of words each dash sits between, lowercased.

    Punctuation cannot buy the pause. Probing this voice with one sentence
    written nine ways -- comma, semicolon, colon, ellipsis, dash, full stop --
    every version came back within 0.02s of the version with no punctuation at
    all. Kokoro's pauses are its own, so the silence has to be spliced in after
    the fact, and these pairs are how smooth_pauses locates the spot: not by
    Parakeet's sentence breaks, which do not fall at a dash, but by finding the
    two words in its word stream and cutting between them.
    """
    hooks = []
    for m in DASH_PAIR.finditer(text):
        before = re.findall(r"[A-Za-z']+", text[:m.start()])
        after = re.findall(r"[A-Za-z']+", text[m.end():m.end() + 40])
        if before and after:
            hooks.append((before[-1].lower(), after[0].lower()))
    hooks += [(m.group(1).lower(), m.group(2).lower()) for m in DASH_FUNC.finditer(text)]
    return set(hooks)


ROMAN = re.compile(r"^[IVXLCDM]+$")

# Words that end in a period without ending a sentence.
ABBREV = {"mr", "mrs", "ms", "dr", "st", "jr", "sr", "vs", "prof", "rev",
          "no", "vol", "ch", "pp", "cf", "ca", "etc", "inc", "col", "gen", "capt"}
BREAK = re.compile(r"[.!?][\"'”’)]*\s+")
LASTWORD = re.compile(r"([A-Za-z]+)\.[\"'”’)]*\s*$")

def sentences(text):
    """Split into sentences so the pause between them can be chosen, not inherited.

    Kokoro renders a whole paragraph as one utterance, and its own sentence-final
    pauses are inconsistent -- some as short as 70ms, which is what reads as
    rushed. Rendering each sentence separately costs speed but makes the pacing
    deliberate rather than incidental.

    A period is only a boundary if what follows starts like a sentence and what
    precedes isn't an abbreviation or a bare initial ("A. C. Ghosh").
    """
    out, start = [], 0
    for m in BREAK.finditer(text):
        nxt = text[m.end():m.end() + 1]
        if not (nxt.isupper() or nxt.isdigit() or nxt in "\"'“‘("):
            continue
        w = LASTWORD.search(text[start:m.end()])
        if w and (w.group(1).lower() in ABBREV or len(w.group(1)) == 1):
            continue
        out.append(text[start:m.end()].strip())
        start = m.end()
    tail = text[start:].strip()
    if tail:
        out.append(tail)
    return [s for s in out if s]

DASH_FLOOR = 0.32   # a dash is a caught breath, not a full stop
FADE = 0.008        # seconds of taper on each side of a splice


def quietest(audio, at, sr, radius=0.07):
    """The lowest-energy moment within `radius` of `at`, in seconds.

    Cutting a waveform anywhere it is loud leaves a step, and a step is a click.
    """
    lo = max(0, int((at - radius) * sr))
    hi = min(len(audio), int((at + radius) * sr))
    if hi - lo < 2:
        return at
    win = max(1, int(0.004 * sr))
    seg = np.abs(audio[lo:hi])
    n = (hi - lo) // win
    if n < 2:
        return at
    e = np.array([seg[i * win:(i + 1) * win].mean() for i in range(n)])
    return (lo + (int(e.argmin()) + 0.5) * win) / sr


def smooth_pauses(audio, asr, floor, sr=SR, dashes=()):
    """Lengthen only the sentence-end pauses that came out too short.

    The paragraph is rendered as one utterance and never re-rendered, so every
    bit of Kokoro's prosody survives -- this only splices silence into gaps that
    already exist. Rendering sentence by sentence was tried first and rejected
    by ear: even gaps weren't worth the prosody lost to breaking the paragraph up.

    Parakeet segments its own transcript into sentences with timestamps, so it
    reports where a listener hears the sentence end, which is a better signal
    than where the source text puts a full stop. Gaps at or above the floor are
    left exactly as they are, so the natural long pauses stay natural.

    Returns (audio, number of gaps padded, seconds added).
    """
    import soundfile as sf, tempfile, subprocess
    w24 = tempfile.mktemp(suffix=".wav"); sf.write(w24, audio, sr)
    w16 = tempfile.mktemp(suffix=".wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w24,
                    "-ar", "16000", "-ac", "1", w16], check=True)
    sents = getattr(asr.transcribe(w16), "sentences", None) or []
    os.remove(w24); os.remove(w16)

    def last_word_end(sent):
        """End of the last token with letters in it.

        A sentence's own start/end are contiguous with its neighbours -- every
        gap measures 0.00s -- and the trailing "." token absorbs the silence
        too, so both report no pause at all and everything looks short. The
        last audible word is the only honest edge.
        """
        for t in reversed(sent.tokens):
            if any(c.isalnum() for c in t.text):
                return t.end
        return sent.end

    def whole_words():
        """Parakeet's tokens are word PIECES -- the last token of "acceptance"
        is "ction". Glue them back into words with their times, so a dash can be
        found by the two words it sits between."""
        ws = []
        for s in sents:
            for t in s.tokens:
                bare = "".join(c for c in t.text if c.isalpha() or c == "'").lower()
                if t.text.startswith(" ") or not ws:
                    ws.append([bare, t.start, t.end])
                else:
                    ws[-1][0] += bare
                    ws[-1][2] = t.end
        return [w for w in ws if w[0]]

    inserts = []
    # Dashes first: they are found by position in the word stream, not by
    # Parakeet's sentence breaks, which do not fall at a comma.
    if dashes:
        ws = whole_words()
        for i in range(len(ws) - 1):
            if (ws[i][0], ws[i + 1][0]) not in dashes:
                continue
            gap = ws[i + 1][1] - ws[i][2]
            if 0 <= gap < DASH_FLOOR:
                # A sentence gap has real silence to splice into; a dash often
                # has none -- "West-is" is spoken as one unbroken run -- so the
                # midpoint can land mid-vowel and the join clicks. Put the cut
                # at the quietest sample nearby instead.
                at = quietest(audio, (ws[i][2] + ws[i + 1][1]) / 2, sr)
                inserts.append((at, DASH_FLOOR - gap))

    for a, b in zip(sents, sents[1:]):
        # Parakeet also breaks at commas and clause edges. Padding those drops
        # silence mid-phrase -- it put 300ms inside "Kri, to do, to act and
        # react." Only trust a break its punctuation model ended with a stop,
        # or one standing exactly where the text had a dash.
        if not a.text.strip().endswith((".", "!", "?", '."', ".'", '?"', '!"')):
            continue
        want = floor
        end, nxt = last_word_end(a), b.tokens[0].start if b.tokens else b.start
        gap = nxt - end
        if 0 <= gap < want:
            # Splice mid-silence, so neither the outgoing breath nor the
            # incoming onset gets clipped.
            inserts.append(((end + nxt) / 2, want - gap))
    if not inserts:
        return audio, 0, 0.0

    inserts.sort()          # dash and sentence pads are found in separate passes
    n = max(1, int(FADE * sr))
    ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n, dtype=np.float32))

    def fade(seg, head=False, tail=False):
        """Ease a cut edge down to zero. Splicing silence into a syllable leaves a
        step in the waveform, and a step is the click John heard after "West"."""
        if len(seg) < 2 * n:
            return seg
        seg = seg.copy()
        if head:
            seg[:n] *= ramp
        if tail:
            seg[-n:] *= ramp[::-1]
        return seg

    out, prev, added = [], 0, 0.0
    for at, extra in inserts:
        i = min(len(audio), max(0, int(at * sr)))
        if i < prev:
            continue
        out += [fade(audio[prev:i], head=bool(out), tail=True),
                np.zeros(int(extra * sr), dtype=np.float32)]
        prev, added = i, added + extra
    out.append(fade(audio[prev:], head=True))
    return np.concatenate(out), len(inserts), added

def trim(a, thr=0.015, keep=0.02, sr=SR):
    """Strip a segment's own leading/trailing silence, leaving a hair.

    Without this the designed pause is added on top of however much silence
    Kokoro happened to leave, and the pacing is uneven again for a new reason.
    """
    loud = np.where(np.abs(a) > thr)[0]
    if len(loud) == 0:
        return a
    k = int(keep * sr)
    return a[max(0, loud[0] - k): min(len(a), loud[-1] + k)]

def decap(text):
    """Take the shout out of Wikisource's ALL-CAPS before it reaches espeak.

    Wikisource capitalises Sanskrit terms and the odd emphatic English word.
    espeak reads an unrecognised all-caps word as an acronym, letter by letter:
    DHAL comes out "D.H.L." Title case alone fixes that -- "dihal" is wrong but
    it is at least a word, and a lexicon entry can then correct it. Words that
    do have an IPA override are unaffected either way, since their letters are
    never pronounced.

    Roman numerals are left alone; "Ii" would be worse than "II".
    """
    return re.sub(r"\b[A-Z]{2,}\b",
                  lambda m: m.group(0) if ROMAN.match(m.group(0)) else m.group(0).title(),
                  text)

def build_matcher(lex):
    """One alternation over every term that has an IPA, longest first.

    Longest first matters: without it "Yoga" fires inside "Yogananda" and the
    name is mangled. One combined pass also means a replacement can't be
    re-matched by a later term.
    """
    terms = [t for t, e in lex.items() if e.get("ipa")]
    terms.sort(key=len, reverse=True)
    if not terms:
        return None, {}
    pat = re.compile(r"\b(" + "|".join(re.escape(t) for t in terms) + r")\b", re.I)
    return pat, {t.lower(): lex[t]["ipa"] for t in terms}

def apply_lexicon(text, pat, ipa_of, hits=None):
    """Wrap known terms in misaki's [word](/ipa/) override.

    The bracketed text is only what's displayed to the tokeniser; the IPA is
    what's spoken. So the original casing is kept and costs nothing -- KRIYA
    doesn't get shouted, because the letters aren't what's pronounced.
    """
    if not pat:
        return text
    def sub(m):
        w = m.group(1)
        if hits is not None:
            hits[w] = hits.get(w, 0) + 1
        return f"[{w}](/{ipa_of[w.lower()]}/)"
    return pat.sub(sub, text)

# ---------------------------------------------------------------- audio

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chapter", nargs="?", help="chapter id, e.g. Chapter_2")
    ap.add_argument("--paras", help="paragraph range, e.g. 0:8")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--name", help="output basename (default: the chapter id)")
    ap.add_argument("--pause", type=float, default=0.0,
                    help="seconds between sentences. 0 (the default) renders each "
                         "paragraph as one utterance and keeps Kokoro's own pauses. "
                         "A positive value renders sentence by sentence and sets the "
                         "gap deliberately -- tried at 0.22/0.28/0.38 and rejected by "
                         "ear on 2026-08-06: the even gaps don't make up for the "
                         "prosody lost by breaking the paragraph into separate "
                         "utterances. Kept because it costs nothing to keep.")
    ap.add_argument("--smooth", type=float, default=0.45, metavar="SECONDS",
                    help="minimum pause at a sentence end. Keeps the paragraph "
                         "rendered whole and only splices silence into gaps that "
                         "fall short of this, so the prosody is untouched and the "
                         "naturally long pauses stay long. 0 disables it. "
                         "0.45 chosen by ear on 2026-08-06 over 0.30 and 0.35 -- "
                         "unlike the fixed --pause above, this is the version John "
                         "kept, because it leaves the good pauses alone.")
    a = ap.parse_args()

    chapters = json.load(open(f"{ROOT}/chapters.json"))
    if a.list or not a.chapter:
        for c in chapters:
            print(f"  {c['id']:<14} {len(c['blocks']):>4} paras   {c['title']}")
        return

    ch = next((c for c in chapters if c["id"] == a.chapter), None)
    if ch is None:
        sys.exit(f"No chapter {a.chapter!r}. Try --list.")

    # The same predicate as AOY.renderableBlocks() in shared.js, which decides
    # the <p> elements audio.js highlights. The two lists are indexed against
    # each other, so they must filter identically: if this side ever keeps or
    # drops a block the reader doesn't, every highlight past that point lands
    # on the wrong paragraph.
    blocks = [b for b in ch["blocks"]
              if b.get("type") == "p" and (b.get("html") or "").strip()]
    lo, hi = 0, len(blocks)
    if a.paras:
        lo, hi = (int(x) if x else d for x, d in zip(a.paras.split(":"), (0, len(blocks))))
    paras = [plain(b["html"]) for b in blocks[lo:hi]]
    # A block of nothing but a footnote marker comes back empty from plain().
    # It still renders as a <p>, so it keeps its slot and is spoken as silence.
    # Dropping it would shift every later index by one -- the exact failure the
    # filter above exists to prevent.
    blank = sum(1 for p in paras if not p)
    if blank:
        print(f"  !! {blank} paragraph(s) empty once footnotes were removed; "
              f"holding their slots as silence", flush=True)

    lex = json.load(open(f"{ROOT}/lexicon.json"))["terms"]
    pat, ipa_of = build_matcher(lex)
    hits = {}
    # paras stays as written -- it's what the reader will display and highlight.
    # Only the copy handed to the voice gets de-shouted.
    spoken = [pauses(decap(p)) for p in paras]
    hooks = [dash_hooks(decap(p)) for p in paras]
    marked = [apply_lexicon(s, pat, ipa_of, hits) for s in spoken]

    words = sum(len(p.split()) for p in paras)
    print(f"{ch['title']}")
    print(f"  paragraphs {lo}..{hi}  ({len(paras)} non-empty, {words} words)")
    print(f"  lexicon terms in this passage: {sum(hits.values())} "
          f"across {len(hits)} distinct")
    if hits:
        top = sorted(hits.items(), key=lambda kv: -kv[1])[:12]
        print("    " + ", ".join(f"{w}×{n}" for w, n in top))

    os.makedirs(OUT, exist_ok=True)
    base = a.name or (a.chapter + (f"_{lo}-{hi}" if a.paras else ""))

    from mlx_audio.tts.utils import load_model
    model = load_model("prince-canuma/Kokoro-82M")

    pieces, index, t0 = [], [], time.time()
    gap = np.zeros(int(GAP * SR), dtype=np.float32)
    def render(text):
        if not text.strip():
            return np.zeros(0, dtype=np.float32)
        chunks = [r.audio for r in model.generate(text=text, voice=VOICE,
                                                  speed=SPEED, lang_code=LANG)]
        return np.concatenate([np.asarray(c).reshape(-1) for c in chunks])

    _asr = []
    def get_asr():
        if not _asr:
            from parakeet_mlx import from_pretrained
            _asr.append(from_pretrained("mlx-community/parakeet-tdt-0.6b-v3"))
        return _asr[0]

    padded = [0, 0.0]
    pause = np.zeros(int(a.pause * SR), dtype=np.float32)
    for i, (text, spoken) in enumerate(zip(marked, paras)):
        if a.pause > 0:
            parts = []
            for s in sentences(text):
                parts += [trim(render(s)), pause]
            audio = np.concatenate(parts[:-1]) if parts else np.zeros(0, np.float32)
        else:
            audio = render(text)
        if a.smooth > 0:
            audio, n, added = smooth_pauses(audio, get_asr(), a.smooth,
                                            dashes=hooks[i])
            padded[0] += n; padded[1] += added
        start = sum(len(p) for p in pieces) / SR
        index.append({"para": lo + i, "start": round(start, 2),
                      "dur": round(len(audio) / SR, 2), "text": spoken})
        pieces += [audio, gap]
        print(f"  {i+1:3d}/{len(marked)}  {len(audio)/SR:5.1f}s", flush=True)

    full = np.concatenate(pieces)
    secs, elapsed = len(full) / SR, time.time() - t0
    wav = os.path.join(OUT, base + ".wav")
    mp3 = os.path.join(OUT, base + ".mp3")
    sf.write(wav, full, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav,
                    "-b:a", "64k", "-ac", "1", mp3], check=True)
    os.remove(wav)
    json.dump(index, open(os.path.join(OUT, base + ".json"), "w"),
              ensure_ascii=False, indent=1)

    if a.smooth > 0:
        print(f"\n  padded {padded[0]} short sentence gaps up to {a.smooth}s "
              f"(+{padded[1]:.1f}s total)")
    print(f"\n  {mp3}")
    print(f"  {secs/60:.1f} min of audio in {elapsed/60:.1f} min "
          f"({secs/elapsed:.1f}x realtime)")
    print(f"  paragraph timings -> {base}.json")

if __name__ == "__main__":
    main()
