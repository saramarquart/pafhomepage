// Contact page form: sends the message to PAForce (sales.planet-a-foods.com) instead of opening the
// mail program; the pre-filled email is only offered when sending fails.
// The endpoint is stubbed here — nothing is sent to the real PAForce.
const { test, expect } = require("@playwright/test");
const { setup, base } = require("../helpers");

const ENDPOINT = "https://sales.planet-a-foods.com/api/public/inquiry";

async function fill(page) {
  const f = page.locator("#contactForm");
  await f.locator("#name").fill("Jana Keks");
  await f.locator("#company").fill("Example Biscuits GmbH");
  await f.locator("#email").fill("jana@example-biscuits.com");
  await f.locator("#interest").selectOption("codev");
  await f.locator("#message").fill("We'd like to develop a filling together.");
  await f.locator("#privacy").check();
  return f;
}

test("contact form: posts to PAForce and thanks the visitor", async ({ context, page }) => {
  await setup(context, {});
  let sent = null;
  await page.route(ENDPOINT, async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto(base(false) + "/contact.html?interest=booster");
  await expect(page.locator("#interest")).toHaveValue("booster"); // ?interest= still preselects
  const f = await fill(page);
  await f.locator("button[type=submit]").click();

  await expect(page.locator("#formMsg")).toContainText("Thank you");
  expect(sent).toMatchObject({
    form: "contact",
    name: "Jana Keks",
    company: "Example Biscuits GmbH",
    email: "jana@example-biscuits.com",
    interest: "codev",
    message: "We'd like to develop a filling together.",
    privacy: true,
    website: "",
  });
  expect(typeof sent.elapsedMs).toBe("number");
});

test("contact form: offers the pre-filled email when sending fails", async ({ context, page }) => {
  await setup(context, {});
  await page.route(ENDPOINT, (route) => route.fulfill({ status: 503, body: "" }));
  await page.goto(base(false) + "/contact.html");
  const f = await fill(page);
  await f.locator("button[type=submit]").click();

  const link = page.locator("#formMsg a");
  await expect(link).toHaveText("email it to sales@forplaneta.com");
  expect(await link.getAttribute("href")).toMatch(/^mailto:sales@forplaneta\.com\?subject=Inquiry%20via%20planet-a-foods\.com/);
  await expect(f.locator("#name")).toHaveValue("Jana Keks"); // answers kept
});

test("contact form: nothing is sent without the privacy consent", async ({ context, page }) => {
  await setup(context, {});
  let calls = 0;
  await page.route(ENDPOINT, (route) => { calls++; return route.fulfill({ status: 200, body: '{"ok":true}' }); });
  await page.goto(base(false) + "/contact.html");
  const f = await fill(page);
  await f.locator("#privacy").uncheck();
  await f.locator("button[type=submit]").click();
  await page.waitForTimeout(300);
  expect(calls).toBe(0);
});
