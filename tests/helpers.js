// Shared helpers for the site tests.
// Every request that leaves our own site is intercepted and recorded; nothing real is ever sent to Google.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PROD = "https://planet-a-foods.com";
const DUMMY_ID = "G-TEST000000";
const GOOGLE = /(^|\.)(google|googletagmanager|google-analytics|googleapis|gstatic|doubleclick|googlesyndication)\.[a-z.]+$/;

// Pages of the site = the committed HTML files in the repo root (not the Google Search Console verification file).
function sitePages() {
  try {
    return execSync("git ls-files '*.html'", { cwd: ROOT }).toString().split("\n").filter((f) => f && !f.includes("/") && !/^google[0-9a-f]+\.html$/.test(f));
  } catch (e) {
    return fs.readdirSync(ROOT).filter((f) => f.endsWith(".html") && !/^google[0-9a-f]+\.html$/.test(f));
  }
}

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".mp4": "video/mp4",
  ".webm": "video/webm", ".ico": "image/x-icon", ".pdf": "application/pdf" };

/**
 * Prepares a browser context.
 *   prod:    serve the site as if it ran on https://planet-a-foods.com (from the local files)
 *   id:      Measurement ID to inject into consent-config.js (test-only override)
 *   version: consentVersion to inject
 * Returns { external }: every third-party URL the pages tried to load.
 */
async function setup(context, { prod = false, id, version } = {}) {
  const external = [];
  const overrideConfig = (body) => {
    if (id !== undefined) body = body.replace(/measurementId:\s*"[^"]*"/, `measurementId: "${id}"`);
    if (version !== undefined) body = body.replace(/consentVersion:\s*"[^"]*"/, `consentVersion: "${version}"`);
    return body;
  };
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const isConfig = url.pathname.endsWith("/assets/consent-config.js");
    if (url.origin === PROD || url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      if (url.origin === PROD) {
        const file = path.join(ROOT, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
        if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: "" });
        let body = fs.readFileSync(file);
        if (isConfig) body = overrideConfig(body.toString());
        return route.fulfill({ status: 200, body, contentType: TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
      }
      if (isConfig && (id !== undefined || version !== undefined)) {
        const res = await route.fetch();
        return route.fulfill({ response: res, body: overrideConfig(await res.text()) });
      }
      return route.continue();
    }
    external.push(url.href);
    // Stand-in for gtag.js so the page behaves normally; real Google servers are never contacted.
    if (url.hostname === "www.googletagmanager.com") return route.fulfill({ status: 200, contentType: "text/javascript", body: "/* gtag stub */" });
    return route.fulfill({ status: 204, body: "" });
  });
  return { external, google: () => external.filter((u) => GOOGLE.test(new URL(u).hostname)) };
}

function base(prod) { return prod ? PROD : "http://127.0.0.1:4173"; }

async function consentCookie(context) {
  const c = (await context.cookies()).find((x) => x.name === "paf_consent");
  return c ? JSON.parse(decodeURIComponent(c.value)) : null;
}

module.exports = { ROOT, PROD, DUMMY_ID, sitePages, setup, base, consentCookie };
