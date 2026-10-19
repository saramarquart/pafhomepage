/* Mission page — "Our story": the chapter bar highlights the year you are reading. */
(function () {
  "use strict";
  var rail = document.querySelector(".ms-rail");
  if (!rail) return;
  var links = [].slice.call(rail.querySelectorAll("a[data-ch]"));
  var fill = rail.querySelector(".ms-rail-fill");
  var chapters = links.map(function (a) { return document.getElementById("ms-" + a.dataset.ch); });
  var current = -1, ticking = false;

  function update() {
    ticking = false;
    var line = window.innerHeight * 0.4, cur = 0;
    chapters.forEach(function (c, i) { if (c && c.getBoundingClientRect().top < line) cur = i; });
    if (cur === current) return;
    current = cur;
    links.forEach(function (a, i) {
      a.classList.toggle("is-on", i === cur);
      if (i === cur) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
    });
    var a = links[cur];
    fill.style.width = a.offsetWidth + "px";
    fill.style.transform = "translateX(" + a.offsetLeft + "px)";
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", function () { current = -1; update(); });
  update();
})();
