import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcHtml = path.join(root, "src/output/html");
const distHtml = path.join(root, "dist/output/html");

async function copyDir(srcSubdir, destSubdir) {
  const srcPath = path.join(srcHtml, srcSubdir);
  const destPath = path.join(distHtml, destSubdir);
  await fs.mkdir(destPath, { recursive: true });

  for (const entry of await fs.readdir(srcPath)) {
    await fs.copyFile(path.join(srcPath, entry), path.join(destPath, entry));
  }
}

async function copyHighlightCssToDist() {
  const highlightPath = require.resolve("highlight.js/styles/github.min.css");
  const highlightCss = await fs.readFile(highlightPath, "utf-8");
  const distAssetPath = path.join(distHtml, "assets/highlight.css");

  await fs.mkdir(path.dirname(distAssetPath), { recursive: true });
  await fs.writeFile(distAssetPath, highlightCss, "utf-8");
}

await copyDir("templates", "templates");
await copyDir("assets", "assets");
await copyHighlightCssToDist();
