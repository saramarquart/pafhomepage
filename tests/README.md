# Site tests (dev-only)

Automated checks for the consent banner, the Google Analytics gating, the privacy policy and site-wide rules.
Nothing in this folder is part of the website. To run them automatically on every pull request, move `tests/ci/site-tests.yml` to `.github/workflows/site-tests.yml`
(this needs a GitHub login or token with the `workflow` permission).

Run locally (needs Node.js 20+ and Python 3):

```
cd tests
npm install
npx playwright install chromium   # or: PW_CHANNEL=chrome to use an installed Google Chrome
npx playwright test
```

No request ever reaches Google: every third-party request is intercepted and recorded, gtag.js is replaced by an empty stub,
and the production domain is simulated from the local files. The Measurement ID in the tests (`G-TEST000000`) is a dummy.
