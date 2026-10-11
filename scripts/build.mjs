// Zero-dependency build. Usage:
//   node scripts/build.mjs web
//   node scripts/build.mjs extension [--zip] [--test]
//   node scripts/build.mjs all
//
// Single source of truth for the calculator is packages/core. This script only COPIES it,
// so the website and every extension build are guaranteed to ship the same calculator.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const p = (...a) => path.resolve(root, ...a);
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) || "all";
const flags = new Set(args.filter((a) => a.startsWith("--")));

const core = "packages/core";
const fragment = fs.readFileSync(p(core, "calculator.fragment.html"), "utf8");
const inject = (tpl) => {
  if (!tpl.includes("<!--@@CALCULATOR@@-->")) throw new Error("template is missing the @@CALCULATOR@@ marker");
  return tpl.replace("<!--@@CALCULATOR@@-->", fragment.trim());
};

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });
const mk = (d) => fs.mkdirSync(d, { recursive: true });
const cp = (from, to) => { mk(path.dirname(to)); fs.copyFileSync(from, to); };
const cpDir = (from, to) => fs.cpSync(from, to, { recursive: true });

// Files that make up "the calculator". Same list for every target.
const CORE_FILES = [
  ["calciLogic.js", "calciLogic.js"],
  ["style.css", "style.css"],
  ["jquery-ui.css", "jquery-ui.css"],
];

function buildWeb() {
  const out = p("dist/web");
  rm(out); mk(out);
  for (const [src, dst] of CORE_FILES) cp(p(core, src), p(out, dst));
  const web = p("apps/web/src");
  fs.writeFileSync(p(out, "index.html"), inject(fs.readFileSync(p(web, "index.template.html"), "utf8")));
  for (const f of fs.readdirSync(web)) {
    if (f !== "index.template.html") cp(p(web, f), p(out, f));
  }
  console.log("web        ->", path.relative(root, out));
}

function manifestFor(browser, test) {
  const m = JSON.parse(fs.readFileSync(p("apps/extension/manifest.base.json"), "utf8"));
  if (browser === "chrome") {
    m.minimum_chrome_version = "102";
    m.background = { service_worker: "background/background.js" };
    m.web_accessible_resources = [{ resources: ["calculator/*"], matches: ["<all_urls>"], use_dynamic_url: true }];
  } else if (browser === "firefox") {
    m.background = { scripts: ["background/background.js"] };
    m.web_accessible_resources = [{ resources: ["calculator/*"], matches: ["<all_urls>"] }];
    m.browser_specific_settings = {
      gecko: {
        id: "cat-calculator@cat-calculator-delta.vercel.app", // TODO: change to an ID you control before first submission
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["none"] },
      },
    };
  }
  if (test) m.host_permissions = ["<all_urls>"]; // lets automated tests inject without a real click
  return m;
}

function buildExtension(browser) {
  const test = flags.has("--test");
  const out = p("dist", `extension-${browser}${test ? "-test" : ""}`);
  rm(out); mk(out);
  const src = p("apps/extension/src");

  cpDir(p(src, "background"), p(out, "background"));
  cpDir(p(src, "content"), p(out, "content"));
  cpDir(p(src, "icons"), p(out, "icons"));

  // The calculator page: shared core + extension-only glue.
  const calc = p(out, "calculator");
  mk(calc);
  for (const [s, d] of CORE_FILES) cp(p(core, s), p(calc, d));
  cp(p(core, "vendor/jquery-3.6.0.min.js"), p(calc, "jquery-3.6.0.min.js"));
  for (const f of ["embed.js", "embed.css", "no-focus.js"]) cp(p(src, "calculator", f), p(calc, f));
  fs.writeFileSync(
    p(calc, "calculator.html"),
    inject(fs.readFileSync(p(src, "calculator/calculator.template.html"), "utf8")),
  );

  fs.writeFileSync(p(out, "manifest.json"), JSON.stringify(manifestFor(browser, test), null, 2) + "\n");
  console.log(`extension  -> ${path.relative(root, out)}`);

  if (flags.has("--zip") && !test) {
    const version = JSON.parse(fs.readFileSync(p(out, "manifest.json"), "utf8")).version;
    const zip = p("dist", `cat-calculator-${browser}-v${version}.zip`);
    rm(zip);
    try {
      execFileSync("zip", ["-r", "-X", "-q", zip, "."], { cwd: out });
      console.log("zip        ->", path.relative(root, zip));
    } catch {
      console.warn("`zip` not found - zip the contents of", out, "manually (manifest.json must be at the zip root).");
    }
  }
}

if (target === "web" || target === "all") buildWeb();
if (target === "extension" || target === "all") {
  buildExtension("chrome");   // also the package for Microsoft Edge
  buildExtension("firefox");
}
