// Mission page checks: anchors, dropdown, year cards, keyboard, reduced motion, accessibility.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { setup, base } = require("../helpers");

async function decided(context) {
  await context.addCookies([{ name: "paf_consent", value: encodeURIComponent(JSON.stringify({ v: "2026-10", a: false, t: Date.now() })), url: base(false) }]);
}

test("anchors: hero Learn more and the dropdown targets exist, sections are not hidden under the nav", async ({ context, page }) => {
  await setup(context, {}); await decided(context);
  await page.goto(base(false) + "/mission.html");
  await page.getByRole("link", { name: "Learn more" }).click();
  await expect(page).toHaveURL(/#our-mission$/);
  for (const id of ["our-mission", "journey", "story"]) {
    // arrive fresh, as from the dropdown on another page (a second jump started mid smooth-scroll can stop short — browser behaviour)
    await page.goto(base(false) + "/index.html");
    await page.goto(base(false) + "/mission.html#" + id);
    // the page scrolls smoothly to the section; wait until it has arrived
    await expect.poll(() => page.evaluate((i) => Math.abs(document.getElementById(i).getBoundingClientRect().top), id), { message: id, timeout: 4000 }).toBeLessThan(4);
  }
});

test("dropdown: hovering Mission shows Mission / Journey / Story and they lead to the sections", async ({ context, page }) => {
  await setup(context, {}); await decided(context);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base(false) + "/index.html");
  const item = page.locator(".nav-item", { has: page.locator('> a[href="mission.html"]') });
  await item.hover();
  const links = item.locator(".nav-sub a");
  await expect(links).toHaveText(["Mission", "Journey", "Story"]);
  await expect(links.first()).toBeVisible();
  await links.nth(2).click();
  await expect(page).toHaveURL(/mission\.html#story$/);
});

test("year cards: reveal on scroll, open/close with mouse and keyboard, aria-expanded follows", async ({ context, page }) => {
  await setup(context, {}); await decided(context);
  await page.goto(base(false) + "/mission.html#story");
  const card = page.locator(".ms-ch").first();
  await expect(card).toHaveClass(/is-in/);
  const btn = card.locator(".ms-reveal");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(card.locator(".ms-ev").first()).toBeVisible();
  await btn.focus(); await page.keyboard.press("Enter");
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  // a card further down is revealed as soon as it scrolls in
  const last = page.locator(".ms-ch").last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/is-in/);
  await expect(last.locator('a[href="product-cocoa-booster.html"]').first()).toBeVisible();
});

test("reduced motion: every card is fully visible without scrolling animations", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await setup(context, {}); await decided(context);
  const page = await context.newPage();
  await page.goto(base(false) + "/mission.html");
  const ops = await page.$$eval(".ms-ch", (cs) => cs.map((c) => getComputedStyle(c).opacity));
  expect(ops.every((o) => o === "1")).toBe(true);
  await context.close();
});

test("axe: no accessibility violations on the Mission page (desktop and phone)", async ({ context, page }) => {
  await setup(context, {}); await decided(context);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base(false) + "/mission.html");
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    await page.waitForTimeout(1500);
    await page.locator(".ms-reveal").first().click();
    // the big outlined years are decorative (aria-hidden; the year is also in each card's button label)
    const r = await new AxeBuilder({ page }).exclude(".pc-banner").exclude(".ms-ch-year").analyze();
    expect(r.violations.map((v) => v.id + ": " + v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")), `width ${width}`).toEqual([]);
  }
});
