/*
 * careers.html — open positions from paf_sonio (see assets/jobs-config.js). Does nothing while the
 * source is "personio". With "paf_sonio":
 *   1. every Personio link on the page goes to paf_sonio's careers page (?source=website) at once,
 *      so no link ever points to the cancelled Personio portal, even if the feed is down;
 *   2. the feed's published jobs replace the hand-written cards, in the same markup and look
 *      (title, chips: team · place · contract · remote/hybrid, "View role");
 *   3. each card links to its paf_sonio job page with ?source=website.
 * Feed text is inserted as text (never HTML), and only links on the paf_sonio origin are used.
 */
(function () {
  "use strict";
  var cfg = window.PAF_JOBS || {};
  if (cfg.source !== "paf_sonio" || !cfg.feedUrl || !window.fetch) return;

  var origin;
  try { origin = new URL(cfg.feedUrl).origin; } catch (e) { return; }

  function withSource(href) {
    try {
      var u = new URL(href, origin);
      if (u.origin !== origin) return null;
      u.searchParams.set("source", "website");
      return u.toString();
    } catch (e) { return null; }
  }

  var careers = withSource(cfg.careersUrl || origin + "/careers");
  Array.prototype.forEach.call(document.querySelectorAll('a[href*="jobs.personio.de"]'), function (a) {
    if (careers) a.setAttribute("href", careers);
  });

  var grid = document.querySelector("[data-jobs-grid]");
  if (!grid) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function card(job) {
    var href = withSource(job.url || "");
    if (!href || typeof job.title !== "string") return null;
    var a = el("a", "card reveal");
    a.setAttribute("style", "min-height:auto");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("data-jobs-item", "");
    a.appendChild(el("h3", null, job.title));
    var chips = el("div", "chips");
    var loc = job.location && job.location.label;
    [job.department, loc, job.employmentTypeLabel, job.workplace === "remote" ? "Remote" : job.workplace === "hybrid" ? "Hybrid" : null].forEach(function (c) {
      if (typeof c === "string" && c) chips.appendChild(el("span", "chip", c));
    });
    a.appendChild(chips);
    var more = el("span", "engine-link arrow", "View role");
    more.setAttribute("style", "margin-top:16px");
    a.appendChild(more);
    return a;
  }

  function reveal(nodes) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n, i) { if (i > 0) n.style.transitionDelay = Math.min(i, 6) * 90 + "ms"; io.observe(n); });
  }

  var ctrl = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
  fetch(cfg.feedUrl, { headers: { Accept: "application/json" }, mode: "cors", credentials: "omit", signal: ctrl ? ctrl.signal : undefined })
    .then(function (r) { if (!r.ok) throw new Error("feed " + r.status); return r.json(); })
    .then(function (feed) {
      clearTimeout(timer);
      var jobs = feed && Array.isArray(feed.jobs) ? feed.jobs : [];
      var cards = jobs.map(card).filter(Boolean);
      // Replace the hand-written job cards; keep the "Don't see your role?" card last.
      Array.prototype.forEach.call(grid.querySelectorAll("[data-jobs-static]"), function (n) { n.remove(); });
      var keep = grid.querySelector("[data-jobs-keep]");
      if (!cards.length) {
        var none = el("div", "card reveal");
        none.setAttribute("style", "min-height:auto;justify-content:center");
        none.setAttribute("data-jobs-item", "");
        none.appendChild(el("h3", null, "No open positions right now"));
        none.appendChild(el("p", null, "New roles are posted here first — check back soon."));
        cards = [none];
      }
      cards.forEach(function (c) { grid.insertBefore(c, keep); });
      reveal(cards);
      grid.setAttribute("data-jobs-loaded", String(jobs.length));
    })
    .catch(function () {
      clearTimeout(timer);
      // Feed unreachable: the hand-written cards may name roles that are long filled, so they go;
      // one card points to paf_sonio's careers page, which lists the same published jobs.
      Array.prototype.forEach.call(grid.querySelectorAll("[data-jobs-static]"), function (n) { n.remove(); });
      if (careers) {
        var a = el("a", "card reveal");
        a.setAttribute("style", "min-height:auto");
        a.href = careers;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("data-jobs-item", "");
        a.appendChild(el("h3", null, "See all open positions"));
        a.appendChild(el("p", null, "Every current vacancy, with the application form, is on our careers portal."));
        var more = el("span", "engine-link arrow", "View roles");
        more.setAttribute("style", "margin-top:16px");
        a.appendChild(more);
        grid.insertBefore(a, grid.querySelector("[data-jobs-keep]"));
        reveal([a]);
      }
      grid.setAttribute("data-jobs-loaded", "error");
    });
})();
