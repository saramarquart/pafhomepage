/* Planet A Foods — homepage interactions (index.html only).
   Ingredient reel, smart nav, Why-now drivers, portfolio carousel.
   No dependencies; respects prefers-reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function play(v) { if (!v) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  /* ---- Hero: ingredient reel (cocoa booster → coffee → nuts → chocolate → speciality fats) ---- */
  var reels = [].slice.call(document.querySelectorAll(".hero .reel"));
  var marks = [].slice.call(document.querySelectorAll(".reel-index li"));
  var current = 0, timer = null, HOLD = 5200;
  var FX = ["wipe", "dissolve", "rise", "zoom"], cut = 0;   // reveal styles, rotated cut by cut
  function show(i) {
    if (i === current) return;
    var prev = current;
    reels.forEach(function (r, k) {
      var on = k === i, was = k === prev, v = r.querySelector("video");
      if (on) r.setAttribute("data-fx", r.getAttribute("data-in") || FX[cut++ % FX.length]);   // a shot can pin its own reveal (data-in)
      r.classList.toggle("on", on);
      r.classList.toggle("was", was);   // outgoing shot stays visible underneath while the next one fades in
      if (v) { if (on) { try { v.currentTime = 0; } catch (e) {} play(v); } else if (!was) { v.pause(); } }
    });
    marks.forEach(function (m, k) { m.classList.toggle("on", k === i); });
    current = i;
  }
  function next() { show((current + 1) % reels.length); }
  // the name links to its page; the stripe next to it shows that shot and restarts the timer
  marks.forEach(function (m, k) {
    var go = m.querySelector(".reel-go");
    if (!go) return;
    go.addEventListener("click", function () {
      show(k);
      if (timer) { clearInterval(timer); timer = setInterval(next, HOLD); }
    });
  });
  if (reels.length) {
    show(0);
    if (!reduce) {
      timer = setInterval(next, HOLD);
      // pause the reel when the hero is off-screen
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            var v = reels[current].querySelector("video");
            if (e.isIntersecting) { if (!timer) timer = setInterval(next, HOLD); play(v); }
            else { clearInterval(timer); timer = null; if (v) v.pause(); }
          });
        }, { threshold: 0.05 }).observe(document.querySelector(".hero"));
      }
    }
  }

  /* ---- Nav: transparent at the top; slim white bar once scrolled.
     Hides while reading downwards, returns on any upward scroll. ---- */
  var nav = document.querySelector(".nav");
  var lastY = window.pageYOffset || 0;
  function onNav() {
    var y = window.pageYOffset || 0;
    nav.classList.toggle("scrolled", y > 40);
    var down = y > lastY + 4, up = y < lastY - 4;
    if (nav.classList.contains("open")) { nav.classList.remove("away"); }
    else if (down && y > 320) { nav.classList.add("away"); }
    else if (up || y <= 320) { nav.classList.remove("away"); }
    if (down || up) lastY = y;
  }
  if (nav) {
    onNav();
    window.addEventListener("scroll", onNav, { passive: true });
    nav.addEventListener("focusin", function () { nav.classList.remove("away"); });
  }

  /* ---- Why now: hover / focus / click a driver to open it and swap the image ---- */
  var drivers = [].slice.call(document.querySelectorAll(".driver"));
  var whyImgs = [].slice.call(document.querySelectorAll(".why-media img"));
  function activate(btn) {
    var key = btn.getAttribute("data-key");
    drivers.forEach(function (d) { var on = d === btn; d.classList.toggle("on", on); d.setAttribute("aria-selected", on); });
    whyImgs.forEach(function (im) { im.classList.toggle("on", im.getAttribute("data-for") === key); });
  }
  drivers.forEach(function (d) {
    d.addEventListener("mouseenter", function () { activate(d); });
    d.addEventListener("focus", function () { activate(d); });
    d.addEventListener("click", function () { activate(d); });
  });

  /* ---- Sustainability: count the CO₂ figure up once (one decimal) ---- */
  document.querySelectorAll("[data-tick]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-tick"));
    function set(v) { el.textContent = "\u2212" + v.toFixed(1); }
    if (reduce || !("IntersectionObserver" in window)) { set(target); return; }
    set(0);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1800, 1);
        set(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ---- Portfolio groups: climate-threatened vs highly regulated ---- */
  var groups = [].slice.call(document.querySelectorAll(".group"));
  function pickGroup(btn) {
    var g = btn.getAttribute("data-group");
    groups.forEach(function (b) { var on = b === btn; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    document.querySelectorAll(".carousel .slide").forEach(function (s) { s.hidden = s.getAttribute("data-group") !== g; });
    document.querySelectorAll(".group-note").forEach(function (n) { n.hidden = n.getAttribute("data-note") !== g; });
    var t = document.querySelector(".carousel .track");
    if (t) { t.scrollLeft = 0; t.dispatchEvent(new Event("scroll")); }
  }
  groups.forEach(function (b) { b.addEventListener("click", function () { pickGroup(b); }); });

  /* ---- Portfolio: endless slow roll, left to right, that you can still scroll yourself ----
     A second copy of the cards follows the first; the track scrolls on its own and jumps back by exactly one set
     at the edge, so it never ends. Swiping, dragging, the arrows or hovering take over; the roll resumes after a pause. */
  var roll = document.querySelector(".carousel");
  var rollTrack = roll && roll.querySelector(".track");
  if (rollTrack && !reduce && "IntersectionObserver" in window) {
    var cards = [].slice.call(rollTrack.querySelectorAll(".slide"));
    cards.forEach(function (s) {
      var copy = s.cloneNode(true);
      copy.setAttribute("aria-hidden", "true"); copy.setAttribute("tabindex", "-1");   // clickable, but skipped by screen readers and Tab
      rollTrack.appendChild(copy);
    });
    roll.classList.add("is-roll");
    var SECS_PER_SET = cards.length * 6.5;   // ~6.5 s per card
    var period = 0, pos = 0, last = 0, visible = false, hover = false, busyUntil = 0, held = false;
    function measure() { period = rollTrack.children[cards.length].offsetLeft - rollTrack.children[0].offsetLeft; }
    function wrap(x) { return x <= 0 ? x + period : x > period ? x - period : x; }
    // start with the Cocoa booster (the wider lead card, second copy) in the middle of the screen
    measure();
    var lead = rollTrack.children[cards.length + cards.indexOf(rollTrack.querySelector(".is-lead"))];
    pos = wrap(lead.offsetLeft - rollTrack.children[0].offsetLeft - (rollTrack.clientWidth - lead.offsetWidth) / 2);
    rollTrack.scrollLeft = pos;
    function takeOver(ms) { busyUntil = performance.now() + (ms || 2500); }
    function tick(now) {
      var dt = Math.min(64, now - (last || now)); last = now;
      if (visible && !hover && now > busyUntil && period) {
        if (Math.abs(rollTrack.scrollLeft - pos) > 2) pos = rollTrack.scrollLeft;   // pick up where the visitor left it
        pos = wrap(pos - period / SECS_PER_SET * dt / 1000);                        // content drifts left to right
        rollTrack.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    // the visitor scrolls: keep it endless at the edges once they let go
    rollTrack.addEventListener("scroll", function () {
      if (performance.now() > busyUntil) return;
      var x = rollTrack.scrollLeft, max = rollTrack.scrollWidth - rollTrack.clientWidth;
      if (x < 2 || x > max - 2) { rollTrack.scrollLeft = wrap(x); pos = rollTrack.scrollLeft; }
    }, { passive: true });
    ["wheel", "touchstart", "touchmove"].forEach(function (t) { rollTrack.addEventListener(t, function () { takeOver(); }, { passive: true }); });
    roll.addEventListener("mouseenter", function () { hover = true; });
    roll.addEventListener("mouseleave", function () { hover = false; });
    roll.addEventListener("focusin", function () { takeOver(6000); });
    // drag with the mouse; a drag doesn't count as a click on the card
    var drag = null, dragged = false;
    rollTrack.addEventListener("dragstart", function (e) { e.preventDefault(); });
    rollTrack.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: rollTrack.scrollLeft }; dragged = false;
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5) { dragged = true; roll.classList.add("is-dragging"); }
      if (dragged) { takeOver(); rollTrack.scrollLeft = drag.left - dx; }
    });
    window.addEventListener("pointerup", function () { drag = null; roll.classList.remove("is-dragging"); });
    rollTrack.addEventListener("click", function (e) { if (dragged) { e.preventDefault(); dragged = false; } }, true);
    window.addEventListener("resize", function () { measure(); pos = wrap(rollTrack.scrollLeft); });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && !held) { held = true; takeOver(3500); }   // hold the booster in the centre for a moment first
        [].forEach.call(rollTrack.querySelectorAll("[aria-hidden] .media-vid"), function (v) {   // the copies' videos (main.js handles the originals)
          if (visible) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
        });
      });
    }, { threshold: 0.35 }).observe(roll);
  }

  /* ---- Portfolio carousel arrows ---- */
  var track = document.querySelector(".carousel .track");
  document.querySelectorAll(".arrow-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!track) return;
      var slide = track.querySelector(".slide:not(.is-lead)");
      if (roll && roll.classList.contains("is-roll")) { busyUntil = performance.now() + 2500; }
      var step = slide ? slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 400;
      track.scrollBy({ left: step * parseInt(b.getAttribute("data-dir"), 10), behavior: reduce ? "auto" : "smooth" });
    });
  });
  // show there is more: "1–3 of 5" counter, item count per group, fade on the side with more cards
  var carousel = document.querySelector(".carousel");
  var counter = document.querySelector(".carousel-count");
  document.querySelectorAll("[data-count-for]").forEach(function (c) {
    c.textContent = document.querySelectorAll('.carousel .slide[data-group="' + c.getAttribute("data-count-for") + '"]:not([aria-hidden])').length;
  });
  function arrowState() {
    if (!track || carousel.classList.contains("is-roll")) return;   // endless: the arrows never run out
    var max = track.scrollWidth - track.clientWidth - 2;
    document.querySelectorAll(".arrow-btn").forEach(function (b) {
      var d = parseInt(b.getAttribute("data-dir"), 10);
      b.disabled = d < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
    var slides = [].filter.call(track.querySelectorAll(".slide"), function (s) { return !s.hidden; });
    if (!slides.length) return;
    var gap = parseFloat(getComputedStyle(track).columnGap || 0);
    var step = slides[0].getBoundingClientRect().width + gap;
    var first = Math.round(track.scrollLeft / step);
    var fit = Math.max(1, Math.floor((track.clientWidth + gap + 4) / step));
    var last = Math.min(slides.length, first + fit);
    if (counter) counter.textContent = slides.length <= fit ? "" : (fit === 1 ? (first + 1) : (first + 1) + "–" + last) + " of " + slides.length;
    if (carousel) {
      carousel.classList.toggle("more-right", track.scrollLeft < max);
      carousel.classList.toggle("more-left", track.scrollLeft > 2);
    }
  }
  if (track) { track.addEventListener("scroll", arrowState, { passive: true }); window.addEventListener("resize", arrowState); arrowState(); }
})();
