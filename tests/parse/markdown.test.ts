import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marked } from "marked";
import { log } from "../../src/core/Logger.js";
import {
  createAnchorAllocator,
  parseSpecFile,
  renderMarkdown,
  slugify,
} from "../../src/parse/markdown.js";
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

  it("disambiguates duplicate section anchors", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `## Same Title

First.

## Same Title

Second.
`,
    );
    const parsed = await parseSpecFile(file);

    expect(parsed.sections.map((section) => section.anchor)).toEqual([
      "same-title",
      "same-title-2",
    ]);
  });

  it("uses fallback anchors for punctuation-only headings", async () => {
    const file = await writeTempSpec("SPEC.md", "## !!!\n\nBody.");
    const parsed = await parseSpecFile(file);

    expect(parsed.sections[0].anchor).toBe("section-1");
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

  it("falls back to markdown body when frontmatter YAML is invalid", async () => {
    log.setVerbose(true);
    const file = await writeTempSpec(
      "experience-example.md",
      `---
name: Drift
sources:
  - {planning_artifacts}/prds/quill-2025-08-15/prd.md
---

Intro paragraph for the spec.

## First Section

Section body.
`,
    );

    const parsed = await parseSpecFile(file);

    expect(parsed.title).toBe("Fallback Title");
    expect(parsed.description).toBe("Intro paragraph for the spec.");
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0]).toMatchObject({
      level: 2,
      title: "First Section",
    });
    expect(parsed.rawContent).toContain("Intro paragraph for the spec.");
    expect(parsed.rawContent).not.toContain("{planning_artifacts}");

    const lines = parseStderrLines();
    expect(lines).toEqual([
      {
        event: "parse.frontmatter-fallback",
        level: "info",
        relativePath: "experience-example.md",
      },
      {
        event: "parse.file",
        level: "info",
        relativePath: "experience-example.md",
        sectionCount: 1,
      },
    ]);
  });

  it("does not emit parse.frontmatter-fallback when verbose is disabled", async () => {
    log.setVerbose(false);
    const file = await writeTempSpec(
      "SPEC.md",
      `---
title: [unclosed
---

Body text.
`,
    );

    const parsed = await parseSpecFile(file);

    expect(parsed.rawContent).toBe("Body text.\n");
    expect(parseStderrLines()).toEqual([]);
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

  it("emits render.error and rethrows on parse failure regardless of verbose", () => {
    log.setVerbose(false);
    const parseSpy = vi.spyOn(marked, "parse").mockImplementationOnce(() => {
      throw new Error("parse boom");
    });

    expect(() => renderMarkdown("# bad")).toThrow("parse boom");

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "render.error",
      level: "error",
      message: "parse boom",
    });
    expect(JSON.stringify(lines[0])).not.toContain("<script>");
    parseSpy.mockRestore();
  });

  it("stringifies non-Error parse failures in render.error", () => {
    log.setVerbose(false);
    const parseSpy = vi.spyOn(marked, "parse").mockImplementationOnce(() => {
      throw "render failed";
    });

    expect(() => renderMarkdown("content")).toThrow();

    const lines = parseStderrLines();
    expect(lines[0]).toMatchObject({
      event: "render.error",
      level: "error",
      message: "render failed",
    });
    parseSpy.mockRestore();
  });

  it("does not emit info-level logs during successful render", () => {
    log.setVerbose(true);
    renderMarkdown("# Title");
    const infoEvents = parseStderrLines().filter(
      (line) => line.level === "info",
    );
    expect(infoEvents).toHaveLength(0);
  });

  it("renders GFM tables", () => {
    const html = renderMarkdown(
      "| Column | Value |\n| ------ | ----- |\n| foo    | bar   |",
    );

    expect(html).toContain("<table>");
    expect(html).toContain("<th>Column</th>");
    expect(html).toContain("<td>foo</td>");
  });

  it("renders GFM strikethrough and task lists", () => {
    const html = renderMarkdown("~~removed~~\n\n- [x] done\n- [ ] todo");

    expect(html).toContain("<del>removed</del>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
  });

  it("adds heading ids for h2-h6 matching slugify", () => {
    const html = renderMarkdown("## My Section\n\n### Nested Section");

    expect(html).toContain('<h2 id="my-section">');
    expect(html).toContain('<h3 id="nested-section">');
    expect(html).not.toMatch(/<h1 id=/);
  });

  it("disambiguates duplicate heading ids", () => {
    const html = renderMarkdown("## Same\n\n### Same");

    expect(html).toContain('<h2 id="same">');
    expect(html).toContain('<h3 id="same-2">');
    expect(html.match(/id="same"/g)).toHaveLength(1);
  });

  it("uses fallback ids for punctuation-only headings", () => {
    const html = renderMarkdown("## !!!\n\n## ???");

    expect(html).toContain('<h2 id="section-1">');
    expect(html).toContain('<h2 id="section-2">');
  });

  it("escapes script tags in unhighlighted code blocks", () => {
    const html = renderMarkdown("```unknown\n<script>alert(1)</script>\n```");

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("matches heading ids to parsed section anchors", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `## Level 2: Details!

Body.

### Level 3 — Notes

More body.
`,
    );
    const parsed = await parseSpecFile(file);
    const html = renderMarkdown(parsed.rawContent);

    for (const section of parsed.sections.filter(
      (entry) => entry.level >= 2 && entry.level <= 6,
    )) {
      expect(html).toContain(`id="${section.anchor}"`);
    }
  });

  it("matches heading ids when rendering full page content with specwiki toc", async () => {
    const file = await writeTempSpec(
      "SPEC.md",
      `## Requirements

Body.

## Table of Contents

User section.
`,
    );
    const parsed = await parseSpecFile(file);
    const { buildWiki } = await import("../../src/output/wiki.js");
    const wiki = buildWiki([parsed]);
    const html = renderMarkdown(wiki.pages[0].content);

    expect(html).toContain('id="specwiki-toc"');
    expect(html).toContain('id="requirements"');
    expect(html).toContain('id="table-of-contents"');
    for (const section of parsed.sections.filter(
      (entry) => entry.level >= 2 && entry.level <= 6,
    )) {
      expect(html).toContain(`id="${section.anchor}"`);
    }
  });

  it("highlights fenced code blocks with highlight.js classes", () => {
    const html = renderMarkdown("```typescript\nconst x: number = 1;\n```");

    expect(html).toContain('class="hljs language-typescript"');
    expect(html).toMatch(/hljs-/);
  });

  it("falls back silently for unknown highlight languages", () => {
    const html = renderMarkdown("```not-a-real-language\nplain text\n```");

    expect(html).toContain("<pre><code>plain text</code></pre>");
    expect(html).not.toContain("hljs");
    expect(parseStderrLines()).toEqual([]);
  });

  it("emits render.error when highlight.js throws for a registered language", async () => {
    const hljs = await import("highlight.js/lib/core");
    const highlightSpy = vi
      .spyOn(hljs.default, "highlight")
      .mockImplementationOnce(() => {
        throw new Error("highlight boom");
      });

    const html = renderMarkdown("```typescript\nconst x = 1;\n```");

    expect(html).toContain("<pre><code>");
    expect(html).not.toContain("hljs");
    expect(parseStderrLines()).toContainEqual(
      expect.objectContaining({
        event: "render.error",
        level: "error",
        message: "highlight boom",
      }),
    );

    highlightSpy.mockRestore();
  });

  it("applies linkResolver to markdown links", () => {
    const html = renderMarkdown("[changelog](CHANGELOG.md)", {
      linkResolver: (href) =>
        href === "CHANGELOG.md" ? "changelog.html" : href,
    });

    expect(html).toContain('href="changelog.html"');
    expect(html).not.toContain('href="CHANGELOG.md"');
  });

  it("preserves link title attributes through linkResolver", () => {
    const html = renderMarkdown('[docs](./guide.md "User guide")', {
      linkResolver: () => "guide.html",
    });

    expect(html).toContain('href="guide.html"');
    expect(html).toContain('title="User guide"');
  });

  it("escapes malicious href values from linkResolver output", () => {
    const html = renderMarkdown("[x](safe.md)", {
      linkResolver: () => '"><script>alert(1)</script>',
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("renders markdown links unchanged without linkResolver", () => {
    const html = renderMarkdown("[changelog](CHANGELOG.md)");
    expect(html).toContain('href="CHANGELOG.md"');
  });
});

describe("slugify", () => {
  it("matches parser anchor conventions", () => {
    expect(slugify("Level 2: Details!")).toBe("level-2-details");
    expect(slugify("Level 3 — Notes")).toBe("level-3-notes");
  });
});

describe("createAnchorAllocator", () => {
  it("disambiguates repeated titles and handles empty slugs", () => {
    const allocate = createAnchorAllocator();

    expect(allocate("Same")).toBe("same");
    expect(allocate("Same")).toBe("same-2");
    expect(allocate("!!!")).toBe("section-1");
    expect(allocate("!!!")).toBe("section-2");
  });
});
