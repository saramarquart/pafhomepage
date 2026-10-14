/* Planet A Foods — homepage interactions (index.html only).
   Ingredient reel, nav tone, Why-now drivers, portfolio carousel.
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

  /* ---- Nav: logo is white over dark sections, brand purple over light ones ---- */
  var nav = document.querySelector(".nav");
  var toned = [].slice.call(document.querySelectorAll("[data-tone]"));
  function tone() {
    var y = 60, t = "dark";
    for (var i = 0; i < toned.length; i++) {
      var r = toned[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { t = toned[i].getAttribute("data-tone"); break; }
    }
    nav.setAttribute("data-on", t);
  }
  if (nav) { tone(); window.addEventListener("scroll", tone, { passive: true }); window.addEventListener("resize", tone); }

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
