#!/usr/bin/env node
/**
 * Reproducible landing-page build for specwiki.ai (GitHub Pages).
 * Copies site/ to dist/landing-site/ and adds Pages metadata (CNAME, .nojekyll).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "site");

function parseOutputDir(argv) {
  const flag = argv.find((arg) => arg.startsWith("--output="));
  if (flag) {
    return path.resolve(root, flag.slice("--output=".length));
  }
  return path.join(root, "dist/landing-site");
}

function shouldWriteCname(argv) {
  return !argv.includes("--skip-cname");
}

async function copyEntry(srcPath, destPath, entry) {
  const from = path.join(srcPath, entry.name);
  const to = path.join(destPath, entry.name);

  if (entry.isDirectory()) {
    await fs.mkdir(to, { recursive: true });
    for (const child of await fs.readdir(from, { withFileTypes: true })) {
      await copyEntry(from, to, child);
    }
    return;
  }

  await fs.copyFile(from, to);
}

async function copySite(source, destination) {
  await fs.mkdir(destination, { recursive: true });

  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    await copyEntry(source, destination, entry);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const outputDir = parseOutputDir(args);

  await fs.access(sourceDir);
  await copySite(sourceDir, outputDir);
  if (shouldWriteCname(args)) {
    await fs.writeFile(path.join(outputDir, "CNAME"), "specwiki.ai\n");
  }
  await fs.writeFile(path.join(outputDir, ".nojekyll"), "");
}

await main();
