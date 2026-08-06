"""Turn what survived confirm_findings.py into a page you can work through.

The whole chain exists to spend a human ear well. Pass one accused about five
percent of the book; pass two re-listened in short windows and dismissed almost
all of it as the transcriber's own dropouts. What is left is a short list of
places where a real English word is in the text and no window heard it -- which
in practice means the voice said something else. "ocher" arriving as "usher" is
the shape of it.

No clips are cut. Each row plays a window straight out of the chapter mp3 and
stops itself at the end of the paragraph, so this adds not one byte to the 508MB
already on disk. It needs serve_audio.py, because seeking into a chapter is a
Range request and python -m http.server cannot answer one.

  ./.venv-audio/bin/python build_narration_review.py
  ./.venv-audio/bin/python serve_audio.py 8903      then open /narration_review.html
"""
import glob, html, json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "narration_review.html")
LEAD = 1.5          # seconds before the paragraph, so it doesn't start cold


def rows():
    titles = {c["id"]: c["title"] for c in json.load(open(f"{ROOT}/chapters.json"))}
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, "confirm", "*.json"))):
        d = json.load(open(f))
        for s in d["survivors"]:
            out.append({**s, "chapter": d["chapter"],
                        "title": titles.get(d["chapter"], d["chapter"])})
    # Worst first: most flagged words, then longest paragraph, so the rows most
    # likely to be a real defect are the ones listened to while attention is fresh.
    out.sort(key=lambda r: (-len(r["common"]), -r["dur"]))
    return out


def mark(text, flagged):
    """The paragraph as written, with the suspect words picked out."""
    want = {w.lower() for w in flagged}
    parts, buf = [], ""
    for ch in text:
        if ch.isalpha() or ch == "'":
            buf += ch
            continue
        if buf:
            parts.append(f"<b>{html.escape(buf)}</b>" if buf.lower() in want
                         else html.escape(buf))
            buf = ""
        parts.append(html.escape(ch))
    if buf:
        parts.append(f"<b>{html.escape(buf)}</b>" if buf.lower() in want
                     else html.escape(buf))
    return "".join(parts)


def main():
    rs = rows()
    cards = []
    for i, r in enumerate(rs):
        start = max(0.0, r["at"] - LEAD)
        cards.append(f"""
<article class="row" id="r{i}">
  <div class="meta">
    <span class="n">{i + 1}</span>
    <span class="ch">{html.escape(r['title'])}</span>
    <span class="ts">para {r['para']} &middot; {int(r['at'] // 60)}:{int(r['at'] % 60):02d} &middot; {r['dur']:.0f}s</span>
    <span class="flag">{html.escape(', '.join(r['common']))}</span>
  </div>
  <p class="text">{mark(r['text'], r['common'])}</p>
  <div class="acts">
    <button class="play" data-src="audio/{r['chapter']}.mp3"
            data-start="{start:.2f}" data-end="{r['at'] + r['dur'] + 0.5:.2f}">&#9654; listen</button>
    <label><input type="radio" name="v{i}" value="ok"> reads fine</label>
    <label><input type="radio" name="v{i}" value="bad"> wrong</label>
  </div>
</article>""")

    doc = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Narration review — {len(rs)} places to listen</title>
<style>
 body {{ font:15px/1.6 -apple-system,system-ui,sans-serif; max-width:820px;
        margin:0 auto; padding:28px 18px 120px; color:#222; background:#faf8f4; }}
 h1 {{ font-size:22px; margin:0 0 4px; }}
 .lede {{ color:#666; font-size:14px; margin:0 0 26px; }}
 .row {{ border:1px solid #e4ded2; border-radius:10px; padding:14px 16px;
        margin:0 0 14px; background:#fff; }}
 .row.done {{ opacity:.45; }}
 .meta {{ display:flex; gap:10px; align-items:baseline; flex-wrap:wrap;
         font-size:12px; color:#777; margin-bottom:8px; }}
 .n {{ font-weight:600; color:#9a6b3f; }}
 .ch {{ font-weight:600; color:#444; }}
 .flag {{ margin-left:auto; font-weight:600; color:#b4472f; }}
 .text {{ margin:0 0 12px; }}
 .text b {{ background:#ffe9a8; font-weight:600; padding:0 2px; border-radius:2px; }}
 .acts {{ display:flex; gap:14px; align-items:center; font-size:13px; color:#555; }}
 button.play {{ font:inherit; padding:5px 14px; border:1px solid #9a6b3f; color:#9a6b3f;
        background:#fff; border-radius:20px; cursor:pointer; }}
 button.play.on {{ background:#9a6b3f; color:#fff; }}
 #bar {{ position:fixed; left:0; right:0; bottom:0; padding:10px 18px; background:#fff;
        border-top:1px solid #e4ded2; font-size:13px; display:flex; gap:16px; align-items:center; }}
 #bar button {{ font:inherit; padding:5px 12px; border-radius:16px; border:1px solid #ccc;
        background:#fff; cursor:pointer; }}
</style></head><body>
<h1>Narration review</h1>
<p class="lede">{len(rs)} paragraphs where a real English word is in the text and no
short window of the audio heard it. Everything the whole-chapter transcriber
merely <em>thought</em> was missing has already been dismissed by re-listening.
Play, judge, move on — you are not proof-reading the book, only these spots.</p>
{''.join(cards)}
<div id="bar">
  <span id="tally">0 judged</span>
  <button id="copy">Copy the wrong ones</button>
  <button id="reset">Clear judgements</button>
</div>
<script>
const KEY = "aoy-narration-review";
const saved = JSON.parse(localStorage.getItem(KEY) || "{{}}");
const audio = new Audio(); let stopAt = 0, current = null;
audio.addEventListener("timeupdate", () => {{
  if (stopAt && audio.currentTime >= stopAt) {{ audio.pause(); mark(null); }}
}});
function mark(btn) {{
  document.querySelectorAll("button.play.on").forEach(b => b.classList.remove("on"));
  current = btn; if (btn) btn.classList.add("on");
}}
document.querySelectorAll("button.play").forEach(btn => {{
  btn.addEventListener("click", () => {{
    if (current === btn && !audio.paused) {{ audio.pause(); mark(null); return; }}
    const src = btn.dataset.src;
    // Only reload when the chapter changes; re-setting src would refetch and
    // lose the seek we are about to make.
    if (!audio.src.endsWith(src)) audio.src = src;
    stopAt = parseFloat(btn.dataset.end);
    const go = () => {{ audio.currentTime = parseFloat(btn.dataset.start); audio.play(); }};
    if (audio.readyState >= 1) go();
    else audio.addEventListener("loadedmetadata", go, {{ once: true }});
    mark(btn);
  }});
}});
function tally() {{
  const n = Object.keys(saved).length;
  const bad = Object.values(saved).filter(v => v === "bad").length;
  document.getElementById("tally").textContent =
    n + " judged of {len(rs)}" + (bad ? " — " + bad + " wrong" : "");
}}
document.querySelectorAll("input[type=radio]").forEach(r => {{
  const i = r.name.slice(1);
  if (saved[i] === r.value) {{ r.checked = true; r.closest(".row").classList.add("done"); }}
  r.addEventListener("change", () => {{
    saved[i] = r.value; localStorage.setItem(KEY, JSON.stringify(saved));
    r.closest(".row").classList.add("done"); tally();
  }});
}});
document.getElementById("copy").addEventListener("click", () => {{
  const lines = Object.entries(saved).filter(([, v]) => v === "bad")
    .map(([i]) => {{
      const row = document.getElementById("r" + i);
      return row.querySelector(".ch").textContent + " " +
             row.querySelector(".ts").textContent + " — " +
             row.querySelector(".flag").textContent;
    }});
  navigator.clipboard.writeText(lines.join("\\n") || "(none marked wrong)");
  document.getElementById("copy").textContent = "copied " + lines.length;
}});
document.getElementById("reset").addEventListener("click", () => {{
  localStorage.removeItem(KEY); location.reload();
}});
tally();
</script></body></html>"""
    open(OUT, "w", encoding="utf-8").write(doc)
    print(f"{OUT}  ({len(rs)} paragraphs to listen to, "
          f"{sum(r['dur'] for r in rs) / 60:.0f} minutes of audio)")


if __name__ == "__main__":
    main()
