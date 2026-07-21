import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertCatalogCoversExampleDirectories,
  assertExampleDirectoriesExist,
  getHeroExample,
  loadExamplesManifest,
  normalizeLandingProse,
  parseExamplesManifest,
} from "../../scripts/lib/examples-manifest.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("examples/manifest.yaml", () => {
  it("loads and validates the repo manifest", async () => {
    const manifest = await loadExamplesManifest(projectRoot);

    expect(manifest.hero).toBe("agent-harness-parcel");
    expect(manifest.examples.map((entry) => entry.slug)).toEqual([
      "agent-harness-parcel",
      "bmad-research-relay",
      "article-research-mycelium",
    ]);
  });

  it("requires the hero slug to match an existing examples/ folder", async () => {
    const manifest = await loadExamplesManifest(projectRoot);
    const heroDir = path.join(projectRoot, "examples", manifest.hero);
    const stat = await fs.stat(heroDir);

    expect(stat.isDirectory()).toBe(true);
  });

  it("requires commands on the hero entry for docs parity", async () => {
    const manifest = await loadExamplesManifest(projectRoot);
    const hero = getHeroExample(manifest);

    expect(hero.commands?.generate).toBe(
      "npx @lucasviola/specwiki generate --project examples/agent-harness-parcel",
    );
    expect(hero.commands?.open).toBe(
      "npx @lucasviola/specwiki open --project examples/agent-harness-parcel",
    );
  });

  it("documents landing §04 copy on the hero entry (manual sync until S27.4)", async () => {
    const manifest = await loadExamplesManifest(projectRoot);
    const hero = getHeroExample(manifest);
    const html = await fs.readFile(
      path.join(projectRoot, "site/index.html"),
      "utf8",
    );
    const sectionProseMatch = html.match(
      /<p class="section-prose">([\s\S]*?)<\/p>/,
    );

    expect(hero.landing?.section_title).toBe(
      "Three root files in. A browsable wiki out.",
    );
    expect(html).toContain(hero.landing?.section_title);
    expect(sectionProseMatch, "landing §04 section-prose").not.toBeNull();
    expect(normalizeLandingProse(sectionProseMatch![1])).toBe(
      normalizeLandingProse(hero.landing!.section_prose),
    );
  });

  it("requires every mock-project folder under examples/ to appear in the catalog", async () => {
    const manifest = await loadExamplesManifest(projectRoot);
    await expect(
      assertCatalogCoversExampleDirectories(
        manifest,
        path.join(projectRoot, "examples"),
      ),
    ).resolves.toBeUndefined();
  });
});

describe("parseExamplesManifest", () => {
  /** @type {string | undefined} */
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-manifest-"));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects a hero slug that is missing from the catalog", () => {
    expect(() =>
      parseExamplesManifest({
        hero: "missing-slug",
        examples: [
          {
            slug: "agent-harness-parcel",
            title: "Hero",
            tagline: "Tagline",
            framework: "agent-harness",
            commands: { generate: "gen", open: "open" },
          },
        ],
      }),
    ).toThrow("hero 'missing-slug' must match a catalog entry slug");
  });

  it("rejects duplicate catalog slugs", () => {
    expect(() =>
      parseExamplesManifest({
        hero: "agent-harness-parcel",
        examples: [
          {
            slug: "agent-harness-parcel",
            title: "One",
            tagline: "Tagline",
            framework: "agent-harness",
            commands: { generate: "gen", open: "open" },
            landing: {
              section_title: "Title",
              section_prose: "Prose",
            },
          },
          {
            slug: "agent-harness-parcel",
            title: "Two",
            tagline: "Tagline",
            framework: "agent-harness",
          },
        ],
      }),
    ).toThrow("duplicate catalog slug 'agent-harness-parcel'");
  });

  it("rejects a hero entry without commands", () => {
    expect(() =>
      parseExamplesManifest({
        hero: "agent-harness-parcel",
        examples: [
          {
            slug: "agent-harness-parcel",
            title: "Hero",
            tagline: "Tagline",
            framework: "agent-harness",
          },
        ],
      }),
    ).toThrow(
      "hero entry 'agent-harness-parcel' must include commands.generate and commands.open",
    );
  });

  it("rejects a hero entry without landing copy", () => {
    expect(() =>
      parseExamplesManifest({
        hero: "agent-harness-parcel",
        examples: [
          {
            slug: "agent-harness-parcel",
            title: "Hero",
            tagline: "Tagline",
            framework: "agent-harness",
            commands: { generate: "gen", open: "open" },
          },
        ],
      }),
    ).toThrow(
      "hero entry 'agent-harness-parcel' must include landing.section_title and landing.section_prose",
    );
  });

  it("assertExampleDirectoriesExist fails when a catalog folder is missing", async () => {
    const manifest = parseExamplesManifest({
      hero: "agent-harness-parcel",
      examples: [
        {
          slug: "agent-harness-parcel",
          title: "Hero",
          tagline: "Tagline",
          framework: "agent-harness",
          commands: { generate: "gen", open: "open" },
          landing: {
            section_title: "Title",
            section_prose: "Prose",
          },
        },
      ],
    });

    await expect(
      assertExampleDirectoriesExist(manifest, tempDir),
    ).rejects.toThrow(
      "catalog slug 'agent-harness-parcel' has no examples/agent-harness-parcel/ folder",
    );
  });
});
