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
  const fileUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/";
  const annByTerm = buildTermIndex();

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

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function stripTags(html) {
    const t = document.createElement("div");
    t.innerHTML = html;
    return t.textContent;
  }
  function imgUrl(file, width) {
    if (!file) return null;
    const w = width || 640;
    // Special:FilePath accepts spaces; encode for safety
    return fileUrl + encodeURIComponent(file.replace(/ /g, "_")) + "?width=" + w;
  }

  // Global endnote map (for cross-chapter references like FN26-6 in ch27)
  const GLOBAL_NOTES = {};
  CHAPTERS.forEach((c) => {
    Object.keys(c.endnotes || {}).forEach((k) => { GLOBAL_NOTES[k] = { note: c.endnotes[k], chapter: c.title }; });
  });

  // Build a lookup: normalized term -> annotation
  function buildTermIndex() {
    const idx = {};
    for (const ann of ANNOTATIONS) {
      for (const term of (ann.terms || [])) {
        const t = term.trim();
        if (t) idx[t.toLowerCase()] = ann;
      }
    }
    return idx;
  }

  // ---------- top-level render ----------
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
          <img src="${imgUrl("Paramahansa_Yogananda.jpg", 560)}" alt="Paramahansa Yogananda"
               onerror="this.style.display='none'"/>
        </div>
        <h1 class="cover-title">Autobiography<br/>of a Yogi</h1>
        <p class="cover-author">Paramahansa Yogananda</p>
        <div class="dec"></div>
        <p class="cover-sub">An Annotated Public-Domain Edition &nbsp;·&nbsp; 48 Chapters</p>
        <div class="cover-actions">
          <button class="start" id="start-reading">Begin Reading →</button>
          ${resume}
        </div>
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
  }

  // ---------- chapter rendering ----------
  function renderChapter(idx, scrollTop) {
    if (idx < 0 || idx >= CHAPTERS.length) return;
    currentIndex = idx;
    const c = CHAPTERS[idx];
    const main = $("#main");

    const isEndnoteCap = /^Chapter_20$/.test(c.id); // no-op safeguard
    let bodyHtml = c.blocks
      .filter((b) => b.type === "p" && b.html.trim())
      .map((b) => `<p>${b.html}</p>`)
      .join("");

    main.innerHTML = `
      <article class="ch-body" data-idx="${idx}">
        <header class="ch-head">
          <div class="ch-chapter">${chapterLabel(c)}</div>
          <h2 class="ch-title">${esc(titleClean(c))}</h2>
          ${c.title.indexOf(":") >= 0 && /^Chapter/.test(c.title) ? "" : ""}
          <hr class="ch-divider"/>
        </header>
        ${bodyHtml}
      </article>`;

    annotateBody($(".ch-body"));
    bindFootnotes($(".ch-body"));
    updateTocHighlight();
    updatePosition();

    if (scrollTop) window.scrollTo(0, 0);
    closeNote();
  }

  // Wrap annotation terms in the body
  function annotateBody(article) {
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (node.parentNode && node.parentNode.closest("sup, .ann")) return NodeFilter.FILTER_REJECT;
        const t = node.nodeValue;
        if (!t || !t.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker);
    nodes.forEach(wrapTextNode);
  }

  function wrapTextNode(node) {
    const text = node.nodeValue;
    const candidates = [];
    for (const term in annByTerm) {
      const ann = annByTerm[term];
      let re = null;
      try {
        // Match whole words only: guard both ends so a term like "Christ"
        // doesn't highlight inside "Christian"/"Christlike".
        re = new RegExp(
          "(?<![A-Za-z0-9])" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z0-9])",
          "gi"
        );
      }
      catch (e) { continue; }
      let m;
      while ((m = re.exec(text)) !== null) {
        candidates.push({ start: m.index, end: m.index + m[0].length, ann });
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
    const nlow = (note + " " + (context || "")).toLowerCase();
    const found = new Map();
    for (const ann of ANNOTATIONS) {
      for (const t of (ann.terms || [])) {
        if (t && t.trim().length > 2 && nlow.indexOf(t.toLowerCase()) >= 0) { found.set(ann.id, ann); break; }
      }
    }
    const images = [], links = [], seen = new Set();
    found.forEach((ann) => {
      if (ann.image) images.push(ann.image);
      (ann.links || []).forEach((l) => { if (!seen.has(l.url)) { seen.add(l.url); links.push(l); } });
    });
    return { images, links };
  }

  function bindFootnotes(article) {
    $$("sup.fn", article).forEach((sup) => {
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
        showNote({
          title: ((c.title.match(/Chapter\s+(\d+)/) ? "Chapter " + c.title.match(/Chapter\s+(\d+)/)[1] : "Preface") + " · Note " + key + origin),
          body: note,
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
    images.forEach((f) => {
      imgs += `<img src="${imgUrl(f)}" alt="${esc(ann.label || ann.title || "annotation")}" onerror="this.style.display='none'"/>
               <div class="src">Image: Wikimedia Commons (shared license)</div>`;
    });
    let links = "";
    if (ann.links && ann.links.length) {
      links = "<div class='links'>" + ann.links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">↗ ${esc(l.label)}</a>`).join("") + "</div>";
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
      if (currentIndex >= 0 && currentIndex < CHAPTERS.length - 1) renderChapter(currentIndex + 1, true);
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
    const label = currentIndex >= 0 ? CHAPTERS[currentIndex].title : "Cover";
    $("#ch-position").textContent = currentIndex >= 0
      ? (currentIndex + 1) + " of " + CHAPTERS.length
      : "Cover";
  }

  // ---------- search ----------
  function buildSearchIndex() {
    const idx = [];
    CHAPTERS.forEach((c, ci) => {
      c.blocks.forEach((b, bi) => {
        const plain = stripTags(b.html);
        if (plain.trim()) idx.push({ ci, bi, text: plain, title: c.title });
      });
    });
    return idx;
  }
  const SEARCH = buildSearchIndex();

  function doSearch() {
    const q = $("#search-input").value.trim().toLowerCase();
    const box = $("#search-results");
    if (!q) { box.innerHTML = ""; return; }
    let html = '<div class="count">Results for “' + esc(q) + '”</div>';
    let n = 0;
    for (let i = 0; i < SEARCH.length && n < 40; i++) {
      const item = SEARCH[i];
      const idx = item.text.toLowerCase().indexOf(q);
      if (idx < 0) continue;
      n++;
      const start = Math.max(0, idx - 60);
      const end = Math.min(item.text.length, idx + q.length + 80);
      let snippet = item.text.slice(start, end);
      snippet = esc(snippet);
      const re = new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      snippet = snippet.replace(re, (m) => "<b>" + m + "</b>");
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
    // highlight matches in target paragraph
    const re = new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    // re-annotate this paragraph after annotation engine already ran; skip (annotations preserved), just mark
    highlightIn(target, re);
    setTimeout(() => {
      const y = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 30);
  }

  function highlightIn(target, re) {
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.parentNode && n.parentNode.closest(".ann, mark") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker);
    nodes.forEach((node) => {
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
