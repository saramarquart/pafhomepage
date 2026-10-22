// Homepage "Why now?": the Volatility card shows the static cocoa price chart.
const { test, expect } = require("@playwright/test");
const { setup, base } = require("../helpers");

test("Volatility tab shows the cocoa chart with its title and the callout", async ({ context, page }) => {
  await setup(context, {});
  await page.goto(base(false) + "/index.html");
  await page.locator('.driver[data-key="volatility"]').click();
  const card = page.locator('.why-shot[data-for="volatility"]');
  await expect(card).toHaveClass(/\bon\b/);
  await expect(card.locator('svg[role="img"] title')).toHaveText(/Cocoa price, USD per tonne/);
  await expect(card.locator(".wc-line")).toHaveAttribute("d", /^M0 [\d.]+C/);
  await expect(card.locator(".why-fact span")).toHaveText(/The next shock is a question of when, not if/);
  // switching back hides it again
  await page.locator('.driver[data-key="climate"]').click();
  await expect(card).not.toHaveClass(/\bon\b/);
});

test("Why now tabs: each tab shows its own card and copy", async ({ context, page }) => {
  await setup(context, {});
  await page.goto(base(false) + "/index.html");
  const facts = { climate: /\$123 billion/, volatility: /question of when, not if/, regulation: /cocoa and coffee placed on the EU market/ };
  for (const key of ["volatility", "regulation", "climate"]) {
    await page.locator(`.driver[data-key="${key}"]`).click();
    await expect(page.locator(`.driver[data-key="${key}"]`)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".why-shot.on")).toHaveCount(1);
    await expect(page.locator(".why-shot.on .why-fact span")).toHaveText(facts[key]);
  }
});
