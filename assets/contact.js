/* Contact page: compose a pre-filled email from the form (mailto). No data is sent to any server.
   Lives in its own file so the Content Security Policy can forbid inline scripts. */
(function () {
  "use strict";
  // Offline-safe submit: compose a pre-filled email (swap for a real form endpoint at go-live — see README).
  // Buttons elsewhere link here with ?interest=sample|codev|volumes: start on that topic.
  var want = new URLSearchParams(location.search).get("interest"), pick = document.getElementById("interest");
  if (want && pick && pick.querySelector('option[value="' + want + '"]')) pick.value = want;
  var f = document.getElementById("contactForm");
  if (f) f.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (id) { return encodeURIComponent((document.getElementById(id) || {}).value || ""); };
    var sel = document.getElementById("interest");
    var body = "Name: " + g("name") + "%0D%0ACompany: " + g("company") + "%0D%0AEmail: " + g("email") +
               "%0D%0AInterest: " + encodeURIComponent(sel.options[sel.selectedIndex].text) + "%0D%0A%0D%0A" + g("message");
    window.location.href = "mailto:hello@forplaneta.com?subject=" +
      encodeURIComponent("Enquiry via planet-a-foods.com") + "&body=" + body;
    document.getElementById("formOk").style.display = "block";
  });
})();
