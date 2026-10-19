/* Planet A Foods — ingredient detail pages.
   Sample-request form (pre-filled email until CRM routing exists) and
   links that pre-fill the form (colour profile, requested document). */
(function () {
  "use strict";
  var form = document.getElementById("sampleForm");
  if (!form) return;

  // "Discuss your reference" / profile cards / document cards pre-fill the form
  document.querySelectorAll("[data-prefill-profile], [data-prefill-req]").forEach(function (a) {
    a.addEventListener("click", function () {
      var p = a.getAttribute("data-prefill-profile");
      var r = a.getAttribute("data-prefill-req");
      if (p && form.profile) form.profile.value = p;
      if (r && form.req && form.req.value.indexOf(r) === -1) form.req.value = (form.req.value ? form.req.value + "\n" : "") + r;
    });
  });

  // TODO: replace with CRM routing (Salesforce, source "Web – Cocoa Booster", UTM parameters)
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = form.querySelector(".form-msg");
    if (!form.checkValidity()) {
      msg.textContent = "Please fill in the required fields (*) and accept the privacy policy.";
      form.reportValidity && form.reportValidity();
      return;
    }
    var v = function (n) { return (form[n] && form[n].value) || "–"; };
    var body = [
      "Name: " + v("name"), "Email: " + v("email"), "Company: " + v("company"),
      "Role: " + v("role"), "Country: " + v("country"), "Application: " + v("application"),
      "Cocoa powder used today: " + v("profile"), "Annual volume: " + v("volume"),
      "Sample requested: " + (form.sample.checked ? "yes" : "no"), "", v("req"),
      "", "Source: Web – Cocoa Booster" + (location.search ? " " + location.search : "")
    ].join("\n");
    window.location.href = "mailto:hello@forplaneta.com?subject=" +
      encodeURIComponent("Cocoa Booster sample request – " + v("company")) + "&body=" + encodeURIComponent(body);
    msg.textContent = "Your email client opens with the request pre-filled.";
  });
})();

/* Story motion (same language as the careers page): headlines rise in word by
   word, the quote reads itself from soft to white as you scroll, images wipe
   into their frames and cards follow each other in. Uses CSS scroll timelines;
   skipped with reduced motion or where they are not supported. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !(window.CSS && CSS.supports("animation-timeline: view()"))) return;
  document.documentElement.classList.add("story");

  // wrap every word in <span class="sw"><i>word</i></span>, keeping inner markup (br, b, sup)
  function splitWords(el) {
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
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

  var h1 = document.querySelector(".cb-hero h1"); if (h1) splitWords(h1);
  var heads = [].slice.call(document.querySelectorAll(".sub h2"));
  heads.forEach(splitWords);
  if ("IntersectionObserver" in window) {
    var ho = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); ho.unobserve(e.target); } });
    }, { threshold: 0.6 });
    heads.forEach(function (h) { ho.observe(h); });
  } else { heads.forEach(function (h) { h.classList.add("is-in"); }); }

  // the quote reads itself, finished before it reaches mid-screen
  var q = document.querySelector(".quote blockquote");
  if (q) {
    var ink = splitWords(q);
    ink.forEach(function (w, k) {
      var a = 6 + (k / ink.length) * 22;
      w.style.animationRange = "cover " + a.toFixed(1) + "% cover " + (a + 5).toFixed(1) + "%";
    });
  }

  // stagger index for cards; scroll motion replaces the simple reveal on these
  [".pillars .pillar", ".why2 .why-card", ".profiles .profile", ".steps .step", ".apps .app"].forEach(function (sel) {
    [].forEach.call(document.querySelectorAll(sel), function (c, k) {
      c.style.setProperty("--n", k);
      c.classList.add("in");
    });
  });
})();
