#!/usr/bin/env node
/* ============================================================================
 * cocoa-chart.js — prints the SVG paths and marker positions for the static
 * cocoa price chart in the "Why now? · Volatility" card (index.html).
 *
 * The chart is hand-written inline SVG; this only does the arithmetic.
 * Edit PRICES, run it, paste the output into index.html.
 *
 * RUN:  node scripts/cocoa-chart.js
 * ============================================================================ */

// USD per tonne, monthly average, Aug 2022 – Sep 2026 (World Bank Commodity Price Data, Pink Sheet)
const START = { year: 2022, month: 8 };
const PRICES = [
  2323, 2298, 2309, 2412, 2512,                                              // Aug–Dec 2022
  2625, 2653, 2748, 2883, 2965, 3173, 3388, 3460, 3608, 3630, 4028, 4209,    // 2023
  4398, 5556, 7089, 9740, 7540, 8270, 7090, 6880, 6520, 6660, 7890, 10320,   // 2024
  10750, 9860, 8080, 8150, 8990, 8400, 7370, 7600, 7030, 5950, 5610, 5780,   // 2025
  4970, 3590, 3240, 3400, 4160, 4400, 5610, 5950, 5920,                      // Jan–Sep 2026
];
const Y_MAX = 12000;            // y range is fixed 0 – 12,000
const W = 1000, H = 400;        // viewBox; the SVG stretches to the plot box (preserveAspectRatio="none")

const n = PRICES.length;
const pts = PRICES.map((v, i) => [i * W / (n - 1), H * (1 - v / Y_MAX)]);
const r = (x) => Math.round(x * 10) / 10;

// monotone cubic (Fritsch–Carlson): smooth, never overshoots the data
const d = [], m = [];
for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
m[0] = d[0]; m[n - 1] = d[n - 2];
for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
for (let i = 0; i < n - 1; i++) {
  if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
  const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
  if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
}
let line = `M${r(pts[0][0])} ${r(pts[0][1])}`;
for (let i = 0; i < n - 1; i++) {
  const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = (x1 - x0) / 3;
  line += `C${r(x0 + h)} ${r(y0 + m[i] * h)} ${r(x1 - h)} ${r(y1 - m[i + 1] * h)} ${r(x1)} ${r(y1)}`;
}
const area = `${line}L${W} ${H}L0 ${H}Z`;

// positions as percentages of the plot box, for the HTML dots, labels and year ticks
const idx = (year, month) => (year - START.year) * 12 + (month - START.month);
const pos = (i) => ({ left: r(i * 100 / (n - 1)) + "%", top: r((1 - PRICES[i] / Y_MAX) * 100) + "%", price: PRICES[i] });

console.log("line:", line, "\n");
console.log("area:", area, "\n");
console.log("years:", [2023, 2024, 2025, 2026].map((y) => `${y} @ ${r(idx(y, 1) * 100 / (n - 1))}%`).join(" · "));
console.log("Jan 2025:", pos(idx(2025, 1)));
console.log("Mar 2026:", pos(idx(2026, 3)));
console.log("Sep 2026:", pos(idx(2026, 9)));
