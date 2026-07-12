import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseSpecFile, renderMarkdown } from "../../src/parse/markdown.js";
import type { SpecFile } from "../../src/types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

async function writeTempSpec(
  relativePath: string,
  content: string,
): Promise<SpecFile> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-parse-"));
  tempDirs.push(dir);
  const filePath = path.join(dir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");

  return {
    path: filePath,
    relativePath,
    category: "root",
    title: "Fallback Title",
  };
}

describe("parseSpecFile", () => {
  it("uses frontmatter title and extracts sections", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `---
title: Frontmatter Title
---

Intro paragraph for the spec.

## First Section

Section body.

### Nested Section

Nested body.
`,
    );

    const parsed = await parseSpecFile(file);

    expect(parsed.title).toBe("Frontmatter Title");
    expect(parsed.description).toBe("Intro paragraph for the spec.");
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]).toMatchObject({
      level: 2,
      title: "First Section",
      anchor: "first-section",
    });
    expect(parsed.sections[1]).toMatchObject({
      level: 3,
      title: "Nested Section",
    });
  });

  it("falls back to discovered title when frontmatter title is missing", async () => {
    const file = await writeTempSpec("notes.md", "# Heading only\n");
    const parsed = await parseSpecFile(file);

    expect(parsed.title).toBe("Fallback Title");
    expect(parsed.description).toBe("");
  });
});

describe("renderMarkdown", () => {
  it("renders markdown to HTML", () => {
    const html = renderMarkdown("# Hello\n\n**bold**");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
    expect(html).toContain("<strong>bold</strong>");
  });
});
