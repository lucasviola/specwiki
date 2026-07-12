import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import {
  buildWiki,
  escapeHtml,
  pageSlug,
  writeHtmlWiki,
  writeWiki,
} from "../../src/output/wiki.js";
import { resetHtmlRendererCache } from "../../src/output/html/renderer.js";
import type { ParsedSpec, WikiOutput } from "../../src/types.js";

const tempDirs: string[] = [];
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.setVerbose(false);
  resetHtmlRendererCache();
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  log.setVerbose(false);
  resetHtmlRendererCache();
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

function maliciousWiki(slug: string): WikiOutput {
  const spec = sampleSpec();
  return {
    indexContent: "# Spec Wiki\n",
    pages: [
      {
        slug,
        title: spec.title,
        category: spec.file.category,
        content: "# Malicious\n\nTraversal probe.",
        sourcePath: spec.file.relativePath,
      },
    ],
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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

describe("slug collision", () => {
  function hashSuffix(relativePath: string): string {
    return createHash("sha256").update(relativePath).digest("hex").slice(0, 8);
  }

  it("disambiguates duplicate slugs with hash suffix on later paths", () => {
    const flat = sampleSpec({
      title: "Flat Bar",
      file: {
        path: "/tmp/specs/foo-bar.md",
        relativePath: "specs/foo-bar.md",
        category: "specs",
        title: "Flat Bar",
      },
    });
    const nested = sampleSpec({
      title: "Nested Bar",
      file: {
        path: "/tmp/specs/foo/bar.md",
        relativePath: "specs/foo/bar.md",
        category: "specs",
        title: "Nested Bar",
      },
    });

    const wiki = buildWiki([flat, nested]);
    const slugs = wiki.pages.map((page) => page.slug).sort();

    expect(slugs).toEqual([
      "specs-foo-bar",
      `specs-foo-bar-${hashSuffix("specs/foo/bar.md")}`,
    ]);
  });

  it("disambiguates three-way slug collisions with unique hash suffixes", () => {
    const paths = [
      "specs/a-b/c.md",
      "specs/a/b-c.md",
      "specs/a/b/c.md",
    ] as const;

    const wiki = buildWiki(
      paths.map((relativePath, index) =>
        sampleSpec({
          title: `Spec ${index + 1}`,
          file: {
            path: `/tmp/${relativePath}`,
            relativePath,
            category: "specs",
            title: `Spec ${index + 1}`,
          },
        }),
      ),
    );

    const slugs = wiki.pages.map((page) => page.slug).sort();
    expect(slugs).toEqual([
      "specs-a-b-c",
      `specs-a-b-c-${hashSuffix("specs/a/b/c.md")}`,
      `specs-a-b-c-${hashSuffix("specs/a/b-c.md")}`,
    ]);
    expect(new Set(slugs).size).toBe(3);
  });

  it("emits output.slug-collision for each disambiguated path in a three-way collision", () => {
    log.setVerbose(true);

    buildWiki([
      sampleSpec({
        title: "Spec 1",
        file: {
          path: "/tmp/specs/a-b/c.md",
          relativePath: "specs/a-b/c.md",
          category: "specs",
          title: "Spec 1",
        },
      }),
      sampleSpec({
        title: "Spec 2",
        file: {
          path: "/tmp/specs/a/b-c.md",
          relativePath: "specs/a/b-c.md",
          category: "specs",
          title: "Spec 2",
        },
      }),
      sampleSpec({
        title: "Spec 3",
        file: {
          path: "/tmp/specs/a/b/c.md",
          relativePath: "specs/a/b/c.md",
          category: "specs",
          title: "Spec 3",
        },
      }),
    ]);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.slug-collision",
    );

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.sourcePath).sort()).toEqual([
      "specs/a/b-c.md",
      "specs/a/b/c.md",
    ]);
  });

  it("keeps index links aligned with disambiguated slugs", () => {
    const flat = sampleSpec({
      title: "Flat Bar",
      file: {
        path: "/tmp/specs/foo-bar.md",
        relativePath: "specs/foo-bar.md",
        category: "specs",
        title: "Flat Bar",
      },
    });
    const nested = sampleSpec({
      title: "Nested Bar",
      file: {
        path: "/tmp/specs/foo/bar.md",
        relativePath: "specs/foo/bar.md",
        category: "specs",
        title: "Nested Bar",
      },
    });

    const wiki = buildWiki([nested, flat]);
    const nestedSlug = `specs-foo-bar-${hashSuffix("specs/foo/bar.md")}`;

    expect(wiki.indexContent).toContain("[Flat Bar](specs-foo-bar.md)");
    expect(wiki.indexContent).toContain(`[Nested Bar](${nestedSlug}.md)`);
  });

  it("preserves base slug algorithm for non-colliding paths", () => {
    const spec = sampleSpec({
      file: {
        path: "/tmp/docs/specs/architecture.md",
        relativePath: "docs/specs/architecture.md",
        category: "docs-specs",
        title: "Architecture",
      },
    });
    const wiki = buildWiki([spec]);

    expect(pageSlug(spec)).toBe("docs-specs-architecture");
    expect(wiki.pages[0].slug).toBe("docs-specs-architecture");
  });

  it("emits output.slug-collision when verbose and collision occurs", () => {
    log.setVerbose(true);

    buildWiki([
      sampleSpec({
        title: "Flat Bar",
        file: {
          path: "/tmp/specs/foo-bar.md",
          relativePath: "specs/foo-bar.md",
          category: "specs",
          title: "Flat Bar",
        },
      }),
      sampleSpec({
        title: "Nested Bar",
        file: {
          path: "/tmp/specs/foo/bar.md",
          relativePath: "specs/foo/bar.md",
          category: "specs",
          title: "Nested Bar",
        },
      }),
    ]);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.slug-collision",
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      originalSlug: "specs-foo-bar",
      disambiguatedSlug: `specs-foo-bar-${hashSuffix("specs/foo/bar.md")}`,
      sourcePath: "specs/foo/bar.md",
    });
  });

  it("does not emit output.slug-collision when verbose is disabled", () => {
    buildWiki([
      sampleSpec({
        title: "Flat Bar",
        file: {
          path: "/tmp/specs/foo-bar.md",
          relativePath: "specs/foo-bar.md",
          category: "specs",
          title: "Flat Bar",
        },
      }),
      sampleSpec({
        title: "Nested Bar",
        file: {
          path: "/tmp/specs/foo/bar.md",
          relativePath: "specs/foo/bar.md",
          category: "specs",
          title: "Nested Bar",
        },
      }),
    ]);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.slug-collision",
    );
    expect(events).toHaveLength(0);
  });

  it("writes distinct markdown and HTML files for colliding specs", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-collision-"),
    );
    tempDirs.push(outputDir);

    const flat = sampleSpec({
      title: "Flat Bar",
      file: {
        path: "/tmp/specs/foo-bar.md",
        relativePath: "specs/foo-bar.md",
        category: "specs",
        title: "Flat Bar",
      },
      rawContent: "Flat body",
    });
    const nested = sampleSpec({
      title: "Nested Bar",
      file: {
        path: "/tmp/specs/foo/bar.md",
        relativePath: "specs/foo/bar.md",
        category: "specs",
        title: "Nested Bar",
      },
      rawContent: "Nested body",
    });

    const wiki = buildWiki([flat, nested]);
    await writeWiki(outputDir, wiki);
    await writeHtmlWiki(outputDir, wiki);

    const nestedSlug = `specs-foo-bar-${hashSuffix("specs/foo/bar.md")}`;
    expect(
      await fs.readFile(path.join(outputDir, "specs-foo-bar.md"), "utf-8"),
    ).toContain("Flat body");
    expect(
      await fs.readFile(path.join(outputDir, `${nestedSlug}.md`), "utf-8"),
    ).toContain("Nested body");
    expect(
      await fs.readFile(
        path.join(outputDir, "html", `${nestedSlug}.html`),
        "utf-8",
      ),
    ).toContain("Nested Bar");
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
      '<nav class="specwiki-nav"><a href="index.html">← Back to index</a></nav>',
    );
    expect(indexHtml).toContain(
      '<link rel="stylesheet" href="assets/specwiki.css">',
    );
    expect(indexHtml).not.toContain("<style>");
    expect(indexHtml).toContain('<header class="specwiki-header">');
    expect(indexHtml).toContain("Custom Spec Title");
  });

  it("writes html/assets/specwiki.css with bundled stylesheet", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    await writeHtmlWiki(outputDir, wiki);

    const css = await fs.readFile(
      path.join(outputDir, "html", "assets", "specwiki.css"),
      "utf-8",
    );
    expect(css).toContain("--background-color-base");
    expect(css).toContain(".specwiki-header");
  });

  it("writes html/index.html and html/{slug}.html for each page", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const written = await writeHtmlWiki(outputDir, wiki);

    expect(written).toHaveLength(3);
    expect(
      await fs.readFile(path.join(outputDir, "html", "index.html"), "utf-8"),
    ).toContain("<html");
    expect(
      await fs.readFile(path.join(outputDir, "html", "spec.html"), "utf-8"),
    ).toContain("Custom Spec Title");
  });

  it("confines writes to the resolved output directory", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const written = await writeHtmlWiki(outputDir, wiki);

    for (const filePath of written) {
      expect(filePath.startsWith(outputDir + path.sep)).toBe(true);
    }
  });

  it("emits output.write per HTML file when verbose", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);
    log.setVerbose(true);

    const wiki = buildWiki([sampleSpec()]);
    await writeHtmlWiki(outputDir, wiki);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.write",
    );

    expect(events).toHaveLength(3);
    expect(events.map((event) => event.relativePath).sort()).toEqual([
      "html/assets/specwiki.css",
      "html/index.html",
      "html/spec.html",
    ]);
    for (const event of events) {
      expect(JSON.stringify(event)).not.toMatch(/rawContent|frontmatter/);
    }
  });

  it("does not emit output.write when verbose is disabled", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    await writeHtmlWiki(outputDir, wiki);

    const events = parseStderrLines().filter(
      (line) => line.event === "output.write",
    );
    expect(events).toHaveLength(0);
  });

  it("emits output.error and rethrows on index write failure", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("disk full"));

    await expect(writeHtmlWiki(outputDir, wiki)).rejects.toThrow("disk full");

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("disk full");
    expect(errorEvent?.relativePath).toBe("html/index.html");
    writeSpy.mockRestore();
  });

  it("emits output.error and rethrows on page write failure", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-"),
    );
    tempDirs.push(outputDir);

    const wiki = buildWiki([sampleSpec()]);
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce("page write failed");

    await expect(writeHtmlWiki(outputDir, wiki)).rejects.toBe(
      "page write failed",
    );

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("page write failed");
    expect(errorEvent?.relativePath).toBe("html/spec.html");
    writeSpy.mockRestore();
  });

  it("emits output.error and rethrows on mkdir failure", async () => {
    const outputDir = path.join(os.tmpdir(), "specwiki-html-mkdir-fail");
    const wiki = buildWiki([sampleSpec()]);
    const mkdirSpy = vi
      .spyOn(fs, "mkdir")
      .mockRejectedValueOnce(new Error("permission denied"));

    await expect(writeHtmlWiki(outputDir, wiki)).rejects.toThrow(
      "permission denied",
    );

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("permission denied");
    expect(errorEvent?.relativePath).toBe("html");
    mkdirSpy.mockRestore();
  });

  it("stringifies non-Error mkdir failures in output.error", async () => {
    const outputDir = path.join(os.tmpdir(), "specwiki-html-mkdir-fail");
    const wiki = buildWiki([sampleSpec()]);
    const mkdirSpy = vi.spyOn(fs, "mkdir").mockRejectedValueOnce("mkdir boom");

    await expect(writeHtmlWiki(outputDir, wiki)).rejects.toBe("mkdir boom");

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.message).toBe("mkdir boom");
    expect(errorEvent?.relativePath).toBe("html");
    mkdirSpy.mockRestore();
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

describe("path traversal guards", () => {
  it("writeWiki rejects .. segment slugs and emits output.error", async () => {
    const parentDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-traverse-parent-"),
    );
    tempDirs.push(parentDir);
    const outputDir = path.join(parentDir, "wiki");
    await fs.mkdir(outputDir);

    const escapedPath = path.join(parentDir, "evil.md");
    await expect(
      writeWiki(outputDir, maliciousWiki("../evil")),
    ).rejects.toThrow(/escapes output directory/);

    expect(await pathExists(escapedPath)).toBe(false);

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.relativePath).toBe("../evil.md");
    expect(errorEvent?.message).toMatch(/escapes output directory/);
    expect(JSON.stringify(errorEvent)).not.toMatch(
      /Traversal probe|rawContent/,
    );
  });

  it("writeWiki rejects nested .. segment slugs", async () => {
    const parentDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-traverse-nested-"),
    );
    tempDirs.push(parentDir);
    const outputDir = path.join(parentDir, "wiki");
    await fs.mkdir(outputDir);

    const escapedPath = path.join(parentDir, "passwd");
    await expect(
      writeWiki(outputDir, maliciousWiki("foo/../../passwd")),
    ).rejects.toThrow(/escapes output directory/);

    expect(await pathExists(escapedPath)).toBe(false);
  });

  it("writeHtmlWiki rejects .. segment slugs and emits output.error", async () => {
    const parentDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-traverse-"),
    );
    tempDirs.push(parentDir);
    const outputDir = path.join(parentDir, "wiki");
    await fs.mkdir(outputDir);

    const escapedPath = path.join(parentDir, "evil.html");
    await expect(
      writeHtmlWiki(outputDir, maliciousWiki("../../evil")),
    ).rejects.toThrow(/escapes output directory/);

    expect(await pathExists(escapedPath)).toBe(false);

    const errorEvent = parseStderrLines().find(
      (line) => line.event === "output.error",
    );
    expect(errorEvent?.relativePath).toBe("html/../../evil.html");
    expect(errorEvent?.message).toMatch(/escapes output directory/);
    expect(JSON.stringify(errorEvent)).not.toMatch(
      /Traversal probe|rawContent/,
    );
  });

  it("writeHtmlWiki rejects nested .. segment slugs", async () => {
    const parentDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-html-nested-"),
    );
    tempDirs.push(parentDir);
    const outputDir = path.join(parentDir, "wiki");
    await fs.mkdir(outputDir);

    const escapedPath = path.join(parentDir, "passwd.html");
    await expect(
      writeHtmlWiki(outputDir, maliciousWiki("foo/../../../passwd")),
    ).rejects.toThrow(/escapes output directory/);

    expect(await pathExists(escapedPath)).toBe(false);
  });

  it("emits output.error when verbose is disabled", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-traverse-quiet-"),
    );
    tempDirs.push(outputDir);
    log.setVerbose(false);

    await expect(
      writeWiki(outputDir, maliciousWiki("../evil")),
    ).rejects.toThrow();

    const errorEvents = parseStderrLines().filter(
      (line) => line.event === "output.error",
    );
    expect(errorEvents.length).toBeGreaterThan(0);
  });
});
