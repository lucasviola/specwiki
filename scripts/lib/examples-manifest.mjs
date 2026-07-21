/**
 * Load and validate examples/manifest.yaml — source of truth for mock-project metadata.
 * Used by build:examples (S27.2+) and contract tests (S27.1).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const MANIFEST_FILENAME = "manifest.yaml";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Generated wiki output — not a mock project catalog entry. */
export const EXCLUDED_EXAMPLE_DIRS = new Set(["wiki"]);

/**
 * @typedef {Object} ExampleCommands
 * @property {string} generate
 * @property {string} open
 */

/**
 * @typedef {Object} ExampleLandingCopy
 * @property {string} section_title
 * @property {string} section_prose
 */

/**
 * @typedef {Object} ExampleCatalogEntry
 * @property {string} slug
 * @property {string} title
 * @property {string} tagline
 * @property {string} framework
 * @property {ExampleCommands} [commands]
 * @property {ExampleLandingCopy} [landing]
 */

/**
 * @typedef {Object} ExamplesManifest
 * @property {string} hero
 * @property {ExampleCatalogEntry[]} examples
 */

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {ExampleCommands}
 */
function parseCommands(value, label) {
  if (value === undefined || value === null) {
    throw new Error(`${label}.commands is required`);
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}.commands must be an object`);
  }

  return {
    generate: requireNonEmptyString(
      value.generate,
      `${label}.commands.generate`,
    ),
    open: requireNonEmptyString(value.open, `${label}.commands.open`),
  };
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {ExampleLandingCopy | undefined}
 */
function parseLanding(value, label) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}.landing must be an object`);
  }

  return {
    section_title: requireNonEmptyString(
      value.section_title,
      `${label}.landing.section_title`,
    ),
    section_prose: requireNonEmptyString(
      value.section_prose,
      `${label}.landing.section_prose`,
    ),
  };
}

/**
 * @param {unknown} raw
 * @returns {ExamplesManifest}
 */
export function parseExamplesManifest(raw) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("examples/manifest.yaml must be a YAML mapping");
  }

  const hero = requireNonEmptyString(raw.hero, "hero");
  if (!SLUG_RE.test(hero)) {
    throw new Error(`hero slug '${hero}' must be kebab-case`);
  }

  if (!Array.isArray(raw.examples) || raw.examples.length === 0) {
    throw new Error("examples must be a non-empty array");
  }

  /** @type {ExampleCatalogEntry[]} */
  const examples = [];
  const seenSlugs = new Set();

  for (const [index, entry] of raw.examples.entries()) {
    const label = `examples[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new Error(`${label} must be an object`);
    }

    const slug = requireNonEmptyString(entry.slug, `${label}.slug`);
    if (!SLUG_RE.test(slug)) {
      throw new Error(`${label}.slug '${slug}' must be kebab-case`);
    }
    if (seenSlugs.has(slug)) {
      throw new Error(`duplicate catalog slug '${slug}'`);
    }
    seenSlugs.add(slug);

    /** @type {ExampleCatalogEntry} */
    const parsed = {
      slug,
      title: requireNonEmptyString(entry.title, `${label}.title`),
      tagline: requireNonEmptyString(entry.tagline, `${label}.tagline`),
      framework: requireNonEmptyString(entry.framework, `${label}.framework`),
    };

    if (entry.commands !== undefined) {
      parsed.commands = parseCommands(entry.commands, label);
    }
    if (entry.landing !== undefined) {
      parsed.landing = parseLanding(entry.landing, label);
    }

    examples.push(parsed);
  }

  if (!seenSlugs.has(hero)) {
    throw new Error(`hero '${hero}' must match a catalog entry slug`);
  }

  const heroEntry = examples.find((entry) => entry.slug === hero);
  if (!heroEntry?.commands) {
    throw new Error(
      `hero entry '${hero}' must include commands.generate and commands.open`,
    );
  }
  if (!heroEntry.landing) {
    throw new Error(
      `hero entry '${hero}' must include landing.section_title and landing.section_prose`,
    );
  }

  return { hero, examples };
}

/**
 * @param {ExamplesManifest} manifest
 * @param {string} examplesDir — absolute path to examples/
 */
export async function assertCatalogCoversExampleDirectories(
  manifest,
  examplesDir,
) {
  const catalogSlugs = new Set(manifest.examples.map((entry) => entry.slug));
  const entries = await fs.readdir(examplesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }
    if (EXCLUDED_EXAMPLE_DIRS.has(entry.name)) {
      continue;
    }
    if (!catalogSlugs.has(entry.name)) {
      throw new Error(
        `examples/${entry.name}/ is not listed in examples/manifest.yaml`,
      );
    }
  }
}

/**
 * @param {ExamplesManifest} manifest
 * @param {string} examplesDir — absolute path to examples/
 */
export async function assertExampleDirectoriesExist(manifest, examplesDir) {
  for (const entry of manifest.examples) {
    const projectDir = path.join(examplesDir, entry.slug);
    try {
      const stat = await fs.stat(projectDir);
      if (!stat.isDirectory()) {
        throw new Error(`examples/${entry.slug} exists but is not a directory`);
      }
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") {
        throw new Error(
          `catalog slug '${entry.slug}' has no examples/${entry.slug}/ folder`,
        );
      }
      throw error;
    }
  }
}

/**
 * @param {string} repoRoot — absolute path to repository root
 * @returns {Promise<ExamplesManifest>}
 */
export async function loadExamplesManifest(repoRoot) {
  const manifestPath = path.join(repoRoot, "examples", MANIFEST_FILENAME);
  const source = await fs.readFile(manifestPath, "utf8");
  const parsed = parseYaml(source);
  const manifest = parseExamplesManifest(parsed);
  await assertExampleDirectoriesExist(
    manifest,
    path.join(repoRoot, "examples"),
  );
  await assertCatalogCoversExampleDirectories(
    manifest,
    path.join(repoRoot, "examples"),
  );
  return manifest;
}

/**
 * Collapse HTML and whitespace for landing §04 prose comparisons.
 * @param {string} text
 */
export function normalizeLandingProse(text) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {ExamplesManifest} manifest
 * @returns {ExampleCatalogEntry}
 */
export function getHeroExample(manifest) {
  const heroEntry = manifest.examples.find(
    (entry) => entry.slug === manifest.hero,
  );
  if (!heroEntry) {
    throw new Error(`hero '${manifest.hero}' is missing from catalog`);
  }
  return heroEntry;
}
