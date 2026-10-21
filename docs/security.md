# Security configuration

This file is the one place that documents the site's security headers. Keep the three copies identical:
`staticwebapp.config.json` (Azure Static Web Apps), the `<meta http-equiv="Content-Security-Policy">` tag at the top of
every HTML page, and the allowlist below.

## Content Security Policy

```
default-src 'self'; script-src 'self' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; media-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self'
```

On Azure the header version adds `frame-ancestors 'self'` (browsers ignore `frame-ancestors` in a `<meta>` tag).

| Directive | Allowed | Why |
| --- | --- | --- |
| `default-src` | `'self'` | Everything comes from our own site unless listed below. |
| `script-src` | `'self'`, `https://*.googletagmanager.com` | Our own scripts; Google's gtag.js, which `assets/consent.js` only loads after analytics consent on the production domain. No `'unsafe-inline'`: the site has no inline scripts (JSON-LD data blocks are not executed and are not affected). |
| `style-src` | `'self'`, `'unsafe-inline'` | Many pages use `style="…"` attributes. Removing them is a separate clean-up; scripts stay strict. |
| `img-src` | `'self'`, `data:`, `https://*.google-analytics.com`, `https://*.googletagmanager.com` | Own images and small inline SVGs in CSS; Google Analytics measurement requests (only after consent). |
| `font-src` | `'self'` | Rethink Sans is self-hosted (`assets/fonts/`). |
| `connect-src` | `'self'`, `https://*.google-analytics.com`, `https://*.analytics.google.com`, `https://*.googletagmanager.com` | Google Analytics measurement requests (only after consent). Wildcards as recommended by Google's GA4 CSP guide, so regional endpoints are not blocked. |
| `media-src` | `'self'` | Own videos. |
| `object-src`, `frame-src` | `'none'` | No plugins, no embedded frames. |
| `base-uri`, `form-action`, `manifest-src` | `'self'` | |
| `frame-ancestors` (header only) | `'self'` | Our pages cannot be framed by other sites. |

Plain links to other sites (LinkedIn, Personio, kununu, inoqo, the old CMS downloads on `*.blob.core.windows.net`)
are normal navigations and are not affected by the CSP.

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
