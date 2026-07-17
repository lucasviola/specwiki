import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcHtml = path.join(root, "src/output/html");
const distHtml = path.join(root, "dist/output/html");

async function copyDir(srcSubdir, destSubdir) {
  const srcPath = path.join(srcHtml, srcSubdir);
  const destPath = path.join(distHtml, destSubdir);
  await fs.mkdir(destPath, { recursive: true });

  for (const entry of await fs.readdir(srcPath, { withFileTypes: true })) {
    const from = path.join(srcPath, entry.name);
    const to = path.join(destPath, entry.name);
    if (entry.isDirectory()) {
      await copyDir(
        path.join(srcSubdir, entry.name),
        path.join(destSubdir, entry.name),
      );
    } else {
      await fs.copyFile(from, to);
    }
  }
}

await copyDir("templates", "templates");
await copyDir("assets", "assets");
