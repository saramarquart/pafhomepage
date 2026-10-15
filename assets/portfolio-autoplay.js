/* Planet A Foods — homepage portfolio carousel: a very slow, constant glide from left to right.
   A hidden copy of the cards sits before the real ones so the row loops seamlessly; it starts on
   Cocoa Booster, which then travels across the whole row (in view the longest).
   Starts 3 s after the carousel comes into view. Pauses on hover / focus / touch, while off-screen
   or in a background tab, and never runs with prefers-reduced-motion. Arrows keep working (home.js). */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var carousel = document.querySelector(".portfolio .carousel");
  var track = carousel && carousel.querySelector(".track");
  if (reduce || !track) return;

  var SPEED = 22;          // px per second — slow on purpose
  var START_DELAY = 3000;  // ms after the carousel comes into view

  // 1. hidden copy of all cards in front of the real ones (not focusable, not announced)
  var originals = [].slice.call(track.querySelectorAll(".slide"));
  var clones = originals.map(function (s) {
    var c = s.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.setAttribute("tabindex", "-1");
    c.querySelectorAll("a, button, video").forEach(function (el) { el.setAttribute("tabindex", "-1"); });
    return c;
  });
  clones.forEach(function (c) { track.insertBefore(c, originals[0]); });

  // copied videos aren't known to main.js — play them while on screen
  var cloneVids = [].slice.call(track.querySelectorAll('.slide[aria-hidden="true"] video'));
  if ("IntersectionObserver" in window && cloneVids.length) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } });
    }, { threshold: 0.15 });
    cloneVids.forEach(function (v) { vo.observe(v); });
  }

  // 2. free gliding: no snapping, start with the real Cocoa Booster at the left edge
  track.style.scrollSnapType = "none";
  track.style.scrollBehavior = "auto";
  function setWidth() { return originals[0].offsetLeft - clones[0].offsetLeft; }
  var pos = setWidth();
  track.scrollLeft = pos;

  // 3. the glide itself
  var running = false, paused = false, raf = null, last = 0, delay = null, resumeHold = null;
  function frame(t) {
    if (!running) return;
    if (!last) last = t;
    var dt = Math.min(t - last, 64) / 1000; last = t;
    if (!paused && !document.hidden) {
      pos -= SPEED * dt;                       // content moves left → right
      var w = setWidth();
      if (pos <= 0) pos += w;                  // seamless wrap into the copy
      track.scrollLeft = pos;
    }
    raf = requestAnimationFrame(frame);
  }
  function run() { if (running) return; running = true; last = 0; pos = track.scrollLeft; raf = requestAnimationFrame(frame); }
  function halt() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
  function startAfterDelay() { clearTimeout(delay); delay = setTimeout(run, START_DELAY); }

  function pause() { paused = true; clearTimeout(resumeHold); }
  function resume(after) {
    clearTimeout(resumeHold);
    resumeHold = setTimeout(function () { pos = track.scrollLeft; last = 0; paused = false; }, after || 0);
  }
  carousel.addEventListener("mouseenter", pause);
  carousel.addEventListener("mouseleave", function () { resume(600); });
  carousel.addEventListener("focusin", pause);
  carousel.addEventListener("focusout", function () { resume(600); });
  track.addEventListener("touchstart", pause, { passive: true });
  track.addEventListener("touchend", function () { resume(3000); }, { passive: true });
  // after an arrow click, carry on from wherever the arrow scrolled to
  carousel.querySelectorAll(".arrow-btn").forEach(function (b) {
    b.addEventListener("click", function () { pause(); resume(1200); });
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) startAfterDelay(); else { clearTimeout(delay); halt(); } });
    }, { threshold: 0.3 }).observe(carousel);
  } else { startAfterDelay(); }
})();
