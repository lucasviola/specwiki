#!/usr/bin/env node
/**
 * Generate example wikis for specwiki.ai (E27 S27.2 / S27.3).
 * Reads examples/manifest.yaml; v1 default builds the hero slug only.
 * After generation, emits the /examples/ gallery hub for built slugs.
 *
 * Usage:
 *   npm run build                          # compile CLI first
 *   npm run build:examples -- --hero-only  # hero wiki → dist/landing-site/examples/<slug>/
 *   npm run build:examples -- --all        # all catalog entries + gallery hub
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertNoRootAbsoluteUrlsInHtmlTree } from "./lib/assert-no-root-absolute-urls.mjs";
import { renderExamplesGalleryHtml } from "./lib/examples-gallery.mjs";
import { loadExamplesManifest } from "./lib/examples-manifest.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PATH = path.join(root, "dist/cli.js");
const DEFAULT_SITE_OUTPUT = path.join(root, "dist/landing-site");
/** Confined wiki staging dir inside each example project (gitignored). */
const WIKI_STAGING_DIR = "wiki";

/**
 * @param {string[]} argv
 */
export function parseBuildExamplesArgs(argv) {
  const all = argv.includes("--all");
  const outputFlag = argv.find((arg) => arg.startsWith("--output="));
  const siteOutputDir = outputFlag
    ? path.resolve(root, outputFlag.slice("--output=".length))
    : DEFAULT_SITE_OUTPUT;

  return {
    heroOnly: !all,
    all,
    siteOutputDir,
  };
}

/**
 * @param {string} srcDir
 * @param {string} destDir
 */
async function copyTree(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  for (const entry of await fs.readdir(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}

/**
 * @param {string} slug
 * @param {string} siteOutputDir
 */
async function generateExampleWiki(slug, siteOutputDir) {
  const projectDir = path.join(root, "examples", slug);
  const stagingWikiDir = path.join(projectDir, WIKI_STAGING_DIR);
  const destSlugDir = path.join(siteOutputDir, "examples", slug);

  try {
    execFileSync(
      "node",
      [
        CLI_PATH,
        "generate",
        "--project",
        projectDir,
        "--output",
        WIKI_STAGING_DIR,
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const err =
      /** @type {NodeJS.ErrnoException & { stderr?: string; stdout?: string }} */ (
        error
      );
    const detail = [err.stderr, err.stdout, err.message]
      .filter(Boolean)
      .join("\n")
      .trim();
    throw new Error(
      `build:examples: failed to generate examples/${slug}/ — run npm run build first\n${detail}`,
    );
  }

  try {
    await fs.access(path.join(stagingWikiDir, "html", "index.html"));
  } catch {
    throw new Error(
      `build:examples: examples/${slug}/wiki/html/index.html missing after generate`,
    );
  }

  await fs.rm(destSlugDir, { recursive: true, force: true });
  await copyTree(stagingWikiDir, destSlugDir);
  await fs.rm(stagingWikiDir, { recursive: true, force: true });

  await assertNoRootAbsoluteUrlsInHtmlTree(destSlugDir);
}

/**
 * @param {{ heroOnly?: boolean; all?: boolean; siteOutputDir?: string }} [options]
 */
export async function buildExamples(options = {}) {
  const heroOnly = options.heroOnly ?? !options.all;
  const siteOutputDir = options.siteOutputDir ?? DEFAULT_SITE_OUTPUT;

  try {
    await fs.access(CLI_PATH);
  } catch {
    throw new Error(
      "build:examples: dist/cli.js not found — run npm run build before build:examples",
    );
  }

  const manifest = await loadExamplesManifest(root);
  const slugs = heroOnly
    ? [manifest.hero]
    : manifest.examples.map((entry) => entry.slug);

  await fs.mkdir(siteOutputDir, { recursive: true });

  for (const slug of slugs) {
    await generateExampleWiki(slug, siteOutputDir);
  }

  const examplesDir = path.join(siteOutputDir, "examples");
  const galleryHtml = renderExamplesGalleryHtml(manifest, {
    builtSlugs: slugs,
  });
  await fs.mkdir(examplesDir, { recursive: true });
  await fs.writeFile(path.join(examplesDir, "index.html"), galleryHtml, "utf8");
  await assertNoRootAbsoluteUrlsInHtmlTree(examplesDir);

  return { slugs, siteOutputDir };
}

async function main() {
  try {
    const args = parseBuildExamplesArgs(process.argv.slice(2));
    await buildExamples(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await main();
}
