/* Planet A Foods — homepage interactions (index.html only).
   Ingredient reel, smart nav, Why-now drivers, portfolio carousel.
   No dependencies; respects prefers-reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function play(v) { if (!v) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  /* ---- Hero: ingredient reel (cocoa → citrus → vanilla → hazelnut → meat) ---- */
  var reels = [].slice.call(document.querySelectorAll(".hero .reel"));
  var marks = [].slice.call(document.querySelectorAll(".reel-index li"));
  var current = 0, timer = null, HOLD = 5200;
  function show(i) {
    reels.forEach(function (r, k) {
      var on = k === i, v = r.querySelector("video");
      r.classList.toggle("on", on);
      if (v) { if (on) { try { v.currentTime = 0; } catch (e) {} play(v); } else { v.pause(); } }
    });
    marks.forEach(function (m, k) { m.classList.toggle("on", k === i); });
    current = i;
  }
  function next() { show((current + 1) % reels.length); }
  if (reels.length) {
    show(0);
    if (!reduce) {
      timer = setInterval(next, HOLD);
      // pause the reel when the hero is off-screen
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            var v = reels[current].querySelector("video");
            if (e.isIntersecting) { if (!timer) timer = setInterval(next, HOLD); play(v); }
            else { clearInterval(timer); timer = null; if (v) v.pause(); }
          });
        }, { threshold: 0.05 }).observe(document.querySelector(".hero"));
      }
    }
  }

  /* ---- Nav: transparent at the top; slim white bar once scrolled.
     Hides while reading downwards, returns on any upward scroll. ---- */
  var nav = document.querySelector(".nav");
  var lastY = window.pageYOffset || 0;
  function onNav() {
    var y = window.pageYOffset || 0;
    nav.classList.toggle("scrolled", y > 40);
    var down = y > lastY + 4, up = y < lastY - 4;
    if (nav.classList.contains("open")) { nav.classList.remove("away"); }
    else if (down && y > 320) { nav.classList.add("away"); }
    else if (up || y <= 320) { nav.classList.remove("away"); }
    if (down || up) lastY = y;
  }
  if (nav) {
    onNav();
    window.addEventListener("scroll", onNav, { passive: true });
    nav.addEventListener("focusin", function () { nav.classList.remove("away"); });
  }

  /* ---- Why now: hover / focus / click a driver to open it and swap the image ---- */
  var drivers = [].slice.call(document.querySelectorAll(".driver"));
  var whyImgs = [].slice.call(document.querySelectorAll(".why-media img"));
  function activate(btn) {
    var key = btn.getAttribute("data-key");
    drivers.forEach(function (d) { var on = d === btn; d.classList.toggle("on", on); d.setAttribute("aria-selected", on); });
    whyImgs.forEach(function (im) { im.classList.toggle("on", im.getAttribute("data-for") === key); });
  }
  drivers.forEach(function (d) {
    d.addEventListener("mouseenter", function () { activate(d); });
    d.addEventListener("focus", function () { activate(d); });
    d.addEventListener("click", function () { activate(d); });
  });

  /* ---- Sustainability: count the CO₂ figure up once (one decimal) ---- */
  document.querySelectorAll("[data-tick]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-tick"));
    function set(v) { el.textContent = "\u2212" + v.toFixed(1); }
    if (reduce || !("IntersectionObserver" in window)) { set(target); return; }
    set(0);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1800, 1);
        set(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ---- Portfolio groups: climate-threatened vs highly regulated ---- */
  var groups = [].slice.call(document.querySelectorAll(".group"));
  function pickGroup(btn) {
    var g = btn.getAttribute("data-group");
    groups.forEach(function (b) { var on = b === btn; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    document.querySelectorAll(".carousel .slide").forEach(function (s) { s.hidden = s.getAttribute("data-group") !== g; });
    document.querySelectorAll(".group-note").forEach(function (n) { n.hidden = n.getAttribute("data-note") !== g; });
    var t = document.querySelector(".carousel .track");
    if (t) { t.scrollLeft = 0; t.dispatchEvent(new Event("scroll")); }
  }
  groups.forEach(function (b) { b.addEventListener("click", function () { pickGroup(b); }); });

  /* ---- Portfolio carousel arrows ---- */
  var track = document.querySelector(".carousel .track");
  document.querySelectorAll(".arrow-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!track) return;
      var slide = track.querySelector(".slide");
      var step = slide ? slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 400;
      track.scrollBy({ left: step * parseInt(b.getAttribute("data-dir"), 10), behavior: reduce ? "auto" : "smooth" });
    });
  });
  function arrowState() {
    if (!track) return;
    var max = track.scrollWidth - track.clientWidth - 2;
    document.querySelectorAll(".arrow-btn").forEach(function (b) {
      var d = parseInt(b.getAttribute("data-dir"), 10);
      b.disabled = d < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
  }
  if (track) { track.addEventListener("scroll", arrowState, { passive: true }); window.addEventListener("resize", arrowState); arrowState(); }
})();
