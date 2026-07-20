import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const readmePath = path.join(projectRoot, "README.md");
const launchCopyPath = path.join(projectRoot, "docs/marketing/launch-copy.md");
const wikiTemplatesDir = path.join(projectRoot, "src/output/html/templates");

const BLOG_URL = "https://specwiki.ai/blog/";

function readLaunchCopy(): string {
  return fs.readFileSync(launchCopyPath, "utf8");
}

function sectionBetween(
  doc: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = doc.indexOf(startHeading);
  expect(start, `missing section: ${startHeading}`).toBeGreaterThanOrEqual(0);
  const end = doc.indexOf(endHeading, start + startHeading.length);
  expect(end, `missing end heading after ${startHeading}`).toBeGreaterThan(
    start,
  );
  return doc.slice(start, end);
}

describe("S28.5 README blog discovery link", () => {
  it("points to the public blog URL after Install", () => {
    const readme = fs.readFileSync(readmePath, "utf8");

    expect(readme).toContain(BLOG_URL);

    const installIndex = readme.indexOf("## Install");
    const usageIndex = readme.indexOf("## Usage");
    const blogIndex = readme.indexOf(BLOG_URL);

    expect(installIndex).toBeGreaterThanOrEqual(0);
    expect(usageIndex).toBeGreaterThan(installIndex);
    expect(blogIndex).toBeGreaterThan(installIndex);
    expect(blogIndex).toBeLessThan(usageIndex);
  });
});

describe("S28.5 launch-copy blog placeholders", () => {
  it("includes blog URL in Reddit, LinkedIn, and Hacker News variants", () => {
    const doc = readLaunchCopy();

    const reddit = sectionBetween(doc, "## Reddit", "## LinkedIn");
    const linkedIn = sectionBetween(doc, "## LinkedIn", "## Hacker News");
    const hackerNews = sectionBetween(doc, "## Hacker News", "## X / Twitter");

    for (const [channel, section] of [
      ["Reddit", reddit],
      ["LinkedIn", linkedIn],
      ["Hacker News", hackerNews],
    ] as const) {
      expect(section, `${channel} variant missing blog URL`).toContain(
        BLOG_URL,
      );
    }
  });
});

describe("S28.5 wiki output unchanged", () => {
  it("does not add blog links to HTML wiki templates", () => {
    const templateFiles = fs
      .readdirSync(wikiTemplatesDir, { recursive: true })
      .filter((entry): entry is string => typeof entry === "string")
      .filter((entry) => entry.endsWith(".mustache"))
      .map((entry) => path.join(wikiTemplatesDir, entry));

    for (const file of templateFiles) {
      const contents = fs.readFileSync(file, "utf8");
      expect(
        contents,
        `${path.relative(projectRoot, file)} must not link blog`,
      ).not.toContain("specwiki.ai/blog");
    }
  });
});
