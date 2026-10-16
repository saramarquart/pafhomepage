/* Careers — concept helpers (temporary, see careers-concepts.css). */
(function () {
  "use strict";
  var root = document.documentElement;
  var current = (root.className.match(/concept-(\w+)/) || [])[1] || "d";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* switcher: reload with ?concept=… so every scroll timeline starts clean */
  var sw = document.createElement("nav");
  sw.className = "cc-switch"; sw.setAttribute("aria-label", "Design concept");
  sw.innerHTML = "<span>Concept</span>" + [["d", "D · Story"], ["e", "E · Drift"], ["off", "Off"]].map(function (c) {
    return '<a href="?concept=' + c[0] + '"' + (c[0] === current ? ' aria-current="true"' : "") + ">" + c[1] + "</a>";
  }).join("");
  document.body.appendChild(sw);
  if (current === "off" || reduce) return;

  /* wrap every word of an element in <span class="sw"><i>word</i></span>, keeping inner markup (br, spans) */
  function splitWords(el) {
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement("span"), i = document.createElement("i");
            s.className = "sw"; i.textContent = p; s.appendChild(i); frag.appendChild(s); words.push(i);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") { walk(n); }
      });
    })(el);
    words.forEach(function (w, k) { w.style.setProperty("--i", k); });
    return words;
  }

  /* stagger index for cards inside each grid / step list */
  [".cr-grid-4", ".cr-grid-2", ".cr-steps"].forEach(function (sel) {
    [].forEach.call(document.querySelectorAll(sel), function (g) {
      [].forEach.call(g.querySelectorAll(".cr-value, .cr-fact, .cr-perk, .cr-step-btn"), function (c, k) { c.style.setProperty("--n", k); });
    });
  });
  /* key-fact cards are rendered by careers.js before this runs, so they are included above */

  if (current === "d") {
    var h1 = document.querySelector(".cr-hero h1"); if (h1) splitWords(h1);
    [].forEach.call(document.querySelectorAll(".cr-sec h2"), splitWords);
    /* vision paragraph + closing line read themselves, spread over the scroll */
    var ink = [];
    [".cr-vision .lead", ".cr-vision .cr-strong"].forEach(function (sel) {
      var el = document.querySelector(sel); if (el) ink = ink.concat(splitWords(el));
    });
    ink.forEach(function (w, k) {
      var a = 14 + (k / ink.length) * 34;
      w.style.animationRange = "cover " + a.toFixed(1) + "% cover " + (a + 5).toFixed(1) + "%";
    });
  }

  /* photo strip: speeds up with scroll (both concepts) and leans into the scroll direction (E) */
  var lastY = window.scrollY, lastT = performance.now(), vp = document.querySelector(".cr-viewport");
  window.crBoost = 0;
  window.addEventListener("scroll", function () {
    var now = performance.now(), dy = window.scrollY - lastY, dt = Math.max(16, now - lastT);
    var v = dy / dt * 1000;   // px per second, signed
    window.crBoost = Math.min(900, Math.max(window.crBoost, Math.abs(v) * 0.6));
    if (current === "e" && vp) vp.style.setProperty("--lean", Math.max(-6, Math.min(6, -v / 250)).toFixed(2));
    lastY = window.scrollY; lastT = now;
  }, { passive: true });
  (function decay() {
    window.crBoost *= 0.92; if (window.crBoost < 1) window.crBoost = 0;
    if (vp && current === "e") { var l = parseFloat(vp.style.getPropertyValue("--lean")) || 0; vp.style.setProperty("--lean", (Math.abs(l) < .05 ? 0 : l * .9).toFixed(2)); }
    requestAnimationFrame(decay);
  })();
})();
