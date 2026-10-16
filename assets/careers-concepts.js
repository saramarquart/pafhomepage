/* Careers — concept helpers (temporary, see careers-concepts.css). */
(function () {
  "use strict";
  var root = document.documentElement;
  var current = (root.className.match(/concept-(\w+)/) || [])[1] || "a";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* switcher: reload with ?concept=… so every scroll timeline starts clean */
  var sw = document.createElement("nav");
  sw.className = "cc-switch"; sw.setAttribute("aria-label", "Design concept");
  sw.innerHTML = "<span>Concept</span>" + [["a", "A · Cinematic"], ["b", "B · Unfold"], ["c", "C · Flow"], ["off", "Off"]].map(function (c) {
    return '<a href="?concept=' + c[0] + '"' + (c[0] === current ? ' aria-current="true"' : "") + ">" + c[1] + "</a>";
  }).join("");
  document.body.appendChild(sw);

  /* B: split "We set a new standard." into words that fill in one by one */
  if (current === "b") {
    var hl = document.querySelector("#cr-vision-title .cr-hl");
    if (hl) {
      var words = hl.textContent.trim().split(/\s+/);
      hl.innerHTML = words.map(function (w) { return '<span class="cb-word">' + w + "</span>"; }).join(" ");
      [].forEach.call(hl.querySelectorAll(".cb-word"), function (s, i) {
        var a = 10 + i * 6;
        s.style.animationRange = "cover " + a + "% cover " + (a + 8) + "%";
      });
    }
    /* carousel speeds up with your scroll, then eases back */
    if (!reduce) {
      var lastY = window.scrollY, lastT = performance.now();
      window.crBoost = 0;
      window.addEventListener("scroll", function () {
        var now = performance.now(), dy = Math.abs(window.scrollY - lastY), dt = Math.max(16, now - lastT);
        window.crBoost = Math.min(900, Math.max(window.crBoost, dy / dt * 1000 * 0.6));
        lastY = window.scrollY; lastT = now;
      }, { passive: true });
      (function decay() { window.crBoost *= 0.92; if (window.crBoost < 1) window.crBoost = 0; requestAnimationFrame(decay); })();
    }
  }

  /* C: one travelling "A" mark behind the page */
  if (current === "c") {
    var a = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    a.setAttribute("class", "deco-a cc-a"); a.setAttribute("aria-hidden", "true");
    a.innerHTML = '<use href="#paf-a"/>';
    document.body.insertBefore(a, document.body.firstChild);
  }
})();
