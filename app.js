(function () {
  "use strict";

  const CHAPTERS = window.CHAPTERS || [];

  // The source data lists chapters in lexicographic order (Chapter_10 before
  // Chapter_2), which breaks TOC/navigation numbering. Sort into true order.
  CHAPTERS.sort(function (a, b) {
    if (a.id === "Preface") return -1;
    if (b.id === "Preface") return 1;
    const ma = String(a.id).match(/Chapter_(\d+)/);
    const mb = String(b.id).match(/Chapter_(\d+)/);
    return (ma ? parseInt(ma[1], 10) : 0) - (mb ? parseInt(mb[1], 10) : 0);
  });
  const ANNOTATIONS = window.ANNOTATIONS || [];

  // ---- state ----
  let currentIndex = -1; // index into CHAPTERS (-1 => cover)

  // ---- persisted preferences (theme, font size) ----
  const THEME_KEY = "aoy-theme";
  const FONTSIZE_KEY = "aoy-fontsize";
  function restorePrefs() {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t) document.documentElement.setAttribute("data-theme", t);
    } catch (e) {}
    try {
      const fs = localStorage.getItem(FONTSIZE_KEY);
      if (fs != null) {
        const input = $("#font-size");
        if (input) input.value = fs;
        document.documentElement.style.setProperty("--fs", (1 + parseFloat(fs) * 0.12).toFixed(2));
      }
    } catch (e) {}
  }

  // ---- reading progress (auto-saved to localStorage) ----
  const PROGRESS_KEY = "aoy-progress";
  let saveTimer = null;
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null"); }
    catch (e) { return null; }
  }
  function saveProgress(scrollY) {
    if (currentIndex < 0) return;
    try {
      const c = CHAPTERS[currentIndex];
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        chapterIndex: currentIndex,
        chapterTitle: c.title,
        scrollY: Math.max(0, Math.round(scrollY || 0)),
        updatedAt: Date.now()
      }));
    } catch (e) {}
  }
  function clearProgress() { try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {} }
  function resumeReading() {
    const p = getProgress();
    if (!p || p.chapterIndex < 0 || p.chapterIndex >= CHAPTERS.length) return;
    renderChapter(p.chapterIndex, false);
    const y = Math.max(0, p.scrollY || 0);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }

  // ---------- helpers ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // Shared helpers live in shared.js (esc, escAttr, imgUrl, sanitize, enrich,
  // block filtering) so the reader and the review tools cannot drift apart.
  const esc = AOY.esc;
  const escAttr = AOY.escAttr;
  const stripTags = AOY.stripTags;
  const sanitizeHtml = AOY.sanitizeHtml;
  const imgUrl = AOY.imgUrl;

  // Global endnote map (for cross-chapter references like FN26-6 in ch27)
  const GLOBAL_NOTES = {};
  CHAPTERS.forEach((c) => {
    Object.keys(c.endnotes || {}).forEach((k) => { GLOBAL_NOTES[k] = { note: c.endnotes[k], chapter: c.title }; });
  });

  // Precompiled per-term matchers (whole-word, no lookbehind, so they work on
  // every engine and never throw). Compiled once at load, reused for every
  // text node. Genuine cross-annotation term collisions are logged, not silent.
  const TERM_MATCHERS = (function () {
    const byKey = new Map();
    for (const ann of ANNOTATIONS) {
      for (const term of (ann.terms || [])) {
        const t = String(term).trim();
        if (!t) continue;
        const key = t.toLowerCase();
        if (byKey.has(key) && byKey.get(key).ann !== ann) {
          console.warn("[aoy] duplicate annotation term:", JSON.stringify(t), "->", ann.id, "(overrides", byKey.get(key).ann.id + ")");
        }
        byKey.set(key, {
          ann: ann,
          term: t,
          re: new RegExp("(^|[^A-Za-z0-9])" + AOY.regEscape(t) + "(?![A-Za-z0-9])", "gi")
        });
      }
    }
    return Array.from(byKey.values());
  })();

  // ---------- top-level render ----------
  // The gallery and footnotes buttons were removed from the topbar on
  // 2026-08-06; hideMissingTools() and the data-local-tools attribute existed
  // only to hide them on the public build and went with them.
  function init() {
    restorePrefs();
    buildToc();
    renderCover();
    bindEvents();
  }

  function buildToc() {
    const toc = $("#toc");
    const chapters = CHAPTERS.filter((c) => /^Chapter_/.test(c.id));
    const preface = CHAPTERS.find((c) => c.id === "Preface");
    let html = '<div class="toc-group">Book</div><ul>';
    html += '<li class="toc-item"><a data-idx="-1" href="#toc-nav">📖 Cover</a></li>';
    const __prog = getProgress();
    if (__prog && __prog.chapterIndex >= 0 && __prog.chapterIndex < CHAPTERS.length) {
      html += '<li class="toc-item resume"><a href="#toc-nav" data-action="resume">↻ ' + esc(CHAPTERS[__prog.chapterIndex].title) + '</a></li>';
    }
    html += "</ul><div class='toc-group'>Front Matter</div><ul>";
    if (preface) html += `<li class="toc-item"><a data-idx="${CHAPTERS.indexOf(preface)}" href="#toc-nav">Preface</a></li>`;
    html += "</ul><div class='toc-group'>Chapters</div><ul>";
    chapters.forEach((c) => {
      const idx = CHAPTERS.indexOf(c);
      const num = c.title.match(/Chapter\s+(\d+)/);
      html += `<li class="toc-item"><a data-idx="${idx}" href="#toc-nav">${num ? num[1] : ""}. ${esc(titleClean(c))}</a></li>`;
    });
    html += "</ul>";
    toc.innerHTML = html;
  }

  function titleClean(c) {
    // Strip leading "Chapter N:" for display
    return c.title.replace(/^Chapter\s+\d+:\s*/i, "") || c.name.replace(/_/g, " ");
  }

  function chapterLabel(c) {
    // "Chapter 21: We Visit Kashmir" -> "Chapter 21"
    const m = String(c.title).match(/Chapter\s+(\d+)/);
    return m ? "Chapter " + m[1] : "Preface";
  }

  function renderCover() {
    currentIndex = -1;
    const main = $("#main");
    const p = getProgress();
    let resume = "";
    if (p && p.chapterIndex >= 0 && p.chapterIndex < CHAPTERS.length) {
      const label = CHAPTERS[p.chapterIndex].title;
      resume = `<button class="start resume" id="resume-reading">↻ Resume — ${esc(label)}</button>
                <button class="reset" id="reset-progress">Start over</button>`;
    }
    main.innerHTML = `
      <section class="cover">
        <div class="cover-photo">
          <img src="${imgUrl("Paramahansa_Yogananda.jpg", 560)}" alt="Paramahansa Yogananda"/>
        </div>
        <h1 class="cover-title">Autobiography<br/>of a Yogi</h1>
        <p class="cover-author">Paramahansa Yogananda</p>
        <div class="dec"></div>
        <p class="cover-sub">An Annotated Public-Domain Edition with Audio &nbsp;·&nbsp; 48 Chapters</p>
        <p class="cover-audio">Every chapter is narrated. Open one and press play in the bar
           at the foot of the page — or hold Option and click any paragraph to hear
           the reading start there.</p>
        <div class="cover-actions">
          <button class="start" id="start-reading">Begin Reading →</button>
          ${resume}
        </div>
        <p class="cover-rights"><strong>No copyright is claimed.</strong> The 1946 first edition
           entered the United States public domain in 1975, its copyright never renewed. The
           annotations, the narration and this site are released under
           <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener noreferrer">CC0 1.0</a>
           — copy, share, remix, republish or sell them, for any purpose, without permission
           and without credit. Photographs come from Wikimedia Commons under their own licenses.</p>
      </section>`;
    const prefaceIdx = CHAPTERS.findIndex((c) => c.id === "Preface");
    $("#start-reading").onclick = () => renderChapter(prefaceIdx >= 0 ? prefaceIdx : 0, true);
    const resumeBtn = $("#resume-reading");
    if (resumeBtn) resumeBtn.onclick = resumeReading;
    const resetBtn = $("#reset-progress");
    if (resetBtn) resetBtn.onclick = () => { clearProgress(); renderCover(); };
    updateTocHighlight();
    updatePosition();
    window.scrollTo(0, 0);
    const coverImg = $(".cover-photo img");
    if (coverImg) coverImg.addEventListener("error", () => { coverImg.style.display = "none"; });
  }

  // ---------- chapter rendering ----------
  function renderChapter(idx, scrollTop) {
    if (idx < 0 || idx >= CHAPTERS.length) return;
    currentIndex = idx;
    const c = CHAPTERS[idx];
    const main = $("#main");

    // Single source of truth: AOY.renderableBlocks() — the search index uses
    // the same filter so block indices always match the rendered DOM.
    let bodyHtml = AOY.renderableBlocks(c)
      .map((b) => `<p>${sanitizeHtml(b.html)}</p>`)
      .join("");

    main.innerHTML = `
      <article class="ch-body" data-idx="${idx}">
        <header class="ch-head">
          <div class="ch-chapter">${chapterLabel(c)}</div>
          <h2 class="ch-title">${esc(titleClean(c))}</h2>
          <hr class="ch-divider"/>
        </header>
        ${bodyHtml}
      </article>`;

    annotateBody($(".ch-body"));
    bindFootnotes($(".ch-body"));
    // Narration last: it only toggles classes on the <p> elements above, so it
    // must run after the annotation spans exist and must never rebuild them.
    if (window.AOYAudio) window.AOYAudio.load(c.id, $(".ch-body"));
    updateTocHighlight();
    updatePosition();

    if (scrollTop) window.scrollTo(0, 0);
    closeNote();
  }

  // Collect descendant text nodes exactly once each. (Regression guard: a past
  // version pushed the TreeWalker itself, so the annotation feature rendered
  // nothing at all and search highlighting threw.)
  function textNodesIn(root, rejectSel) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (rejectSel && node.parentNode && node.parentNode.closest(rejectSel)) return NodeFilter.FILTER_REJECT;
        const t = node.nodeValue;
        if (!t || !t.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  // Wrap annotation terms in the body
  function annotateBody(article) {
    textNodesIn(article, "sup, .ann").forEach(wrapTextNode);
  }

  function wrapTextNode(node) {
    const text = node.nodeValue;
    const candidates = [];
    for (const mdef of TERM_MATCHERS) {
      const re = mdef.re;
      let m;
      while ((m = re.exec(text)) !== null) {
        // m[1] is the captured leading boundary ("", or one non-word char).
        const start = m.index + m[1].length;
        candidates.push({ start: start, end: start + mdef.term.length, ann: mdef.ann });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
    if (!candidates.length) return;
    // Sort by start, longer first among same start
    candidates.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const chosen = [];
    for (const cand of candidates) {
      const overlaps = chosen.some((c) => cand.start < c.end && cand.end > c.start);
      if (!overlaps) chosen.push(cand);
    }
    chosen.sort((a, b) => a.start - b.start);
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const c of chosen) {
      if (c.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, c.start)));
      const span = document.createElement("span");
      span.className = "ann";
      span.setAttribute("tabindex", "0");
      span.setAttribute("data-ann", c.ann.id);
      span.setAttribute("role", "button");
      span.setAttribute("aria-label", c.ann.label);
      span.title = c.ann.label;
      span.textContent = text.slice(c.start, c.end);
      frag.appendChild(span);
      pos = c.end;
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    node.parentNode.replaceChild(frag, node);
  }

  function enrichFootnote(note, context) {
    return AOY.enrichNote(note, context, ANNOTATIONS);
  }

  function bindFootnotes(article) {
    $$("sup.fn", article).forEach((sup) => {
      sup.setAttribute("role", "button");
      sup.setAttribute("tabindex", "0");
      sup.setAttribute("aria-label", "Footnote");
      sup.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); sup.click(); } });
      sup.onclick = () => {
        const key = sup.dataset.fn;
        const c = CHAPTERS[currentIndex];
        const local = c.endnotes && c.endnotes[key];
        const global = GLOBAL_NOTES[key];
        const note = local || (global && global.note) || "No note available.";
        const origin = (!local && global && global.chapter !== c.title) ? " (from " + global.chapter + ")" : "";
        const p = sup.closest("p");
        const ctx = p ? p.textContent : "";
        const en = enrichFootnote(note, ctx);
        const ov = (window.FOOTNOTE_OVERRIDES || {})[key];
        let shown = note;
        if (ov) {
          if (ov.note != null) shown = ov.note;
          if (ov.images) en.images = ov.images;
          if (ov.links) en.links = ov.links;
        }
        showNote({
          title: (chapterLabel(c) + " · Note " + key + origin),
          body: shown,
          isFn: true,
          images: en.images,
          links: en.links
        });
      };
    });
  }

  // ---------- note panel ----------
  function showNote(ann) {
    const panel = $("#note-panel");
    const images = ann.images || (ann.image ? [ann.image] : []);
    let imgs = "";
    const hostOf = AOY.hostOf;
    const escAttr = (s) => String(s == null ? "" : s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    images.forEach((f) => {
      const src = imgUrl(f);
      if (!src) return;
      const credit = AOY.isHttpUrl(f) ? ("Photo: " + hostOf(f)) : "Image: Wikimedia Commons (shared license)";
      imgs += '<img src="' + escAttr(src) + '" alt="' + esc(ann.label || ann.title || "annotation") + '"/>' +
              "\n               <div class=\"src\"><span class=\"credit\">" + esc(credit) + "</span></div>";
    });
    let links = "";
    if (ann.links && ann.links.length) {
      const escAttr = (s) => String(s == null ? "" : s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      links = "<div class='links'>" + ann.links.map((l) => {
        const href = AOY.isHttpUrl(l.url) ? l.url : null;
        return href ? '<a href="' + escAttr(href) + '" target="_blank" rel="noopener">↗ ' + esc(l.label) + '</a>' : "";
      }).join("") + "</div>";
    }
    panel.innerHTML = `
      <div class="note-card${ann.isFn ? " fn-card" : ""}">
        <button class="close" aria-label="Close">×</button>
        <h3>${esc(ann.label || ann.title)}</h3>
        ${imgs}
        <p>${esc(ann.note || ann.body || "")}</p>
        ${links}
      </div>`;
    $(".note-card .close").onclick = closeNote;
    // CSP blocks inline onerror attributes, so attach image fallbacks from script.
    $$("img", panel).forEach((im) => im.addEventListener("error", () => { im.style.display = "none"; }));
    // reveal the notes drawer (right overlay) and dim behind it
    const notes = $("#marginalia");
    if (notes) notes.classList.add("open");
    const bd = $("#toc-backdrop");
    if (bd) bd.classList.remove("hidden");
  }
  function closeDrawers() {
    const toc = $("#toc"); if (toc) toc.classList.remove("open");
    const notes = $("#marginalia"); if (notes) notes.classList.remove("open");
    const bd = $("#toc-backdrop"); if (bd) bd.classList.add("hidden");
  }
  function closeNote() {
    $("#note-panel").innerHTML = "";
    $$(".ann.active").forEach((a) => a.classList.remove("active"));
    closeDrawers();
  }

  // ---------- bind global events ----------
  function bindEvents() {
    // toc navigation
    $("#toc").addEventListener("click", (e) => {
      const a = e.target.closest("a[data-idx], a[data-action]");
      if (!a) return;
      e.preventDefault();
      if (a.dataset.action === "resume") {
        resumeReading();
      } else {
        const idx = parseInt(a.dataset.idx, 10);
        if (idx === -1) renderCover(); else renderChapter(idx, true);
      }
      $("#toc").classList.remove("open");
      $("#toc-backdrop").classList.add("hidden");
      $("#toc-toggle").classList.remove("active");
    });

    // annotation clicks (event delegation)
    $("#main").addEventListener("click", (e) => {
      const ann = e.target.closest(".ann");
      if (!ann) return;
      const id = ann.dataset.ann;
      const def = ANNOTATIONS.find((a) => a.id === id);
      if (!def) return;
      $$(".ann").forEach((a) => a.classList.remove("active"));
      ann.classList.add("active");
      showNote(def);
    });

    // prev/next
    $("#prev-ch").onclick = () => {
      if (currentIndex <= 0) { renderCover(); } else renderChapter(currentIndex - 1, true);
    };
    $("#next-ch").onclick = () => {
      if (currentIndex < 0) {
        // From the cover, Next begins reading.
        const prefaceIdx = CHAPTERS.findIndex((c) => c.id === "Preface");
        renderChapter(prefaceIdx >= 0 ? prefaceIdx : 0, true);
      } else if (currentIndex < CHAPTERS.length - 1) {
        renderChapter(currentIndex + 1, true);
      }
    };

    // toc toggle: overlay drawer on all sizes
    $("#toc-toggle").onclick = (e) => {
      e.stopPropagation();
      const open = $("#toc").classList.toggle("open");
      $("#toc-backdrop").classList.toggle("hidden", !open);
    };
    $("#toc-backdrop").onclick = () => closeDrawers();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeDrawers(); $("#searchbox").classList.add("hidden"); }
    });

    // theme
    $("#theme-toggle").onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    };

    // font size
    const fsInput = $("#font-size");
    const applyFs = () => {
      const v = parseFloat(fsInput.value);
      document.documentElement.style.setProperty("--fs", (1 + v * 0.12).toFixed(2));
      try { localStorage.setItem(FONTSIZE_KEY, fsInput.value); } catch (e) {}
    };
    fsInput.addEventListener("input", applyFs);

    // search
    $("#search-toggle").onclick = () => $("#searchbox").classList.toggle("hidden");
    $("#search-input").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

    // scroll progress
    window.addEventListener("scroll", updatePosition, { passive: true });
  }

  function updatePosition() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const frac = docH > 0 ? (window.scrollY / docH) : 0;
    const pct = Math.round(frac * 100);
    const bar = $("#progress-bar");
    if (bar) bar.style.width = pct + "%";
    const fg = $("#ring-fg");
    if (fg) {
      const c = 2 * Math.PI * 15.5;
      fg.style.strokeDasharray = c.toFixed(1);
      fg.style.strokeDashoffset = (c * (1 - frac)).toFixed(1);
    }
    const rp = $("#ring-pct");
    if (rp) rp.textContent = pct + "%";
    // auto-save reading position (throttled)
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveProgress(window.scrollY), 400);
  }

  function updateTocHighlight() {
    $$("#toc a[data-idx]").forEach((a) => {
      a.classList.toggle("current", parseInt(a.dataset.idx, 10) === currentIndex);
    });
    $("#ch-position").textContent = currentIndex >= 0
      ? (currentIndex + 1) + " of " + CHAPTERS.length
      : "Cover";
  }

  // ---------- search ----------
  // Lazy search index: built on first search, then memoized. Built from
  // AOY.renderableBlocks() so indices match the DOM, and stripped with
  // DOMParser (no innerHTML round-trip, so no resource loads or script parsing).
  let SEARCH = null;
  function searchIndex() {
    if (SEARCH) return SEARCH;
    SEARCH = [];
    CHAPTERS.forEach((c, ci) => {
      AOY.renderableBlocks(c).forEach((b, bi) => {
        const plain = stripTags(b.html);
        if (plain.trim()) SEARCH.push({ ci: ci, bi: bi, text: plain, title: c.title });
      });
    });
    return SEARCH;
  }

  function highlightSnippet(text, q) {
    const re = new RegExp(AOY.regEscape(q), "gi");
    let out = "", last = 0, m;
    while ((m = re.exec(text)) !== null) {
      out += esc(text.slice(last, m.index)) + "<b>" + esc(m[0]) + "</b>";
      last = m.index + m[0].length;
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return out + esc(text.slice(last));
  }

  function doSearch() {
    const q = $("#search-input").value.trim().toLowerCase();
    const box = $("#search-results");
    if (!q) { box.innerHTML = ""; return; }
    let html = '<div class="count">Results for “' + esc(q) + '”</div>';
    let n = 0;
    const SEARCH = searchIndex();
    for (let i = 0; i < SEARCH.length && n < 40; i++) {
      const item = SEARCH[i];
      const idx = item.text.toLowerCase().indexOf(q);
      if (idx < 0) continue;
      n++;
      const start = Math.max(0, idx - 60);
      const end = Math.min(item.text.length, idx + q.length + 80);
      const snippet = highlightSnippet(item.text.slice(start, end), q);
      const ns = start > 0 ? "…" : "";
      const ne = end < item.text.length ? "…" : "";
      html += `<div class="sr" data-ci="${item.ci}" data-bi="${item.bi}">${esc(titleClean(CHAPTERS[item.ci]))} — ${ns}${snippet}${ne}</div>`;
    }
    if (!n) html += '<div class="count">No matches.</div>';
    box.innerHTML = html;
    $$(".sr", box).forEach((el) => {
      el.onclick = () => {
        const ci = parseInt(el.dataset.ci, 10);
        const bi = parseInt(el.dataset.bi, 10);
        goToParagraph(ci, bi, q);
      };
    });
  }

  function goToParagraph(ci, bi, q) {
    renderChapter(ci, true);
    const paras = $$(".ch-body p");
    const target = paras[bi];
    if (!target) return;
    // highlightIn walks raw DOM text nodes, so the RAW query is regex-escaped
    // here (the HTML-escaped form could never match).
    highlightIn(target, new RegExp(AOY.regEscape(q), "gi"));
    setTimeout(() => {
      const y = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 30);
  }

  function highlightIn(target, re) {
    // Walk real text nodes (reject only previously-marked text and footnote
    // anchors); matching inside annotation spans is fine and keeps the marked
    // text consistent with what the reader shows.
    textNodesIn(target, "mark, sup").forEach((node) => {
      const text = node.nodeValue;
      let m; const parts = []; let last = 0;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        parts.push(document.createTextNode(text.slice(last, m.index)));
        const mark = document.createElement("mark");
        mark.textContent = m[0];
        parts.push(mark);
        last = m.index + m[0].length;
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      if (parts.length) {
        parts.push(document.createTextNode(text.slice(last)));
        const frag = document.createDocumentFragment();
        parts.forEach((p) => frag.appendChild(p));
        node.parentNode.replaceChild(frag, node);
      }
    });
  }

  // expose for debugging
  window.Reader = { renderCover, renderChapter, ANNOTATIONS, CHAPTERS };

  // kick off
  document.addEventListener("DOMContentLoaded", init);
})();
