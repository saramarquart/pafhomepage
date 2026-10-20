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
