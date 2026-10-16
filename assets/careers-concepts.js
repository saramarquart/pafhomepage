/* Careers — concept helpers (temporary, see careers-concepts.css). */
(function () {
  "use strict";
  var root = document.documentElement;
  var current = (root.className.match(/concept-(\w+)/) || [])[1] || "1";
  var IMG = "assets/img/careers/";
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* switcher */
  var sw = el("nav", "cc-switch");
  sw.setAttribute("aria-label", "Design concept");
  sw.innerHTML = "<span>Concept</span>" + [["1", "1 · Clarity"], ["2", "2 · Gallery"], ["3", "3 · Split (radical)"], ["off", "Current"]].map(function (c) {
    return '<a href="?concept=' + c[0] + '"' + (c[0] === current ? ' aria-current="true"' : "") + ">" + c[1] + "</a>";
  }).join("");
  document.body.appendChild(sw);

  var join = $(".cr-join"); if (join && !join.id) join.id = "how-to-join";

  /* ---------------- 1 · CLARITY ---------------- */
  if (current === "1") {
    var h1 = $(".cr-hero h1");
    if (h1 && window.KEY_FACTS) {
      var f = window.KEY_FACTS, ul = el("ul", "cc-herofacts");
      ul.innerHTML = [f[1].number + " people", "Munich & Pilsen", f[3].number + " nationalities", "English-speaking team"]
        .map(function (t) { return "<li>" + t + "</li>"; }).join("");
      var box = el("div", "cc-herohead");          // keep headline + facts together on the left
      h1.parentNode.insertBefore(box, h1); box.appendChild(h1); box.appendChild(ul);
    }
    var acts = $(".cr-hero .hero-actions");
    if (acts) {
      var a = el("a", "btn-text cc-hire", 'How we hire <span aria-hidden="true">↓</span>');
      a.href = "#how-to-join"; acts.insertBefore(a, acts.firstChild);
    }
    /* Munich + Pilsen side by side on wide screens: show both panels, drop the tabs */
    var mq = window.matchMedia("(min-width: 1100px)");
    var panels = ["cr-panel-munich", "cr-panel-pilsen"].map(function (id) { return document.getElementById(id); });
    function wide() {
      root.classList.toggle("cc-wide", mq.matches);
      if (mq.matches) panels.forEach(function (p) { if (p) { p.hidden = false; p.removeAttribute("role"); } });
      else { panels.forEach(function (p) { if (p) p.setAttribute("role", "tabpanel"); });
             var sel = $('#cr-tab-pilsen[aria-selected="true"]'); if (panels[0]) panels[0].hidden = !!sel; if (panels[1]) panels[1].hidden = !sel; }
    }
    if (mq.addEventListener) mq.addEventListener("change", wide); wide();
  }

  /* ---------------- 2 · GALLERY ---------------- */
  if (current === "2") {
    /* captions on the photo strip, from the alt text */
    $$(".cr-slide").forEach(function (s) {
      var img = $("img", s); if (img && img.alt) s.appendChild(el("span", "cc-cap", img.alt));
    });
    /* faces beside the vision */
    var vis = $(".cr-vision");
    if (vis) {
      [["cc-face cc-face-l", "careers-carousel-06-ski-trip"], ["cc-face cc-face-r", "careers-carousel-03-chef"]].forEach(function (f) {
        var fig = el("figure", f[0], '<img src="' + IMG + f[1] + '-sm.jpg" alt="" loading="lazy">');
        fig.setAttribute("aria-hidden", "true"); vis.appendChild(fig);
      });
    }
    /* values as photo tiles */
    ["careers-carousel-05-lab", "careers-carousel-02-trade-fair", "careers-carousel-04-tasting-pilsen", "careers-carousel-08-grand-opening-pilsen"]
      .forEach(function (src, k) {
        var card = $$(".cr-value")[k]; if (!card) return;
        var img = el("img", "cc-bg"); img.src = IMG + src + "-sm.jpg"; img.alt = ""; img.loading = "lazy";
        card.insertBefore(img, card.firstChild);
      });
  }

  /* ---------------- 3 · SPLIT (radical) ---------------- */
  if (current === "3") {
    var chapters = [
      [".cr-vision", "Our vision", "careers-carousel-08-grand-opening-pilsen"],
      [".cr-work", "Work at Planet A Foods", "careers-carousel-05-lab"],
      [".cr-facts", "Key facts", "careers-carousel-01-pilsen-site"],
      [".cr-perks", "Perks & benefits", "careers-perks-munich-5-years"],
      [".cr-join", "How to join", "careers-carousel-04-tasting-pilsen"],
      [".cr-final", "Join us", "careers-hero-team-summer"]
    ];
    var stage = el("aside", "cc-stage"); stage.setAttribute("aria-hidden", "true");
    stage.innerHTML = chapters.map(function (c) {
      var big = c[2].indexOf("hero") > -1 || c[2].indexOf("perks") > -1;
      return '<img src="' + IMG + c[2] + (big ? "-sm" : "") + '.jpg" alt="">';
    }).join("") + '<div class="cc-dots">' + chapters.map(function () { return "<i></i>"; }).join("") + "</div>" +
      '<div class="cc-chapter"><small></small><b></b></div>';
    document.body.appendChild(stage);
    var imgs = $$("img", stage), dots = $$(".cc-dots i", stage), small = $(".cc-chapter small", stage), bold = $(".cc-chapter b", stage);
    var secs = chapters.map(function (c) { return $(c[0]); });
    var last = -1, ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight, cur = -1;
      secs.forEach(function (s, k) { if (s && s.getBoundingClientRect().top < vh * 0.55) cur = k; });
      var hero = $(".cr-hero"), foot = $(".footer");
      var on = cur > -1 && (!hero || hero.getBoundingClientRect().bottom < vh * 0.5) && (!foot || foot.getBoundingClientRect().top > vh * 0.6);
      stage.classList.toggle("is-on", on);
      if (cur > -1 && cur !== last) {
        imgs.forEach(function (im, k) { im.classList.toggle("is-on", k === cur); });
        dots.forEach(function (d, k) { d.classList.toggle("is-on", k <= cur); });
        small.textContent = "0" + (cur + 1) + " / 0" + chapters.length;
        bold.textContent = chapters[cur][1];
        last = cur;
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
