// Headless regression tests for the reader's matching/data invariants.
// Run: node --test tests/
//
// Covers: word-boundary term matching, the block-filter invariant behind the
// search index, footnote enrichment, and the shipped-data contracts that
// previous bugs violated (caption leaks, dead overrides, unreachable endnotes).

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const AOY = require("../shared.js");

// ---- pure matching helpers ----

test("termHasMatch respects whole-word boundaries", () => {
  assert.equal(AOY.termHasMatch("He spoke of his cosmic romance", "Roma"), false, "Roma inside romance");
  assert.equal(AOY.termHasMatch("the Kalighat temple", "Kali"), false, "Kali inside Kalighat");
  assert.equal(AOY.termHasMatch("I am Christian, not Christlike", "Christ"), false, "Christ inside Christlike");
  assert.equal(AOY.termHasMatch("the Divine Mother Kali", "Kali"), true);
  assert.equal(AOY.termHasMatch("Bose Institute", "Bose"), true);
  assert.equal(AOY.termHasMatch("OM is the cosmic sound", "Om"), true, "case-insensitive");
  assert.equal(AOY.termHasMatch("(Benares)", "Benares"), true, "punctuation boundaries are fine");
  assert.equal(AOY.termHasMatch("Beloved", "love"), false);
});

test("renderableBlocks is the single source of truth for rendered blocks", () => {
  const chapter = {
    blocks: [
      { type: "p", html: "hello" },
      { type: "p", html: "   " },
      { type: "p", html: "" },
      { type: "h", html: "section break" }
    ]
  };
  const out = AOY.renderableBlocks(chapter);
  assert.deepEqual(out.map((b) => b.html), ["hello"]);
});

test("enrichNote guards boundaries and separates note vs context matches", () => {
  const anns = [
    { id: "roma", label: "Sister Roma", terms: ["Roma"], image: null, links: [{ label: "W", url: "https://example.com/roma" }] },
    { id: "kali", label: "Kali", terms: ["Kali"], image: "Kali.jpg", links: [{ label: "W", url: "https://example.com/kali" }] }
  ];
  const noteOnly = AOY.enrichNote("The goddess Kali is feared and loved", "", anns);
  assert.equal(noteOnly.images.length, 1);
  assert.equal(noteOnly.links.length, 1);
  assert.deepEqual(noteOnly.tags, ["Kali"]);

  // "Roma" occurs only inside "cosmic romance" in the context sentence.
  const ctxOnly = AOY.enrichNote("(cosmic romance)", "He spoke of his cosmic romance", anns);
  assert.equal(ctxOnly.images.length, 0, "no image from a context-only boundary miss");
  assert.equal(ctxOnly.links.length, 0);
});

// ---- shipped-data contracts ----

function loadData() {
  globalThis.window = globalThis.window || {};
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "data.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(src);
  return globalThis.window.CHAPTERS;
}

test("data.js has no leaked image-caption blocks", () => {
  const chapters = loadData();
  const leaks = [];
  chapters.forEach((c) =>
    c.blocks.forEach((b, i) => {
      if (/:Wikipedia:|Image Gallery/i.test(b.html || "")) leaks.push(`${c.id}:${i}`);
    })
  );
  assert.deepEqual(leaks, []);
});

test("converted <ref> markers became footnote anchors (no raw refs, orphans reduced)", () => {
  const chapters = loadData();
  let rawRefs = 0;
  const supKeys = new Set();
  chapters.forEach((c) =>
    c.blocks.forEach((b) => {
      if (/<ref/.test(b.html || "")) rawRefs++;
      const m = (b.html || "").match(/data-fn="([^"]+)"/g) || [];
      m.forEach((x) => supKeys.add(x.match(/data-fn="([^"]+)"/)[1]));
    })
  );
  assert.equal(rawRefs, 0, "no <ref> markup should remain in the body");
  for (const key of ["FN35-1", "FN35-5", "FN35-6", "FN35-7"]) {
    assert.ok(supKeys.has(key), `${key} should now be reachable via a sup anchor`);
  }
});

test("every footnote anchor resolves; every endnote reference is used", () => {
  const chapters = loadData();
  const endnotes = new Map();
  const supKeys = new Set();
  chapters.forEach((c) => {
    Object.keys(c.endnotes || {}).forEach((k) => endnotes.set(k, c.id));
    c.blocks.forEach((b) => {
      const m = (b.html || "").match(/data-fn="([^"]+)"/g) || [];
      m.forEach((x) => supKeys.add(x.match(/data-fn="([^"]+)"/)[1]));
    });
  });
  const supsMissingNote = [...supKeys].filter((k) => !endnotes.has(k));
  assert.deepEqual(supsMissingNote, [], "no sup should point at a missing endnote");
});

test("no footnote override is dead (every override key has at least one anchor)", () => {
  const chapters = loadData();
  const overrideSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "footnote_overrides.js"), "utf8");
  const supKeys = new Set();
  chapters.forEach((c) =>
    c.blocks.forEach((b) => {
      const m = (b.html || "").match(/data-fn="([^"]+)"/g) || [];
      m.forEach((x) => supKeys.add(x.match(/data-fn="([^"]+)"/)[1]));
    })
  );
  const dead = [...overrideSrc.matchAll(/^\s*"FN[\d-]+":/gm)].map((m) => m[0].replace(/[\s":]/g, ""));
  const unreachable = dead.filter((k) => !supKeys.has(k));
  assert.deepEqual(unreachable, [], `overrides without any anchor: ${unreachable.join(", ")}`);
});

test("annotation term index has no cross-annotation collisions", () => {
  const annSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "annotations.js"), "utf8");
  const anns = annSrc.match(/id: "([a-z0-9_]+)",\s*label: "[^"]+",\s*terms: (\[[^\]]*\])/g);
  const termOwner = new Map();
  const collisions = [];
  const terms = [];
  for (const block of anns) {
    const id = block.match(/id: "([a-z0-9_]+)"/)[1];
    const t = JSON.parse(block.match(/terms: (\[[^\]]*\])/)[1]);
    for (const term of t) {
      const key = term.trim().toLowerCase();
      if (!key) continue;
      terms.push(key);
      if (termOwner.has(key) && termOwner.get(key) !== id) collisions.push(`${key}:${termOwner.get(key)}+${id}`);
      termOwner.set(key, id);
    }
  }
  assert.deepEqual(collisions, []);
});
