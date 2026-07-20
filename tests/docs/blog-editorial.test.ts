import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const editorialPath = path.join(projectRoot, "docs/blog/EDITORIAL.md");
const templatePath = path.join(projectRoot, "site/blog/_template.md");
const seedPostPath = path.join(
  projectRoot,
  "site/blog/2026-07-20-seed-post.md",
);

function readEditorial(): string {
  return fs.readFileSync(editorialPath, "utf8");
}

describe("S28.4 docs/blog/EDITORIAL.md", () => {
  it("exists at docs/blog/EDITORIAL.md", () => {
    expect(fs.existsSync(editorialPath)).toBe(true);
  });

  it("documents content lanes, voice, cross-linking, cadence, and authorship", () => {
    const doc = readEditorial();

    expect(doc).toMatch(/Field Notes/i);
    expect(doc).toMatch(/Release Stories/i);
    expect(doc).toMatch(/Ecosystem/i);
    expect(doc).toMatch(/field-notes/);
    expect(doc).toMatch(/release-story/);
    expect(doc).toMatch(/ecosystem/);

    expect(doc).toMatch(/developer-credible/i);
    expect(doc).toMatch(
      /unsupported superlatives|best.*revolutionary|revolutionary/i,
    );
    expect(doc).toMatch(/CHANGELOG\.md/);
    expect(doc).toMatch(/adr\/index\.md|docs\/adr/);
    expect(doc).toMatch(/duplicate install|README/i);
    expect(doc).toMatch(/biweekly/i);
    expect(doc).toMatch(/Lucas-only|Lucas only/i);
    expect(doc).toMatch(/1\.0/);
  });

  it("documents image conventions from S28.10", () => {
    const doc = readEditorial();

    expect(doc).toMatch(/## Images/i);
    expect(doc).toMatch(/heroAlt/);
    expect(doc).toMatch(/media\/default-hero\.svg/);
    expect(doc).toMatch(/site\/blog\/media/);
    expect(doc).toMatch(/http\(s\):|remote/i);
    expect(doc).toMatch(/alt text/i);
  });

  it("points authors at the blog template and publishing workflow", () => {
    const doc = readEditorial();

    expect(doc).toMatch(/site\/blog\/_template\.md/);
    expect(doc).toMatch(/YYYY-MM-DD-your-slug\.md/);
    expect(doc).toMatch(/npm run build:site/);
  });

  it("references launch-copy brand guardrails", () => {
    const doc = readEditorial();

    expect(doc).toMatch(/launch-copy\.md/);
    expect(doc).toMatch(/\[\[specwiki\]\]/);
  });
});

describe("S28.4 seed post editorial conventions", () => {
  function readSeedBody(): string {
    const seed = fs.readFileSync(seedPostPath, "utf8");
    const parts = seed.split(/^---\n/m);
    return parts.slice(2).join("---\n").trim();
  }

  it("ships a Field Notes seed post with OG-friendly summary and inline media", () => {
    const seed = fs.readFileSync(seedPostPath, "utf8");

    expect(seed).toMatch(/^---\n/);
    expect(seed).toMatch(/lane:\s*field-notes/);
    expect(seed).toMatch(/author:\s*Lucas/);
    expect(seed).toMatch(
      /summary:\s*"specwiki already generates wikis from your repo — the blog is editorial voice for why that matters today\."/,
    );
    expect(seed).toMatch(/!\[[^\]]+\]\(media\/2026-07-20-seed-post\/[^)]+\)/);
    expect(seed).toMatch(/AGENTS\.md|\.cursor\/rules/);
    expect(seed).not.toMatch(/\bbest\b|\brevolutionary\b|\bgame-changing\b/i);
  });

  it("leads with workflow pain before the product pitch", () => {
    const body = readSeedBody();
    const painIndex = body.search(/grepping|AGENTS\.md|\.cursor\/rules/);
    const pitchIndex = body.search(/\*\*specwiki\*\* turns|specwiki turns/i);

    expect(painIndex).toBeGreaterThanOrEqual(0);
    expect(pitchIndex).toBeGreaterThan(painIndex);
  });

  it("respects launch-copy messaging guardrails in body copy", () => {
    const body = readSeedBody();

    expect(body).toMatch(/publisher voice/i);
    expect(body).toMatch(/belongs to _your_ repo|your repo/i);
    expect(body).not.toMatch(/authors specs|run agents|host documentation/i);
    expect(body).not.toMatch(/npx specwiki (list|generate|open)/);
  });

  it("links the blog template to the editorial guide", () => {
    const template = fs.readFileSync(templatePath, "utf8");

    expect(template).toMatch(/docs\/blog\/EDITORIAL\.md/);
  });
});
