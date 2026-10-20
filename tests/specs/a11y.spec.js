// Accessibility of banner and dialog (test 12 of the brief): keyboard-only flow + axe-core.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { setup, base, consentCookie } = require("../helpers");

test("12a · keyboard only: reach the banner, open settings, ESC returns focus, save a choice", async ({ context, page }) => {
  await setup(context, {});
  await page.goto(base(false) + "/index.html");
  // the banner comes first in the page order
  await page.keyboard.press("Tab");
  await expect(page.locator(".pc-banner a")).toBeFocused();   // privacy policy link in the text
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-pc=accept]")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-pc=decline]")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-pc=settings]")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".pc-dialog")).toBeVisible();
  await expect(page.locator(".pc-dialog .pc-close")).toBeFocused();   // focus moved into the dialog
  await page.keyboard.press("Escape");
  await expect(page.locator(".pc-dialog")).toBeHidden();
  await expect(page.locator("[data-pc=settings]")).toBeFocused();     // and back to the trigger
  // toggle analytics with the keyboard and save
  await page.keyboard.press("Enter");
  await page.locator("#pc-analytics").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#pc-analytics")).toBeChecked();
  await page.getByRole("button", { name: "Save settings" }).focus();
  await page.keyboard.press("Enter");
  expect((await consentCookie(context)).a).toBe(true);
});

test("12b · axe-core: no violations in banner and dialog (desktop and 200% zoom / mobile width)", async ({ context, page }) => {
  await setup(context, {});
  for (const width of [1280, 640]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(base(false) + "/index.html");
    const banner = await new AxeBuilder({ page }).include(".pc-banner").analyze();
    expect(banner.violations, JSON.stringify(banner.violations, null, 1)).toEqual([]);
    await page.locator("[data-pc=settings]").click();
    const dialog = await new AxeBuilder({ page }).include(".pc-dialog").analyze();
    expect(dialog.violations, JSON.stringify(dialog.violations, null, 1)).toEqual([]);
    // everything inside the dialog stays reachable on a narrow screen
    const save = page.getByRole("button", { name: "Save settings" });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
  }
});

test("12c · small and short screens: all three banner buttons are fully on screen", async ({ context, page }) => {
  await setup(context, {});
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [720, 450]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base(false) + "/index.html");
    for (const b of ["accept", "decline", "settings"]) {
      await expect(page.locator(`[data-pc=${b}]`), `${b} at ${width}x${height}`).toBeInViewport({ ratio: 1 });
    }
    const share = await page.evaluate(() => document.querySelector(".pc-banner-inner").getBoundingClientRect().height / innerHeight);
    expect(share, `banner height share at ${width}x${height}`).toBeLessThan(0.66);
  }
});

test("12d · dialog: page styles don't leak in (subpage) and the page behind doesn't scroll", async ({ context, page }) => {
  await setup(context, {});
  await page.goto(base(false) + "/press.html");
  await page.locator("[data-pc=settings]").click();
  const pad = await page.$$eval(".pc-dialog .pc-cat", (s) => s.map((x) => getComputedStyle(x).paddingBottom));
  expect(pad).toEqual(["0px", "0px"]);
  const overflowY = () => page.evaluate(() => getComputedStyle(document.documentElement).overflowY);
  const before = await page.evaluate(() => document.documentElement.classList.contains("pc-dialog-open"));
  expect(before).toBe(true);
  expect(await overflowY()).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect.poll(overflowY).not.toBe("hidden");
});

test("12e · after a choice in the banner, keyboard focus lands on the page heading (not lost)", async ({ context, page }) => {
  await setup(context, {});
  await page.goto(base(false) + "/index.html");
  await page.locator("[data-pc=decline]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1").first()).toBeFocused();
});
