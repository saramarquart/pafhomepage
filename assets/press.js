/* Press room + press release pages: year filter, "show all", endless logo strip,
   reading progress and "copy link". Lives in its own file so the CSP can forbid inline scripts. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- press room: filter releases by year, first 6 shown under "All" ---- */
  var grid = document.querySelector("[data-pr-grid]");
  if (grid) {
    var cards = [].slice.call(grid.querySelectorAll(".pr-card"));
    var chips = [].slice.call(document.querySelectorAll(".pr-chip"));
    var more = document.querySelector(".pr-show-more");
    var LIMIT = 6, expanded = false, current = "all";

    function apply(animate) {
      var shown = 0;
      cards.forEach(function (c) {
        var match = current === "all" || c.getAttribute("data-pr-year") === current;
        var visible = match && (current !== "all" || expanded || shown < LIMIT);
        if (match) shown++;
        if (visible && c.hidden) {
          c.hidden = false;
          c.classList.add("in");
          if (animate && !reduce) {
            c.classList.add("pr-fade");
            requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove("pr-fade"); }); });
          }
        } else if (!visible) {
          c.hidden = true;
        }
      });
      if (more) more.hidden = !(current === "all" && !expanded && shown > LIMIT);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        current = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        apply(true);
      });
    });
    if (more) more.addEventListener("click", function () { expanded = true; apply(true); });
    apply(false);
  }

  /* ---- as seen on: duplicate the logo row so the strip loops without a gap ---- */
  var row = document.querySelector(".pr-logos");
  if (row && !reduce) {
    var copy = row.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    [].forEach.call(copy.querySelectorAll("img"), function (img) { img.alt = ""; });
    row.parentNode.appendChild(copy);
  }

  /* ---- press release: reading progress along the top edge ---- */
  var bar = document.querySelector(".pr-progress span"), article = document.querySelector(".pr-article");
  if (bar && article) {
    var ticking = false;
    function progress() {
      var r = article.getBoundingClientRect(), total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, { passive: true });
    window.addEventListener("resize", progress);
    progress();
  }

  /* ---- press release: copy the page link ---- */
  [].forEach.call(document.querySelectorAll("[data-copy-link]"), function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-copy-link"), label = btn.textContent;
      function done() {
        btn.textContent = "Link copied";
        btn.classList.add("is-done");
        setTimeout(function () { btn.textContent = label; btn.classList.remove("is-done"); }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
      else window.prompt("Copy this link:", url);
    });
  });
})();
