# Store submission playbook

Package once, publish three times: **one Chrome zip serves Chrome and Edge**, plus one Firefox zip.
Build them with `npm run package` -> `dist/cat-calculator-chrome-vX.zip`, `dist/cat-calculator-firefox-vX.zip`.
Policies change; re-check each dashboard's current requirements at submission time.

## Why this should pass review quickly
- Minimal permissions (`activeTab`, `scripting`, `storage`); no host permissions.
- No remote code: jQuery is bundled, no CDN scripts, no inline scripts (MV3 requirement).
- No data collected or transmitted, no network requests, no analytics inside the extension.
- Single, obvious purpose.
- Hosts a privacy policy: https://cat-calculator-delta.vercel.app/privacy.html (deploy the site first).

## Before you submit (do once)
1. Deploy the website so `/privacy.html` is live.
2. Replace the Firefox add-on ID in `scripts/build.mjs` (`gecko.id`) with one you control (email-style, e.g. `cat-calculator@yourdomain`). It must never change afterwards.
3. Smoke-test the Firefox build manually (see README). Automated tests ran on Chromium only.
4. Take 1-5 real screenshots at 1280x800 (samples in `apps/extension/store/screenshots/`; ideally use a real practice site or a neutral page).
5. Optional but recommended: Chrome small promo tile 440x280.
6. Use the text in `apps/extension/store/listing.md`.

## Chrome Web Store
1. Create a developer account at the Chrome Web Store developer dashboard (one-time registration fee, currently US$5).
2. New item -> upload the Chrome zip.
3. Store listing: name, summary, description, category **Education**, language, screenshots, icon (128px is taken from the package).
4. Privacy tab:
   - Single purpose: paste from `listing.md`.
   - Permission justifications: `activeTab`, `scripting`, `storage` (text in `listing.md`).
   - Remote code: **No**.
   - Data usage: tick nothing; certify the three compliance statements.
   - Privacy policy URL: the `/privacy.html` link.
5. Distribution: Public, all regions. Submit for review.
6. Name hygiene: don't stack keywords in the title/description (a reason for rejection); keep the "not affiliated with IIMs / CAT" line; don't use official logos.

## Microsoft Edge Add-ons
1. Free account at Partner Center -> Edge program.
2. Upload the **same Chrome zip**.
3. Fill listing, category Education, privacy policy URL, and "notes for certification": *"Click the toolbar icon on any website; a draggable calculator appears. No login needed."*
4. Submit. Edge reviewers are typically quick for simple extensions.

## Firefox (addons.mozilla.org)
1. Free account at the Firefox Add-on developer hub.
2. Submit new add-on -> "On this site" (listed) -> upload the Firefox zip.
3. The manifest already declares `data_collection_permissions: { required: ["none"] }` (required for new submissions) and a minimum Firefox of 140.
4. Source code: AMO asks for source only for generated/minified code. All first-party code is hand-written; `calculator/jquery-3.6.0.min.js` is the unmodified official jQuery 3.6.0 build. Say so in the reviewer notes.
5. Listing text and privacy policy URL as above.

## Later: Safari
Apple wraps web extensions in a Mac/iOS app: `xcrun safari-web-extension-converter dist/extension-chrome`, then publish via an Apple Developer account (US$99/year). Not needed for launch; the website hint already ignores Safari.

## After each release
Tag the commit `ext-vX.Y.Z`, keep the submitted zips, and when a listing goes live paste its URL into `STORE_URLS` in `apps/web/src/extension-hint.js`.
