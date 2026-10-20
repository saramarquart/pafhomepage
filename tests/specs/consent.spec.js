// Consent banner + Google Analytics behaviour (tests 1–8 of the brief).
const { test, expect } = require("@playwright/test");
const { DUMMY_ID, setup, base, consentCookie } = require("../helpers");

const accept = (page) => page.locator(".pc-banner [data-pc=accept]").click();
const decline = (page) => page.locator(".pc-banner [data-pc=decline]").click();

test("1 · test domain: no Google request, whatever the choice (even with a Measurement ID)", async ({ context, page }) => {
  const net = await setup(context, { id: DUMMY_ID });
  await page.goto(base(false) + "/index.html");
  await accept(page);
  await page.goto(base(false) + "/contact.html");
  await page.waitForLoadState("networkidle");
  expect(net.google()).toEqual([]);
  expect((await consentCookie(context)).a).toBe(true);
});

test("2 · production host, empty Measurement ID, ACCEPT: no Google request", async ({ context, page }) => {
  const net = await setup(context, { prod: true, id: "" });
  await page.goto(base(true) + "/index.html");
  await accept(page);
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(net.google()).toEqual([]);
});

test("3 · production host, Measurement ID, no interaction: no Google request, no cookies", async ({ context, page }) => {
  const net = await setup(context, { prod: true, id: DUMMY_ID });
  await page.goto(base(true) + "/index.html");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".pc-banner")).toBeVisible();
  expect(net.google()).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test("4 · DECLINE: no Google request; paf_consent stores analytics false", async ({ context, page }) => {
  const net = await setup(context, { prod: true, id: DUMMY_ID });
  await page.goto(base(true) + "/index.html");
  await decline(page);
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(net.google()).toEqual([]);
  const c = await consentCookie(context);
  expect(c).toMatchObject({ v: "2026-10", a: false });
  expect((await context.cookies()).map((x) => x.name)).toEqual(["paf_consent"]);
  await expect(page.locator(".pc-banner")).toHaveCount(0);
});

test("5 · ACCEPT: gtag.js only after the click, signals and ad parameters off", async ({ context, page }) => {
  const net = await setup(context, { prod: true, id: DUMMY_ID });
  await page.goto(base(true) + "/index.html");
  await page.waitForLoadState("networkidle");
  expect(net.google()).toEqual([]);
  await accept(page);
  await expect.poll(() => net.google().length).toBeGreaterThan(0);
  expect(net.google()[0]).toBe("https://www.googletagmanager.com/gtag/js?id=" + DUMMY_ID);
  const layer = await page.evaluate(() => window.dataLayer.map((a) => JSON.parse(JSON.stringify(Array.from(a)))));
  const consent = layer.filter((e) => e[0] === "consent");
  expect(consent[0]).toEqual(["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  expect(consent[1]).toEqual(["consent", "update", { analytics_storage: "granted" }]);
  expect(consent.length).toBe(2);   // ad parameters are never granted
  const config = layer.find((e) => e[0] === "config");
  expect(config[1]).toBe(DUMMY_ID);
  expect(config[2]).toMatchObject({ allow_google_signals: false, allow_ad_personalization_signals: false, cookie_flags: "SameSite=Lax;Secure", cookie_expires: 34214400 });
  expect(config[2].page_location).toBe("https://planet-a-foods.com/index.html");
  expect((await consentCookie(context)).a).toBe(true);
});

test("6 · withdraw via footer 'Cookie Settings': _ga/_ga_* deleted, no Google request after reload", async ({ context, page }) => {
  const net = await setup(context, { prod: true, id: DUMMY_ID });
  await page.goto(base(true) + "/index.html");
  await accept(page);
  // what GA would have set (our stub sets nothing)
  await context.addCookies([
    { name: "_ga", value: "GA1.1.123.456", domain: ".planet-a-foods.com", path: "/", secure: true, sameSite: "Lax" },
    { name: "_ga_TEST000000", value: "GS1.1.1", domain: ".planet-a-foods.com", path: "/", secure: true, sameSite: "Lax" },
    { name: "_ga", value: "GA1.1.789", domain: "planet-a-foods.com", path: "/", secure: true, sameSite: "Lax" },
  ]);
  await page.locator("footer [data-cookie-settings]").click();
  const dialog = page.locator(".pc-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#pc-analytics")).toBeChecked();   // shows the earlier choice
  await Promise.all([page.waitForEvent("load"), dialog.getByRole("button", { name: "Decline all" }).click()]);
  const before = net.google().length;
  await page.waitForLoadState("networkidle");
  const names = (await context.cookies()).map((x) => x.name);
  expect(names.filter((n) => n === "_ga" || n.startsWith("_ga_"))).toEqual([]);
  expect((await consentCookie(context)).a).toBe(false);
  await page.goto(base(true) + "/press.html");
  await page.waitForLoadState("networkidle");
  expect(net.google().length).toBe(before);
});

test("7 · a new consentVersion shows the banner again", async ({ context, page }) => {
  await setup(context, { version: "2026-10" });
  await page.goto(base(false) + "/index.html");
  await accept(page);
  await page.reload();
  await expect(page.locator(".pc-banner")).toHaveCount(0);
  await context.unrouteAll();
  await setup(context, { version: "2099-01" });
  await page.reload();
  await expect(page.locator(".pc-banner")).toBeVisible();
});

test("8 · ESC or closing the dialog stores no decision", async ({ context, page }) => {
  await setup(context, {});
  await page.goto(base(false) + "/index.html");
  await page.locator(".pc-banner [data-pc=settings]").click();
  await expect(page.locator(".pc-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".pc-dialog")).toBeHidden();
  await page.locator(".pc-banner [data-pc=settings]").click();
  await page.locator(".pc-dialog .pc-close").click();
  await expect(page.locator(".pc-dialog")).toBeHidden();
  expect(await consentCookie(context)).toBeNull();
  await expect(page.locator(".pc-banner")).toBeVisible();
});
