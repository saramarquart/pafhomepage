#!/usr/bin/env node
/* ============================================================================
 * generate-video.js — drive Google Veo (Gemini API) to produce short, muted,
 * loopable nature background clips into assets/img/*.mp4.
 *
 * RUN:
 *   export GEMINI_API_KEY="your_key"
 *   node scripts/generate-video.js            # all clips
 *   node scripts/generate-video.js hero       # one clip
 *
 * OPTIONS: GEMINI_VIDEO_MODEL default "veo-3.1-fast-generate-preview"
 * ============================================================================ */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_VIDEO_MODEL || "veo-3.1-fast-generate-preview";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const IMG_DIR = path.join(__dirname, "..", "assets", "img");

const STYLE =
  " Cinematic, calm, slow and gentle camera movement, bright natural daylight, " +
  "serene and premium, no people, no text, no captions.";

const CLIPS = {
  hero: {
    file: "hero.mp4",
    prompt: "A calm, almost still wide view of a misty tropical rainforest canopy at blue hour in " +
      "soft blue-green tones. The camera is nearly static — only the soft mist drifts gently and the " +
      "light shifts subtly. No flythrough, no travelling, no fast movement; a peaceful ambient mood " +
      "that begins and ends in almost the same place so it loops seamlessly. Pure untouched jungle — " +
      "no buildings, no roads, no people, no structures. Cinematic, serene, premium, bright natural daylight.",
  },
  rainforest: {
    file: "rainforest.mp4",
    prompt: "A slow, gentle aerial drift over a vast lush green rainforest canopy with soft " +
      "morning mist rising between the trees." + STYLE,
  },
  lake: {
    file: "lake.mp4",
    prompt: "A calm mountain lake at dawn, still mirror-like water gently rippling, soft green " +
      "hills and drifting clouds reflected." + STYLE,
  },
  clouds: {
    file: "clouds.mp4",
    prompt: "Soft white clouds drifting slowly over green mountain peaks in bright daylight." + STYLE,
  },
  forest: {
    file: "forest.mp4",
    prompt: "A calm, almost still view looking up through a lush green forest canopy, soft sunlight " +
      "filtering between the leaves, only gentle subtle movement of leaves and light. Minimal camera " +
      "motion, begins and ends in nearly the same place so it loops smoothly. Serene, premium, bright " +
      "natural daylight, no people, no text.",
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function veo(key, clip) {
  // 1) kick off long-running generation
  const startRes = await fetch(`${BASE}/models/${MODEL}:predictLongRunning?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: clip.prompt }],
      parameters: { aspectRatio: "16:9", sampleCount: 1, resolution: "1080p" },
    }),
  });
  if (!startRes.ok) throw new Error(`start HTTP ${startRes.status}: ${(await startRes.text()).slice(0, 300)}`);
  const op = await startRes.json();
  if (!op.name) throw new Error("no operation name: " + JSON.stringify(op).slice(0, 200));

  // 2) poll until done (Veo takes ~40s–3min)
  let result;
  for (let i = 0; i < 45; i++) {
    await sleep(8000);
    const pr = await fetch(`${BASE}/${op.name}?key=${key}`);
    const pj = await pr.json();
    if (pj.error) throw new Error("op error: " + JSON.stringify(pj.error).slice(0, 300));
    if (pj.done) { result = pj; break; }
    process.stdout.write(".");
  }
  if (!result) throw new Error("timed out waiting for Veo");

  // 3) dig out the video URI (shape varies across versions)
  const r = result.response || {};
  const sample =
    (r.generateVideoResponse && r.generateVideoResponse.generatedSamples && r.generateVideoResponse.generatedSamples[0]) ||
    (r.generatedVideos && r.generatedVideos[0]) ||
    (r.generatedSamples && r.generatedSamples[0]);
  let uri = sample && ((sample.video && (sample.video.uri || sample.video.fileUri)) || sample.uri);
  if (!uri) throw new Error("no video uri in: " + JSON.stringify(result).slice(0, 500));

  // 4) download (append key + alt=media if it's a generativelanguage file URI)
  if (uri.includes("generativelanguage") && !uri.includes("key=")) {
    uri += (uri.includes("?") ? "&" : "?") + "key=" + key + "&alt=media";
  }
  const vres = await fetch(uri);
  if (!vres.ok) throw new Error(`download HTTP ${vres.status}: ${(await vres.text()).slice(0, 200)}`);
  return Buffer.from(await vres.arrayBuffer());
}

async function main() {
  if (!API_KEY) { console.error("✗ export GEMINI_API_KEY first"); process.exit(1); }
  const pick = process.argv.slice(2);
  const names = pick.length ? pick : Object.keys(CLIPS);
  console.log(`Model: ${MODEL}\nGenerating ${names.length} video(s) — this takes a few minutes each.\n`);
  for (const name of names) {
    const clip = CLIPS[name];
    if (!clip) { console.warn(`? unknown clip "${name}"`); continue; }
    process.stdout.write(`• ${name} → ${clip.file} `);
    try {
      const bytes = await veo(API_KEY, clip);
      fs.writeFileSync(path.join(IMG_DIR, clip.file), bytes);
      console.log(` ok (${Math.round(bytes.length / 1024)} KB)`);
    } catch (e) { console.log(" FAILED"); console.error("    " + e.message + "\n"); }
  }
  console.log("\nDone.");
}
main();
