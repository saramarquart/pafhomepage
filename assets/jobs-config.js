/*
 * Where careers.html gets its open positions from — the one switch for the Personio → paf_sonio move.
 *
 *   source: "personio"   (default) the hand-written cards below link to planetafoods.jobs.personio.de,
 *                        exactly as before. Nothing is fetched.
 *   source: "paf_sonio"  the cards are replaced by the published jobs from paf_sonio's public feed
 *                        (feedUrl), each linking to its paf_sonio job page with ?source=website so the
 *                        application shows "Company website" as its source. Every remaining Personio
 *                        link (e.g. "See all vacancies") points to paf_sonio's careers page instead.
 *
 * This site has no build step, so the switch is this file (the equivalent of an env variable):
 * change `source`, commit, and the next GitHub Pages deploy of main serves it.
 */
window.PAF_JOBS = {
  source: "personio",
  feedUrl: "https://sonio.planet-a-foods.com/api/public/jobs",
  careersUrl: "https://sonio.planet-a-foods.com/careers",
};
