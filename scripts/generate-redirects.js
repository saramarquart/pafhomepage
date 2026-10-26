#!/usr/bin/env node
/* ============================================================================
 * generate-redirects.js — keep the old site's URLs working after the relaunch.
 *
 * The old Nuxt site (until 26.10.2026) had URLs like /about/mission or
 * /press/articles/<id>/<slug>. Google, press articles and partners link to them.
 * GitHub Pages can't send server redirects, so every old URL gets a tiny stub
 * page (instant meta refresh + canonical) pointing to its new page. Google treats
 * an instant meta refresh like a permanent redirect.
 *
 * GitHub Pages serves /foo/bar from foo/bar.html, so each old path becomes
 * <path>.html (or <path>/index.html for a bare folder like /de).
 * Old URLs that still exist as pages (/careers, /contact, /imprint,
 * /privacy-policy, /press) are served as-is and need no stub.
 *
 * RUN (after editing the table):  node scripts/generate-redirects.js
 * ============================================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://www.planet-a-foods.com";

// Old press article ids → new press page. Each id existed under several slugs.
const PRESS = {
  a43ktxv7f1kmz55imokmktmt: ["press-asia.html", "choviva-in-asia", "choviva-in-asien"],
  b926a6a0l400sotqwww7h1n9: ["press-nestle.html", "nestle-partnership", "nestle-partnerschaft"],
  bjb88ruh8qkprw91d2dn3f5j: ["press.html", "planet-a-foods-baeko-und-baker-und-baker"],
  ca1klx1e5e3mfhxbyjnzeeno: ["press-honored.html", "planet-a-foods-honored", "planet-a-foods-doppelt-ausgezeichnet"],
  iu2xm6bhnoemm82tzrmnsh5t: ["press-series-b.html", "planet-a-foods-series-b-financing", "planet-a-foods-series-b-finanzierung"],
  mzsly86l1geymdpzdccijeaz: ["press-series-a.html", "planet-a-foods-series-a"],
  or0iwkvc5ezsfq1k5ikxw0fg: ["press-rewe.html", "choviva-available-at-rewe", "choviva-jetzt-bei-rewe"],
  s7aa9gqy7umzc4gczo8z5pbt: ["press-no-added-sugar.html", "choviva-no-added-sugar", "cho-viva-no-added-sugar"],
  usz46xv9zcxj1owtkoz7jgpo: ["press-treets.html", "treets-launch-with-choviva", "treets-launch-mit-choviva"],
  y5txbxgtwhtnrwfwr3ekare1: ["press-barry.html", "partner-barry-callebaut", "partnerschaft-barry-callebaut"],
  z7jri4fhgkjoj6jevmomsir8: ["press-easter.html", "choviva-easter-launch", "choviva-oster-launch"],
};

// Old path → new URL (path on this site, or a full URL elsewhere).
const MAP = {
  "/de": "/",
  "/en": "/",
  "/press": "/press.html", // only reached if Pages prefers the press/ folder over press.html

  "/about/mission": "/mission.html",
  "/about/journey": "/mission.html#journey",
  "/about/people": "/mission.html",
  "/partners": "/",
  "/portfolio/chocolate": "https://choviva.com/",
  "/portfolio/butter": "/#portfolio",

  "/en/about/mission": "/mission.html",
  "/en/about/journey": "/mission.html#journey",
  "/en/about/people": "/mission.html",
  "/en/partners": "/",
  "/en/portfolio/chocolate": "https://choviva.com/",
  "/en/portfolio/butter": "/#portfolio",
  "/en/press": "/press.html",
  "/en/careers": "/careers.html",
  "/en/contact": "/contact.html",
  "/en/imprint": "/imprint.html",
  "/en/privacy-policy": "/privacy-policy.html",

  "/de/ueber-uns/mission": "/mission.html",
  "/de/ueber-uns/journey": "/mission.html#journey",
  "/de/ueber-uns/menschen": "/mission.html",
  "/de/partner": "/",
  "/de/portfolio/chocolate": "https://choviva.com/",
  "/de/portfolio/butter": "/#portfolio",
  "/de/presse": "/press.html",
  "/de/karriere": "/careers.html",
  "/de/kontakt": "/contact.html",
  "/de/impressum": "/imprint.html",
  "/de/datenschutz": "/privacy-policy.html",
};
for (const [id, [target, ...slugs]] of Object.entries(PRESS)) {
  for (const slug of slugs) {
    MAP[`/press/articles/${id}/${slug}`] = "/" + target;
    MAP[`/de/presse/artikel/${id}/${slug}`] = "/" + target;
  }
}

const FOLDERS = new Set(["/de", "/en", "/press"]);

function stub(target) {
  const abs = target.startsWith("http") ? target : SITE + target;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>This page has moved — Planet A Foods</title>
  <link rel="canonical" href="${abs}" />
  <meta http-equiv="refresh" content="0; url=${target}" />
</head>
<body>
  <p>This page has moved to <a href="${target}">${abs}</a>.</p>
</body>
</html>
`;
}

for (const [from, to] of Object.entries(MAP)) {
  const file = path.join(ROOT, FOLDERS.has(from) ? from + "/index.html" : from + ".html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stub(to));
}
console.log(`${Object.keys(MAP).length} redirect stubs written.`);
