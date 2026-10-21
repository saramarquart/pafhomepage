// Playwright setup. The site is served from the repo root with Python's built-in static server
// (no extra dependency). Run locally with:  cd tests && npm install && npx playwright test
// Set PW_CHANNEL=chrome to use an installed Google Chrome instead of downloading Playwright's browser.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: process.env.PW_CHANNEL || undefined,
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory ..",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "ignore",
  },
});
