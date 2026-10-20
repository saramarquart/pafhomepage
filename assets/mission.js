/* Mission page — "Our story": each year's milestones are hidden behind a reveal button. */
(function () {
  "use strict";
  var buttons = [].slice.call(document.querySelectorAll(".ms-reveal"));
  if (!buttons.length) return;
  document.documentElement.classList.add("ms-js");
  buttons.forEach(function (b) {
    var ch = b.closest(".ms-ch"), label = b.querySelector(".ms-reveal-label");
    var year = ch.getAttribute("data-ch");
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      ch.classList.toggle("is-open", open);
      label.textContent = open ? "Hide " + year : "See what happened in " + year;
    });
  });
})();

/* Hero video: plays (muted, looping) once the page has loaded; with reduced motion it stays on its still frame.
   Pauses while off screen to save battery. */
(function () {
  "use strict";
  var v = document.querySelector("[data-hero-video]");
  if (!v) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if (document.readyState === "complete") play(); else window.addEventListener("load", play);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) play(); else v.pause(); }).observe(v);
  }
})();
