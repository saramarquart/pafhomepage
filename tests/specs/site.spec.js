// Site-wide checks (tests 9–11 of the brief).
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { test, expect } = require("@playwright/test");
const { ROOT, sitePages, setup, base } = require("../helpers");

const pages = sitePages();

test("9 · every page has Cookie Settings, Privacy Policy and Imprint in the footer", async ({ context, page }) => {
  await setup(context, {});
  for (const p of pages) {
    await page.goto(base(false) + "/" + p);
    const footer = page.locator("footer").last();
    await expect(footer.locator("a[data-cookie-settings]"), p).toHaveCount(1);
    await expect(footer.locator('a[href="privacy-policy.html"]', { hasText: "Privacy Policy" }), p).toHaveCount(1);
    await expect(footer.locator('a[href="imprint.html"]', { hasText: "Imprint" }), p).toHaveCount(1);
  }
});

test("10 · cookie tables on the privacy policy equal the cookie list in consent-config.js", async ({ context, page }) => {
  // the config, read straight from the file
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/consent-config.js"), "utf8"), sandbox);
  const cfg = sandbox.window.PAF_CONSENT_CONFIG;
  await setup(context, {});
  await page.goto(base(false) + "/privacy-policy.html");
  const tables = await page.$$eval("table.cookie-table", (ts) => ts.map((t) => ({
    category: t.dataset.category,
    head: [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim()),
    rows: [...t.querySelectorAll("tbody tr")].map((tr) => [...tr.cells].map((td) => td.textContent.trim().replace(/\s+/g, " "))),
  })));
  expect(tables.map((t) => t.category)).toEqual(cfg.categories.map((c) => c.id));
  for (const cat of cfg.categories) {
    const t = tables.find((x) => x.category === cat.id);
    expect(t.head).toEqual([cfg.text.colCookie, cfg.text.colService, cfg.text.colDuration, cfg.text.colDescription]);
    expect(t.rows).toEqual(cat.cookies.map((c) => [c.name, c.service, c.duration, c.description]));
  }
  // and the dialog renders exactly the same rows
  await page.locator(".pc-banner [data-pc=settings]").click();
  const dialogRows = await page.$$eval(".pc-dialog table tbody tr", (trs) => trs.map((tr) => [...tr.cells].map((td) => td.textContent.trim())));
  expect(dialogRows).toEqual(cfg.categories.flatMap((c) => c.cookies.map((k) => [k.name, k.service, k.duration, k.description])));
});

test("11 · no page uses localStorage/sessionStorage or loads anything from another domain", async ({ context, page }) => {
  await context.addInitScript(() => {
    window.__storage = [];
    for (const n of ["localStorage", "sessionStorage"]) {
      const d = Object.getOwnPropertyDescriptor(window, n);
      Object.defineProperty(window, n, { configurable: true, get() { window.__storage.push(n); return d.get.call(window); } });
    }
  });
  const net = await setup(context, {});
  for (const p of pages) {
    await context.clearCookies();
    await page.goto(base(false) + "/" + p);
    await page.waitForLoadState("networkidle");
    await page.mouse.wheel(0, 20000);   // also lets lazy images and videos start loading
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__storage), p).toEqual([]);
  }
  expect(net.external).toEqual([]);
});
