import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildWiki, writeHtmlWiki, writeWiki } from "../../src/output/wiki.js";
import type { ParsedSpec } from "../../src/types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

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
});
