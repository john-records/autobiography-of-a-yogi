#!/usr/bin/env node
// Rebuild data.js (and chapters.json) from the scraped chapters.
//
// Cleaning passes over the raw scrape output:
//  1. Convert leaked wikisource <ref name="FNx-y">citation</ref> inline markers
//     into real footnote anchors (<sup class="fn" data-fn="FNx-y">x-y</sup>),
//     so those endnotes become reachable and the citation text stops leaking.
//  2. Remove Wikimedia image-caption markers from the body:
//       - blocks that START with the ":Wikipedia:... Image Gallery (...)" marker
//         are pure plate captions (our edition renders no plates) -> dropped;
//       - blocks that merely CONTAIN the marker keep their body text and their
//         footnote anchors; only the marker segment is stripped.
//     A hard invariant: the set of footnote anchor keys can only GROW, never
//     shrink (refs may become anchors; body cleaning may not remove any).
// Note: endnote entries that no anchor references are kept as-is — they are
// source book content and simply do not surface in this edition.
//
// Usage: node scripts/clean_data.mjs
// Writes chapters.json (pretty) and data.js (compact, single line).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const chaptersPath = join(root, "chapters.json");
const dataPath = join(root, "data.js");

const chapters = JSON.parse(readFileSync(chaptersPath, "utf8"));

// ---- invariant: capture the original anchor key set before any cleaning ----
const origKeys = new Set();
for (const ch of chapters) {
  for (const b of ch.blocks || []) {
    for (const m of String(b.html || "").matchAll(/data-fn="([^"]+)"/g)) origKeys.add(m[1]);
  }
}

const stats = { captionBlocksRemoved: 0, markerSegmentsStripped: 0, mixedBlocksKept: 0, refsConverted: 0 };
const finalKeys = new Set(origKeys);
const keptSample = [];

// Pure caption block: the whole block is a plate caption.
const PURE_CAPTION = /^\s*:Wikipedia:/i;
// Marker segment with its parenthesised caption content (lazy to first ")").
const MARKER_SEGMENT = /:Wikipedia:[^<]*Image Gallery\s*\([\s\S]*?\)/gi;

const cleaned = chapters.map((ch) => {
  const blocks = (ch.blocks || [])
    .map((b) => {
      let html = b.html || "";

      // 1) <ref> -> footnote anchor
      html = html.replace(
        /<ref\s+name="FN(\d+-\d+)"\s*>\s*(.*?)\s*<\/ref>/gi,
        (_m, key) => {
          stats.refsConverted++;
          finalKeys.add(`FN${key}`);
          return `<sup class="fn" data-fn="FN${key}">${key}</sup>`;
        }
      );

      // 2a) pure caption blocks
      if (PURE_CAPTION.test(html) && !/data-fn=/.test(html)) {
        stats.captionBlocksRemoved++;
        return null;
      }

      // 2b) mixed blocks: keep body + anchors, strip only the marker segments
      if (/^:Wikipedia:|:Wikipedia:[^<]*Image Gallery/i.test(html)) {
        const stripped = html.replace(MARKER_SEGMENT, " ").replace(/\s{2,}/g, " ").trim();
        if (/data-fn=/.test(html)) {
          stats.mixedBlocksKept++;
          stats.markerSegmentsStripped++;
          if (!stripped) {
            console.warn(`[clean_data] block ${ch.id} lost ALL text after marker strip`);
          }
          html = stripped;
        } else {
          // marker in a body block with no anchor: keep the body text
          stats.markerSegmentsStripped++;
          html = stripped || b.html; // never empty out a body block
          if (!stripped) stats.captionBlocksRemoved++;
        }
      }

      // invariant: never lose an anchor we already had
      for (const m of String(b.html || "").matchAll(/data-fn="([^"]+)"/g)) {
        if (!String(html).includes(m[1])) {
          throw new Error(`[clean_data] would lose anchor ${m[1]} in ${ch.id} — aborting`);
        }
      }
      if (html) return { ...b, html };
      return null;
    })
    .filter(Boolean);

  if (blocks.length < (ch.blocks || []).length) {
    keptSample.push(`${ch.id}: ${(ch.blocks || []).length} -> ${blocks.length}`);
  }
  return { ...ch, blocks };
});

// hard invariant: anchor set may only grow
const finalAnchorCount = cleaned.reduce(
  (n, c) =>
    n + (c.blocks || []).reduce((m, b) => m + (String(b.html).match(/data-fn="/g) || []).length, 0),
  0
);
const origAnchorCount = chapters.reduce(
  (n, c) => n + (c.blocks || []).reduce((m, b) => m + (String(b.html || "").match(/data-fn="/g) || []).length, 0),
  0
);
if (origAnchorCount > finalAnchorCount) {
  throw new Error(`[clean_data] anchor count shrank ${origAnchorCount} -> ${finalAnchorCount}; aborting`);
}

writeFileSync(chaptersPath, JSON.stringify(cleaned, null, 1) + "\n");
writeFileSync(
  dataPath,
  "// Autobiography of a Yogi - chapter data (public domain text)\n" +
    "window.CHAPTERS = " + JSON.stringify(cleaned) + ";\n"
);

console.log(
  JSON.stringify({ ...stats, chapters: cleaned.length, origins: origAnchorCount, finals: finalAnchorCount })
);
for (const line of keptSample) console.log("[blocks] " + line);
