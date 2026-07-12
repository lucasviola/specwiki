import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import {
  buildWiki,
  escapeHtml,
  wrapHtml,
  writeHtmlWiki,
  writeWiki,
} from "../../src/output/wiki.js";
import type { ParsedSpec } from "../../src/types.js";

const tempDirs: string[] = [];
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.setVerbose(false);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  log.setVerbose(false);
  stderrSpy.mockRestore();
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

function sampleSpec(overrides: Partial<ParsedSpec> = {}): ParsedSpec {
  return {
    file: {
      path: "/tmp/SPEC.md",
      relativePath: "SPEC.md",
      category: "root",
      title: "Project Specification",
    },
    frontmatter: {},
    title: "Custom Spec Title",
    description: "Short description.",
    sections: [
      {
        level: 2,
        title: "Requirements",
        content: "Must preserve markdown.",
        anchor: "requirements",
      },
    ],
    rawContent: "## Requirements\n\nMust preserve markdown.",
    ...overrides,
  };
}

describe("escapeHtml", () => {
  it("escapes ampersands, angle brackets, and quotes", () => {
    expect(escapeHtml("A & B <tag> \"quoted\" 'apos'")).toBe(
      "A &amp; B &lt;tag&gt; &quot;quoted&quot; &#39;apos&#39;",
    );
  });

  it("escapes script injection payloads", () => {
    const malicious = '<script>alert("x")</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<script>");
    expect(escaped).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });

  it("leaves safe text unchanged", () => {
    expect(escapeHtml("Architecture Overview")).toBe("Architecture Overview");
  });
});

describe("wrapHtml", () => {
  it("produces valid page structure with escaped title", () => {
    const html = wrapHtml("Evil <img src=x onerror=alert(1)>", "<p>Body</p>");

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('name="viewport"');
    expect(html).toContain(
      "<title>Evil &lt;img src=x onerror=alert(1)&gt; — Spec Wiki</title>",
    );
    expect(html).toContain(
      '<nav><a href="index.html">← Back to index</a></nav>',
    );
    expect(html).toContain("<p>Body</p>");
    expect(html).not.toMatch(/<title>[^<]*<img/);
  });

  it("escapes ampersands in title without double-escaping body", () => {
    const html = wrapHtml("Tom & Jerry", "<p>Content &amp; more</p>");
    expect(html).toContain("<title>Tom &amp; Jerry — Spec Wiki</title>");
    expect(html).toContain("<p>Content &amp; more</p>");
  });
});

describe("buildWiki", () => {
  it("builds index and page content with table of contents", () => {
    const wiki = buildWiki([sampleSpec()]);

    expect(wiki.pages).toHaveLength(1);
    expect(wiki.pages[0].slug).toBe("spec");
    expect(wiki.pages[0].content).toContain("# Custom Spec Title");
    expect(wiki.pages[0].content).toContain("## Table of Contents");
    expect(wiki.indexContent).toContain("# Spec Wiki");
    expect(wiki.indexContent).toContain("[Custom Spec Title](spec.md)");
  });

  it("derives slug from nested paths", () => {
    const wiki = buildWiki([
      sampleSpec({
        file: {
          path: "/tmp/docs/specs/architecture.md",
          relativePath: "docs/specs/architecture.md",
          category: "docs-specs",
          title: "Architecture",
        },
      }),
    ]);

    expect(wiki.pages[0].slug).toBe("docs-specs-architecture");
  });

  it("falls back to untitled slug when path strips to empty", () => {
    const wiki = buildWiki([
      sampleSpec({
        title: "Dashes",
        file: {
          path: "/tmp/---.md",
          relativePath: "---.md",
          category: "root",
          title: "Dashes",
        },
      }),
    ]);

    expect(wiki.pages[0].slug).toBe("untitled");
    expect(wiki.indexContent).toContain("[Dashes](untitled.md)");
  });

  it("omits table of contents when spec has no sections", () => {
    const wiki = buildWiki([
      sampleSpec({
        sections: [],
        rawContent: "Body only.",
      }),
    ]);

    expect(wiki.pages[0].content).not.toContain("## Table of Contents");
    expect(wiki.pages[0].content).toContain("Body only.");
  });

  it("omits description block when spec has no description", () => {
    const wiki = buildWiki([
      sampleSpec({
        description: "",
      }),
    ]);

    expect(wiki.pages[0].content).toContain("# Custom Spec Title");
    expect(wiki.pages[0].content).not.toContain("Short description.");
  });

  it("groups index by category label and sorts categories alphabetically", () => {
    const wiki = buildWiki([
      sampleSpec({
        file: {
          path: "/tmp/openspec/change.md",
          relativePath: "openspec/change.md",
          category: "openspec",
          title: "Change",
        },
      }),
      sampleSpec({
        file: {
          path: "/tmp/AGENTS.md",
          relativePath: "AGENTS.md",
          category: "root",
          title: "Agents",
        },
      }),
      sampleSpec({
        file: {
          path: "/tmp/custom/foo.md",
          relativePath: "custom/foo.md",
          category: "custom-cat",
          title: "Custom",
        },
      }),
    ]);

    const rootIndex = wiki.indexContent.indexOf("## Project Root");
    const openspecIndex = wiki.indexContent.indexOf("## OpenSpec");
    const customIndex = wiki.indexContent.indexOf("## custom-cat");

    expect(rootIndex).toBeGreaterThan(-1);
    expect(openspecIndex).toBeGreaterThan(-1);
    expect(customIndex).toBeGreaterThan(-1);
    expect(customIndex).toBeLessThan(openspecIndex);
    expect(openspecIndex).toBeLessThan(rootIndex);
    expect(wiki.indexContent).toContain("**3** spec files indexed.");
  });

  it("escapes HTML characters in page titles", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([
      sampleSpec({
        title: 'Title <script>alert("x")</script>',
      }),
    ]);

    await writeHtmlWiki(outputDir, wiki);

    const html = await fs.readFile(
      path.join(outputDir, "html", "spec.html"),
      "utf-8",
    );
    expect(html).toContain(
      "<title>Title &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; — Spec Wiki</title>",
    );
    expect(html).not.toMatch(/<title>[^<]*<script>/);
  });

  it("escapes ampersand and apostrophe titles in written HTML", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([
      sampleSpec({
        title: "Tom & Jerry's Rules",
      }),
    ]);

    await writeHtmlWiki(outputDir, wiki);

    const html = await fs.readFile(
      path.join(outputDir, "html", "spec.html"),
      "utf-8",
    );
    expect(html).toContain(
      "<title>Tom &amp; Jerry&#39;s Rules — Spec Wiki</title>",
    );
  });
});

describe("writeHtmlWiki", () => {
  it("writes index.html with structure and categorized content", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    await writeHtmlWiki(outputDir, wiki);

    const indexHtml = await fs.readFile(
      path.join(outputDir, "html", "index.html"),
      "utf-8",
    );
    expect(indexHtml).toMatch(/^<!DOCTYPE html>/);
    expect(indexHtml).toContain("<title>Spec Wiki — Spec Wiki</title>");
    expect(indexHtml).toContain(
      '<nav><a href="index.html">← Back to index</a></nav>',
    );
    expect(indexHtml).toContain("Custom Spec Title");
  });
});

describe("writeWiki", () => {
  it("writes markdown index and pages", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const written = await writeWiki(outputDir, wiki);

    expect(written).toHaveLength(2);
    expect(
      await fs.readFile(path.join(outputDir, "index.md"), "utf-8"),
    ).toContain("# Spec Wiki");
    expect(
      await fs.readFile(path.join(outputDir, "spec.md"), "utf-8"),
    ).toContain("Custom Spec Title");
  });

  it("confines writes to the resolved output directory", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const written = await writeWiki(outputDir, wiki);

    for (const filePath of written) {
      expect(filePath.startsWith(outputDir + path.sep)).toBe(true);
    }
  });

  it("emits output.write per markdown file when verbose", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);
    log.setVerbose(true);

    const wiki = buildWiki([sampleSpec()]);
    await writeWiki(outputDir, wiki);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.write",
    );

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.relativePath).sort()).toEqual([
      "index.md",
      "spec.md",
    ]);
    for (const event of events) {
      expect(JSON.stringify(event)).not.toMatch(/rawContent|frontmatter/);
    }
  });

  it("does not emit output.write when verbose is disabled", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    await writeWiki(outputDir, wiki);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.write",
    );
    expect(events).toHaveLength(0);
  });

  it("emits output.error and rethrows on write failure", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockRejectedValueOnce(new Error("disk full"));

    await expect(writeWiki(outputDir, wiki)).rejects.toThrow("disk full");

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("disk full");
    expect(errorEvent?.relativePath).toBe("index.md");
    writeSpy.mockRestore();
  });

  it("stringifies non-Error index write failures in output.error", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockRejectedValueOnce("index write failed");

    await expect(writeWiki(outputDir, wiki)).rejects.toBe("index write failed");

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("index write failed");
    expect(errorEvent?.relativePath).toBe("index.md");
    writeSpy.mockRestore();
  });

  it("emits output.error and rethrows on page write failure", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-md-"));
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce("page write failed");

    await expect(writeWiki(outputDir, wiki)).rejects.toBe("page write failed");

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("page write failed");
    expect(errorEvent?.relativePath).toBe("spec.md");
    writeSpy.mockRestore();
  });

  it("emits output.error and rethrows on mkdir failure", async () => {
    const outputDir = path.join(os.tmpdir(), "specwiki-mkdir-fail");
    const wiki = buildWiki([sampleSpec()]);
    const mkdirSpy = vi
      .spyOn(fs, "mkdir")
      .mockRejectedValueOnce(new Error("permission denied"));

    await expect(writeWiki(outputDir, wiki)).rejects.toThrow(
      "permission denied",
    );

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("permission denied");
    expect(errorEvent?.relativePath).toBe(".");
    mkdirSpy.mockRestore();
  });

  it("stringifies non-Error mkdir failures in output.error", async () => {
    const outputDir = path.join(os.tmpdir(), "specwiki-mkdir-fail");
    const wiki = buildWiki([sampleSpec()]);
    const mkdirSpy = vi.spyOn(fs, "mkdir").mockRejectedValueOnce("mkdir boom");

    await expect(writeWiki(outputDir, wiki)).rejects.toBe("mkdir boom");

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("mkdir boom");
    expect(errorEvent?.relativePath).toBe(".");
    mkdirSpy.mockRestore();
  });
});
