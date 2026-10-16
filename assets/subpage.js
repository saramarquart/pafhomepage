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
