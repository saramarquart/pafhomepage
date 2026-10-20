// With the real Measurement ID in consent-config.js (no test override): the test domain never contacts Google.
const { test, expect } = require("@playwright/test");
const { setup, base } = require("../helpers");

test("real ID · test domain: ACCEPT still sends nothing to Google", async ({ context, page }) => {
  const net = await setup(context, {});
  await page.goto(base(false) + "/index.html");
  expect(await page.evaluate(() => window.PAF_CONSENT_CONFIG.measurementId)).toMatch(/^G-/);
  await page.locator(".pc-banner [data-pc=accept]").click();
  await page.goto(base(false) + "/press.html");
  await page.waitForLoadState("networkidle");
  expect(net.google()).toEqual([]);
  expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
});
