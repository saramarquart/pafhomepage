/* Contact page: sends the inquiry to PAForce, the sales CRM (sales.planet-a-foods.com); a
   pre-filled email is only offered as the fallback when that fails.
   Lives in its own file so the Content Security Policy can forbid inline scripts. */
(function () {
  "use strict";
  // Buttons elsewhere link here with ?interest=booster|product|sample|codev|volumes: start on that topic.
  var want = new URLSearchParams(location.search).get("interest"), pick = document.getElementById("interest");
  if (want && pick && pick.querySelector('option[value="' + want + '"]')) pick.value = want;
  var f = document.getElementById("contactForm");
  if (!f) return;
  var started = Date.now(); // PAForce treats forms sent within 3 s as spam

  function val(name) { return (f.elements[name] && f.elements[name].value) || ""; }

  // Pre-filled email with the same answers: the fallback when sending fails.
  function mailtoHref() {
    var sel = document.getElementById("interest");
    var body = "Name: " + val("name") + "\nCompany: " + val("company") + "\nEmail: " + val("email") +
               "\nInterest: " + sel.options[sel.selectedIndex].text + "\n\n" + val("message");
    return "mailto:sales@forplaneta.com?subject=" + encodeURIComponent("Inquiry via planet-a-foods.com") +
           "&body=" + encodeURIComponent(body);
  }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = document.getElementById("formMsg");
    var btn = f.querySelector('button[type="submit"]');
    var data = {
      form: "contact",
      name: val("name"), company: val("company"), email: val("email"),
      interest: val("interest"), message: val("message"),
      privacy: f.elements.privacy.checked,
      website: val("website"), elapsedMs: Date.now() - started, pageUrl: location.href
    };
    var fallback = mailtoHref();
    btn.disabled = true;
    msg.textContent = "Sending …";
    fetch(f.getAttribute("data-endpoint"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (res) {
        if (!r.ok || !res.ok) throw new Error(res.error || String(r.status));
      });
    }).then(function () {
      f.reset();
      msg.textContent = "Thank you – your message is with our team. We'll be in touch shortly.";
    }).catch(function () {
      msg.textContent = "Your message could not be sent. Please ";
      var a = document.createElement("a");
      a.href = fallback;
      a.textContent = "email it to sales@forplaneta.com";
      msg.appendChild(a);
      msg.appendChild(document.createTextNode(" instead."));
    }).then(function () { btn.disabled = false; });
  });
})();
