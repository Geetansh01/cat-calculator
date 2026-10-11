# CAT On-Screen Calculator

A practice calculator for CAT exam aspirants, available as:

1. **Website** (live): the calculator on its own page.
2. **Browser extension** (Chrome, Edge, Firefox): the same calculator as a draggable overlay that floats on top of *any* website, so students can use it while solving questions elsewhere.
3. **Mobile app** (possible future): would load the same core calculator.

The calculator itself (`packages/core`) is shared by all of them and is never forked.

---

## Contents

1. [Product decisions](#1-product-decisions)
2. [Repo structure](#2-repo-structure)
3. [One-time migration from the old flat repo](#3-one-time-migration-from-the-old-flat-repo)
4. [Everyday commands](#4-everyday-commands)
5. [How the extension works](#5-how-the-extension-works)
6. [The website's extension hint](#6-the-websites-extension-hint)
7. [Deploying the website (Vercel)](#7-deploying-the-website-vercel)
8. [Testing](#8-testing)
9. [Publishing the extension](#9-publishing-the-extension)
10. [Day-to-day workflow and rules](#10-day-to-day-workflow-and-rules)
11. [Known limitations](#11-known-limitations)
12. [Changelog](#12-changelog)
13. [Ideas for later](#13-ideas-for-later)

---

## 1. Product decisions

**Is a browser extension the right way to offer an overlay?** Yes. A web page can't draw on top of other websites; an extension can. The flow is: click the toolbar icon, the calculator appears over the current page in a draggable window, the cross hides it, click the icon again to bring it back.

**Does it need to pass browser store verification?** Yes, and that shaped the design:

| Store requirement | How this project meets it |
|---|---|
| Minimal, justified permissions | Only `activeTab`, `scripting`, `storage`. No host permissions, so there is **no** "read and change all your data on all websites" install warning. |
| No remotely hosted code (Manifest V3) | jQuery is bundled in the package. No CDN scripts, no inline scripts. |
| Single, clear purpose | Show a calculator over the current page. |
| Privacy policy | `/privacy.html` on the website. The extension collects and transmits nothing. |
| No impersonation | The listing states it is an unofficial practice tool, not affiliated with the IIMs or the CAT organisers. No official logos. |

**Website hint (subtle, for people who want the overlay).** Best practice for a site that already earns traffic: never interrupt, never block, only show to people it can help, easy to dismiss, remember the dismissal. Details in [section 6](#6-the-websites-extension-hint).

**Audience wording.** CAT aspirants think in terms of "practising on another website / mock test site", so the copy says *"Solving questions on another website? Keep this calculator floating on top of any page."* The words "floating" and "overlay" describe exactly what they're after.

---

## 2. Repo structure

One **monorepo**, not separate repos.

```
cat-calculator/
├─ packages/
│  └─ core/                       THE calculator. Single source of truth.
│     ├─ calciLogic.js            logic, untouched
│     ├─ style.css
│     ├─ jquery-ui.css
│     ├─ calculator.fragment.html calculator DOM (title bar + keypad)
│     └─ vendor/
│        └─ jquery-3.6.0.min.js   bundled (extensions can't load CDN code)
│
├─ apps/
│  ├─ web/src/                    website shell
│  │  ├─ index.template.html      page, SEO, watermark, disclaimer
│  │  ├─ extension-hint.js / .css the subtle "get the extension" line
│  │  ├─ privacy.html
│  │  └─ favicon.ico
│  │
│  ├─ extension/                  Manifest V3 extension (Chrome, Edge, Firefox)
│  │  ├─ manifest.base.json       one manifest, patched per browser at build time
│  │  ├─ src/background/          toolbar click + keyboard shortcut handler
│  │  ├─ src/content/overlay.js   the floating, draggable overlay
│  │  ├─ src/calculator/          extension-only glue around the core page
│  │  ├─ src/icons/
│  │  └─ store/                   listing copy + screenshots
│  │
│  └─ mobile/                     (future) e.g. a Capacitor shell loading the same core
│
├─ scripts/
│  ├─ build.mjs                   copies core into each app; zero dependencies
│  └─ serve.mjs                   local preview server
├─ docs/
│  └─ STORE_SUBMISSION.md         step-by-step for the three stores
├─ tests/
│  └─ extension.e2e.mjs           Playwright smoke test for the overlay
├─ vercel.json                    build: npm run build:web, output: dist/web
├─ package.json
└─ README.md
```

**Why a monorepo.** The requirement is that the core calculator is identical everywhere. With separate repos, `calciLogic.js` would be copied between them and drift within a month. Here:

- The build only **copies** core files into each app, so apps cannot diverge from core.
- A calculator fix is one commit; the next build of the website and every extension picks it up.
- Adding a mobile app later means adding `apps/mobile`; nothing is restructured.
- No pnpm workspaces / Turborepo: plain folders plus one script is enough for three small apps. Add heavier tooling only if the repo outgrows that.

**The one rule:** if the calculator's behaviour or looks change, edit `packages/core`. If it's about *where or how* it is shown (page, overlay, hint, store listing), edit the app.

`dist/` is generated on every build and is git-ignored. Never edit it.

---

## 3. One-time migration from the old flat repo

The old repo was a single folder containing `index.html`, `calciLogic.js`, `style.css`, `jquery-ui.css`, `favicon.ico`. Do this once. You need Node 20+ (`node -v`); there are no packages to install.

1. **Make a branch** (nothing touches `main` or the live site until you merge). Run inside your repo folder, in Git Bash on Windows or any terminal on Mac/Linux:
   ```bash
   git checkout -b monorepo-extension
   ```
2. **Unzip `cat-calculator-repo.zip`** somewhere *outside* your repo, e.g. `~/Downloads/`. This creates a `cat-calculator/` folder; call it NEW.
3. **Move your existing files with `git mv`** (keeps their Git history):
   ```bash
   mkdir -p packages/core apps/web/src
   git mv calciLogic.js style.css jquery-ui.css packages/core/
   git mv favicon.ico apps/web/src/
   git rm index.html
   ```
   `index.html` is replaced by `apps/web/src/index.template.html`, which is your page with the calculator markup extracted into the core package.
   > If you edited `index.html` after sharing it (meta tags, GitHub link, author name, etc.), re-apply those edits to `apps/web/src/index.template.html` in the next step.
4. **Copy the new files in**, from inside your repo folder:
   ```bash
   cp -r ~/Downloads/cat-calculator/. .
   ```
   - The files you moved are overwritten by identical copies (the logic file is byte-identical to yours).
   - If you already had a `README.md`, `.gitignore`, `vercel.json` or `package.json`, they get overwritten. Check `git diff` and merge anything you want to keep.
   - Any other files you have that were never part of this project (for example a jQuery UI `images/` folder): leave them alone, or move them under `apps/web/src/` so the build copies them.
5. **Preview the website locally:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 and compare with the live site. The only differences should be an added "Privacy" link and the website's dead close button being hidden.
6. **Build and try the extension:**
   ```bash
   npm run build
   ```
   - Chrome/Edge: `chrome://extensions` (or `edge://extensions`), turn on Developer mode, **Load unpacked**, choose `dist/extension-chrome`. Pin the icon from the puzzle-piece menu, open any website, click it.
   - Firefox: `about:debugging#/runtime/this-firefox`, **Load Temporary Add-on**, choose `dist/extension-firefox/manifest.json`. **Test this one properly**: automated tests ran on Chromium only.
7. **Commit and push the branch:**
   ```bash
   git add -A
   git status        # dist/ must NOT be listed
   git commit -m "Restructure into monorepo; add browser extension and extension hint"
   git push -u origin monorepo-extension
   ```
8. **Check the Vercel preview before merging** (see [section 7](#7-deploying-the-website-vercel)). Vercel builds a preview for the pushed branch automatically.
9. **Merge to `main`** when the preview looks right. The hint stays invisible until store URLs are configured, so merging is safe.

---

## 4. Everyday commands

```bash
npm run dev        # build + serve the website at http://localhost:5173
npm run build      # website -> dist/web, extensions -> dist/extension-{chrome,firefox}
npm run package    # also writes dist/cat-calculator-{chrome,firefox}-vX.Y.Z.zip for upload
npm run test:ext   # E2E overlay test (needs Playwright + Chromium; set PLAYWRIGHT_PATH if not local)
```

---

## 5. How the extension works

**Flow.** Click the toolbar icon (or press **Alt+Shift+C**) -> the background script injects `content/overlay.js` into *that tab only* -> the overlay shows `calculator/calculator.html` (the same calculator) in an iframe inside a Shadow DOM host. Clicking the icon again toggles it.

**Why an iframe.** `calciLogic.js` reaches the DOM through global jQuery selectors (`$('#keyPad_btn7')`). Those can't see into a Shadow DOM, so embedding the calculator directly would mean rewriting your logic. The iframe keeps the logic byte-identical and fully isolates it from the host site's CSS and scripts. The Shadow DOM wrapper protects the overlay's own frame from page styles.

**Behaviour**
- **Drag:** a transparent strip over the title bar is the drag handle (handled in the parent page). The calculator can't be dragged off-screen; at least 100px always stays visible.
- **Close (cross):** hides the calculator rather than destroying it, so memory (M+) and the current entry survive until the page reloads.
- **Position:** remembered across pages and sessions (`storage.local`, on the device only).
- **Focus:** pressing calculator keys does not steal keyboard focus from the page, so a student can keep typing in an answer box. (`no-focus.js` makes `focus()` a no-op inside the overlay, and button presses don't take focus.)
- **Resizing:** the overlay frame follows the calculator's height. When M+ is pressed the "M" indicator adds a line, and the frame grows with it (and shrinks again on MC).
- **Fullscreen:** if a site fullscreens one element, the overlay moves into it so it stays visible. (The calculator reloads once when this happens.)
- **Restricted pages** (`chrome://`, the Web Store, `about:`, the built-in PDF viewer): browsers forbid extensions there. The icon shows a "!" badge with an explanatory tooltip instead of failing silently.
- **Sites that block embedded extension content (CSP):** after 2.5 s without a response the overlay shows a small notice pointing to the website.

**Permissions and why** (also used verbatim in store forms, see `apps/extension/store/listing.md`):
- `activeTab`: lets the extension act on the tab where the user clicked, only after the click.
- `scripting`: injects the overlay script into that tab.
- `storage`: saves the calculator's position locally.
- `web_accessible_resources` (`calculator/*`): the calculator page must be loadable in a frame on the current site.

**Per-browser manifests.** `scripts/build.mjs` patches `manifest.base.json`:
- Chrome/Edge: `service_worker` background, `use_dynamic_url`. **One Chrome zip serves both Chrome and Edge.**
- Firefox: event-page background (`scripts`), `browser_specific_settings.gecko` with an add-on ID, minimum Firefox 140, and `data_collection_permissions: { required: ["none"] }` (required for new AMO submissions).

---

## 6. The website's extension hint

A single line fixed at the bottom of the page:

> Solving questions on another website? Keep this calculator floating on top of any page. **Get the free Chrome extension**   ✕

Rules built into `apps/web/src/extension-hint.js`:
- **Invisible until a store URL is set** for the visitor's browser, so it is safe to deploy before the extension is published.
- **Desktop only.** Phones and Safari see nothing (no extension for them yet). It's also hidden below 600px width.
- **Per-browser link:** Edge users get the Edge store, Firefox users the Firefox store, other Chromium browsers (Chrome, Brave, Opera, Vivaldi) the Chrome store.
- **Only for engaged visitors:** appears after 5 calculator key presses, or after 25 seconds.
- **Quiet:** one line, bottom of the viewport (doesn't overlap the calculator), a single fade-in, no animation if the visitor prefers reduced motion.
- **Dismissible:** the ✕ hides it for 60 days (stored in `localStorage`).
- **Measured:** fires Google Analytics events `ext_hint_shown`, `ext_hint_click`, `ext_hint_dismiss` (with the browser) if `gtag` is present.

**To activate it** once a listing is live, paste its URL into `STORE_URLS` at the top of `extension-hint.js`, commit and deploy:

```js
var STORE_URLS = {
  chrome: "https://chromewebstore.google.com/detail/<slug>/<id>",
  edge: "https://microsoftedge.microsoft.com/addons/detail/<slug>/<id>",
  firefox: "https://addons.mozilla.org/firefox/addon/<slug>/"
};
```

Other website changes made along the way: a "Privacy" link next to the disclaimer, `privacy.html` (covers the extension and the website's Google Analytics), and the title-bar close button is hidden on the website because it never had an action there (it exists for the extension overlay).

---

## 7. Deploying the website (Vercel)

The website used to be plain static files and now has a (dependency-free) build step.

1. Vercel project **Settings -> General -> Root Directory**: the repo root (blank or `./`).
2. Framework Preset: **Other**. Build Command and Output Directory come from `vercel.json` (`npm run build:web`, `dist/web`). If the dashboard shows manual overrides for them, clear the overrides.
3. Every pushed branch gets a preview deployment; check it before merging to `main`.

---

## 8. Testing

`tests/extension.e2e.mjs` loads the built extension in Chromium and checks (the calculator's own math logic is treated as given and not re-tested):

- the overlay opens and sizes itself over a deliberately hostile page (CSS resets, `!important` styles);
- 7 x 6 = 42 works inside the overlay;
- the page's answer box keeps focus while calculator keys are pressed;
- dragging works, and the calculator can't be dragged off-screen and can be grabbed again;
- the cross closes it, the icon reopens it in the same spot with its state;
- the position is remembered on another page;
- a strict-CSP page either loads the overlay or shows the fallback notice;
- a restricted page (`chrome://`) shows the "!" badge instead of crashing.

Run it with `npm run test:ext`. Not covered: Firefox, Edge (it uses the Chrome package), real-world exam sites. Smoke-test Firefox manually before submitting.

---

## 9. Publishing the extension

Package once, publish three times: **one Chrome zip serves Chrome and Edge**, plus one Firefox zip. `npm run package` creates both in `dist/`. The complete walkthrough is in [`docs/STORE_SUBMISSION.md`](docs/STORE_SUBMISSION.md); paste-ready listing text, single-purpose statement, permission justifications and reviewer notes are in [`apps/extension/store/listing.md`](apps/extension/store/listing.md).

**Before the first submission**
1. Deploy the website so `/privacy.html` is live (the stores require a privacy policy URL).
2. In `scripts/build.mjs`, replace the Firefox add-on ID (`gecko.id`, marked TODO) with one you control. **It can never change after the first submission.**
3. Smoke-test the Firefox build manually (section 3, step 6).
4. Replace the screenshots in `apps/extension/store/screenshots/` with real 1280x800 ones (the included ones use a mock page). Optionally add a 440x280 promo tile for Chrome.

**Per store (summary)**
- **Chrome Web Store:** developer account (one-time fee, currently US$5) -> upload the Chrome zip -> listing (category Education), privacy tab (single purpose, permission justifications, remote code: No, data usage: none, policy URL) -> submit. Don't keyword-stuff the title or description.
- **Microsoft Edge Add-ons:** free Partner Center account -> upload the *same* Chrome zip -> listing, category, policy URL, certification notes ("click the icon on any website") -> submit.
- **Firefox (AMO):** free account -> upload the Firefox zip as a listed add-on. Source code is only requested for generated/minified code; everything first-party is hand-written, and `jquery-3.6.0.min.js` is the unmodified official build, so say so in the reviewer notes.
- **Safari (later):** `xcrun safari-web-extension-converter dist/extension-chrome`, published through an Apple Developer account (US$99/year).

Store policies and fees change; re-check each dashboard at submission time.

**After a release:** tag the commit `ext-vX.Y.Z`, keep the submitted zips, and when each listing goes live add its URL to `STORE_URLS` (section 6). Bump `version` in `apps/extension/manifest.base.json` for every new submission.

---

## 10. Day-to-day workflow and rules

- **Calculator bug or look change:** edit `packages/core/`, run `npm run build`, redeploy the site, and re-release the extension (new version number).
- **Website-only change** (SEO text, hint wording, disclaimer): edit `apps/web/src/`.
- **Extension-only change:** edit `apps/extension/src/`.
- **Never** edit `dist/`; it is regenerated.
- **Never fork** `calciLogic.js` or copy it into an app by hand. The build does the copying.
- Extension versions are independent of the website; the website deploys on every merge to `main`, the extension only when you submit a new zip to the stores.
- Possible later cleanup: the website could use the bundled `vendor/jquery-3.6.0.min.js` instead of the jQuery CDN (one less third-party request).

---

## 11. Known limitations

- **Firefox is untested** by automation; verify manually.
- **Restricted pages** (`chrome://`, Web Store, `about:`, built-in PDF viewer) can't host the overlay; this is a browser rule.
- **Strict-CSP sites** may block the embedded calculator (more likely on Firefox); the overlay then shows a notice.
- **Fullscreen mode:** the calculator reloads once (state resets) when a site enters or leaves fullscreen.
- **Calculator state resets on page reload** (it lives in the page).
- **Looks:** the calculator renders in its light theme, as defined by `style.css`, and the overlay forces light mode. If your site is intended to look dark, say so and the core CSS needs a dark variant.
- The calculator has **no keyboard input**, matching the on-screen calculator in the real exam.

---

## 12. Changelog

**1.0.0**
- Initial monorepo, website shell, extension, hint, privacy page, store docs.
- Fix: in the overlay, pressing M+ made the calculator taller (the "M" indicator appears above MC) while the overlay frame stayed the same height, clipping the bottom buttons. The overlay frame now follows the calculator's height (`apps/extension/src/calculator/embed.js`). No core logic changed.

---

## 13. Ideas for later

- Real-site screenshots and a Chrome promo tile for the store listings.
- `apps/mobile` (e.g. Capacitor) loading the same core page.
- Safari extension via Apple's converter.
- Optional dark theme in `packages/core` if the site is meant to be dark.
- Switch the website from the jQuery CDN to the bundled jQuery.
