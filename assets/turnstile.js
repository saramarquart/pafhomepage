/* Bot check (Cloudflare Turnstile) for the two inquiry forms: the contact page and the
   Cocoa Booster sample request. PAForce (sales.planet-a-foods.com) verifies the token.

   OFF while TURNSTILE_SITE_KEY is empty: nothing is loaded from Cloudflare and the forms post
   exactly as before. Switching it on takes more than the key (Content Security Policy, privacy
   policy, then the secret key on PAForce): see "Bot check" in docs/security.md.

   When on, Cloudflare's script is loaded only once the visitor starts filling in a form, and the
   widget stays invisible unless Cloudflare needs the visitor to click it.
   Lives in its own file so the Content Security Policy can forbid inline scripts. */
(function () {
  "use strict";
  var TURNSTILE_SITE_KEY = ""; // public site key from the Cloudflare dashboard; empty = off
  var API = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var loading = null;

  function load() {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        if (window.turnstile) { resolve(window.turnstile); return; }
        var s = document.createElement("script");
        s.src = API;
        s.async = true;
        s.onload = function () { window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not start")); };
        s.onerror = function () { reject(new Error("Turnstile script blocked")); };
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  var OFF = { token: function () { return Promise.resolve(""); }, reset: function () {} };

  /* One widget per form. token() resolves with the current token, waiting up to 10 s for
     Cloudflare; it resolves "" when the check could not run, and PAForce then decides. */
  function attach(form) {
    if (!TURNSTILE_SITE_KEY || !form) return OFF;
    var slot = document.createElement("div");
    slot.className = "bot-check";
    slot.style.gridColumn = "1 / -1"; // both forms are grids: give the widget a full row
    form.insertBefore(slot, form.querySelector('button[type="submit"]'));
    // failed: the widget reported an error (a reset may recover); blocked: the script never loaded.
    var current = "", failed = false, blocked = false, started = false, widget = null, waiting = [];

    function settle(t) {
      current = t || "";
      var w = waiting; waiting = [];
      w.forEach(function (fn) { fn(current); });
    }
    function start() {
      if (started) return;
      started = true;
      load().then(function (ts) {
        widget = ts.render(slot, {
          sitekey: TURNSTILE_SITE_KEY,
          action: "inquiry",
          appearance: "interaction-only",
          theme: "light",
          callback: settle,
          "expired-callback": function () { current = ""; },
          "error-callback": function () { failed = true; settle(""); }
        });
      }).catch(function (e) {
        blocked = true;
        settle("");
        if (window.console) console.warn("Bot check unavailable: " + e.message + " (see docs/security.md)");
      });
    }
    form.addEventListener("focusin", start);

    return {
      token: function (ms) {
        start();
        if (current || failed || blocked) return Promise.resolve(current);
        return new Promise(function (resolve) {
          var done = false;
          function finish(t) { if (!done) { done = true; resolve(t); } }
          waiting.push(finish);
          setTimeout(function () { finish(current); }, ms || 10000);
        });
      },
      // Tokens are single-use: after every send, get a fresh one for the next attempt.
      reset: function () {
        current = "";
        failed = false;
        if (widget !== null && window.turnstile) window.turnstile.reset(widget);
      }
    };
  }

  window.pafBotCheck = { enabled: !!TURNSTILE_SITE_KEY, attach: attach };
})();
