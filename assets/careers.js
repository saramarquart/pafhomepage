/* Careers page — key facts, photo carousel, location tabs, application stepper.
   Loaded before main.js so the rendered key-fact cards pick up main.js's
   reveal + count-up. No dependencies; respects prefers-reduced-motion. */

// Job board (Personio) — every "View our open positions" button links here.
var OPEN_POSITIONS_URL = "https://planetafoods.jobs.personio.de/?language=en";

/* Key facts — edit the figures here (plain strings; a leading number counts up). */
var KEY_FACTS = [
  { icon: "map-pin", number: "2",   label: "Locations",     text: "Our headquarters in Munich & own production in Pilsen." },
  { icon: "users",   number: "~60", label: "Team members",  text: "Around 60 people building the future of food together." },
  { icon: "scale",   number: "44%", label: "Women",         text: "We're proud of the balance we've built: in our leadership team, 60% are women." },
  { icon: "globe",   number: "16",  label: "Nationalities", text: "Different backgrounds and perspectives, on one shared mission. Our company language is English." }
];

(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* "View our open positions" buttons */
  $$("[data-open-positions]").forEach(function (a) {
    a.setAttribute("href", OPEN_POSITIONS_URL);
    if (/^https?:/.test(OPEN_POSITIONS_URL)) { a.target = "_blank"; a.rel = "noopener"; }
  });

  /* Key facts */
  var factsEl = document.querySelector("[data-key-facts]");
  if (factsEl) {
    factsEl.innerHTML = KEY_FACTS.map(function (f) {
      var m = /^(\d+)(\D*)$/.exec(f.number);
      var count = m ? ' data-count="' + m[1] + '"' + (m[2] ? ' data-suffix="' + esc(m[2]) + '"' : "") : "";
      return '<div class="cr-card cr-fact reveal">' +
        '<span class="cr-icon"><svg class="cr-ico" aria-hidden="true"><use href="#i-' + esc(f.icon) + '"/></svg></span>' +
        '<div class="fact"><b' + count + ">" + esc(f.number) + "</b><span>" + esc(f.label) + "</span></div>" +
        "<p>" + esc(f.text) + "</p></div>";
    }).join("");
  }

  /* Photo carousel — continuous marquee over a duplicated track. Pauses on
     hover, keyboard focus and drag; arrows step one image; swipe on touch. */
  $$("[data-carousel]").forEach(function (root) {
    var viewport = root.querySelector("[data-carousel-viewport]");
    var track = root.querySelector("[data-carousel-track]");
    var n = track.children.length;
    if (!n) return;
    $$(".cr-slide", track).forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      $$("img", c).forEach(function (img) { img.alt = ""; });
      track.appendChild(c);
    });

    var SPEED = 28;                         // px per second
    var offset = 0, last = 0, tween = null, drag = null;
    var hover = false, focused = false, visible = true, resumeAt = 0;
    var loopW = 0, stepW = 0;
    function measure() {
      loopW = track.children[n].offsetLeft - track.children[0].offsetLeft;
      stepW = track.children[1].offsetLeft - track.children[0].offsetLeft;
    }
    function render() {
      if (!loopW) return;
      var x = ((offset % loopW) + loopW) % loopW;
      track.style.transform = "translate3d(" + (-x).toFixed(2) + "px,0,0)";
    }
    function frame(ts) {
      var dt = last ? Math.min((ts - last) / 1000, 0.1) : 0;
      last = ts;
      if (tween) {
        var p = Math.min((ts - tween.t0) / tween.dur, 1);
        offset = tween.from + (tween.to - tween.from) * (1 - Math.pow(1 - p, 3));
        if (p >= 1) tween = null;
        render();
      } else if (!reduce && !hover && !focused && !drag && visible && ts >= resumeAt) {
        offset += (SPEED + (window.crBoost || 0)) * dt;   // crBoost: optional scroll-linked speed-up
        render();
      }
      requestAnimationFrame(frame);
    }
    function go(dir) {
      var base = tween ? tween.to : offset;
      var target = dir > 0 ? (Math.floor(base / stepW + 0.01) + 1) * stepW
                           : (Math.ceil(base / stepW - 0.01) - 1) * stepW;
      var now = performance.now();
      if (reduce) { tween = null; offset = target; render(); }
      else tween = { from: offset, to: target, t0: now, dur: 560 };
      resumeAt = now + 1600;
    }
    root.querySelector("[data-carousel-prev]").addEventListener("click", function () { go(-1); });
    root.querySelector("[data-carousel-next]").addEventListener("click", function () { go(1); });

    viewport.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
    viewport.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hover = false; });
    root.addEventListener("focusin", function (e) {
      try { focused = e.target.matches(":focus-visible"); } catch (x) { focused = true; }
    });
    root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) focused = false; });

    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = { x: e.clientX, start: offset, id: e.pointerId, moved: false };
      tween = null;
    });
    viewport.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        viewport.classList.add("is-dragging");
        try { viewport.setPointerCapture(e.pointerId); } catch (x) {}
      }
      if (drag.moved) { offset = drag.start - dx; render(); }
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      viewport.classList.remove("is-dragging");
      resumeAt = performance.now() + 1600;
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
    }
    document.addEventListener("visibilitychange", function () { last = 0; });
    window.addEventListener("resize", function () { measure(); render(); }, { passive: true });
    measure(); render();
    requestAnimationFrame(frame);
  });

  /* Location tabs (WAI-ARIA tabs, automatic activation) */
  $$("[data-tabs]").forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault();
        select(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
  });

  /* Application stepper — one step active on desktop; accordion on mobile
     (one open at a time, the open one can be collapsed). */
  $$("[data-stepper]").forEach(function (root) {
    var items = $$(".cr-step", root);
    var btns = items.map(function (it) { return it.querySelector(".cr-step-btn"); });
    var panels = items.map(function (it) { return it.querySelector(".cr-step-panel"); });
    var mq = window.matchMedia("(max-width: 640px)");
    var active = 0, open = true;

    function render() {
      var show = open || !mq.matches;
      root.style.setProperty("--active", active);   // drives the progress line
      root.setAttribute("data-step", active);       // drives the per-step colour tint
      btns.forEach(function (b, i) { b.classList.toggle("is-done", i < active); });
      btns.forEach(function (b, i) {
        var on = i === active;
        if (on) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
        b.setAttribute("aria-expanded", on && show ? "true" : "false");
        panels[i].hidden = !(on && show);
      });
    }
    function set(i) { active = Math.max(0, Math.min(btns.length - 1, i)); open = true; render(); }

    btns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        if (mq.matches && i === active && open) { open = false; render(); return; }
        set(i);
      });
      b.addEventListener("keydown", function (e) {
        var j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: btns.length - 1 }[e.key];
        if (j === undefined || j < 0 || j >= btns.length) return;
        e.preventDefault();
        set(j);
        btns[j].focus();
      });
    });

    root.addEventListener("click", function (e) {
      var prev = e.target.closest("[data-step-prev]");
      var next = e.target.closest("button[data-step-next]");
      if (!prev && !next) return;
      set(active + (next ? 1 : -1));
      // keep keyboard focus on the matching control in the newly shown panel
      var p = panels[active];
      var target = p.querySelector(next ? "[data-step-next]" : "[data-step-prev]:not([disabled])") || p.querySelector("[data-step-next]");
      if (target) target.focus({ preventScroll: !mq.matches });
    });

    if (mq.addEventListener) mq.addEventListener("change", render); else if (mq.addListener) mq.addListener(render);
    render();
  });

  /* Story motion (see careers.css): wrap words for the headline / reading reveals, stagger cards,
     and let the photo strip speed up with the scroll. Skipped with reduced motion. */
  if (!reduce && window.CSS && CSS.supports("animation-timeline: view()")) {
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

    var lastY = window.scrollY, lastT = performance.now();
    window.crBoost = 0;
    window.addEventListener("scroll", function () {
      var now = performance.now(), v = Math.abs(window.scrollY - lastY) / Math.max(16, now - lastT) * 1000;
      window.crBoost = Math.min(900, Math.max(window.crBoost, v * 0.6));
      lastY = window.scrollY; lastT = now;
    }, { passive: true });
    (function decay() { window.crBoost *= 0.92; if (window.crBoost < 1) window.crBoost = 0; requestAnimationFrame(decay); })();
  }
})();
