/* Planet A Foods — homepage portfolio carousel: slides one card every few seconds.
   Pauses on hover / focus / touch, while off-screen or in a background tab,
   and never runs with prefers-reduced-motion. The arrows keep working (handled in home.js). */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var carousel = document.querySelector(".portfolio .carousel");
  var track = carousel && carousel.querySelector(".track");
  if (reduce || !track) return;

  var INTERVAL = 3800, timer = null, hovering = false, visible = false, touchHold = null;

  function step() {
    var slide = track.querySelector(".slide");
    return slide ? slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 400;
  }
  function advance() {
    if (hovering || !visible || document.hidden) return;
    var max = track.scrollWidth - track.clientWidth - 2;
    if (track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: "smooth" });   // back to the start after the last card
    else track.scrollBy({ left: step(), behavior: "smooth" });
  }
  function start() { stop(); timer = setInterval(advance, INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  carousel.addEventListener("mouseenter", function () { hovering = true; });
  carousel.addEventListener("mouseleave", function () { hovering = false; start(); });
  carousel.addEventListener("focusin", function () { hovering = true; });
  carousel.addEventListener("focusout", function () { hovering = false; start(); });
  // touch: hold off while swiping, resume a little after
  track.addEventListener("touchstart", function () { hovering = true; clearTimeout(touchHold); }, { passive: true });
  track.addEventListener("touchend", function () { touchHold = setTimeout(function () { hovering = false; start(); }, 4000); }, { passive: true });
  // an arrow click restarts the countdown so the next auto-slide doesn't come straight after
  carousel.querySelectorAll(".arrow-btn").forEach(function (b) { b.addEventListener("click", start); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; if (visible) start(); else stop(); });
    }, { threshold: 0.3 }).observe(carousel);
  } else { visible = true; start(); }
})();
