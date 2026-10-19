/* Site navigation for the subpages (see site-nav.css). main.js already opens/closes
   the drawer (.open) and sets .scrolled; this adds the homepage behaviour on top:
   the bar slides away while reading down and returns on scroll up, the current
   section is highlighted, and the drawer closes after a link is tapped. */
(function () {
  "use strict";
  var nav = document.querySelector("header.site-nav");
  if (!nav) return;

  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var section = /^(solution|product|portfolio)/.test(page) ? "solutions.html"
    : /^(mission|journey|people|partners|company-|sustainability)/.test(page) ? "mission.html"
    : /^press/.test(page) ? "press.html" : page;
  var top = nav.querySelector('.nav-pill > a[href="' + section + '"], .nav-pill > .nav-item > a[href="' + section + '"]');
  if (top) top.setAttribute("aria-current", "page");

  var lastY = window.pageYOffset || 0;
  function onScroll() {
    var y = window.pageYOffset || 0;
    nav.classList.toggle("scrolled", y > 40);
    var down = y > lastY + 4, up = y < lastY - 4;
    if (nav.classList.contains("open")) nav.classList.remove("away");
    else if (down && y > 320) nav.classList.add("away");
    else if (up || y <= 320) nav.classList.remove("away");
    if (down || up) lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  [].forEach.call(nav.querySelectorAll(".nav-pill a"), function (a) {
    a.addEventListener("click", function () { nav.classList.remove("open"); });
  });
})();
