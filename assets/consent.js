/* ============================================================================
   Cookie consent + Google Analytics loader (vanilla JS, no library, no inline code).
   Settings and all wording: assets/consent-config.js. Styles: assets/consent.css.

   How it works, in short:
   1. The visitor's decision is stored in ONE first-party cookie, `paf_consent`
      ({ v: consent version, a: analytics yes/no, t: time of decision }), for 12 months.
      No localStorage / sessionStorage is used anywhere.
   2. If there is no valid decision (missing, unreadable, expired, or an older consent
      version), a small non-blocking banner is shown with equal ACCEPT / DECLINE buttons
      and a SETTINGS button. The page stays fully usable while it is shown.
   3. SETTINGS (and the "Cookie Settings" link in every footer) open a dialog with the two
      categories and their cookie tables. Closing it (ESC / ×) is NOT a decision.
   4. Google Analytics loads only if ALL three hold:
        analytics consent given  AND  a measurementId is configured  AND  we run on a production host.
      Otherwise no request ever goes to a Google domain.
   5. Withdrawing consent switches GA off, deletes the _ga / _ga_* cookies and reloads the page,
      so no Google code stays active.
   Without JavaScript nothing of this runs: no banner, and nothing optional is ever loaded.
   ========================================================================== */
(function () {
  "use strict";

  var cfg = window.PAF_CONSENT_CONFIG;
  if (!cfg) return;
  var T = cfg.text;
  var COOKIE = "paf_consent";
  var DAY = 24 * 60 * 60;

  /* ---------- 1. Reading and writing the decision cookie ---------- */

  // Returns the stored decision, or null if it is missing, unreadable, too old or from an older consent version.
  function readConsent() {
    var match = document.cookie.match(/(?:^|;\s*)paf_consent=([^;]*)/);
    if (!match) return null;
    try {
      var d = JSON.parse(decodeURIComponent(match[1]));
      if (!d || d.v !== cfg.consentVersion || typeof d.a !== "boolean" || typeof d.t !== "number") return null;
      if (Date.now() - d.t > cfg.consentMaxAgeDays * DAY * 1000) return null;   // older than 12 months: ask again
      return d;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(analytics) {
    var value = encodeURIComponent(JSON.stringify({ v: cfg.consentVersion, a: analytics, t: Date.now() }));
    // Secure on every HTTPS page (the live site). Plain-http previews (localhost, a phone on the local network)
    // would silently drop a Secure cookie and ask again on every page, so it is left out there.
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = COOKIE + "=" + value + "; Path=/; Max-Age=" + cfg.consentMaxAgeDays * DAY + "; SameSite=Lax" + secure;
  }

  /* ---------- 2. Google Analytics: load only when allowed, remove on withdrawal ---------- */

  function analyticsAllowedHere() {
    return !!cfg.measurementId && cfg.productionHosts.indexOf(location.hostname) !== -1;
  }

  var gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded || !analyticsAllowedHere()) return;   // test domain, localhost or no ID: never contact Google
    gaLoaded = true;
    var id = cfg.measurementId;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Google Consent Mode: everything denied first; then only analytics storage is granted. Ad signals stay denied for good.
    window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    // Repeats our GA4 property settings on purpose, as a second safeguard. Standard page views (plus the
    // open_positions_click event in careers.js);
    // the address is sent without query string or #fragment so no parameters can carry personal data.
    window.gtag("config", id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_flags: "SameSite=Lax;Secure",
      cookie_expires: cfg.gaCookieExpiresSeconds,
      page_location: location.origin + location.pathname
    });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  // Deletes _ga and every _ga_* cookie on this host and on the parent domain (e.g. ".planet-a-foods.com").
  function deleteAnalyticsCookies() {
    var host = location.hostname;
    var parent = host.split(".").slice(-2).join(".");
    var domains = ["", "; Domain=" + host, "; Domain=." + host, "; Domain=." + parent];
    document.cookie.split(";").forEach(function (part) {
      var name = part.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0) {
        domains.forEach(function (d) {
          document.cookie = name + "=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" + d;
        });
      }
    });
  }

  /* ---------- 3. Saving a choice ---------- */

  function decide(analytics) {
    var before = readConsent();
    var hadFocusInConsentUi = !!(document.activeElement && document.activeElement.closest &&
      document.activeElement.closest(".pc-banner, .pc-dialog"));
    writeConsent(analytics);
    hideBanner();
    closeDialog();
    if (hadFocusInConsentUi && !(opener && document.contains(opener))) focusPage();
    if (analytics) {
      loadAnalytics();
    } else {
      if (cfg.measurementId) window["ga-disable-" + cfg.measurementId] = true;   // stop GA at once
      deleteAnalyticsCookies();
      // If analytics was on before (consent withdrawn), reload so no Google code remains in the page.
      if ((before && before.a) || gaLoaded) location.reload();
    }
  }

  /* ---------- 4. Building the banner and the dialog ---------- */

  // Where keyboard focus goes once the banner has disappeared: the page's main heading (or the page itself).
  function focusPage() {
    var h = document.querySelector("main h1, h1");
    if (h) {
      if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    } else if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  // The banner text with the privacy policy link put in place of {privacyLink}.
  function bannerText() {
    var p = el("p", { "class": "pc-text", id: "pc-banner-text" });
    var parts = T.bannerBody.split("{privacyLink}");
    p.appendChild(document.createTextNode(parts[0]));
    p.appendChild(el("a", { href: T.privacyUrl }, T.privacyLinkText));
    p.appendChild(document.createTextNode(parts[1] || ""));
    return p;
  }

  var banner = null;
  function showBanner() {
    if (banner) return;
    // A labelled region, not a modal: the page behind stays usable (privacy policy, imprint, …).
    banner = el("section", { "class": "pc-banner", role: "region", "aria-labelledby": "pc-banner-title", "aria-describedby": "pc-banner-text" });
    var inner = el("div", { "class": "pc-banner-inner" });
    inner.appendChild(el("h2", { "class": "pc-title", id: "pc-banner-title" }, T.bannerTitle));
    inner.appendChild(bannerText());
    var row = el("div", { "class": "pc-actions" });
    var acc = el("button", { type: "button", "class": "pc-btn pc-choice", "data-pc": "accept" }, T.accept);
    var dec = el("button", { type: "button", "class": "pc-btn pc-choice", "data-pc": "decline" }, T.decline);
    var set = el("button", { type: "button", "class": "pc-btn pc-ghost", "data-pc": "settings", "aria-haspopup": "dialog" }, T.settings);
    acc.addEventListener("click", function () { decide(true); });
    dec.addEventListener("click", function () { decide(false); });
    set.addEventListener("click", function () { openDialog(set); });
    row.appendChild(acc); row.appendChild(dec); row.appendChild(set);
    inner.appendChild(row);
    banner.appendChild(inner);
    // First in the page order so keyboard users reach it first; shown fixed at the bottom of the screen.
    document.body.insertBefore(banner, document.body.firstChild);
    document.documentElement.classList.add("pc-has-banner");
    reserveSpace();
    if (window.ResizeObserver) new ResizeObserver(reserveSpace).observe(banner);
  }
  function hideBanner() {
    if (!banner) return;
    banner.parentNode.removeChild(banner);
    banner = null;
    document.documentElement.classList.remove("pc-has-banner");
    document.documentElement.style.removeProperty("--pc-banner-h");
  }
  // Leaves room at the end of the page so the banner never hides the last lines of content.
  function reserveSpace() {
    if (banner) document.documentElement.style.setProperty("--pc-banner-h", banner.offsetHeight + "px");
  }
  window.addEventListener("resize", reserveSpace);

  function cookieTable(cat) {
    var wrap = el("div", { "class": "pc-table-wrap" });
    var table = el("table", { "class": "pc-table" });
    table.appendChild(el("caption", { "class": "pc-sr" }, cat.title + " cookies"));
    var head = el("tr");
    [T.colCookie, T.colService, T.colDuration, T.colDescription].forEach(function (h) { head.appendChild(el("th", { scope: "col" }, h)); });
    var thead = el("thead"); thead.appendChild(head); table.appendChild(thead);
    var tbody = el("tbody");
    cat.cookies.forEach(function (c) {
      var tr = el("tr");
      tr.appendChild(el("td", { "data-label": T.colCookie }, c.name));
      tr.appendChild(el("td", { "data-label": T.colService }, c.service));
      tr.appendChild(el("td", { "data-label": T.colDuration }, c.duration));
      tr.appendChild(el("td", { "data-label": T.colDescription }, c.description));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  var dialog = null, analyticsBox = null, opener = null;
  function buildDialog() {
    dialog = el("dialog", { "class": "pc-dialog", "aria-labelledby": "pc-dialog-title" });
    var box = el("div", { "class": "pc-dialog-inner" });
    var top = el("div", { "class": "pc-dialog-top" });
    top.appendChild(el("h2", { "class": "pc-title", id: "pc-dialog-title" }, T.dialogTitle));
    var x = el("button", { type: "button", "class": "pc-close", "aria-label": T.close }, "×");
    x.addEventListener("click", function () { closeDialog(); });   // closing is not a decision
    top.appendChild(x);
    box.appendChild(top);
    box.appendChild(el("p", { "class": "pc-text" }, T.dialogIntro));

    cfg.categories.forEach(function (cat) {
      var sec = el("section", { "class": "pc-cat", "aria-labelledby": "pc-cat-" + cat.id });
      var head = el("div", { "class": "pc-cat-head" });
      head.appendChild(el("h3", { id: "pc-cat-" + cat.id }, cat.title));
      if (cat.id === "necessary") {
        head.appendChild(el("span", { "class": "pc-always" }, T.alwaysActive));
      } else {
        var label = el("label", { "class": "pc-switch" });
        analyticsBox = el("input", { type: "checkbox", id: "pc-analytics", "aria-describedby": "pc-desc-" + cat.id });
        label.appendChild(analyticsBox);
        label.appendChild(el("span", { "class": "pc-sr" }, cat.title));
        label.appendChild(el("span", { "class": "pc-slider", "aria-hidden": "true" }));
        head.appendChild(label);
      }
      sec.appendChild(head);
      sec.appendChild(el("p", { "class": "pc-text", id: "pc-desc-" + cat.id }, cat.description));
      sec.appendChild(cookieTable(cat));
      box.appendChild(sec);
    });

    var row = el("div", { "class": "pc-actions" });
    var save = el("button", { type: "button", "class": "pc-btn pc-ghost" }, T.save);
    var all = el("button", { type: "button", "class": "pc-btn pc-choice" }, T.acceptAll);
    var none = el("button", { type: "button", "class": "pc-btn pc-choice" }, T.declineAll);
    save.addEventListener("click", function () { decide(analyticsBox.checked); });
    all.addEventListener("click", function () { decide(true); });
    none.addEventListener("click", function () { decide(false); });
    row.appendChild(all); row.appendChild(none); row.appendChild(save);
    box.appendChild(row);
    dialog.appendChild(box);
    // ESC (or ×) just closes the dialog: nothing is stored, the banner stays until a real choice is made.
    // Whatever closed it, focus goes back to where it came from and the page can scroll again.
    dialog.addEventListener("close", function () {
      document.documentElement.classList.remove("pc-dialog-open");
      if (opener && document.contains(opener)) opener.focus();
      else if (banner) banner.querySelector("button").focus();
      opener = null;
    });
    document.body.appendChild(dialog);
  }

  function openDialog(trigger) {
    if (!dialog) buildDialog();
    opener = trigger || document.activeElement;
    var current = readConsent();
    analyticsBox.checked = !!(current && current.a);   // shows the visitor's own earlier choice; never pre-ticked otherwise
    document.documentElement.classList.add("pc-dialog-open");   // the page behind does not scroll
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
    dialog.querySelector(".pc-close").focus();
  }
  function closeDialog() {
    if (!dialog || !dialog.hasAttribute("open")) return;
    if (dialog.close) dialog.close();   // fires "close" (focus + scroll handled there)
    else { dialog.removeAttribute("open"); dialog.dispatchEvent(new Event("close")); }
  }

  /* ---------- 5. Start ---------- */

  // "Cookie Settings" links in the footer: open the dialog (without JS they lead to the cookie section of the policy).
  [].forEach.call(document.querySelectorAll("[data-cookie-settings]"), function (a) { a.setAttribute("aria-haspopup", "dialog"); });
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (!link) return;
    e.preventDefault();
    openDialog(link);
  });

  // Pages restored with the browser's Back/Forward button come back exactly as they were left.
  // Re-check the decision, which may have been made or withdrawn on another page meanwhile.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    var d = readConsent();
    closeDialog();
    if (d) hideBanner(); else showBanner();
    if (d && d.a) {
      loadAnalytics();
    } else if (gaLoaded) {
      if (cfg.measurementId) window["ga-disable-" + cfg.measurementId] = true;
      deleteAnalyticsCookies();
      location.reload();   // remove the Google code that is still in this restored page
    }
  });

  var decision = readConsent();
  if (!decision) {
    if (document.cookie.indexOf(COOKIE + "=") !== -1) {
      // Unreadable or outdated decision: remove it and switch analytics off until the visitor decides again.
      deleteAnalyticsCookies();
    }
    showBanner();
  } else if (decision.a) {
    loadAnalytics();
  }
})();
