/* Narration for the annotated edition.
 *
 * Deliberately self-contained. app.js renders the chapter and annotations.js
 * wraps the annotated terms inside those paragraphs; both are working on the
 * same DOM this file wants to highlight. So the rule here is: this file never
 * writes innerHTML inside a paragraph and never rebuilds one. It only toggles a
 * class on <p> elements. Anything more would silently destroy the annotation
 * spans and the footnote bindings, which is precisely the thing that must not
 * happen to this book.
 *
 * Timings come from audio/<id>.json, written by render_passage.py at render
 * time -- one entry per paragraph, in the same order app.js renders them.
 * render_passage.py skips <sup> footnote markers, so the narration never reads
 * a footnote aloud; the footnotes remain readable on the page.
 *
 * A chapter with no audio yet simply shows no player. That is the normal state
 * during a partial render, not an error.
 */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };

  var audio = null;      // the HTMLAudioElement, made on first use
  var marks = null;      // [{start, dur}] per paragraph, from the JSON
  var paras = [];        // the <p> elements, same order as marks
  var active = -1;       // index of the highlighted paragraph
  var chapterId = null;
  var follow = true;     // scroll to keep the spoken paragraph in view
  var advancing = false; // rolling on into the next chapter, so play on arrival

  // Remembered across chapters, because someone who wants 1.25x wants it for
  // the whole book, not for one chapter.
  var rate = parseFloat(localStorage.getItem("aoy-rate") || "1") || 1;

  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  /* ---- the paragraph a given time falls in --------------------------------
   * Binary search rather than a scan: timeupdate fires ~4x a second and a
   * chapter can run to 200 paragraphs. */
  function indexAt(t) {
    var lo = 0, hi = marks.length - 1, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (marks[mid].start <= t) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return best;
  }

  function highlight(i) {
    if (i === active) return;
    if (active >= 0 && paras[active]) paras[active].classList.remove("para-speaking");
    active = i;
    if (i < 0 || !paras[i]) return;
    paras[i].classList.add("para-speaking");
    if (!follow || audio.paused) return;
    var r = paras[i].getBoundingClientRect();
    // Only scroll when the paragraph has actually left the comfortable band --
    // scrolling on every paragraph makes the page twitch.
    if (r.top < 90 || r.bottom > window.innerHeight - 140) {
      window.scrollTo({ top: window.scrollY + r.top - window.innerHeight * 0.32,
                        behavior: "smooth" });
    }
  }

  /* ---- the bar ----------------------------------------------------------- */

  function bar() {
    var el = $("#player");
    if (el) return el;
    el = document.createElement("div");
    el.id = "player";
    el.className = "player hidden";
    el.innerHTML =
      '<button id="pl-play" class="pl-btn" aria-label="Play narration" title="Play / pause the narration (space). Option-click any paragraph to read from there.">▶</button>' +
      '<button id="pl-back" class="pl-btn pl-small" aria-label="Back 15 seconds" title="Back 15s">↺</button>' +
      '<span id="pl-time" class="pl-time">0:00</span>' +
      '<input id="pl-seek" class="pl-seek" type="range" min="0" max="1000" value="0" ' +
             'aria-label="Position in chapter" />' +
      '<span id="pl-dur" class="pl-time">0:00</span>' +
      '<select id="pl-rate" class="pl-rate" aria-label="Speed" title="Speed">' +
        '<option value="0.75">0.75x</option><option value="1">1x</option>' +
        '<option value="1.15">1.15x</option><option value="1.3">1.3x</option>' +
        '<option value="1.5">1.5x</option></select>' +
      '<button id="pl-follow" class="pl-btn pl-small on" aria-label="Follow along" ' +
             'title="Scroll to follow the narration">⇵</button>' +
      '<button id="pl-close" class="pl-btn pl-small" aria-label="Hide player" title="Hide">✕</button>';
    document.body.appendChild(el);

    $("#pl-play", el).addEventListener("click", toggle);
    $("#pl-back", el).addEventListener("click", function () {
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    $("#pl-seek", el).addEventListener("input", function (e) {
      if (audio && audio.duration) audio.currentTime = audio.duration * e.target.value / 1000;
    });
    var sel = $("#pl-rate", el);
    sel.value = String(rate);
    sel.addEventListener("change", function (e) {
      rate = parseFloat(e.target.value) || 1;
      localStorage.setItem("aoy-rate", String(rate));
      if (audio) audio.playbackRate = rate;
    });
    $("#pl-follow", el).addEventListener("click", function (e) {
      follow = !follow;
      e.currentTarget.classList.toggle("on", follow);
    });
    $("#pl-close", el).addEventListener("click", function () {
      if (audio) audio.pause();
      el.classList.add("hidden");
      document.body.classList.remove("with-player");
    });
    return el;
  }

  /* A line under the chapter title saying the chapter is narrated and how to
   * drive it. Written here rather than in app.js so it can only ever appear on
   * a chapter that really has audio, and inserted after annotateBody() has run
   * so the annotator never sees it. A <div>, deliberately not a <p>: the
   * paragraph list this file highlights is every <p> in the article, and a
   * stray one would throw the count off by one. */
  function hint(article) {
    var head = article && article.querySelector(".ch-head");
    if (!head || head.querySelector(".ch-audio-hint")) return;
    var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;
    var el = document.createElement("div");
    el.className = "ch-audio-hint";
    el.textContent = touch
      ? "Narrated · press play in the bar at the foot of the screen. The text follows along, "
        + "and the reading carries on into the next chapter."
      : "Narrated · press play in the bar at the foot of the page, or the space bar. "
        + "Hold Option and click any paragraph to start reading from there. The text follows "
        + "along, and the reading carries on into the next chapter.";
    head.appendChild(el);
  }

  function toggle() {
    if (!audio) return;
    // Closing the bar means "stop offering me this chapter", so the space bar
    // must not reach past it. Without this, ✕ then space starts narration with
    // nothing on screen to stop it.
    var el = $("#player");
    if (!el || el.classList.contains("hidden")) return;
    if (audio.paused) { audio.playbackRate = rate; audio.play().catch(noAudio); }
    else audio.pause();
  }

  function noAudio() {
    var el = $("#player");
    if (el) el.classList.add("hidden");
    document.body.classList.remove("with-player");
  }

  /* ---- rolling on into the next chapter -----------------------------------
   * Someone listening in the car cannot reach over and pick the next chapter,
   * so the end of one is the start of the next. The reader is driven through
   * Reader.renderChapter(), the same call the table of contents makes, so the
   * page arrives properly rendered -- annotations, footnotes and all -- and the
   * highlighting simply carries on in the new text.
   *
   * Nothing here assumes every chapter has audio: an unrendered one is stepped
   * over rather than stopping the run, which keeps this working during a
   * partial render. Reaching the end of the book just stops. */

  function rollOn() {
    var R = window.Reader;
    if (!R || !R.CHAPTERS || !chapterId) return;
    for (var i = 0; i < R.CHAPTERS.length; i++) {
      if (R.CHAPTERS[i].id === chapterId) { rollTo(i + 1, chapterId); return; }
    }
  }

  /* `from` is the chapter this run started at. The probe below is asynchronous,
   * and in that window the reader may have picked something else from the
   * contents -- in which case they have overruled the roll-on and must not be
   * yanked to a chapter they didn't choose. load() moves chapterId, so a
   * changed chapterId is exactly that signal. */
  function rollTo(i, from) {
    var R = window.Reader;
    if (!R || i >= R.CHAPTERS.length) return;   // end of the book
    if (chapterId !== from) return;             // the reader has taken over
    // HEAD, not GET: this only asks whether the chapter is narrated. The real
    // fetch happens in load() a moment later and comes from cache.
    fetch("audio/" + encodeURIComponent(R.CHAPTERS[i].id) + ".json", { method: "HEAD" })
      .then(function (r) {
        if (!r.ok) return rollTo(i + 1, from);   // not narrated yet: step over it
        if (chapterId !== from) return;
        advancing = true;
        try { R.renderChapter(i, true); } finally { advancing = false; }
      })
      // A fetch that rejects is the network failing, not a chapter that is
      // missing. Walking the rest of the book asking the same dead connection
      // 40 more times helps nobody, so stop and leave the reader where they are.
      .catch(function () {});
  }

  /* ---- called by app.js after each chapter renders ------------------------ */

  function load(id, article) {
    chapterId = id;
    marks = null; paras = []; active = -1;
    // Someone listening who jumps to another chapter means "read me that one",
    // not "stop reading". Switching the src always pauses the element, so carry
    // the intention across by hand. A chapter that has just ended is paused too,
    // and there `advancing` is what carries it. Read and clear that here, before
    // any early return below can strand it as true.
    var wasPlaying = (!!audio && !audio.paused) || advancing;
    advancing = false;
    if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    var el = $("#player");
    if (el) el.classList.add("hidden");

    fetch("audio/" + encodeURIComponent(id) + ".json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        // Chapter changed mid-fetch, or this one simply has no narration. The
        // reserved space goes back only here, not in the synchronous hide
        // above -- releasing it on every chapter change would make the page
        // jump as the padding came off and went straight back on.
        if (!data) { document.body.classList.remove("with-player"); return; }
        if (chapterId !== id) return;
        var list = data.paragraphs || data;
        paras = Array.prototype.slice.call(article.querySelectorAll("p"));

        // The renderer and the reader must agree on what a paragraph is. If they
        // ever drift, every highlight after the first difference lands on the
        // wrong text -- so refuse to guess rather than mislead the reader.
        if (list.length !== paras.length) {
          console.warn("[audio] " + id + ": " + list.length + " timed paragraphs but " +
                       paras.length + " rendered; highlighting disabled.");
          list = null;
        }
        marks = list;

        var el = bar();
        el.classList.remove("hidden");
        document.body.classList.add("with-player");
        if (!audio) {
          // In the document, not a bare `new Audio()`. An un-attached element
          // still plays, but the tab shows no sound indicator and nothing --
          // including a future maintainer's querySelectorAll("audio") -- can
          // find it to stop it. Sound with no visible source is the worst kind.
          audio = document.createElement("audio");
          audio.id = "pl-audio";
          el.appendChild(audio);
          audio.preload = "metadata";
          audio.addEventListener("timeupdate", tick);
          audio.addEventListener("play", function () { $("#pl-play").textContent = "❚❚"; });
          audio.addEventListener("pause", function () { $("#pl-play").textContent = "▶"; });
          audio.addEventListener("ended", function () { highlight(-1); rollOn(); });
          audio.addEventListener("error", noAudio);
          audio.addEventListener("loadedmetadata", function () {
            $("#pl-dur").textContent = fmt(audio.duration);
          });
        }
        audio.src = "audio/" + encodeURIComponent(id) + ".mp3";
        audio.playbackRate = rate;
        // Not noAudio() on failure: the file is plainly there, so a refused
        // resume means the browser wanted a fresh gesture. Leave the bar up
        // with the new chapter loaded and let the reader press play.
        if (wasPlaying) audio.play().catch(function () {});
        hint(article);
      })
      .catch(function () { /* no audio for this chapter yet */ });
  }

  function tick() {
    $("#pl-time").textContent = fmt(audio.currentTime);
    if (audio.duration) {
      $("#pl-seek").value = String(Math.round(audio.currentTime / audio.duration * 1000));
    }
    if (marks) highlight(indexAt(audio.currentTime));
  }

  /* Option-click a paragraph to start reading there. Option, not plain click,
   * because a plain click already opens the annotation panel and that
   * behaviour predates the narration. */
  document.addEventListener("click", function (e) {
    if (!e.altKey || !audio || !marks) return;
    var p = e.target.closest && e.target.closest(".ch-body p");
    if (!p) return;
    var i = paras.indexOf(p);
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    // Deliberate ask, so bring the bar back if it was closed -- otherwise this
    // is the same sound-with-no-visible-source the ✕ was meant to end.
    var pl = $("#player");
    if (pl && pl.classList.contains("hidden")) {
      pl.classList.remove("hidden");
      document.body.classList.add("with-player");
    }
    audio.currentTime = marks[i].start;
    if (audio.paused) { audio.playbackRate = rate; audio.play().catch(noAudio); }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (!audio || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    if (e.key === " ") { e.preventDefault(); toggle(); }
  });

  window.AOYAudio = { load: load };
})();
