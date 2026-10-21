# THE PROJECT
- This repo (pafhomepage) is a static website: plain HTML, CSS, and JavaScript — no
  build step, no framework. Edit files, refresh the browser.
- Pages are the *.html files at the repo root. index, careers and mission use
  assets/home.css (+ careers.css / mission.css); every other page uses assets/styles.css
  with assets/site-nav.css for the nav. Shared interactions: assets/main.js (all pages),
  home.js (homepage nav), site-nav.js (sub-page nav). Fonts: assets/fonts.css (self-hosted).
  Images/video live in assets/img/.

# DESIGN LANGUAGE — Relaunch 2026 CI (match it closely, on every page)
- Colours: brand purple #320F99 (primary), Ronchi gold #EEB650 (warm contrast, the
  accent over dark/purple), light green #82C7AE, light grey #F7F7F9, white; text
  #0E0B1A; light purple tints #EFECF9 / #DCD6F3. Use the CSS tokens (var(--purple),
  var(--gold), var(--lilac) ...), never raw hex.
  Olive, espresso/brown and baby blue (sky, #E2F2F3, #B0DCE0) are retired.
- Font: Rethink Sans only (400–700), headings at weight 500.
- Shapes: 6px buttons, 8px cards and images, pill tags.
- Nav and footer look the same on every page; the sub-page footer is copied from
  index.html and its CSS in styles.css mirrors home.css, so change both together.
- Reuse the existing components and class names — find a similar existing section and
  follow how it's built rather than inventing new patterns.

# PREVIEW LOCALLY
- Run python3 -m http.server 8848 in the repo, open http://localhost:8848, edit,
  save, refresh.

# HOW WE SHIP — IMPORTANT
- The main branch is protected and auto-deploys to the live site.
  NEVER commit or push to main.
- For every task: create a branch named <author>/<short-topic>, commit there, push it,
  and open a Pull Request into main with gh pr create. Sara reviews and merges the
  ones she wants live — do not merge PRs yourself.
- Keep each PR small and focused on one change so Sara can pick and choose.