// Pages-safe deployment checks for the static site.
//
// GitHub Pages serves this repo from a subpath (https://<owner>.github.io/<repo>/),
// so root-absolute URLs like `/assets/app.js` would 404. This script scans
// the publishable files and fails CI if:
//   1. A local asset referenced from index.html is missing.
//   2. Any HTML/CSS/JS source contains a root-absolute local URL
//      (`href="/..."`, `src="/..."`, or `url(/...)`) other than the
//      well-known exceptions (`/` alone, schema-less protocol URLs, data:,
//      blob:, mailto:, tel:, #fragments, full http(s) URLs).
//   3. index.html does not contain the expected app mount point.

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];
const info = [];

function ok(msg) { info.push(`  ok  ${msg}`); }
function fail(msg) { errors.push(`  FAIL ${msg}`); }

const indexPath = resolve(root, "index.html");
const html = await readFile(indexPath, "utf8");

// Check 1: mount point present
if (!/id\s*=\s*["']app["']/.test(html)) {
  fail(`index.html missing <* id="app"> mount point`);
} else {
  ok(`index.html has #app mount point`);
}

// Check 2: every local href/src referenced from index.html resolves to a file
const refRe = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const externalRe = /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|blob:|mailto:|tel:|#)/i;
for (const m of html.matchAll(refRe)) {
  const url = m[1].trim();
  if (!url || externalRe.test(url)) continue;
  if (url.startsWith("/")) {
    fail(`index.html: root-absolute local URL "${url}" — will 404 on GitHub Pages subpath`);
    continue;
  }
  // Resolve relative to repo root (Pages serves index.html as the root document)
  const target = resolve(root, url.split("?")[0].split("#")[0]);
  try {
    const s = await stat(target);
    if (!s.isFile()) {
      fail(`index.html references non-file: "${url}"`);
    } else if (s.size === 0) {
      fail(`index.html references empty asset: "${url}"`);
    } else {
      ok(`local asset exists: ${url} (${s.size} B)`);
    }
  } catch {
    fail(`index.html references missing local asset: "${url}"`);
  }
}

// Check 3: scan CSS and JS for root-absolute local URLs
async function scanForAbsoluteRoots(rel) {
  const text = await readFile(resolve(root, rel), "utf8");
  // Match url(/...) in CSS and string literals like "/something" in JS that
  // look like asset paths (no spaces, end with a known extension or trailing slash).
  // This stays narrow on purpose — we only flag obvious deploy-breakers, not
  // every "/" in code (e.g. regex, hash router strings starting with #/ are fine).
  const cssUrl = /url\(\s*["']?(\/[^"'\)\s]+)["']?\s*\)/gi;
  const jsAsset = /["'](\/(?:assets|public|static|images|img|css|js)\/[^"']+)["']/gi;
  for (const m of text.matchAll(cssUrl)) fail(`${rel}: root-absolute url(${m[1]}) — would 404 on Pages subpath`);
  for (const m of text.matchAll(jsAsset)) fail(`${rel}: root-absolute asset path ${m[1]} — would 404 on Pages subpath`);
  ok(`scanned ${rel} for root-absolute URLs`);
}
await scanForAbsoluteRoots("assets/app.js");
await scanForAbsoluteRoots("assets/styles.css");

// Check 4: assert the legacy-Pages source layout (index.html at repo root + assets/ dir)
for (const must of ["index.html", "assets/app.js", "assets/styles.css"]) {
  try {
    const s = await stat(resolve(root, must));
    if (!s.isFile() || s.size === 0) fail(`required Pages file missing or empty: ${must}`);
    else ok(`Pages source present: ${must} (${s.size} B)`);
  } catch {
    fail(`required Pages file missing: ${must}`);
  }
}

console.log(info.join("\n"));
if (errors.length) {
  console.log("\nPages deployment hardening check:");
  console.log(errors.join("\n"));
  process.exit(1);
}
console.log("\npages:check PASS");
