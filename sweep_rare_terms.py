"""Render every rare term in prose and ask Parakeet what it heard.

The lexicon covers 122 terms John has now confirmed by ear. Below those sit
~650 words the dictionary doesn't know -- Bengali and Sanskrit names, mostly
appearing once or twice. Reviewing them all by ear would cost more of John's
attention than they're worth, so this narrows the list to the ones worth
looking at.

Method: put each term in a carrier sentence, render it exactly as the book
will, transcribe, and compare what came back to the spelling. A word Kokoro
says sensibly comes back close to how it's written. A word it mangles comes
back as something else.

The carrier matters. A term rendered alone is stretched by up to 2x -- Kokoro
pads short utterances, and the padding lands on the final syllable. That's the
drawl John heard on the review clips, and it is an artifact of the clip, not of
the book. Measured 2026-08-06.

This flags candidates. It does not edit lexicon.json -- same rule as
apply_spoken_corrections.py, and for the same reason: a wrong IPA costs a
re-render of a 17-hour book.

  python3 sweep_rare_terms.py            -> rare_report.md
  python3 sweep_rare_terms.py --limit 50    just the most frequent
"""
import argparse, difflib, json, os, re, subprocess, tempfile
import numpy as np, soundfile as sf

import render_passage as R

ROOT = os.path.dirname(os.path.abspath(__file__))
CARRIER = "He spoke of %s that evening."
# What the carrier contributes, so it can be subtracted from the transcript.
FRAME = {"he", "spoke", "of", "that", "evening"}


def heard_word(text):
    """The transcript minus the carrier -- i.e. what the term sounded like."""
    words = re.findall(r"[A-Za-z']+", text)
    return " ".join(w for w in words if w.lower() not in FRAME)


def spelled_out(heard):
    """espeak reads an unrecognised ALL-CAPS word letter by letter."""
    letters = [w for w in heard.split() if len(w) == 1]
    return len(letters) >= 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="only the N most frequent")
    ap.add_argument("--flag", type=float, default=0.62, metavar="RATIO",
                    help="similarity below this is reported (0-1)")
    a = ap.parse_args()

    terms = json.load(open(f"{ROOT}/rare_terms.json"))
    if a.limit:
        terms = terms[:a.limit]

    from mlx_audio.tts.utils import load_model
    from parakeet_mlx import from_pretrained
    model = load_model("prince-canuma/Kokoro-82M")
    asr = from_pretrained("mlx-community/parakeet-tdt-0.6b-v3")
    lex = json.load(open(f"{ROOT}/lexicon.json"))["terms"]
    pat, ipa_of = R.build_matcher(lex)

    rows = []
    for i, (term, count) in enumerate(terms, 1):
        text = R.apply_lexicon(R.decap(CARRIER % term), pat, ipa_of)
        audio = np.concatenate([np.asarray(s.audio) for s in model.generate(
            text=text, voice=R.VOICE, speed=R.SPEED, lang_code=R.LANG)]).astype("float32")
        w = tempfile.mktemp(suffix=".wav")
        sf.write(w, audio, R.SR)
        w16 = tempfile.mktemp(suffix=".wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w,
                        "-ar", "16000", "-ac", "1", w16], check=True)
        heard = heard_word(asr.transcribe(w16).text)
        os.unlink(w); os.unlink(w16)

        ratio = difflib.SequenceMatcher(
            None, term.lower(), heard.replace(" ", "").lower()).ratio()
        rows.append({"term": term, "count": count, "heard": heard,
                     "ratio": round(ratio, 3), "spelled_out": spelled_out(heard)})
        if i % 25 == 0:
            print(f"  {i}/{len(terms)}", flush=True)

    json.dump(rows, open(f"{ROOT}/rare_report.json", "w"), indent=1, ensure_ascii=False)

    # Worst first, weighted by how often the word actually appears -- a term
    # read wrong forty times matters more than one read wrong once.
    flagged = [r for r in rows if r["spelled_out"] or r["ratio"] < a.flag]
    flagged.sort(key=lambda r: (-r["count"] * (1 - r["ratio"])))

    with open(f"{ROOT}/rare_report.md", "w") as f:
        f.write(f"# Rare terms: {len(flagged)} of {len(rows)} worth a listen\n\n")
        f.write("`heard` is what Parakeet made of the rendered audio. Parakeet\n"
                "mangles Sanskrit even when Kokoro says it well, so a low score is\n"
                "a reason to listen, not proof of a fault.\n\n")
        f.write("| term | in book | heard as | match |\n|---|---|---|---|\n")
        for r in flagged:
            note = " **spelled out**" if r["spelled_out"] else ""
            f.write(f"| {r['term']} | {r['count']}x | {r['heard']}{note} | {r['ratio']} |\n")

    print(f"\n{len(flagged)} of {len(rows)} flagged -> rare_report.md")


if __name__ == "__main__":
    main()
