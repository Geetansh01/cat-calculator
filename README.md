# CAT On-Screen Calculator

One calculator, three surfaces: the **website** (live), the **browser extension** (floating overlay for Chrome / Edge / Firefox), and a possible **mobile app** later.

## Repo layout (monorepo)

```
packages/core/            <- THE calculator. Single source of truth. Never forked.
  calciLogic.js             logic, untouched
  style.css, jquery-ui.css  look & feel
  calculator.fragment.html  the calculator's DOM (title bar + keypad)
  vendor/jquery-3.6.0.min.js  bundled copy (extensions may not load remote code)

apps/web/src/             <- website shell: page, SEO, watermark, disclaimer, extension hint, privacy page
apps/extension/           <- MV3 extension: manifest, background, overlay, icons, store listing
scripts/build.mjs         <- copies core into each app. No dependencies.
docs/STORE_SUBMISSION.md  <- step-by-step for Chrome Web Store, Edge Add-ons, Firefox AMO
tests/extension.e2e.mjs   <- Playwright smoke test for the overlay
```

**Why a monorepo and not separate repos:** the requirement is "the core calculator is identical everywhere". With one repo a calculator fix is one commit and the next build of every app picks it up; with separate repos you would be copy-pasting `calciLogic.js` and drifting within a month. The build *copies* core files into each app, so apps cannot diverge from core. When the mobile app arrives, add `apps/mobile` (e.g. a Capacitor shell that loads the same core page); no restructuring needed. Don't add pnpm/turborepo until there is a reason; plain folders + one script is enough.

Rule of thumb: calculator behaviour/looks change -> edit `packages/core`. Anything about *where* it is shown -> edit the app.

## Commands

```
npm run dev        # build + serve the website at http://localhost:5173
npm run build      # website -> dist/web, extensions -> dist/extension-{chrome,firefox}
npm run package    # also writes dist/cat-calculator-{chrome,firefox}-vX.Y.Z.zip
npm run test:ext   # E2E overlay test (needs Playwright + Chromium; set PLAYWRIGHT_PATH if not local)
```

Load unpacked for manual testing:
- Chrome / Edge: `chrome://extensions` -> Developer mode -> Load unpacked -> `dist/extension-chrome`
- Firefox: `about:debugging#/runtime/this-firefox` -> Load Temporary Add-on -> `dist/extension-firefox/manifest.json`

## Deploying the website (Vercel)

Set the project **Root Directory to the repo root**. `vercel.json` already runs `npm run build:web` and serves `dist/web`.

## How the extension works

Click the toolbar icon (or **Alt+Shift+C**) -> background script injects `content/overlay.js` into that tab only -> the overlay mounts `calculator/calculator.html` (the same calculator, unchanged) in an iframe inside a Shadow DOM host. Dragging is done by the overlay; the cross hides it (state such as memory is kept until the page reloads); the position is remembered across pages.

Why an iframe: `calciLogic.js` talks to the DOM through global jQuery selectors, which can't see into a Shadow DOM and would otherwise need rewriting. The iframe keeps the logic byte-identical and gives complete style isolation from whatever site the student is on.

Permissions: `activeTab`, `scripting`, `storage`. No host permissions, so no "read all your data on all websites" install warning.

## Releasing

1. Bump `version` in `apps/extension/manifest.base.json`, `npm run package`.
2. Upload the Chrome zip to Chrome Web Store **and** Edge Add-ons (same package); upload the Firefox zip to AMO. See `docs/STORE_SUBMISSION.md`.
3. When a listing is live, paste its URL into `STORE_URLS` in `apps/web/src/extension-hint.js` and deploy. The website hint stays invisible until a URL is set for that browser.
