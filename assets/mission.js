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
