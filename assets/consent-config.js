/* ============================================================================
   Consent configuration — the single place to change cookie consent settings.
   Read by assets/consent.js (banner, settings dialog, Google Analytics loader).

   `measurementId` is set, but Google Analytics still only loads on the production hosts below
   (never on the test domain or locally) and only after the visitor accepts analytics.
   Emptying `measurementId` switches analytics off everywhere.

   The cookie list below must match section 10 of the privacy policy
   (privacy-policy.html, source: docs/legal/privacy-policy-en.md) word for word.
   An automated test (tests/) compares them. If a cookie, provider, purpose or
   duration changes here, the policy has to change too (DPO review), and
   `consentVersion` must be raised so every visitor is asked again.
   ========================================================================== */
window.PAF_CONSENT_CONFIG = {
  // GA4 Measurement ID (Planet A Foods property, web stream planet-a-foods.com). Empty = analytics switched off everywhere.
  measurementId: "G-YBE6M8Y545",

  // Google Analytics may only ever load on these hostnames (never on the test domain or localhost).
  productionHosts: ["planet-a-foods.com", "www.planet-a-foods.com"],

  // Raise this (e.g. "2027-01") whenever the cookie list or the purposes change: visitors are asked again.
  consentVersion: "2026-10",

  // How long a decision is kept before the banner shows again (matches paf_consent: 12 months).
  consentMaxAgeDays: 365,

  // _ga / _ga_* lifetime, as stated in the privacy policy: 13 months = 396 days = 34,214,400 seconds.
  gaCookieExpiresSeconds: 34214400,

  categories: [
    {
      id: "necessary",
      title: "Necessary",
      description: "Required for the technically error-free provision and secure operation of our website. Always active.",
      cookies: [
        {
          name: "paf_consent",
          service: "Planet A Foods",
          duration: "12 months",
          description: "Stores your decision on the use of optional cookies (consent version, your choice and the date of your decision) so that the cookie notice is not shown again on every visit and your choice is respected."
        }
      ]
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Google Analytics 4 (Google Ireland Limited) helps us understand statistically how our website is used. Loaded only with your consent.",
      cookies: [
        {
          name: "_ga",
          service: "Google Analytics",
          duration: "13 months",
          description: "Distinguishes visitors to the website by means of a randomly assigned identifier, enabling statistical analysis of website usage."
        },
        {
          name: "_ga_*",
          service: "Google Analytics",
          duration: "13 months",
          description: "Stores and counts page views within a session for the respective Google Analytics property. The variable part of the name identifies the property."
        }
      ]
    }
  ],

  // All visible wording of the banner and dialog (English only for now).
  text: {
    bannerTitle: "This website uses cookies",
    bannerBody: "We use cookies and similar technologies on our website to provide and improve our website, as well as to analyze your usage. By clicking \"ACCEPT,\" you consent to the use of optional services. If you select \"DECLINE,\" we will only use technically necessary services. You can withdraw your consent at any time with effect for the future via the \"Cookie Settings\" link in the footer. Further information can be found in our {privacyLink}.",
    privacyLinkText: "privacy policy",
    privacyUrl: "privacy-policy.html",
    accept: "Accept",
    decline: "Decline",
    settings: "Settings",
    dialogTitle: "Cookie settings",
    dialogIntro: "Choose which cookies we may use. You can change or withdraw your choice at any time via “Cookie Settings” in the footer.",
    alwaysActive: "Always active",
    save: "Save settings",
    acceptAll: "Accept all",
    declineAll: "Decline all",
    close: "Close",
    colCookie: "Cookie",
    colService: "Service",
    colDuration: "Duration",
    colDescription: "Description"
  }
};
