/* Contact page: compose a pre-filled email from the form (mailto). No data is sent to any server.
   Lives in its own file so the Content Security Policy can forbid inline scripts. */
(function () {
  "use strict";
  var form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (id) { return encodeURIComponent((document.getElementById(id) || {}).value || ""); };
    var body = "Name: " + g("name") + "%0D%0ACompany: " + g("company") + "%0D%0AEmail: " + g("email") +
               "%0D%0AInterest: " + g("interest") + "%0D%0A%0D%0A" + g("message");
    window.location.href = "mailto:hello@forplaneta.com?subject=" +
      encodeURIComponent("Enquiry via planet-a-foods.com") + "&body=" + body;
    document.getElementById("formOk").style.display = "block";
  });
})();
