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

/* Our story: reveal each year card as it scrolls into view (styles in mission.css). */
(function () {
  "use strict";
  var cards = [].slice.call(document.querySelectorAll(".ms-ch"));
  if (!cards.length) return;
  document.documentElement.classList.add("ms-js");
  function show(card) {
    card.classList.add("is-in");
    setTimeout(function () { card.classList.add("is-done"); }, 1400);
  }
  if (!("IntersectionObserver" in window)) { cards.forEach(show); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  cards.forEach(function (card) { io.observe(card); });
  // opening a year via a link (#ms-2023) or from the keyboard shows it at once
  document.addEventListener("focusin", function (e) { var ch = e.target.closest && e.target.closest(".ms-ch"); if (ch) show(ch); });
})();
