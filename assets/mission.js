/* Mission page — milestones: year tabs, swipeable card row, filter by type. */
(function () {
  "use strict";
  var root = document.querySelector("[data-ms]");
  if (!root) return;
  document.documentElement.classList.add("ms-js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  var chips = [].slice.call(root.querySelectorAll(".ms-chip"));
  var prev = root.querySelector("[data-ms-prev]"), next = root.querySelector("[data-ms-next]");
  var bar = root.querySelector(".ms-progress span");
  var filter = "all", current = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });

  function track() { return panels[current].querySelector(".ms-track"); }
  function visibleCards(p) { return [].filter.call(p.querySelectorAll(".ms-card"), function (c) { return filter === "all" || c.dataset.cat === filter; }); }

  function applyFilter() {
    panels.forEach(function (p, i) {
      var shown = 0;
      [].forEach.call(p.querySelectorAll(".ms-card"), function (c) { var on = filter === "all" || c.dataset.cat === filter; c.hidden = !on; if (on) shown++; });
      p.querySelector(".ms-empty").hidden = shown > 0;
      tabs[i].classList.toggle("is-empty", shown === 0);
      tabs[i].querySelector(".ms-tab-n").textContent = shown;
    });
    state();
  }

  function select(i, focus) {
    current = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    track().scrollLeft = 0;
    if (focus) tabs[i].focus();
    state();
  }

  function state() {
    var t = track(), max = t.scrollWidth - t.clientWidth;
    var has = visibleCards(panels[current]).length > 0;
    prev.disabled = t.scrollLeft <= 2 && current === 0;
    next.disabled = (t.scrollLeft >= max - 2 || !has) && current === tabs.length - 1;
    var w = t.scrollWidth ? Math.min(1, t.clientWidth / t.scrollWidth) : 1;
    bar.style.width = (w * 100) + "%";
    bar.style.marginLeft = (max > 0 ? (t.scrollLeft / t.scrollWidth) * 100 : 0) + "%";
  }

  /* arrows scroll the cards; at either end they move on to the neighbouring year */
  function step(dir) {
    var t = track(), card = t.querySelector(".ms-card:not([hidden])");
    var w = card ? card.getBoundingClientRect().width + 20 : 300, max = t.scrollWidth - t.clientWidth;
    if (dir > 0 && t.scrollLeft >= max - 2) { if (current < tabs.length - 1) select(current + 1); return; }
    if (dir < 0 && t.scrollLeft <= 2) { if (current > 0) { select(current - 1); var n = track(); n.scrollLeft = n.scrollWidth; state(); } return; }
    t.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
  }
  prev.addEventListener("click", function () { step(-1); });
  next.addEventListener("click", function () { step(1); });
  panels.forEach(function (p) { p.querySelector(".ms-track").addEventListener("scroll", state, { passive: true }); });
  window.addEventListener("resize", state);

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(i); });
    t.addEventListener("keydown", function (e) {
      var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); select((j + tabs.length) % tabs.length, true);
    });
  });
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      filter = c.dataset.filter;
      chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      applyFilter();
      /* if the open year has nothing of this type, jump to the latest year that does */
      if (!visibleCards(panels[current]).length) {
        for (var k = panels.length - 1; k >= 0; k--) { if (visibleCards(panels[k]).length) { select(k); break; } }
      }
      track().scrollLeft = 0; state();
    });
  });

  applyFilter();
  select(current < 0 ? tabs.length - 1 : current);
})();
