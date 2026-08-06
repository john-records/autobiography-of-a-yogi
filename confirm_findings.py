"""Second pass: check the first pass's accusations against the audio itself.

verify_narration.py transcribes a whole chapter in one go and diffs it against
the text. That finds candidates, but it cannot be trusted as a verdict, and the
reason is measured, not assumed: on Chapter_10 the long-form pass reported "my
gaze fed hungrily for a trice" as missing, a paragraph-length clip of the same
audio also missed it, and a five-second window straddling those same seconds
transcribed it perfectly. Parakeet drops runs of words on long audio. Roughly
five percent of the book came back "lost" that way, nearly all of it the ear.

So this pass re-listens to each accused paragraph in short overlapping windows,
where the transcriber is reliable, and pools every word it hears. A word the
first pass called missing that turns up in any window is dismissed. What
survives -- a word in the text that no window heard anywhere near where it
should be -- is the only thing worth putting a human ear on.

Windows, not one clip of the paragraph: the paragraph-length clip is exactly
what already failed. WIN/HOP overlap so no word is only ever cut in half.

  ./.venv-audio/bin/python confirm_findings.py [chapter_id ...]
"""
import difflib, glob, json, os, re, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "confirm")
MODEL = "mlx-community/parakeet-tdt-0.6b-v3"
WIN, HOP, PAD = 8.0, 6.0, 1.0
MIN_COMMON = 2          # findings below this were noise even in pass one


def words(s):
    return re.findall(r"[a-z0-9']+", s.lower())


def load_dict():
    p = "/usr/share/dict/words"
    if not os.path.exists(p):
        return set()
    with open(p, encoding="utf-8", errors="ignore") as f:
        return {w.strip().lower() for w in f}


def heard_in_window(asr, mp3, a, b):
    fd, wav = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a:.2f}",
                    "-to", f"{b:.2f}", "-i", mp3, "-ar", "16000", "-ac", "1", wav],
                   check=True)
    try:
        return words(asr.transcribe(wav).text)
    finally:
        os.unlink(wav)


def listen(asr, mp3, start, dur):
    """Every word heard anywhere in this paragraph, across overlapping windows.

    The bag also holds each adjacent pair run together, because where a word
    divides is a spelling decision the transcriber makes on its own: the book's
    "short cut" comes back as "shortcut" and its "market place" as
    "marketplace". Both readings are correct and neither is a dropped word.
    """
    a, end, bag = max(0.0, start - PAD), start + dur + PAD, set()
    while a < end:
        seq = heard_in_window(asr, mp3, a, min(a + WIN, end))
        bag.update(seq)
        bag.update(x + y for x, y in zip(seq, seq[1:]))
        a += HOP
    return bag


def confirm_chapter(cid, asr, vocab):
    first = json.load(open(os.path.join(ROOT, "verify", f"{cid}.json")))
    marks = json.load(open(os.path.join(ROOT, "audio", f"{cid}.json")))
    mp3 = os.path.join(ROOT, "audio", f"{cid}.mp3")

    paras = sorted({f["para"] for f in first["findings"]
                    if f["common_words_lost"] >= MIN_COMMON and f["para"] < len(marks)})
    survivors = []
    for p in paras:
        m = marks[p]
        bag = listen(asr, mp3, m["start"], m["dur"])
        # Compare the whole paragraph, not the truncated `lost` string from pass
        # one: the question is simply which of its words were never heard.
        missing = []
        src = words(m["text"])
        for k, w in enumerate(src):
            if w in bag or len(w) <= 2:
                continue
            # The other half of the join problem: the text's two words arrived
            # as one. "shortcut" in the bag acquits both "short" and "cut".
            if (k + 1 < len(src) and w + src[k + 1] in bag) or \
               (k and src[k - 1] + w in bag):
                continue
            # Heard under another spelling is heard. Sanskrit and proper names
            # arrive spelled every which way and that says nothing about the
            # reading, so a close match anywhere in the window pool acquits.
            if difflib.get_close_matches(w, bag, n=1, cutoff=0.75):
                continue
            missing.append(w)
        common = [w for w in missing if w in vocab]
        if common:
            survivors.append({
                "para": p, "at": round(m["start"], 1), "dur": round(m["dur"], 1),
                "missing": missing, "common": common, "text": m["text"],
            })
    survivors.sort(key=lambda s: -len(s["common"]))
    return {"chapter": cid, "checked_paragraphs": len(paras),
            "survivors": survivors,
            "confirmed": sum(len(s["common"]) for s in survivors),
            "pass1_common_lost": first["common_lost"]}


def main():
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or sorted(
        os.path.basename(f)[:-5] for f in glob.glob(os.path.join(ROOT, "verify", "*.json")))
    vocab = load_dict()
    from parakeet_mlx import from_pretrained
    asr = from_pretrained(MODEL)

    for cid in ids:
        dest = os.path.join(OUT, f"{cid}.json")
        if os.path.exists(dest):
            print(f"== {cid}  (already confirmed)", flush=True)
            continue
        t0 = time.time()
        r = confirm_chapter(cid, asr, vocab)
        json.dump(r, open(dest, "w"), ensure_ascii=False, indent=1)
        print(f"== {cid}  {r['checked_paragraphs']} paras re-listened  "
              f"pass1 said {r['pass1_common_lost']} lost -> {r['confirmed']} survive "
              f"in {len(r['survivors'])} paragraphs  [{time.time()-t0:.0f}s]", flush=True)
    print("ALL DONE", flush=True)


if __name__ == "__main__":
    main()
