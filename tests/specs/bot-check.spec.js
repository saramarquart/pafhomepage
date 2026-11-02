// Bot check (Cloudflare Turnstile, assets/turnstile.js) on the two inquiry forms.
// Off by default: nothing is loaded from Cloudflare and the forms post exactly as before.
// Switched on (a site key in turnstile.js plus the CSP from docs/security.md), the token goes along in the POST.
// Cloudflare is never contacted: its script is replaced by a stand-in, and PAForce is stubbed.
const { test, expect } = require("@playwright/test");
const { setup, base } = require("../helpers");

const ENDPOINT = "https://sales.planet-a-foods.com/api/public/inquiry";
const CLOUDFLARE = "https://challenges.cloudflare.com/";
const TEST_SITE_KEY = "1x00000000000000000000AA"; // Cloudflare's always-passes test key

// Stand-in for https://challenges.cloudflare.com/turnstile/v0/api.js: hands out a token shortly after render.
const FAKE_TURNSTILE = `window.turnstile = {
  render: function (el, o) { window.__ts = { sitekey: o.sitekey, action: o.action, resets: 0 };
    setTimeout(function () { o.callback("test-token-" + (window.__ts.resets + 1)); }, 50); window.__tsOpts = o; return "w1"; },
  reset: function () { window.__ts.resets++; var o = window.__tsOpts; setTimeout(function () { o.callback("test-token-" + (window.__ts.resets + 1)); }, 50); }
};`;

const FORMS = [
  {
    name: "contact form",
    path: "/contact.html",
    form: "#contactForm",
    msg: "#formMsg",
    async fill(page) {
      const f = page.locator("#contactForm");
      await f.locator("#name").fill("Jana Keks");
      await f.locator("#company").fill("Example Biscuits GmbH");
      await f.locator("#email").fill("jana@example-biscuits.com");
      await f.locator("#message").fill("We'd like to develop a filling together.");
      await f.locator("#privacy").check();
      return f;
    },
  },
  {
    name: "sample form",
    path: "/product-cocoa-booster.html",
    form: "#sampleForm",
    msg: "#sampleForm .form-msg",
    async fill(page) {
      const f = page.locator("#sampleForm");
      await f.locator("[name=name]").fill("Jana Keks");
      await f.locator("[name=email]").fill("jana@example-biscuits.com");
      await f.locator("[name=company]").fill("Example Biscuits GmbH");
      await f.locator("[name=privacy]").check();
      return f;
    },
  },
];

/** Serve the page with the CSP from docs/security.md ("switch it on", step 3). */
async function withTurnstileCsp(page, path) {
  await page.route("**" + path, async (route) => {
    const res = await route.fetch();
    const html = (await res.text())
      .replace("script-src 'self' https://*.googletagmanager.com;", "script-src 'self' https://*.googletagmanager.com https://challenges.cloudflare.com;")
      .replace("frame-src 'none';", "frame-src https://challenges.cloudflare.com;");
    await route.fulfill({ response: res, body: html });
  });
}

/** Serve turnstile.js with a site key, as if it had been switched on. */
async function withSiteKey(page) {
  await page.route("**/assets/turnstile.js*", async (route) => {
    const res = await route.fetch();
    const js = (await res.text()).replace('var TURNSTILE_SITE_KEY = "";', `var TURNSTILE_SITE_KEY = "${TEST_SITE_KEY}";`);
    await route.fulfill({ response: res, body: js, contentType: "text/javascript" });
  });
}

for (const F of FORMS) {
  test(`${F.name}: bot check is off by default — nothing from Cloudflare, no token in the POST`, async ({ context, page }) => {
    const { external } = await setup(context, {});
    let sent = null;
    await page.route(ENDPOINT, async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto(base(false) + F.path);
    expect(await page.evaluate(() => window.pafBotCheck && window.pafBotCheck.enabled)).toBe(false);
    const f = await F.fill(page);
    await f.locator("button[type=submit]").click();
    await expect(page.locator(F.msg)).toContainText("Thank you");
    expect(sent).not.toBeNull();
    expect("turnstileToken" in sent).toBe(false);
    expect(external.filter((u) => u.startsWith(CLOUDFLARE))).toEqual([]);
    await expect(page.locator(`${F.form} .bot-check`)).toHaveCount(0); // the form markup is unchanged
  });

  test(`${F.name}: switched on, Cloudflare loads on first input and the token goes along`, async ({ context, page }) => {
    await setup(context, {});
    await withSiteKey(page);
    await withTurnstileCsp(page, F.path);
    const scriptLoads = [];
    await page.route(CLOUDFLARE + "turnstile/v0/api.js*", (route) => {
      scriptLoads.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_TURNSTILE });
    });
    const sent = [];
    await page.route(ENDPOINT, async (route) => {
      sent.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });

    await page.goto(base(false) + F.path);
    await page.waitForTimeout(300);
    expect(scriptLoads).toEqual([]); // nothing from Cloudflare before the visitor starts on the form
    const f = await F.fill(page);
    await f.locator("button[type=submit]").click();
    await expect(page.locator(F.msg)).toContainText("Thank you");

    expect(scriptLoads).toHaveLength(1);
    expect(scriptLoads[0]).toContain("render=explicit");
    expect(await page.evaluate(() => window.__ts)).toMatchObject({ sitekey: TEST_SITE_KEY, action: "inquiry" });
    expect(sent).toHaveLength(1);
    expect(sent[0].turnstileToken).toBe("test-token-1");

    // Tokens are single-use: the next send carries a fresh one.
    await F.fill(page);
    await f.locator("button[type=submit]").click();
    await expect.poll(() => sent.length).toBe(2);
    expect(sent[1].turnstileToken).toBe("test-token-2");
  });

  test(`${F.name}: switched on but blocked by the CSP — the form still sends, without a token`, async ({ context, page }) => {
    await setup(context, {});
    await withSiteKey(page); // key set, CSP NOT updated: the browser refuses Cloudflare's script
    let sent = null;
    await page.route(ENDPOINT, async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto(base(false) + F.path);
    const f = await F.fill(page);
    const t0 = Date.now();
    await f.locator("button[type=submit]").click();
    await expect(page.locator(F.msg)).toContainText("Thank you");
    expect(Date.now() - t0).toBeLessThan(5000); // no 10 s wait for a token that cannot come
    expect("turnstileToken" in sent).toBe(false);
  });
}
