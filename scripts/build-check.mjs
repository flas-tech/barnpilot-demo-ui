// Static-site build verification: assemble the publishable artifact
// into dist/ and confirm every required file is present and non-empty.
// Exits non-zero on any failure.

import { rm, mkdir, cp, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

const required = [
  "index.html",
  "assets/app.js",
  "assets/styles.css",
];

async function nonEmpty(path) {
  const s = await stat(path);
  if (!s.isFile()) throw new Error(`not a file: ${path}`);
  if (s.size === 0) throw new Error(`empty file: ${path}`);
  return s.size;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "assets"), resolve(dist, "assets"), { recursive: true });

for (const rel of required) {
  const size = await nonEmpty(resolve(dist, rel));
  console.log(`  ok  ${rel}  (${size} B)`);
}
console.log("build:check PASS");
