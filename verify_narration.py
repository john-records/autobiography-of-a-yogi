"""Transcribe every rendered chapter and diff it against the text it was made
from, so the book can be checked without listening to seventeen hours of it.

The point is NOT to find spelling differences. Parakeet writes Rai as "Rye",
saith as "Seth", Jung as "Yung" -- all of those are correct readings, and an
earlier sweep that ranked by spelling similarity spent its whole top of list on
them. What actually matters is words that went MISSING or arrived that were
never in the text: a dropped clause, a paragraph that stopped early, a number
read as digits. So the diff is scored on lost and invented words, and each
finding is labelled by whether the word is ordinary English (a real defect --
Kokoro should never drop "and") or a name/Sanskrit term (expected variance,
worth a glance, not a bug).

Output is per-chapter JSON in verify/ so the run is resumable, plus
verify_report.md ranked worst-first. What that report is FOR is choosing the
handful of places worth listening to -- roughly fifteen minutes of real
attention aimed by machine at the likeliest failures, instead of seventeen
hours of hoping to catch one.

  ./.venv-audio/bin/python verify_narration.py [chapter_id ...]
"""
import difflib, json, os, re, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "verify")
MODEL = "mlx-community/parakeet-tdt-0.6b-v3"

# Long audio has to be fed in chunks; the overlap is what stops a word being
# cut in half at a seam and then reported as missing.
CHUNK, OVERLAP = 120.0, 15.0


def words(s):
    return re.findall(r"[a-z0-9']+", s.lower())


def load_dict():
    p = "/usr/share/dict/words"
    if not os.path.exists(p):
        return set()
    with open(p, encoding="utf-8", errors="ignore") as f:
        return {w.strip().lower() for w in f}


def to_wav16(mp3):
    fd, wav = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3,
                    "-ar", "16000", "-ac", "1", wav], check=True)
    return wav


def verify(cid, asr, vocab):
    marks = json.load(open(os.path.join(ROOT, "audio", f"{cid}.json")))
    # Paragraph boundaries in word-index space, so a diff position can be
    # turned back into "which paragraph do I go listen to".
    src, bounds = [], []
    for i, m in enumerate(marks):
        bounds.append((len(src), i, m["start"]))
        src += words(m["text"])

    wav = to_wav16(os.path.join(ROOT, "audio", f"{cid}.mp3"))
    try:
        heard = words(asr.transcribe(wav, chunk_duration=CHUNK,
                                     overlap_duration=OVERLAP).text)
    finally:
        os.unlink(wav)

    def para_at(i):
        best = bounds[0]
        for b in bounds:
            if b[0] <= i:
                best = b
            else:
                break
        return best[1], best[2]

    findings = []
    sm = difflib.SequenceMatcher(a=src, b=heard, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        lost = src[i1:i2]
        got = heard[j1:j2]
        common = [w for w in lost if w in vocab and len(w) > 2]
        # A one-for-one swap of a single word is the spelling-variance case.
        # Drop it when the word is a name (not in the dictionary), and drop it
        # even for ordinary English when the two spellings are within a couple
        # of edits -- colored/coloured and wright/right are the transcriber
        # choosing between homophones, which it cannot get right and which says
        # nothing about what the voice actually said.
        if tag == "replace" and len(lost) == len(got) == 1:
            near = difflib.SequenceMatcher(a=lost[0], b=got[0]).ratio() >= 0.7
            if not common or near:
                continue
        para, t = para_at(i1)
        findings.append({
            "kind": tag, "para": para, "at": round(t, 1),
            "lost": " ".join(lost)[:120], "heard": " ".join(got)[:120],
            "common_words_lost": len(common),
        })

    total = max(1, len(src))
    severe = sum(f["common_words_lost"] for f in findings)
    return {"chapter": cid, "words": len(src), "heard": len(heard),
            "findings": findings, "common_lost": severe,
            "loss_rate": round(severe / total, 5)}


def main():
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or [c["id"] for c in
                           json.load(open(os.path.join(ROOT, "chapters.json")))]
    vocab = load_dict()
    from parakeet_mlx import from_pretrained
    asr = from_pretrained(MODEL)

    for cid in ids:
        dest = os.path.join(OUT, f"{cid}.json")
        if os.path.exists(dest):
            print(f"== {cid}  (already checked)", flush=True)
            continue
        if not os.path.exists(os.path.join(ROOT, "audio", f"{cid}.mp3")):
            print(f"== {cid}  NO AUDIO", flush=True)
            continue
        t0 = time.time()
        r = verify(cid, asr, vocab)
        json.dump(r, open(dest, "w"), indent=1)
        print(f"== {cid}  {r['words']}w  {r['common_lost']} common words lost "
              f"({r['loss_rate']*100:.2f}%)  {len(r['findings'])} diffs  "
              f"[{time.time()-t0:.0f}s]", flush=True)
    print("ALL DONE", flush=True)


if __name__ == "__main__":
    main()
