import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import { parseSpecFile, renderMarkdown } from "../../src/parse/markdown.js";
import type { SpecFile } from "../../src/types.js";

const tempDirs: string[] = [];
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.setVerbose(false);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  vi.restoreAllMocks();
  log.setVerbose(false);
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

function parseStderrLines(): Record<string, unknown>[] {
  return stderrSpy.mock.calls
    .map(([chunk]) => String(chunk).trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

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
    expect(parsed.sections[0].content).toBe("Section body.");
    expect(parsed.sections[1].content).toBe("Nested body.");
  });

  it("falls back to discovered title when frontmatter title is missing", async () => {
    const file = await writeTempSpec("notes.md", "# Heading only\n");
    const parsed = await parseSpecFile(file);

    expect(parsed.title).toBe("Fallback Title");
    expect(parsed.description).toBe("");
  });

  it("falls back to discovered title when frontmatter title is not a string", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `---
title: 42
---

Body text.
`,
    );
    const parsed = await parseSpecFile(file);

    expect(parsed.title).toBe("Fallback Title");
  });

  it("preserves raw body content after frontmatter strip", async () => {
    const body = "# Main\n\nParagraph one.\n\n## Section\n\nBody text.";
    const file = await writeTempSpec(
      "SPEC.md",
      `---
title: Test
---
${body}`,
    );

    const parsed = await parseSpecFile(file);

    expect(parsed.rawContent).toBe(body);
    expect(parsed.rawContent).not.toContain("title: Test");
  });

  it("truncates description to 300 characters", async () => {
    const longParagraph = "a".repeat(400);
    const file = await writeTempSpec("SPEC.md", `${longParagraph}\n`);
    const parsed = await parseSpecFile(file);

    expect(parsed.description).toHaveLength(300);
    expect(parsed.description).toBe("a".repeat(300));
  });

  it("skips heading lines when extracting description", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `# Top Heading

## Another Heading

First real paragraph.`,
    );
    const parsed = await parseSpecFile(file);

    expect(parsed.description).toBe("First real paragraph.");
  });

  it("returns empty sections when file has no headings", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      "Plain text only.\n\nNo headings.",
    );
    const parsed = await parseSpecFile(file);

    expect(parsed.sections).toEqual([]);
    expect(parsed.description).toBe("Plain text only.");
  });

  it("extracts multiple heading levels with slugified anchors", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `# Level 1

## Level 2: Details!

### Level 3 — Notes
`,
    );
    const parsed = await parseSpecFile(file);

    expect(parsed.sections).toHaveLength(3);
    expect(parsed.sections[0]).toMatchObject({
      level: 1,
      title: "Level 1",
      anchor: "level-1",
    });
    expect(parsed.sections[1]).toMatchObject({
      level: 2,
      title: "Level 2: Details!",
      anchor: "level-2-details",
    });
    expect(parsed.sections[2]).toMatchObject({
      level: 3,
      title: "Level 3 — Notes",
      anchor: "level-3-notes",
    });
  });

  it("emits parse.file on stderr when verbose is enabled", async () => {
    log.setVerbose(true);
    const file = await writeTempSpec("SPEC.md", "Hello world.\n");

    await parseSpecFile(file);

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "parse.file",
      level: "info",
      relativePath: "SPEC.md",
      sectionCount: 0,
    });
    expect(JSON.stringify(lines[0])).not.toContain("Hello world");
  });

  it("does not emit parse.file when verbose is disabled", async () => {
    log.setVerbose(false);
    const file = await writeTempSpec("SPEC.md", "Hello world.\n");

    await parseSpecFile(file);

    expect(parseStderrLines()).toEqual([]);
  });

  it("emits parse.error on read failure regardless of verbose", async () => {
    log.setVerbose(false);
    const file: SpecFile = {
      path: path.join(os.tmpdir(), "nonexistent-specwiki-file.md"),
      relativePath: "missing.md",
      category: "root",
      title: "Missing",
    };

    await expect(parseSpecFile(file)).rejects.toThrow();

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "parse.error",
      level: "error",
      path: "missing.md",
    });
    expect(lines[0].message).toBeTruthy();
    expect(JSON.stringify(lines[0])).not.toMatch(/Hello world|rawContent/);
  });

  it("emits parse.error on invalid frontmatter regardless of verbose", async () => {
    log.setVerbose(false);
    const file = await writeTempSpec(
      "SPEC.md",
      `---
title: [unclosed
---

Body text.
`,
    );

    await expect(parseSpecFile(file)).rejects.toThrow();

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "parse.error",
      level: "error",
      path: "SPEC.md",
    });
    expect(lines[0].message).toBeTruthy();
  });

  it("stringifies non-Error rejections in parse.error message", async () => {
    log.setVerbose(false);
    const file = await writeTempSpec("SPEC.md", "Body text.\n");
    const readSpy = vi
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce("disk failure");

    await expect(parseSpecFile(file)).rejects.toBe("disk failure");

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "parse.error",
      level: "error",
      path: "SPEC.md",
      message: "disk failure",
    });

    readSpy.mockRestore();
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
