// Cocoa Booster sample form: sends the answers to PAForce (sales.planet-a-foods.com) instead of
// opening the mail program; the pre-filled email is only offered when sending fails.
// The endpoint is stubbed here — nothing is sent to the real PAForce.
const { test, expect } = require("@playwright/test");
const { setup, base } = require("../helpers");

const ENDPOINT = "https://sales.planet-a-foods.com/api/public/inquiry";

async function fill(page) {
  const form = page.locator("#sampleForm");
  await form.locator("[name=name]").fill("Jana Keks");
  await form.locator("[name=email]").fill("jana@example-biscuits.com");
  await form.locator("[name=company]").fill("Example Biscuits GmbH");
  await form.locator("[name=application]").selectOption("Cookies");
  await form.locator("[name=volume]").selectOption("50–500 t");
  await form.locator("[name=privacy]").check();
  return form;
}

test("sample form: posts to PAForce and thanks the visitor", async ({ context, page }) => {
  await setup(context, {});
  let sent = null;
  await page.route(ENDPOINT, async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto(base(false) + "/product-cocoa-booster.html");
  const form = await fill(page);
  await form.locator("button[type=submit]").click();

  await expect(form.locator(".form-msg")).toContainText("Thank you");
  expect(sent).toMatchObject({
    form: "cocoa-booster-sample",
    name: "Jana Keks",
    email: "jana@example-biscuits.com",
    company: "Example Biscuits GmbH",
    application: "Cookies",
    volume: "50–500 t",
    sample: true,
    privacy: true,
    website: "",
  });
  expect(typeof sent.elapsedMs).toBe("number");
  await expect(form.locator("[name=name]")).toHaveValue(""); // reset after success
});

test("sample form: offers the pre-filled email when sending fails", async ({ context, page }) => {
  await setup(context, {});
  await page.route(ENDPOINT, (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"ok":false}' }));
  await page.goto(base(false) + "/product-cocoa-booster.html");
  const form = await fill(page);
  await form.locator("button[type=submit]").click();

  const link = form.locator(".form-msg a");
  await expect(link).toHaveText("email it to sales@forplaneta.com");
  expect(await link.getAttribute("href")).toMatch(/^mailto:sales@forplaneta\.com\?subject=Cocoa%20Booster%20sample%20request/);
  await expect(form.locator("[name=name]")).toHaveValue("Jana Keks"); // answers kept
});

test("sample form: nothing is sent without the required fields", async ({ context, page }) => {
  await setup(context, {});
  let calls = 0;
  await page.route(ENDPOINT, (route) => { calls++; return route.fulfill({ status: 200, body: '{"ok":true}' }); });
  await page.goto(base(false) + "/product-cocoa-booster.html");
  await page.locator("#sampleForm button[type=submit]").click();
  await expect(page.locator("#sampleForm .form-msg")).toContainText("required fields");
  expect(calls).toBe(0);
});
