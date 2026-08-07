#!/usr/bin/env python3
"""Give every chapter a real URL.

The reader is a single page: index.html renders all 49 chapters from data.js,
client-side, with no routing of any kind. To a crawler that is one URL with one
<title>, and the book is invisible. This script emits a static HTML page per
chapter that the existing app.js/audio.js hydrate on top of, so the reading
experience is unchanged while every chapter becomes addressable, linkable and
indexable.

Emitted into the repo root (all regenerable; `--clean` removes them):

    <slug>/index.html     one per chapter, e.g. 1-my-parents-and-early-life/
    colophon/index.html   credits and provenance
    slugs.js              window.AOY_SLUGS, the id -> slug map the reader uses
    transcripts/<id>.vtt  timed text, from the per-paragraph narration timings
    sitemap.xml           every page, absolute, under CANONICAL_BASE
    robots.txt

and it fills the <!-- BUILD:TOC --> region of index.html with a static contents
list so the crawl has an entry point that does not depend on JavaScript.

Two constraints from index.html shape the output and are not negotiable here:

  * `script-src 'self'` with no 'unsafe-inline'. So no inline bootstrap script:
    per-page config travels in <meta> tags. The one inline block that must
    exist -- the JSON-LD -- is admitted by its own sha256 hash, added to that
    page's CSP only. Whether a browser enforces script-src against
    application/ld+json is inconsistent (Chrome does not, Safari has), and a
    hash costs nothing next to finding out in production.
  * `base-uri 'none'`, so no <base href>. Chapter pages sit one directory down
    and reference assets through AOY_BASE ("../"), which shared.js reads from
    the meta tag and audio.js prepends to its fetches.

Canonical always points at johnrecords.org, from every host. The here.now and
GitHub Pages copies stay crawlable on purpose: a copy blocked by robots.txt
cannot be read, so its canonical is never seen and the duplicate is never
consolidated. Let them be crawled, and let the canonical do its job.

Run from anywhere:  ./.venv-audio/bin/python scripts/build_static.py
"""

import argparse
import base64
import hashlib
import html
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CANONICAL_BASE = "https://johnrecords.org/autobiography-of-a-yogi/"
SITE_TITLE = "Autobiography of a Yogi"
AUTHOR = "Paramahansa Yogananda"

# Read out of index.html, not hardcoded. index.html is the one page a human
# edits, so it is the authority on the current cache buster; a constant here
# would drift silently the moment someone bumped it there. Drift would only be
# cosmetic -- sync-herenow.sh rewrites every ?v= at deploy time with the real
# content hash -- but silent drift is worth not having.
def _asset_version():
    with open(os.path.join(ROOT, "index.html")) as fh:
        m = re.search(r"app\.js\?v=([0-9a-zA-Z]+)", fh.read())
    if not m:
        raise SystemExit("build_static: no app.js?v= in index.html")
    return m.group(1)


ASSET_V = _asset_version()

ASSETS_JS = ["data.js", "annotations.js", "footnote_overrides.js", "slugs.js",
             "shared.js", "app.js", "audio.js"]

# Mirrors index.html. {extra} is where a page's JSON-LD hash is spliced in.
CSP = (
    "default-src 'self'; script-src 'self'{extra}; "
    "style-src 'self' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' https://commons.wikimedia.org https://upload.wikimedia.org data:; "
    "connect-src 'self'; base-uri 'none'; form-action 'none'; frame-src 'none'"
)


# ---------------------------------------------------------------- data

def load_chapters():
    """Parse window.CHAPTERS out of data.js.

    data.js, not chapters.json: data.js is what the reader actually loads, and
    it is the cleaned form (scripts/clean_data.mjs). Pre-rendering from any
    other source risks the static HTML and the hydrated HTML disagreeing.
    """
    src = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    chapters = json.loads(src[src.index("["):src.rindex("]") + 1])
    # Same ordering rule as app.js: Preface first, then true numeric order
    # (the raw data is lexicographic, so Chapter_10 sorts before Chapter_2).
    def key(c):
        if c["id"] == "Preface":
            return -1
        m = re.match(r"Chapter_(\d+)", str(c["id"]))
        return int(m.group(1)) if m else 0
    chapters.sort(key=key)
    return chapters


def renderable_blocks(chapter):
    """The reader's AOY.renderableBlocks(), verbatim. Both must agree or the
    narration highlights land on the wrong paragraphs."""
    return [b for b in (chapter.get("blocks") or [])
            if b and b.get("type") == "p" and (b.get("html") or "").strip()]


# The only tags data.js contains are <sup class data-fn> and <br>; everything
# else was already stripped upstream. This is the belt to that braces: anything
# unexpected is unwrapped, its text kept, exactly as shared.js sanitizeHtml()
# does in the browser.
_TAG = re.compile(r"<\s*(/?)\s*([A-Za-z][A-Za-z0-9]*)([^>]*)>")
_SUP_ATTRS = re.compile(r'(class|data-fn)\s*=\s*"([^"]*)"')


def sanitize(fragment):
    def repl(m):
        closing, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if tag == "br" and not closing:
            return "<br/>"
        if tag == "sup":
            if closing:
                return "</sup>"
            keep = " ".join('%s="%s"' % (k, html.escape(v, quote=True))
                            for k, v in _SUP_ATTRS.findall(attrs))
            return "<sup %s>" % keep if keep else "<sup>"
        return ""  # unwrap: drop the tag, keep whatever text it contained
    return _TAG.sub(repl, fragment)


# <sup> holds footnote markers ("1-2") and nothing else, so it is dropped whole
# rather than unwrapped. Unwrapping puts the marker into the running text, and
# a meta description that opens "...the concomitant disciple-guru 1-2
# relationship" reads as a typo in the search result.
_SUP_BLOCK = re.compile(r"<\s*sup\b[^>]*>.*?<\s*/\s*sup\s*>", re.I | re.S)


def plain_text(fragment):
    text = html.unescape(_TAG.sub("", _SUP_BLOCK.sub("", fragment)))
    # Collapse runs of space: dropping a <sup> from mid-sentence leaves the
    # spaces that surrounded it back to back.
    return re.sub(r"\s+", " ", text).strip()


def attr(value):
    """Escape for a double-quoted attribute, leaving apostrophes alone.

    html.escape(quote=True) also escapes ', which turns every CSP keyword into
    &#x27;self&#x27; — correct, and unreadable in a file people have to audit."""
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")


def slugify(chapter):
    """Chapter 1: My Parents and Early Life -> 1-my-parents-and-early-life"""
    if chapter["id"] == "Preface":
        return "preface"
    title = chapter["title"]
    m = re.match(r"Chapter\s+(\d+):\s*(.*)", title)
    num, rest = (m.group(1), m.group(2)) if m else ("", title)
    rest = plain_text(rest).lower()
    rest = re.sub(r"[’']", "", rest)
    rest = re.sub(r"[^a-z0-9]+", "-", rest).strip("-")
    return ("%s-%s" % (num, rest)) if num else rest


def chapter_label(chapter):
    m = re.search(r"Chapter\s+(\d+)", str(chapter["title"]))
    return "Chapter " + m.group(1) if m else "Preface"


def title_clean(chapter):
    return re.sub(r"^Chapter\s+\d+:\s*", "", chapter["title"], flags=re.I) \
        or chapter["name"].replace("_", " ")


# ---------------------------------------------------------------- narration

def timings(chapter_id):
    path = os.path.join(ROOT, "audio", chapter_id + ".json")
    if not os.path.exists(path):
        return None
    data = json.load(open(path, encoding="utf-8"))
    marks = data.get("paragraphs", data) if isinstance(data, dict) else data
    return marks or None


def vtt_timestamp(seconds):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return "%02d:%02d:%02d.%03d" % (h, m, s, ms)


def iso_duration(seconds):
    total = int(round(seconds))
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    out = "PT"
    if h:
        out += "%dH" % h
    if m:
        out += "%dM" % m
    return out + "%dS" % s


def write_vtt(chapter, marks, outdir):
    """One cue per paragraph, straight off the render-time timings.

    Browsers do not surface captions on a bare <audio>, so this is not for the
    player: it is a real timed-text artifact for accessibility tooling, for the
    schema.org transcript link, and for whatever the audio is uploaded to later
    (podcast hosts and the Internet Archive both take WebVTT)."""
    lines = ["WEBVTT", "", "NOTE %s — %s" % (SITE_TITLE, chapter["title"]), ""]
    for i, mk in enumerate(marks):
        start = float(mk.get("start", 0.0))
        end = start + float(mk.get("dur", 0.0))
        text = plain_text(str(mk.get("text", "")))
        if not text:
            continue
        lines += ["%d" % (i + 1),
                  "%s --> %s" % (vtt_timestamp(start), vtt_timestamp(end)),
                  text, ""]
    path = os.path.join(outdir, chapter["id"] + ".vtt")
    open(path, "w", encoding="utf-8").write("\n".join(lines))


# ---------------------------------------------------------------- html

def head_common(base, title, description, canonical, jsonld, extra_links=""):
    payload = json.dumps(jsonld, ensure_ascii=False, indent=2)
    digest = base64.b64encode(hashlib.sha256(payload.encode("utf-8")).digest()).decode()
    csp = CSP.format(extra=" 'sha256-%s'" % digest)
    scripts = "\n  ".join(
        '<link rel="preload" as="script" href="%s%s?v=%s" />' % (base, js, ASSET_V)
        for js in ("data.js",))
    return f"""  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="{attr(csp)}" />
  <meta name="referrer" content="no-referrer" />
  <title>{html.escape(title)}</title>
  <meta name="description" content="{attr(description)}" />
  <link rel="canonical" href="{canonical}" />
{extra_links}  <meta property="og:type" content="article" />
  <meta property="og:title" content="{attr(title)}" />
  <meta property="og:description" content="{attr(description)}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{base}icons/icon-512.png" />
  <link rel="icon" href="{base}icons/icon-192.png" />
  <link rel="apple-touch-icon" href="{base}icons/icon-180.png" />
  <link rel="manifest" href="{base}manifest.webmanifest" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Yogi" />
  <meta name="theme-color" content="#f6f1e7" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#171410" media="(prefers-color-scheme: dark)" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  {scripts}
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{base}styles.css?v={ASSET_V}" />
  <script type="application/ld+json">{payload}</script>"""


def chrome(base, toc_html, main_html, position=""):
    """The shell every page shares: topbar, TOC, main, note panel, footer.

    Byte-for-byte the same element ids and classes as index.html, because
    app.js binds to them by id and audio.js measures against them."""
    scripts = "\n  ".join('<script src="%s%s?v=%s"></script>' % (base, js, ASSET_V)
                          for js in ASSETS_JS)
    return f"""<body>
  <div id="progress"><div id="progress-bar"></div></div>

  <header class="topbar">
    <div class="topbar-inner">
      <button id="toc-toggle" class="icon-btn" aria-label="Table of contents" title="Contents">☰</button>
      <div class="brand">
        <a class="brand-title" href="{base}">Autobiography of a Yogi</a>
        <span class="brand-sub">An Annotated Edition with Audio · Public Domain</span>
      </div>
      <div class="controls">
        <label class="size-ctrl" title="Text size">
          <span>A−</span>
          <input type="range" id="font-size" min="-2" max="3" value="0" />
          <span>A+</span>
        </label>
        <div id="ring-wrap" class="ring" title="Reading progress">
          <svg viewBox="0 0 36 36" width="30" height="30" aria-hidden="true">
            <circle class="ring-bg" cx="18" cy="18" r="15.5" />
            <circle id="ring-fg" class="ring-fg" cx="18" cy="18" r="15.5" />
          </svg>
          <span id="ring-pct" class="ring-pct">0%</span>
        </div>
        <button id="theme-toggle" class="icon-btn" title="Toggle theme">◐</button>
        <button id="search-toggle" class="icon-btn" title="Search text">⌕</button>
      </div>
    </div>
    <div id="searchbox" class="searchbox hidden">
      <input id="search-input" type="search" placeholder="Search the text… (Enter ↵)" />
      <div id="search-results" class="search-results"></div>
    </div>
  </header>

  <div class="layout">
    <aside id="toc" class="toc" aria-label="Table of contents">{toc_html}</aside>

    <main id="main" class="main">{main_html}</main>

    <aside id="marginalia" class="marginalia" aria-label="Annotation panel">
      <div id="note-panel" class="note-panel"></div>
    </aside>
  </div>

  <footer class="reader-footer">
    <button id="prev-ch" class="nav-btn">← Previous</button>
    <span id="ch-position" class="ch-position">{position}</span>
    <button id="next-ch" class="nav-btn">Next →</button>
  </footer>

  <div id="toc-backdrop" class="toc-backdrop hidden"></div>

  {scripts}
</body>"""


def static_toc(chapters, slugs, base, current_id=None):
    """The contents list, pre-rendered with real hrefs.

    This is the crawl graph. Every page carries a link to every other page, so
    a crawler that never runs a line of JavaScript still reaches all 49
    chapters from any single entry point. app.js rebuilds this on load with the
    same hrefs plus the resume entry."""
    body = ['<div class="toc-group">Book</div><ul>',
            '<li class="toc-item"><a data-idx="-1" href="%s">📖 Cover</a></li>' % base,
            '</ul>']
    preface = next((c for c in chapters if c["id"] == "Preface"), None)
    if preface:
        idx = chapters.index(preface)
        cur = " current" if preface["id"] == current_id else ""
        body += ["<div class='toc-group'>Front Matter</div><ul>",
                 '<li class="toc-item"><a class="%s" data-idx="%d" href="%s%s/">Preface</a></li>'
                 % (cur.strip(), idx, base, slugs["Preface"]),
                 "</ul>"]
    body.append("<div class='toc-group'>Chapters</div><ul>")
    for c in chapters:
        if not str(c["id"]).startswith("Chapter_"):
            continue
        idx = chapters.index(c)
        num = re.search(r"Chapter\s+(\d+)", c["title"])
        cur = "current" if c["id"] == current_id else ""
        body.append('<li class="toc-item"><a class="%s" data-idx="%d" href="%s%s/">%s. %s</a></li>'
                    % (cur, idx, base, slugs[c["id"]],
                       num.group(1) if num else "", html.escape(title_clean(c))))
    body.append("</ul>")
    return "".join(body)


def chapter_page(chapter, idx, chapters, slugs):
    base = "../"
    slug = slugs[chapter["id"]]
    canonical = CANONICAL_BASE + slug + "/"
    blocks = renderable_blocks(chapter)
    label = chapter_label(chapter)
    clean = title_clean(chapter)

    first = plain_text(blocks[0]["html"]) if blocks else ""
    description = (first[:157].rsplit(" ", 1)[0] + "…") if len(first) > 158 else first
    page_title = "%s: %s — %s" % (label, clean, SITE_TITLE) \
        if label != "Preface" else "Preface — %s" % SITE_TITLE

    marks = timings(chapter["id"])
    audio_ld = None
    if marks:
        duration = max(float(m.get("start", 0)) + float(m.get("dur", 0)) for m in marks)
        audio_ld = {
            "@type": "AudioObject",
            "name": "%s — %s, read aloud" % (SITE_TITLE, clean),
            "contentUrl": CANONICAL_BASE + "audio/" + chapter["id"] + ".mp3",
            "encodingFormat": "audio/mpeg",
            "duration": iso_duration(duration),
            # The page itself carries the words the narration speaks; the VTT
            # carries them with timings. Both are the transcript.
            "transcript": canonical,
            "caption": CANONICAL_BASE + "transcripts/" + chapter["id"] + ".vtt",
            "inLanguage": "en",
            "isAccessibleForFree": True,
            "creditText": "Narration synthesised with Kokoro-82M",
        }

    jsonld = {
        "@context": "https://schema.org",
        "@type": "Chapter",
        "name": "%s: %s" % (label, clean) if label != "Preface" else "Preface",
        "position": idx,
        "url": canonical,
        "inLanguage": "en",
        "isAccessibleForFree": True,
        "license": "https://creativecommons.org/publicdomain/zero/1.0/",
        "isPartOf": {
            "@type": "Book",
            "name": SITE_TITLE,
            "author": {"@type": "Person", "name": AUTHOR},
            "url": CANONICAL_BASE,
            "bookEdition": "Annotated public-domain edition with audio",
        },
    }
    if audio_ld:
        jsonld["associatedMedia"] = audio_ld

    links = []
    if idx > 0:
        links.append('  <link rel="prev" href="%s%s/" />' % (CANONICAL_BASE, slugs[chapters[idx - 1]["id"]]))
    if idx < len(chapters) - 1:
        links.append('  <link rel="next" href="%s%s/" />' % (CANONICAL_BASE, slugs[chapters[idx + 1]["id"]]))
    # Read by shared.js/app.js. A <meta> and not an inline script because the
    # CSP forbids inline script, and not a <base> because base-uri is 'none'.
    links.append('  <meta name="aoy-base" content="%s" />' % base)
    links.append('  <meta name="aoy-chapter" content="%s" />' % chapter["id"])
    extra = "\n".join(links) + "\n"

    body_html = "".join("<p>%s</p>" % sanitize(b["html"]) for b in blocks)
    main_html = f"""
      <article class="ch-body" data-idx="{idx}">
        <header class="ch-head">
          <div class="ch-chapter">{label}</div>
          <h1 class="ch-title">{html.escape(clean)}</h1>
          <hr class="ch-divider"/>
        </header>
        {body_html}
      </article>"""

    head = head_common(base, page_title, description, canonical, jsonld, extra)
    toc = static_toc(chapters, slugs, base, current_id=chapter["id"])
    position = "%d of %d" % (idx + 1, len(chapters))
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n%s\n</head>\n%s\n</html>\n" % (
        head, chrome(base, toc, main_html, position))


def colophon_page(chapters, slugs, narrated):
    base = "../"
    canonical = CANONICAL_BASE + "colophon/"
    title = "Colophon — %s" % SITE_TITLE
    description = ("How this annotated edition of Autobiography of a Yogi was made: "
                   "the public-domain source text, the annotations, and the Kokoro narration.")
    jsonld = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": title,
        "url": canonical,
        "isPartOf": {"@type": "Book", "name": SITE_TITLE, "url": CANONICAL_BASE},
    }
    extra = '  <meta name="aoy-base" content="%s" />\n  <meta name="robots" content="index,follow" />\n' % base
    hours = "%.1f" % (sum(
        max(float(m.get("start", 0)) + float(m.get("dur", 0)) for m in timings(c["id"]))
        for c in chapters if timings(c["id"])) / 3600.0)

    main_html = f"""
      <article class="ch-body colophon">
        <header class="ch-head">
          <div class="ch-chapter">Colophon</div>
          <h1 class="ch-title">How this edition was made</h1>
          <hr class="ch-divider"/>
        </header>
        <p><strong>The text.</strong> <em>Autobiography of a Yogi</em> by Paramahansa
        Yogananda, first edition, 1946. Its United States copyright was never renewed,
        so the book entered the public domain in 1975. No copyright is claimed over it
        here, and none could be.</p>

        <p><strong>The narration.</strong> All {len(narrated)} narrated chapters —
        {hours} hours — were spoken by <strong>Kokoro-82M</strong>, an open-weights
        text-to-speech model released under Apache-2.0. The voice is synthetic. No
        human read this book aloud, and nothing here should be mistaken for a
        performance by a person. Each chapter's audio is timed paragraph by paragraph,
        which is what lets the text follow along as it reads, and those timings are
        published as WebVTT alongside the audio.</p>

        <p><strong>The edition and this site.</strong> Directed and assembled by
        <strong>John Records</strong> — the selection and writing of the annotations,
        the footnote apparatus, the design of the reader, and the production of the
        narration. He is not the editor of Yogananda's text: not a word of the
        <em>Autobiography</em> has been altered, abridged or rearranged. What was added
        is the apparatus around it.</p>

        <p><strong>The pictures.</strong> Photographs come from Wikimedia Commons under
        their own licences and are credited where they appear.</p>

        <p><strong>The licence.</strong> The annotations, the narration and this site
        are released under
        <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener noreferrer">CC0 1.0</a>:
        copy, share, remix, republish or sell them, for any purpose, without permission
        and without credit.</p>

        <p><strong>The source.</strong> The full build — text, annotations, narration
        and the scripts that made them — is at
        <a href="https://github.com/Kinnison-Tellus/autobiography-of-a-yogi" rel="noopener noreferrer">github.com/Kinnison-Tellus/autobiography-of-a-yogi</a>.</p>
      </article>"""

    head = head_common(base, title, description, canonical, jsonld, extra)
    toc = static_toc(chapters, slugs, base)
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n%s\n</head>\n%s\n</html>\n" % (
        head, chrome(base, toc, main_html, "Colophon"))


# ---------------------------------------------------------------- index.html

def _fill(src, name, body):
    open_m, close_m = "<!-- BUILD:%s -->" % name, "<!-- /BUILD:%s -->" % name
    if open_m not in src or close_m not in src:
        sys.exit("index.html has no %s ... %s region; add it first." % (open_m, close_m))
    start = src.index(open_m) + len(open_m)
    return src[:start] + body + src[src.index(close_m):]


def patch_index(chapters, slugs, narrated):
    """Fill index.html's marked regions: the static contents list and the Book
    JSON-LD, plus the CSP hash that admits it.

    Markers rather than a rewrite, because index.html is hand-maintained and
    this script has no business owning the rest of it. In particular the CSP
    meta stays hand-written and is only edited in place: if this script is
    never run, index.html still ships a correct policy — it just loses the
    structured data, which is a degradation and not a hole."""
    path = os.path.join(ROOT, "index.html")
    src = original = open(path, encoding="utf-8").read()

    hours = sum(
        max(float(m.get("start", 0)) + float(m.get("dur", 0)) for m in timings(cid))
        for cid in narrated) / 3600.0
    jsonld = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": SITE_TITLE,
        "author": {"@type": "Person", "name": AUTHOR},
        "url": CANONICAL_BASE,
        "bookEdition": "Annotated public-domain edition with audio",
        "bookFormat": "https://schema.org/EBook",
        "inLanguage": "en",
        "datePublished": "1946",
        "isAccessibleForFree": True,
        "license": "https://creativecommons.org/publicdomain/zero/1.0/",
        "publisher": {"@type": "Person", "name": "John Records"},
        "hasPart": [
            {"@type": "Chapter", "name": c["title"], "position": i,
             "url": CANONICAL_BASE + slugs[c["id"]] + "/"}
            for i, c in enumerate(chapters)
        ],
        "associatedMedia": {
            "@type": "AudioObject",
            "name": "%s, read aloud" % SITE_TITLE,
            "duration": iso_duration(hours * 3600),
            "inLanguage": "en",
            "isAccessibleForFree": True,
            "creditText": "Narration synthesised with Kokoro-82M",
        },
    }
    payload = json.dumps(jsonld, ensure_ascii=False, indent=2)
    digest = base64.b64encode(hashlib.sha256(payload.encode("utf-8")).digest()).decode()

    src = _fill(src, "TOC", static_toc(chapters, slugs, ""))
    src = _fill(src, "LD", '<script type="application/ld+json">%s</script>' % payload)

    # Replace whatever sha256 is currently allowed, or add the first one. The
    # sub is anchored on "script-src 'self'" so it can only ever touch that one
    # directive in that one meta tag.
    src, n = re.subn(r"script-src 'self'(?: 'sha256-[A-Za-z0-9+/=]+')*",
                     "script-src 'self' 'sha256-%s'" % digest, src, count=1)
    if not n:
        sys.exit("index.html: no \"script-src 'self'\" in the CSP meta to add the JSON-LD hash to.")

    if src != original:
        open(path, "w", encoding="utf-8").write(src)
        return True
    return False


# ---------------------------------------------------------------- outputs

def write_sitemap(chapters, slugs):
    urls = [CANONICAL_BASE, CANONICAL_BASE + "colophon/"]
    urls += [CANONICAL_BASE + slugs[c["id"]] + "/" for c in chapters]
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for i, u in enumerate(urls):
        # The cover is the entry point; chapters matter more than the colophon.
        priority = "1.0" if i == 0 else ("0.4" if u.endswith("colophon/") else "0.8")
        out += ["  <url>", "    <loc>%s</loc>" % u,
                "    <priority>%s</priority>" % priority, "  </url>"]
    out.append("</urlset>")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    return len(urls)


def write_robots():
    # Deliberately permissive. The here.now and GitHub Pages copies serve this
    # same file, and they must stay crawlable: a copy that is disallowed is
    # never read, so its rel=canonical is never seen and Google cannot fold it
    # into johnrecords.org. Blocking the mirrors would preserve the duplication
    # it looks like it prevents.
    body = "User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % CANONICAL_BASE
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(body)


def write_slugs(chapters, slugs):
    body = ("// Generated by scripts/build_static.py — do not edit.\n"
            "// id -> URL slug. One source of truth: the reader builds its links\n"
            "// from this map, so the hrefs it renders and the directories on disk\n"
            "// cannot drift apart.\n"
            "window.AOY_SLUGS = %s;\n"
            % json.dumps({c["id"]: slugs[c["id"]] for c in chapters},
                         ensure_ascii=False, indent=2))
    open(os.path.join(ROOT, "slugs.js"), "w", encoding="utf-8").write(body)


def generated_dirs(chapters, slugs):
    return [os.path.join(ROOT, slugs[c["id"]]) for c in chapters] + \
           [os.path.join(ROOT, "colophon"), os.path.join(ROOT, "transcripts")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clean", action="store_true",
                    help="remove every generated file, then exit")
    args = ap.parse_args()

    chapters = load_chapters()
    slugs = {c["id"]: slugify(c) for c in chapters}

    dupes = [s for s in slugs.values() if list(slugs.values()).count(s) > 1]
    if dupes:
        sys.exit("slug collision: %s — two chapters would share a URL." % sorted(set(dupes)))

    if args.clean:
        for d in generated_dirs(chapters, slugs):
            shutil.rmtree(d, ignore_errors=True)
        for f in ("sitemap.xml", "robots.txt", "slugs.js"):
            p = os.path.join(ROOT, f)
            if os.path.exists(p):
                os.remove(p)
        print("cleaned.")
        return

    tdir = os.path.join(ROOT, "transcripts")
    os.makedirs(tdir, exist_ok=True)

    narrated = []
    for idx, c in enumerate(chapters):
        d = os.path.join(ROOT, slugs[c["id"]])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(
            chapter_page(c, idx, chapters, slugs))
        marks = timings(c["id"])
        if marks:
            narrated.append(c["id"])
            write_vtt(c, marks, tdir)

    cdir = os.path.join(ROOT, "colophon")
    os.makedirs(cdir, exist_ok=True)
    open(os.path.join(cdir, "index.html"), "w", encoding="utf-8").write(
        colophon_page(chapters, slugs, narrated))

    write_slugs(chapters, slugs)
    n_urls = write_sitemap(chapters, slugs)
    write_robots()
    touched = patch_index(chapters, slugs, narrated)

    print("%d chapter pages, %d transcripts, %d URLs in sitemap.%s"
          % (len(chapters), len(narrated), n_urls,
             " index.html TOC updated." if touched else ""))


if __name__ == "__main__":
    main()
