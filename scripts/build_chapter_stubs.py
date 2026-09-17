#!/usr/bin/env python3
"""Rebuild the per-chapter URLs for Autobiography of a Yogi.

Background
----------
Before the webbook-template migration every chapter had a real page at
``/<n>-<slug>/index.html``.  The migration (7afe6b2) replaced that whole tree
with a single self-contained reader at ``index.html``, which addresses chapters
by hash (``#chN``) instead.  That silently 404'd ~50 published URLs — inbound
links, bookmarks, the sitemap and every search result.

The template has no per-chapter page support, and giving it one would diverge
this book from every other webbook.  So instead of restoring a parallel reader,
this script emits a small landing page at each historical slug that

  * redirects into the reader at the right chapter (``<meta http-equiv=refresh>``,
    so it works with JavaScript disabled and reads as a redirect to crawlers), and
  * carries the chapter's real text in a ``data-pagefind-body`` element, so the
    static search index keeps one fragment per chapter instead of collapsing the
    whole book into a single 1 MB result.

The page index lives in the reader's own markup (``<section class="page"
data-i="N">``), so the slug -> #chN mapping is read, never guessed:
``data-i`` 0 is the cover, 1 the preface, 2..49 chapters 1..48, 50 the colophon.

Usage:  python3 scripts/build_chapter_stubs.py [--check]
        --check verifies the generated slugs against --expect without writing.
"""
import argparse, html, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://johnrecords.org/autobiography-of-a-yogi"


def slugify(title: str) -> str:
    t = html.unescape(title).lower()
    t = t.replace("’", "").replace("'", "")   # possessives close up
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return t.strip("-")


def pages(doc: str):
    """Yield (data_i, num_label, title, inner_html) for each reader page."""
    for m in re.finditer(r'<section class="page[^"]*"[^>]*data-i="(\d+)"[^>]*>', doc):
        i = int(m.group(1))
        depth, pos = 1, m.end()
        while depth:                                    # match the closing </section>
            nxt = re.search(r"</?section\b", doc[pos:])
            if not nxt:
                sys.exit(f"unterminated <section> for data-i={i}")
            depth += -1 if doc[pos + nxt.start() + 1] == "/" else 1
            pos += nxt.end()
        inner = doc[m.end(): pos - len("</section>")]
        num = re.search(r'<div class="num">(.*?)</div>', inner, re.S)
        ttl = re.search(r'<h2 class="ttl">(.*?)</h2>', inner, re.S)
        strip = lambda x: html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", x))).strip()
        yield i, (strip(num.group(1)) if num else ""), (strip(ttl.group(1)) if ttl else ""), inner


def slug_for(i: int, title: str, total: int) -> str:
    if i == 1:
        return "preface"
    if i == total:
        return "colophon"
    return f"{i - 1}-{slugify(title)}"


STUB = """<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=../#ch{i}">
<title>{title_esc} · Autobiography of a Yogi</title>
<link rel="canonical" href="{site}/{slug}/">
<style>
  body{{margin:0;padding:3rem 1.25rem;background:#faf7f0;color:#2b2622;
       font:16px/1.6 Georgia,'Iowan Old Style',serif;}}
  main{{max-width:34rem;margin:0 auto;}}
  .num{{font:600 .72rem/1 ui-sans-serif,system-ui;letter-spacing:.14em;
        text-transform:uppercase;color:#8a6a3b;}}
  h1{{font-size:1.6rem;margin:.35rem 0 1.25rem;font-weight:600;}}
  a{{color:#8a5a2b;}}
  @media (prefers-color-scheme:dark){{body{{background:#17151a;color:#e8e2d9;}}
    .num{{color:#c8a35e;}} a{{color:#d8a95e;}}}}
</style>
<main>
  <p class="num">{num_esc}</p>
  <h1>{title_esc}</h1>
  <p><a href="../#ch{i}">Continue to the reader &rarr;</a></p>
  <div data-pagefind-body data-pagefind-meta="title:{title_esc}">
{inner}
  </div>
</main>
</html>
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="verify only, write nothing")
    ap.add_argument("--expect", help="file of expected slugs, one per line")
    args = ap.parse_args()

    doc = (ROOT / "index.html").read_text(encoding="utf-8")
    ps = list(pages(doc))
    if not ps:
        sys.exit("no reader pages found in index.html")
    total = max(p[0] for p in ps)

    built = {}
    for i, num, title, inner in ps:
        if i == 0:
            continue                                    # the cover is the reader itself
        built[slug_for(i, title, total)] = (i, num, title, inner)

    if args.expect:
        want = {l.strip() for l in open(args.expect) if l.strip()}
        missing, extra = want - built.keys(), built.keys() - want
        for s in sorted(missing):
            print(f"  MISSING (was published, not regenerated): {s}")
        for s in sorted(extra):
            print(f"  EXTRA   (regenerated, never published):   {s}")
        if missing or extra:
            sys.exit(f"slug mismatch: {len(missing)} missing, {len(extra)} extra")
        print(f"slugs match the published set exactly ({len(want)})")

    if args.check:
        return

    urls = []
    for slug, (i, num, title, inner) in sorted(built.items()):
        d = ROOT / slug
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(STUB.format(
            i=i, slug=slug, site=SITE, inner=inner,
            num_esc=html.escape(num), title_esc=html.escape(title)), encoding="utf-8")
        urls.append(f"{SITE}/{slug}/")

    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + f"  <url><loc>{SITE}/</loc><priority>1.0</priority></url>\n"
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls)
        + "</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")

    print(f"wrote {len(urls)} chapter pages + sitemap.xml + robots.txt")


if __name__ == "__main__":
    main()
