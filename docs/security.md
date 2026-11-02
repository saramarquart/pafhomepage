# Security configuration

This file is the one place that documents the site's security headers. Keep the three copies identical:
`staticwebapp.config.json` (Azure Static Web Apps), the `<meta http-equiv="Content-Security-Policy">` tag at the top of
every HTML page, and the allowlist below.

## Content Security Policy

```
default-src 'self'; script-src 'self' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://sales.planet-a-foods.com; media-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self'
```

On Azure the header version adds `frame-ancestors 'self'` (browsers ignore `frame-ancestors` in a `<meta>` tag).

| Directive | Allowed | Why |
| --- | --- | --- |
| `default-src` | `'self'` | Everything comes from our own site unless listed below. |
| `script-src` | `'self'`, `https://*.googletagmanager.com` | Our own scripts; Google's gtag.js, which `assets/consent.js` only loads after analytics consent on the production domain. No `'unsafe-inline'`: the site has no inline scripts (JSON-LD data blocks are not executed and are not affected). |
| `style-src` | `'self'`, `'unsafe-inline'` | Many pages use `style="…"` attributes. Removing them is a separate clean-up; scripts stay strict. |
| `img-src` | `'self'`, `data:`, `https://*.google-analytics.com`, `https://*.googletagmanager.com` | Own images and small inline SVGs in CSS; Google Analytics measurement requests (only after consent). |
| `font-src` | `'self'` | Rethink Sans is self-hosted (`assets/fonts/`). |
| `connect-src` | `'self'`, `https://*.google-analytics.com`, `https://*.analytics.google.com`, `https://*.googletagmanager.com`, `https://sales.planet-a-foods.com` | Google Analytics measurement requests (only after consent). Wildcards as recommended by Google's GA4 CSP guide, so regional endpoints are not blocked. `sales.planet-a-foods.com` is PAForce (paf_sales): the Cocoa Booster sample form posts to its `/api/public/inquiry`, only when the visitor submits. |
| `media-src` | `'self'` | Own videos. |
| `object-src`, `frame-src` | `'none'` | No plugins, no embedded frames. |
| `base-uri`, `form-action`, `manifest-src` | `'self'` | |
| `frame-ancestors` (header only) | `'self'` | Our pages cannot be framed by other sites. |

Plain links to other sites (LinkedIn, Personio, kununu, inoqo, the old CMS downloads on `*.blob.core.windows.net`)
are normal navigations and are not affected by the CSP.

## Bot check on the inquiry forms (Cloudflare Turnstile): off until switched on

`assets/turnstile.js` adds a Cloudflare Turnstile check to the contact form (`contact.html`) and the Cocoa Booster
sample form (`product-cocoa-booster.html`); PAForce verifies the token. While `TURNSTILE_SITE_KEY` in that file is
empty (the default) nothing is loaded from Cloudflare and both forms post exactly as before. That is why the CSP above
does not list Cloudflare yet: a `<meta>` CSP cannot depend on whether a key is set, so the allowance is added in the
same change that sets the key.

When it is on, Cloudflare's script is only loaded once a visitor starts filling in one of the two forms, and the widget
stays invisible unless Cloudflare wants the visitor to tick a box. If the script cannot load (for example because the
CSP was not updated), the form still sends without a token and PAForce decides.

To switch it on, in this order:

1. **Cloudflare dashboard → Turnstile → Add widget**: hostnames `www.planet-a-foods.com` and `planet-a-foods.com`,
   widget mode "Managed". This gives a public **site key** and a **secret key**.
2. **Privacy policy**: add a paragraph on Cloudflare Turnstile to section 5 ("Contacting Us") before the key goes live.
   Turnstile processes the visitor's IP address, TLS fingerprint and browser (User-Agent) for bot detection;
   Cloudflare acts as our processor for that, and as its own controller when it uses the signals to improve Turnstile
   (see https://www.cloudflare.com/turnstile-privacy-policy/). The legal basis would be Art. 6(1)(f) GDPR (protecting
   the forms against misuse).
3. **Website**: put the site key into `TURNSTILE_SITE_KEY` in `assets/turnstile.js` and bump `turnstile.js?v=` on the two
   form pages. In the same change, allow Cloudflare in the CSP, in every page's `<meta>` tag, in
   `staticwebapp.config.json` and in this file (keep all copies identical):
   - `script-src 'self' https://*.googletagmanager.com https://challenges.cloudflare.com`
   - `frame-src https://challenges.cloudflare.com` (replaces `frame-src 'none'`)

   For the pages and the Azure config, from the repo root:
   `perl -pi -e "s#script-src 'self' https://\*\.googletagmanager\.com;#script-src 'self' https://*.googletagmanager.com https://challenges.cloudflare.com;#; s#frame-src 'none';#frame-src https://challenges.cloudflare.com;#" *.html staticwebapp.config.json`
   (it touches only the CSP), then update the CSP block and the `script-src` / `frame-src` rows above by hand.
4. **PAForce (paf_sales)**: once the site with the key is live, set `TURNSTILE_SECRET_KEY` on the PAForce service. From
   then on an inquiry without a valid token is refused. The other order would refuse every inquiry until the site
   sends tokens.

Cloudflare's test keys work on any host, including `127.0.0.1`: site key `1x00000000000000000000AA` always passes,
`2x00000000000000000000AB` always fails, `3x00000000000000000000FF` forces the visible challenge; the matching secret
`1x0000000000000000000000000000000AA` always passes. `tests/specs/bot-check.spec.js` checks the off state, the token in
the request and the CSP above with a stand-in for Cloudflare's script.

## Other headers (Azure only)

| Header | Value |
| --- | --- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

GitHub Pages cannot set headers, so until the move to Azure only the `<meta>` CSP is active. HTTPS is enforced by GitHub Pages.

## Files that must not be public

On Azure, `staticwebapp.config.json` answers `/docs/*`, `/tests/*`, `/scripts/*`, `/.github/*`, `/README.md` and `/CLAUDE.md`
with 404. On GitHub Pages (test domain) these files are still publicly reachable; this was accepted until the Azure move.

## Google Analytics

See `assets/consent-config.js` and `assets/consent.js`. GA4 is loaded directly via gtag.js (no Tag Manager) and only when
analytics consent is given, a `measurementId` is set and the site runs on `planet-a-foods.com` / `www.planet-a-foods.com`.
`cookie_expires` = 34,214,400 seconds (396 days, about 13 months, as stated in the privacy policy).
