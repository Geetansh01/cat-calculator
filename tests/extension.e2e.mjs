// E2E smoke test for the extension overlay (glue only; calculator logic is treated as given).
// Needs Playwright + Chromium (set PLAYWRIGHT_PATH if it is not locally installed):  node scripts/build.mjs extension --test && node tests/extension.e2e.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright");
import http from "node:http";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const ext = path.join(root, "dist/extension-chrome-test");
const shots = path.join(root, "tests/out");
fs.mkdirSync(shots, { recursive: true });

// A deliberately hostile "exam site": global resets, high z-index modal, input to test focus.
const page = `<!doctype html><html><head><title>Mock Test - Quant</title><style>
*{box-sizing:content-box!important} a{color:red!important;font-size:40px!important}
button{all:unset;background:#000;color:#0f0;padding:30px} body{font:16px Georgia;background:#f4f1ea;margin:0}
.modal{position:fixed;inset:0;z-index:2147483000;pointer-events:none}
header{background:#6b2c91;color:#fff;padding:14px 24px;font:700 18px Arial}
main{max-width:620px;margin:40px auto;background:#fff;padding:28px;border:1px solid #ddd}
input{font-size:18px;padding:8px;width:160px}</style></head><body>
<div class="modal"></div><header>Mock CAT 2026 - Section: QA</header>
<main><h2>Q7. A shopkeeper marks up an item by 35% and gives a 12% discount. Find the net profit % (TITA).</h2>
<p>Type your answer:</p><input id="ans" placeholder="answer"/> <button>Next</button></main></body></html>`;

const servers = [];
const serve = (headers) => new Promise((res) => {
  const s = http.createServer((q, r) => { r.writeHead(200, { "content-type": "text/html", ...headers }); r.end(page); });
  s.listen(0, () => { servers.push(s); res(`http://localhost:${s.address().port}/`); });
});
const normal = await serve({});
const strict = await serve({ "content-security-policy": "default-src 'self'; frame-src 'none'" });

let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failed++; };

const ctx = await chromium.launchPersistentContext("/tmp/pw-ext-profile-" + Date.now(), {
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  headless: false,
  args: ["--headless=new", `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, "--no-sandbox"],
  viewport: { width: 1280, height: 800 },
});
if (!ctx.serviceWorkers().length) await ctx.waitForEvent("serviceworker");
// The worker can restart between calls; always look it up fresh and retry (test-harness concern only).
const swEval = async (fn) => {
  for (let i = 0; i < 20; i++) {
    const w = ctx.serviceWorkers().find((x) => x.url().endsWith("background/background.js"));
    try { if (w) return await w.evaluate(fn); } catch (e) { /* worker restarting */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("service worker unavailable");
};
const activeTabToggle = () => swEval(async () => {
  for (let i = 0; i < 20 && !(globalThis.chrome && chrome.tabs); i++) await new Promise((r) => setTimeout(r, 100));
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await toggle(tab);
});

const p = await ctx.newPage();
await p.goto(normal);
const clickToolbar = activeTabToggle;
const frameBox = () => p.evaluate(() => {
  const host = document.querySelector("[data-cat-calculator]");
  const f = host && host.shadowRoot.querySelector(".frame");
  if (!f) return null;
  const r = f.getBoundingClientRect(); const cs = getComputedStyle(f);
  return { x: r.x, y: r.y, w: r.width, h: r.height, open: f.classList.contains("open"), visible: cs.visibility !== "hidden" && cs.display !== "none" };
});

// 1. open
await p.fill("#ans", "4"); // user is mid-typing an answer
await clickToolbar();
await p.waitForFunction(() => { const f = document.querySelector("[data-cat-calculator]")?.shadowRoot.querySelector(".frame"); return f && f.classList.contains("open") && !f.classList.contains("loading"); }, null, { timeout: 5000 });
let b = await frameBox();
check("overlay opens and sizes itself", b && b.open && b.visible && b.w > 200 && b.h > 250, JSON.stringify(b));
await p.screenshot({ path: `${shots}/1-open-over-hostile-page.png` });

// 2. calculator inside iframe is alive (press 7 * 6 =), page focus not stolen
const cf = p.frames().find((f) => f.url().includes("calculator/calculator.html"));
await p.focus("#ans");
const press = async (id) => { const box = await cf.locator("#" + id).boundingBox(); const fb = b; await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); };
for (const id of ["keyPad_btn7", "keyPad_btnMult", "keyPad_btn6", "keyPad_btnEnter"]) await press(id);
const shown = await cf.locator("#keyPad_UserInput").inputValue();
check("7 * 6 = 42 inside overlay", shown === "42", `(display=${shown})`);
const active = await p.evaluate(() => document.activeElement && document.activeElement.id);
check("page's answer box keeps focus while pressing calculator keys", active === "ans", `(active=${active})`);
await p.keyboard.type("2");
check("can keep typing in the page afterwards", (await p.inputValue("#ans")) === "42" || (await p.inputValue("#ans")).endsWith("2"), `(value=${await p.inputValue("#ans")})`);

// 3. drag by title bar
b = await frameBox();
const sx = b.x + 60, sy = b.y + 18;
await p.mouse.move(sx, sy); await p.mouse.down(); await p.mouse.move(sx - 400, sy + 150, { steps: 8 }); await p.mouse.up();
const b2 = await frameBox();
check("drag moves the calculator", Math.abs(b2.x - (b.x - 400)) < 3 && Math.abs(b2.y - (b.y + 150)) < 3, `(${b.x|0},${b.y|0}) -> (${b2.x|0},${b2.y|0})`);
// cannot be dragged out of the viewport
await p.mouse.move(b2.x + 60, b2.y + 18); await p.mouse.down(); await p.mouse.move(-500, -500, { steps: 5 }); await p.mouse.up();
const b3 = await frameBox();
check("cannot be dragged off-screen", b3.y >= 0 && b3.x + b3.w >= 99, `(${b3.x|0},${b3.y|0})`);
await p.mouse.move(10, b3.y + 18); await p.mouse.down(); await p.mouse.move(700, 250, { steps: 5 }); await p.mouse.up();
check("can be grabbed again from the visible sliver", Math.abs((await frameBox()).x - (700 - (10 - b3.x))) < 3, `(x=${(await frameBox()).x|0})`);
await p.screenshot({ path: `${shots}/2-dragged-and-used.png` });

// 4. close via cross, state kept on reopen
const b4 = await frameBox();
const x = await cf.locator(".ui-dialog-titlebar-close").boundingBox();
await p.mouse.click(x.x + x.width / 2, x.y + x.height / 2);
await p.waitForTimeout(200); // close travels via postMessage
check("cross closes the overlay", !(await frameBox()).open);
await clickToolbar();
check("toolbar click reopens it, same spot", (await frameBox()).open && Math.abs((await frameBox()).x - b4.x) < 2);
check("calculator state kept across close/reopen", (await cf.locator("#keyPad_UserInput").inputValue()) === "42");
await clickToolbar();
check("toolbar click while open toggles it closed", !(await frameBox()).open);

// 5. position persists to a brand-new page
const p2 = await ctx.newPage(); await p2.goto(normal);
await activeTabToggle();
await p2.waitForFunction(() => document.querySelector("[data-cat-calculator]")?.shadowRoot.querySelector(".frame.open:not(.loading)"), null, { timeout: 5000 });
const bb = await p2.evaluate(() => { const r = document.querySelector("[data-cat-calculator]").shadowRoot.querySelector(".frame").getBoundingClientRect(); return { x: r.x, y: r.y }; });
check("position remembered on another page", Math.abs(bb.x - b4.x) < 3 && Math.abs(bb.y - b4.y) < 3, `(${bb.x|0},${bb.y|0}) vs (${b4.x|0},${b4.y|0})`);
await p2.close();

// 6. strict CSP page: graceful message instead of a dead overlay
const p3 = await ctx.newPage(); await p3.goto(strict);
await activeTabToggle();
await p3.waitForTimeout(3200);
const csp = await p3.evaluate(() => {
  const s = document.querySelector("[data-cat-calculator]").shadowRoot;
  return { notice: s.querySelector(".notice").classList.contains("open"), frame: s.querySelector(".frame").classList.contains("open") };
});
check("strict-CSP page: overlay loads or shows fallback notice", csp.frame || csp.notice, JSON.stringify(csp));
await p3.screenshot({ path: `${shots}/3-strict-csp.png` });

// 7. restricted page: badge instead of crash
const p4 = await ctx.newPage(); await p4.goto("chrome://version");
await activeTabToggle();
const badge = await swEval(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.action.getBadgeText({ tabId: tab.id });
});
check("restricted page (chrome://) shows '!' badge, no crash", badge === "!", `(badge=${badge})`);

await ctx.close(); servers.forEach((s) => s.close());
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
