# THE PROJECT
- This repo (pafhomepage) is a static website: plain HTML, CSS, and JavaScript — no
  build step, no framework. Edit files, refresh the browser.
- Pages are the *.html files at the repo root (index, portfolio, technology,
  capabilities, contact, press, careers, imprint, privacy-policy).
- Shared design system is assets/styles.css; shared interactions are assets/main.js —
  changing those affects every page. Images/video live in assets/img/.

# DESIGN LANGUAGE (match it closely)
- Premium and restrained, "Givaudan-style": lots of clean white, near-black text,
  and a single olive-green accent (#5E7038).
- Fonts: Archivo for headings/display, Inter for body (already loaded).
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