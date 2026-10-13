# Planet A Foods — Homepage

A complete, self-contained marketing site for **www.planet-a-foods.com**, repositioning Planet A Foods from a chocolate-alternative brand into a **sustainable ingredient powerhouse**.

- **Pure static** — HTML + CSS + a little vanilla JS. No build step, no dependencies.
- **Works offline** — double-click `index.html` (or serve the folder). Premium web fonts load online (Fraunces + Inter) and fall back gracefully to system fonts offline.
- **Look & feel** — heavy-premium, editorial, à la givaudan.com (warm neutrals + espresso + a restrained gold/purple accent, big serif headlines, generous whitespace, subtle scroll-reveal).
- **Voice** — inspired by planet-a-foods.com + Givaudan. **Lead themes: reliability, supply-chain resilience, sovereignty, price stability.** Sustainability is the *glue*, not the sales pitch. Written copy throughout (no placeholders).
- **Positioning of the science** — the technology is the *engine, not the car*: whisper-quiet on the homepage (one line), full story on `technology.html`.
- **Industrial credibility** (GFSI-certified · 2 production sites · 30,000 MT) lives on `capabilities.html` so the homepage stays confident, not needy.

## Pages
| File | Purpose |
|---|---|
| `index.html` | Homepage — hero, the challenge, portfolio, quiet tech strip, solutions & co-development, front-end innovation + Academy, "why it matters" (reliability/resilience/sovereignty/price), credibility teaser, CTA |
| `portfolio.html` | All 8 products in detail (ChoViva, ChoViva Butter, Cocoa Booster, Chocolate Compound Solutions, Hazelnut, Vanilla, Coffee Alternative, Coffee Booster) |
| `technology.html` | The two platforms — fermentation + synthetic biology |
| `capabilities.html` | Industrial scale, resilience, GFSI, 30,000 MT, two sites |
| `contact.html` | Partner with us / request a sample (offline-safe form) |
| `assets/` | `styles.css`, `main.js`, `logo.svg` |

## Run it locally
- Double-click `index.html`, **or**
- Serve the folder: `python3 -m http.server 8080` → open `http://localhost:8080`

---

## GO LIVE — checklist

Three things to do before flipping the domain, then deploy.

### 1. Add real imagery (recommended, optional)
The design is intentionally photo-optional (rich colour fields + type), so it looks finished with zero images. To make it *sing*, drop in photography:
- **Where:** the hero (`.hero` background), section backgrounds, and product cards are the natural slots. Easiest: set a `background-image` (with the existing gradient as an overlay) or add `<img>` into cards.
- **Reuse Planet A assets:** pull hero / product / ingredient / production shots from the current **www.planet-a-foods.com** (and existing brand library) and place them in `assets/img/`. Art direction: raw ingredients, macro food textures, fermentation/production, hands, nature — colour-graded warm.

### 2. Wire the contact form (required for real enquiries)
`contact.html` currently opens a **pre-filled email** on submit (works with no backend). For a proper form, replace the inline `<script>` at the bottom of `contact.html` with a real endpoint:
- **Formspree / Getform / Basin** — change `<form>` to `action="https://formspree.io/f/XXXX" method="POST"` and delete the mailto script; **or**
- **Netlify Forms** — add `data-netlify="true"` to the `<form>`; **or**
- **Your own API** — POST to an endpoint.

### 3. German legal pages (required in DE)
Add and link an **Impressum** and **Datenschutzerklärung** (privacy) — legally required for a German company site. Create `impressum.html` / `datenschutz.html` and link them in the footer. (Also add a cookie/analytics notice if you add tracking.)

### 4. Deploy
It's pure static, so it hosts anywhere:
- **Railway** (keeps it on your platform): add a tiny static server. Simplest is a Dockerfile:
  ```Dockerfile
  FROM caddy:2-alpine
  COPY . /srv
  # Caddy auto-serves /srv on :80 with the Caddyfile below, or use `caddy file-server`
  ```
  or a Node static server (`serve`). New Railway service → deploy → add the domain.
- **Cloudflare Pages / Netlify / GitHub Pages** (zero-config, free CDN + HTTPS + custom domain): connect the repo (or drag-drop the folder), set no build command, publish directory = root. **Simplest option for a marketing site.**
- **Vercel**: same, static (but note the Hobby commit-author restriction you've hit before).

### 5. Point the domain + finishing touches
- Point **www.planet-a-foods.com** (CNAME) at the chosen host; add the domain in the host's dashboard for auto-HTTPS.
- **Favicon:** `logo.svg` is set; add a `favicon.ico` + `apple-touch-icon.png` for older browsers/iOS if you like.
- **OG/social image:** add an `assets/og.jpg` and set `og:image` in each page's `<head>` for nice link previews.
- **Analytics:** drop your tag (Plausible/GA) before `</head>` (mind the cookie notice).
- **Metadata:** titles/descriptions are set per page — tweak to taste.

## Notes on the copy
- Every product is framed as **Alternative** (replace) or **Booster** (extend), with benefit chips leading on **supply security, price stability and reliability**; sustainability appears as a supporting benefit, never the headline.
- All figures are the ones you gave (2 sites, 30,000 MT, GFSI). The impact section's `*`-marked lines (CO₂ etc.) are illustrative — replace with verified numbers before publishing.
