// Shared helpers for the Autobiography of a Yogi reader + local review tools.
// Single source of truth for escaping, image URL building, term matching,
// footnote enrichment, and "which blocks render". Load in index.html,
// gallery.html and footnotes.html BEFORE any inline script that uses AOY.
// Also loadable from Node (module.exports) for the headless tests.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AOY = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var FILE_PREFIX = "https://commons.wikimedia.org/wiki/Special:FilePath/";

  // ---- text / attribute escaping (XSS-safe interpolation) ----
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) {
    return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function regEscape(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ---- URL helpers ----
  // Where the site root sits relative to the page being viewed. index.html is
  // the root and gets ""; a generated chapter page lives one directory down
  // and declares <meta name="aoy-base" content="../">. Everything that builds
  // a same-origin URL -- assets, narration fetches, TOC hrefs -- goes through
  // this, because the reader is served from three hosts at three different
  // path depths and a root-relative "/audio/..." is only correct on one.
  //
  // A meta tag rather than an inline script: index.html's CSP is
  // script-src 'self' with no 'unsafe-inline', so a bootstrap <script> block
  // would simply not run. A <base href> is out for the same reason
  // (base-uri 'none'), and would rewrite every relative URL on the page, not
  // just ours.
  var _base = null;
  function base() {
    if (_base === null) {
      var m = (typeof document !== "undefined") &&
        document.querySelector('meta[name="aoy-base"]');
      _base = (m && m.getAttribute("content")) || "";
    }
    return _base;
  }

  function isHttpUrl(u) {
    try {
      var p = new URL(String(u)).protocol;
      return p === "https:" || p === "http:";
    } catch (e) { return false; }
  }
  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return String(u); }
  }
  // Builds the URL used for <img src>/<a href>. Absolute values must be real
  // http(s) URLs; relative values are resolved against Wikimedia Commons.
  function imgUrl(file, width) {
    if (!file) return null;
    var s = String(file);
    var w = width || 640;
    if (/^https?:\/\//i.test(s)) {
      if (!isHttpUrl(s)) return null;
      return s;
    }
    return FILE_PREFIX + encodeURIComponent(s.replace(/ /g, "_")) + "?width=" + w;
  }

  // ---- HTML handling ----
  function hasDOMParser() { return typeof DOMParser !== "undefined"; }

  // Text content of an HTML snippet without instantiating a live document node
  // in the page (no resource loads, no script parsing).
  function stripTags(html) {
    if (hasDOMParser()) {
      var doc = new DOMParser().parseFromString(String(html), "text/html");
      return doc.body ? (doc.body.textContent || "") : "";
    }
    return String(html).replace(/<[^>]*>/g, " ");
  }

  // Tags the reader body actually needs. Everything else is unwrapped (its
  // text is kept) and unknown attributes are dropped — defense in depth on
  // top of the data-level cleaning in scripts/clean_data.mjs.
  var ALLOWED_TAGS = {
    SUP: ["class", "data-fn"],
    BR: [],
    B: [],
    STRONG: [],
    I: [],
    EM: []
  };

  function sanitizeHtml(html) {
    if (!hasDOMParser()) return String(html); // Node fallback: not used by the reader
    var wrapper = document.createElement("div");
    wrapper.innerHTML = String(html);
    cleanNode(wrapper);
    return wrapper.innerHTML;
  }

  function cleanNode(node) {
    var children = Array.prototype.slice.call(node.childNodes);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.nodeType === 1) {
        var tag = child.tagName.toUpperCase();
        if (!ALLOWED_TAGS[tag]) {
          // unwrap: keep text, drop the element (and any scripts/styles inside it)
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          continue;
        }
        var allowed = ALLOWED_TAGS[tag];
        var attrs = Array.prototype.slice.call(child.attributes);
        for (var j = 0; j < attrs.length; j++) {
          if (allowed.indexOf(attrs[j].name) < 0) child.removeAttribute(attrs[j].name);
        }
        cleanNode(child);
      } else if (child.nodeType !== 3 && child.nodeType !== 4) {
        node.removeChild(child);
      }
    }
  }

  // ---- book data ----
  // Single definition of "which blocks render" — the search index and the DOM
  // must both come from here so block indices can never drift apart.
  function renderableBlocks(chapter) {
    return ((chapter && chapter.blocks) || []).filter(function (b) {
      return b && b.type === "p" && b.html && b.html.trim();
    });
  }

  // ---- term matching ----
  // Whole-word, case-insensitive containment test. Deliberately uses manual
  // boundary checks instead of RegExp lookbehind so it works on every engine
  // (Safari < 16.4 included) and never throws.
  function termHasMatch(text, term) {
    var s = String(text).toLowerCase();
    var t = String(term).toLowerCase();
    if (!t) return false;
    var i = 0;
    while ((i = s.indexOf(t, i)) >= 0) {
      var end = i + t.length;
      var beforeOk = i === 0 || !/[a-z0-9]/.test(s.charAt(i - 1));
      var afterOk = end >= s.length || !/[a-z0-9]/.test(s.charAt(end));
      if (beforeOk && afterOk) return true;
      i = end;
    }
    return false;
  }

  // ---- footnote enrichment ----
  // Two-pass match shared by the reader (app.js) and the curation tool
  // (footnotes.html): annotation terms found in the note text contribute
  // images + links; terms found only in the surrounding sentence contribute
  // images only. Terms must be >2 chars and word-boundary guarded.
  function enrichNote(note, context, annotations) {
    var tlow = String(note).toLowerCase();
    var nlow = (String(note) + " " + String(context || "")).toLowerCase();
    var noteFound = new Map(), ctxOnly = new Map();
    annotations.forEach(function (ann) {
      var matched = false;
      (ann.terms || []).forEach(function (t) {
        var tt = String(t).trim();
        if (tt.length > 2 && termHasMatch(tlow, tt)) {
          noteFound.set(ann.id, ann); matched = true;
        }
      });
      if (!matched) {
        (ann.terms || []).forEach(function (t) {
          var tt = String(t).trim();
          if (tt.length > 2 && termHasMatch(nlow, tt)) ctxOnly.set(ann.id, ann);
        });
      }
    });
    var images = [], links = [], tags = [], seen = new Set();
    function addAnn(ann, withLinks) {
      if (ann.image) images.push(ann.image);
      if (withLinks) {
        tags.push(ann.label);
        (ann.links || []).forEach(function (l) {
          if (l && l.url && !seen.has(l.url)) { seen.add(l.url); links.push(l); }
        });
      }
    }
    noteFound.forEach(function (ann) { addAnn(ann, true); });
    ctxOnly.forEach(function (ann) { addAnn(ann, false); });
    return { images: images, links: links, tags: tags };
  }

  return {
    esc: esc,
    escAttr: escAttr,
    regEscape: regEscape,
    base: base,
    isHttpUrl: isHttpUrl,
    hostOf: hostOf,
    imgUrl: imgUrl,
    stripTags: stripTags,
    sanitizeHtml: sanitizeHtml,
    renderableBlocks: renderableBlocks,
    termHasMatch: termHasMatch,
    enrichNote: enrichNote
  };
});
