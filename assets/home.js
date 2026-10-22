/* Planet A Foods — homepage interactions (index.html only).
   Ingredient reel, smart nav, Why-now drivers, portfolio carousel.
   No dependencies; respects prefers-reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function play(v) { if (!v) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  /* ---- Hero: ingredient reel (cocoa booster → coffee → nuts → chocolate → speciality fats) ---- */
  var reels = [].slice.call(document.querySelectorAll(".hero .reel"));
  var marks = [].slice.call(document.querySelectorAll(".reel-index li"));
  var current = 0, timer = null, HOLD = 5200;
  var FX = ["wipe", "dissolve", "rise", "zoom"], cut = 0;   // reveal styles, rotated cut by cut
  function show(i) {
    if (i === current) return;
    var prev = current;
    reels.forEach(function (r, k) {
      var on = k === i, was = k === prev, v = r.querySelector("video");
      if (on) r.setAttribute("data-fx", r.getAttribute("data-in") || FX[cut++ % FX.length]);   // a shot can pin its own reveal (data-in)
      r.classList.toggle("on", on);
      r.classList.toggle("was", was);   // outgoing shot stays visible underneath while the next one fades in
      if (v) { if (on) { try { v.currentTime = 0; } catch (e) {} play(v); } else if (!was) { v.pause(); } }
    });
    marks.forEach(function (m, k) { m.classList.toggle("on", k === i); });
    current = i;
  }
  function next() { show((current + 1) % reels.length); }
  // the name links to its page; the stripe next to it shows that shot and restarts the timer
  marks.forEach(function (m, k) {
    var go = m.querySelector(".reel-go");
    if (!go) return;
    go.addEventListener("click", function () {
      show(k);
      if (timer) { clearInterval(timer); timer = setInterval(next, HOLD); }
    });
  });
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
  var whyImgs = [].slice.call(document.querySelectorAll(".why-media [data-for]"));   // one figure (image + fact) per driver
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
  var groups = [].slice.call(document.querySelectorAll(".group[data-group]"));   // only real tabs; the single label is not clickable
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
  // show there is more: "1–3 of 5" counter, item count per group, fade on the side with more cards
  var carousel = document.querySelector(".carousel");
  var counter = document.querySelector(".carousel-count");
  document.querySelectorAll("[data-count-for]").forEach(function (c) {
    c.textContent = document.querySelectorAll('.carousel .slide[data-group="' + c.getAttribute("data-count-for") + '"]').length;
  });
  function arrowState() {
    if (!track) return;
    var max = track.scrollWidth - track.clientWidth - 2;
    document.querySelectorAll(".arrow-btn").forEach(function (b) {
      var d = parseInt(b.getAttribute("data-dir"), 10);
      b.disabled = d < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
    var slides = [].filter.call(track.querySelectorAll(".slide"), function (s) { return !s.hidden; });
    if (!slides.length) return;
    var gap = parseFloat(getComputedStyle(track).columnGap || 0);
    var step = slides[0].getBoundingClientRect().width + gap;
    var first = Math.round(track.scrollLeft / step);
    var fit = Math.max(1, Math.floor((track.clientWidth + gap + 4) / step));
    var last = Math.min(slides.length, first + fit);
    if (counter) counter.textContent = slides.length <= fit ? "" : (fit === 1 ? (first + 1) : (first + 1) + "–" + last) + " of " + slides.length;
    if (carousel) {
      carousel.classList.toggle("more-right", track.scrollLeft < max);
      carousel.classList.toggle("more-left", track.scrollLeft > 2);
    }
  }
  if (track) { track.addEventListener("scroll", arrowState, { passive: true }); window.addEventListener("resize", arrowState); arrowState(); }
})();
