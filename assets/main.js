/* Planet A Foods — interactions. No dependencies; works offline. Motion is
   deliberately restrained (blue-chip, not startup) and respects reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile nav */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
    });
    // mobile: tapping a top-level item expands its dropdown instead of navigating
    nav.querySelectorAll(".nav-top").forEach(function (t) {
      t.addEventListener("click", function (e) {
        if (window.innerWidth <= 720) { e.preventDefault(); t.parentNode.classList.toggle("open"); }
      });
    });
    // close the mobile drawer when an actual destination link is tapped
    nav.querySelectorAll(".nav-links a:not(.nav-top)").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  /* Nav: condense + shadow once you leave the top */
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Staggered scroll reveal */
  var reveals = document.querySelectorAll(".reveal");
  reveals.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
      return c.classList && c.classList.contains("reveal");
    });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 90 + "ms";
  });
  if ("IntersectionObserver" in window && !reduce && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Count-up on stat numbers */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target.toLocaleString("en-US") + suffix; return; }
    var start = null, dur = 1500;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* Background videos: only play while on-screen (saves CPU/battery) */
  var vids = document.querySelectorAll(".media-vid");
  if ("IntersectionObserver" in window && vids.length) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (v.play) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (v.pause) { v.pause(); }
      });
    }, { threshold: 0.15 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  /* Current year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* Video crossfade — two copies of the same clip running half a loop apart,
   cross-dissolved by distance-to-seam, so the loop point is never visible
   (no hard cut, no poster flash, no seek-to-0 jump). */
(function () {
  "use strict";
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  function setup(wrap) {
    var vids = wrap.querySelectorAll("video.xfade");
    if (vids.length < 2) { if (vids[0]) { vids[0].loop = true; play(vids[0]); } return; }
    var a = vids[0], b = vids[1];
    a.loop = true; b.loop = true;
    a.style.opacity = 1; b.style.opacity = 0;
    play(a);
    (function offset() {
      if (b.readyState >= 1 && b.duration && isFinite(b.duration)) {
        try { b.currentTime = b.duration / 2; } catch (e) {}
        play(b);
      } else { b.addEventListener("loadedmetadata", offset, { once: true }); }
    })();
    function frame() {
      var d = a.duration;
      if (d && isFinite(d)) {
        var da = Math.min(a.currentTime, d - a.currentTime);   // A's distance from its loop seam
        var db = Math.min(b.currentTime, d - b.currentTime);   // B's distance from its loop seam
        var oa = (da + db) > 0 ? da / (da + db) : 1;           // show whichever is farther from a seam
        a.style.opacity = oa; b.style.opacity = 1 - oa;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { play(a); play(b); } else { a.pause(); b.pause(); } });
      }, { threshold: 0.05 }).observe(wrap);
    }
  }
  document.querySelectorAll("[data-xfade]").forEach(setup);
})();

/* Pause the hero lens video once its intro fade completes (it's hidden after). */
(function () {
  var lens = document.querySelector(".hero-lens");
  if (!lens) return;
  var v = lens.querySelector("video");
  if (!v) return;
  lens.addEventListener("animationend", function (e) {
    if (e.animationName === "heroLensIntro") { try { v.pause(); } catch (x) {} }
  });
})();

/* Premium pass — hairline scroll-progress bar + gentle image parallax.
   rAF-throttled, passive, and fully disabled under prefers-reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  function progress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (window.pageYOffset || h.scrollTop) / max : 0;
    bar.style.width = (Math.max(0, Math.min(1, p)) * 100) + "%";
  }

  var items = reduce ? [] : Array.prototype.slice.call(
    document.querySelectorAll(".split-media, .scale-band .bg, .insight-media, .page-hero .bg"));
  function parallax() {
    var vh = window.innerHeight;
    for (var i = 0; i < items.length; i++) {
      var el = items[i], r = el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) continue;
      var off = ((r.top + r.height / 2) - vh / 2) / vh;      // ~ -0.5..0.5
      var y = Math.max(-18, Math.min(18, off * -36));
      el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) scale(1.12)";
    }
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { progress(); parallax(); ticking = false; });
  }
  progress(); parallax();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
})();
