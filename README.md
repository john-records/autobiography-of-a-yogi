# Autobiography of a Yogi — An Annotated Edition

A beautiful, static reading website for the **public domain** text of
Paramahansa Yogananda's *Autobiography of a Yogi* (1946 first edition;
copyright not renewed → public domain in the U.S. since 1975).

## Features

- **Full public-domain text** — all 48 chapters + Preface, split and
  proofread from the Wikisource edition, complete with original endnotes
  (3,217 paragraphs).
- **140+ inline annotations** — every person name in the book is footnoted, plus places, scriptures, and concepts are
  highlighted as underlined links in the prose; click one to open a note
  with an image (hotlinked & verified on Wikimedia Commons)
  and links (Wikipedia, Wikisource).
- **Beautiful reader UI** — warm "paper & ink" theme with dark mode, serif
  typography (Cormorant Garamond), centred reading column with left-justified
  text, full-text search.
- **Centered always** — the TOC (left) and notes (right) are **overlay
  drawers**, so opening or closing them never shifts the reading text.
- **Cover** — a front-and-center portrait of Paramahansa Yogananda.
- **Remembers your preferences** — theme and text size are saved and restored on return.
- **Reading progress** — a thin top progress bar plus a circular % ring in
  the toolbar; your place (chapter + scroll position) is auto-saved to
  `localStorage`, and the cover offers a **Resume** button.
- **Reading aids** — table of contents, prev/next chapter navigation, and
  footnote popovers that auto-include relevant images and Wikipedia links.
- **Responsive** — adapts from wide desktop to phones and tablets.
- **Gallery page** — `gallery.html` lists every annotation as a searchable
  card with its image, note, terms, and links, so you can review them all
  at a glance.
- **No local image files** — all imagery is hotlinked from
  Wikimedia Commons by filename and served directly by their CDN, so the
  site is fully self-hosting-friendly and never requires local assets.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page shell, controls, layout |
| `styles.css` | All styling, themes, responsive layout |
| `data.js` | The book text (`window.CHAPTERS`) — generated from Wikisource |
| `annotations.js` | Annotation database (`window.ANNOTATIONS`) — terms, notes, images, links |
| `app.js` | Reader logic: TOC, rendering, search, footnotes, annotations |
| `gallery.html` | Standalone page reviewing every annotation + image |
| `chapters.json` | Source data the text was bundled from (for regeneration) |
| `convert.py` | Regeneration script (Wikisource → `chapters.json`) |
| `enhance_annotations.py` | Adds annotations & finds images via the Commons search API |
| `curate.py` | Curates & verifies the final image set for every annotation |
| `annotations_raw.json` | Working copy of the annotation array (scripts use it) |

## Run it

Because it's fully static, just serve the directory and open it in a browser:

```bash
cd aoy
python3 serve.py
# then open http://localhost:8977 in your browser
```

`serve.py` is the recommended server: it sends `Cache-Control: no-store` headers so your browser always fetches the latest files (no stale-cache surprises).

No build step, no dependencies, no API keys.

## How the images work (no "image access" needed)

The model that built this site never downloads, generates, or opens a
single image file. Each annotation simply stores a **filename** as text;
`app.js` constructs a Wikimedia Commons `Special:FilePath/…?width=…` URL
and the *reader's browser* downloads the image at view time. If a file is
ever unavailable, the `onerror` handler hides it gracefully so the reading
experience never breaks.

## Deploy it (free hosting)

This is a fully static site — no build step, no server, no API keys — so it
runs anywhere that serves files:

- **GitHub Pages (recommended):** push this folder to a GitHub repo, then
  enable *Settings → Pages → Deploy from a branch → main / (root)*. You get a
  public URL free, e.g. `https://<user>.github.io/<repo>/`.
- **Netlify Drop:** drag-and-drop this folder at https://app.netlify.com/drop
  for an instant live URL (no git required).
- **Cloudflare Pages / Vercel / surge.sh:** all accept the folder directly too.

All asset references are relative, and images/fonts are hotlinked from their
CDNs, so nothing breaks on any host.

## Live deployments

Canonical tracker: this file, in the git repo (https://github.com/Kinnison-Tellus/autobiography-of-a-yogi).

| Host | URL | Lifetime | How to update |
| --- | --- | --- | --- |
| GitHub Pages | https://kinnison-tellus.github.io/autobiography-of-a-yogi/ | permanent | `git add -A && git commit -m "..." && git push` |
| here.now | https://russet-bamboo-b5sa.here.now/ | permanent (your account) | re-run the here-now skill: `scripts/publish.sh <site-folder>` |
| Local (dev) | http://localhost:8977 | on demand | `python3 serve.py` |

Keep this table updated whenever you change hosts; it is the single source of truth for where the book lives.

Auto-sync: a committed git hook (core.hooksPath -> .githooks) republishes the site to here.now on every push - see scripts/sync-herenow.sh. The here.now URL is stable because the sync republishes the same slug (russet-bamboo-b5sa) via --slug. A ready-to-paste Reddit post is in REDDIT_POST.md.

## Public-domain note

The 1946 first edition of *Autobiography of a Yogi* fell into the public
domain in the United States on January 1, 1975 because its copyright was
not renewed. The text and the referenced Wikimedia Commons images are
publicly licensed accordingly.
