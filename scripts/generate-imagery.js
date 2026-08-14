#!/usr/bin/env node
/* ============================================================================
 * generate-imagery.js — drive Google's Gemini image models to produce the
 * site's imagery, on-brand, into assets/img/.
 *
 * SETUP (one time): Node 18+ (built-in fetch). Key from Google AI Studio:
 *   https://aistudio.google.com/apikey   (billing must be enabled)
 *
 * RUN:
 *   export GEMINI_API_KEY="your_key"
 *   cd ~/planet-a-homepage
 *   node scripts/generate-imagery.js            # every slot
 *   node scripts/generate-imagery.js hero cocoa # only these
 *
 * OPTIONS (env):
 *   GEMINI_API_KEY      required
 *   GEMINI_IMAGE_MODEL  default "gemini-2.5-flash-image"
 *                       (try "gemini-3-pro-image" for higher quality)
 * ============================================================================ */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const IMG_DIR = path.join(__dirname, "..", "assets", "img");
const BACKUP_DIR = path.join(IMG_DIR, "_backup");

/* Shared art direction so every image feels like one set: bright, clean, white,
   natural, olive-green world, calm & premium — Givaudan, not stock-y. */
const STYLE =
  "A real, candid editorial photograph shot on 35mm film — imperfect and honest, because " +
  "nothing in reality is perfect. Natural asymmetry and slightly off-centre or awkward framing, " +
  "some soft or missed focus and a touch of motion blur, real uneven available light with genuine " +
  "hard shadows and a few blown-out highlights, everyday worn surfaces, real crumbs, smudges, " +
  "fingerprints, dust, small blemishes and clutter — the character of an actual photo, not a set. " +
  "Visible film grain, muted natural colours, warm neutral and olive-green palette. NOT a glossy " +
  "studio hero shot, NOT symmetrical, NOT perfectly styled, NOT CGI, NOT HDR, NOT retouched, NOT " +
  "plastic. No text, no logos, no watermarks.";

const SLOTS = {
  "land-hands": { file: "land-hands.jpg", aspect: "16:9",
    prompt: "A close documentary photo of a farmer's weathered hands holding TWO large, heavy ripe cacao pods on a cacao farm. The pods are BIG (bigger than the hands), long and oval with deep vertical ridges and furrows; the skin is thick, matte and bumpy — mottled and uneven in blotchy patches of green, yellow, orange, rust-red and brown, covered in natural spots, freckles, warts, scars, blemishes and weathering, absolutely NOT smooth, NOT uniform in colour, NOT glossy, NOT plastic. Real leaves, dappled natural light, dirt under the fingernails, honest and imperfect." },
  "land-harvest": { file: "land-harvest.jpg", aspect: "16:9",
    prompt: "Human hands harvesting coffee cherries from a lush green branch in soft morning light, close and warm, no face in focus, bright and calm, shallow depth of field, premium editorial." },
  "land-culture": { file: "land-culture.jpg", aspect: "16:9",
    prompt: "Two hands gently breaking a piece of chocolate over a bright warm-white surface, soft daylight, intimate and human, generous space, premium and calm." },
  "cb-palette": { file: "cb-palette.jpg", aspect: "16:9",
    prompt: "Four neat mounds of cocoa-style powder in a row on a bright white surface, a palette of shades from warm reddish cocoa brown to deeper brown to dark brown to near-black, soft daylight, premium, generous negative space." },
  "cb-cookies": { file: "cb-cookies.jpg", aspect: "4:3",
    prompt: "Dark near-black round sandwich cookies with a white cream filling, stacked on a bright white surface, soft daylight, appetising and premium." },
  "cb-drink": { file: "cb-drink.jpg", aspect: "4:3",
    prompt: "A tall glass of chocolate milk drink with a straw on a bright white surface, soft daylight, fresh and premium." },
  "cb-cake": { file: "cb-cake.jpg", aspect: "4:3",
    prompt: "A slice of rich dark chocolate cake on a white plate on a bright neutral surface, soft daylight, appetising." },
  "cb-icecream": { file: "cb-icecream.jpg", aspect: "4:3",
    prompt: "Two scoops of chocolate ice cream in a bright ceramic bowl on a white surface, soft daylight, premium." },
  "cb-syrup": { file: "cb-syrup.jpg", aspect: "4:3",
    prompt: "Glossy dark chocolate syrup drizzling from a spoon onto a bright white surface, soft daylight, appetising." },
  "sol-sweet-goods": { file: "sol-sweet-goods.jpg", aspect: "16:9",
    prompt: "An elegant flat lay of chocolate tablets, pralines and moulded bars on a bright white marble surface, soft daylight, premium and appetising, generous negative space." },
  "sol-snacks-bakery": { file: "sol-snacks-bakery.jpg", aspect: "16:9",
    prompt: "Artisan biscuits, cookies and wafers with chocolate chips and coatings on a bright white linen surface, soft daylight." },
  "sol-confectionery": { file: "sol-confectionery.jpg", aspect: "16:9",
    prompt: "A refined arrangement of confectionery bars, filled bites and pralines on a bright neutral surface, premium studio daylight." },
  "sol-beverages": { file: "sol-beverages.jpg", aspect: "16:9",
    prompt: "A cup of coffee and a glass of iced coffee on a bright white surface, soft daylight, calm and premium, generous space." },
  "sol-spreads": { file: "sol-spreads.jpg", aspect: "16:9",
    prompt: "An open jar of smooth hazelnut-chocolate spread with a swirl on a knife, bright neutral surface, soft daylight, appetising." },
  "sol-codev": { file: "sol-codev.jpg", aspect: "16:9",
    prompt: "A bright, clean, minimal food innovation lab bench with softly out-of-focus glassware and a few ingredients, calm and premium, daylight." },
  hero: {
    file: "hero.jpg", aspect: "16:9",
    prompt:
      "Chocolate pieces, pale cocoa-butter chunks and a little cocoa powder on a " +
      "bright white stone surface in soft daylight, with clear empty space for text.",
  },
  cocoa: {
    file: "cocoa.jpg", aspect: "16:9",
    prompt:
      "Fresh cocoa pods and cocoa beans with green leaves on a light neutral " +
      "surface, bright natural daylight, calm and serene.",
  },
  // ---- nature (bright, cinematic landscapes for full-bleed backgrounds) ----
  caldera: {
    file: "caldera.jpg", aspect: "16:9",
    prompt: "A Santorini-like volcanic caldera at blue hour — calm dark sea far below, sweeping " +
      "cliffs, a deep blue twilight sky with soft clouds and a faint glow on the horizon, a few " +
      "distant warm lights. Serene, dramatic, cinematic, moody and premium.",
  },
  "nature-hero": {
    file: "nature-hero.jpg", aspect: "16:9",
    prompt: "Aerial view over a lush green rainforest canopy with soft morning mist and " +
      "gentle sunlight, vast and serene, bright cinematic landscape.",
  },
  lake: {
    file: "lake.jpg", aspect: "16:9",
    prompt: "A calm mountain lake at dawn with still mirror-like water and soft green hills, " +
      "bright, peaceful, cinematic wide landscape.",
  },
  forest: {
    file: "forest.jpg", aspect: "16:9",
    prompt: "Soft sunlight streaming through a bright green forest canopy, fresh and serene, " +
      "cinematic.",
  },
  "cocoa-farm": {
    file: "cocoa-farm.jpg", aspect: "16:9",
    prompt: "Cocoa pods growing on a tree in a bright green plantation in soft daylight, " +
      "lush and healthy, cinematic.",
  },
  sustainability: {
    file: "sustainability.jpg", aspect: "16:9",
    prompt: "Hands gently holding dark fertile soil with a small green seedling, bright " +
      "daylight, hopeful and calm.",
  },
  // ---- science / scale / people ----
  science: {
    file: "science.jpg", aspect: "16:9",
    prompt: "A bright, clean, minimal modern food-science laboratory in daylight, glassware " +
      "softly out of focus, calm and premium.",
  },
  scale: {
    file: "scale.jpg", aspect: "16:9",
    prompt: "Interior of a bright, clean, modern food production facility, stainless steel, " +
      "minimal and airy, daylight.",
  },
  codev: {
    file: "codev.jpg", aspect: "16:9",
    prompt: "Two food scientists in white coats collaborating warmly in a bright modern lab, " +
      "seen from behind or out of focus, no faces in focus, natural daylight.",
  },
  // ---- product shots (bright, premium, for portfolio cards) ----
  "prod-choviva": { file: "prod-choviva.jpg", aspect: "4:3",
    prompt: "A broken bar and pieces of glossy rich chocolate on a bright white surface, premium, appetising." },
  "prod-butter": { file: "prod-butter.jpg", aspect: "4:3",
    prompt: "A block and chunks of pale ivory cocoa butter on a bright white surface, soft daylight." },
  "prod-cocoa": { file: "prod-cocoa.jpg", aspect: "4:3",
    prompt: "A neat mound of fine brown cocoa powder with a scoop on a bright white surface." },
  "prod-compound": { file: "prod-compound.jpg", aspect: "4:3",
    prompt: "Glossy melted chocolate being poured over a molded chocolate piece, bright white studio." },
  "prod-hazelnut": { file: "prod-hazelnut.jpg", aspect: "4:3",
    prompt: "A jar of smooth hazelnut-chocolate spread with whole hazelnuts beside it, bright neutral." },
  "prod-vanilla": { file: "prod-vanilla.jpg", aspect: "4:3",
    prompt: "Vanilla pods and a soft swirl of pale vanilla cream on a bright white surface." },
  "prod-coffee": { file: "prod-coffee.jpg", aspect: "4:3",
    prompt: "A cup of coffee with delicate crema on a bright neutral surface, calm and premium." },
  "prod-coffeeb": { file: "prod-coffeeb.jpg", aspect: "4:3",
    prompt: "Roasted coffee beans and a little ground coffee on a bright white surface." },
  // ---- applications ----
  "app-bakery": {
    file: "app-bakery.jpg", aspect: "4:3",
    prompt: "Artisan bakery goods with chocolate on a bright white linen surface, daylight.",
  },
  "app-snacks": {
    file: "app-snacks.jpg", aspect: "4:3",
    prompt: "Elegant coated and filled confectionery snacks on a bright neutral surface.",
  },
  "app-sweets": {
    file: "app-sweets.jpg", aspect: "4:3",
    prompt: "Plant-based chocolate pralines and sweets, bright airy neutral styling.",
  },
};

async function generate(key, slot) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const mkBody = (withAspect) => ({
    contents: [{ parts: [{ text: `${slot.prompt} ${STYLE}` }] }],
    generationConfig: Object.assign(
      { responseModalities: ["IMAGE"] },
      withAspect ? { imageConfig: { aspectRatio: slot.aspect } } : {}
    ),
  });

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const withAspect of [true, false]) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mkBody(withAspect)),
        });
        if (!res.ok) {
          const txt = await res.text();
          // aspect-ratio field not supported on this model → retry without it
          if (withAspect && /imageConfig|aspectRatio|Unknown name|INVALID_ARGUMENT/i.test(txt)) {
            lastErr = new Error(`HTTP ${res.status}`); continue;
          }
          throw new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
        }
        const json = await res.json();
        const parts = (json.candidates && json.candidates[0] &&
          json.candidates[0].content && json.candidates[0].content.parts) || [];
        const img = parts.find((p) => (p.inlineData && p.inlineData.data) || (p.inline_data && p.inline_data.data));
        const b64 = img && ((img.inlineData && img.inlineData.data) || (img.inline_data && img.inline_data.data));
        if (!b64) throw new Error("No image in response: " + JSON.stringify(json).slice(0, 250));
        return Buffer.from(b64, "base64");
      } catch (e) { lastErr = e; }
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  throw lastErr;
}

async function main() {
  if (!API_KEY) { console.error("✗ export GEMINI_API_KEY=\"...\" first"); process.exit(1); }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const pick = process.argv.slice(2);
  const names = pick.length ? pick : Object.keys(SLOTS);
  console.log(`Model: ${MODEL}\nGenerating ${names.length} image(s) into assets/img/\n`);

  for (const name of names) {
    const slot = SLOTS[name];
    if (!slot) { console.warn(`? unknown slot "${name}" — skipping`); continue; }
    const dest = path.join(IMG_DIR, slot.file);
    process.stdout.write(`• ${name} (${slot.aspect}) → ${slot.file} … `);
    try {
      const bytes = await generate(API_KEY, slot);
      if (fs.existsSync(dest)) fs.copyFileSync(dest, path.join(BACKUP_DIR, slot.file));
      fs.writeFileSync(dest, bytes);
      console.log(`ok (${Math.round(bytes.length / 1024)} KB)`);
    } catch (e) {
      console.log("FAILED"); console.error(`    ${e.message}\n`);
    }
  }
  console.log(`\nDone. Originals backed up in assets/img/_backup/. Refresh the site.`);
}

main();
