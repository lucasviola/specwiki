import { describe, expect, it } from "vitest";
import { buildWiki } from "../../../src/output/wiki.js";
import {
  BODY_EXCERPT_MAX,
  SEARCH_INDEX_VERSION,
  buildSearchIndex,
  extractBodyExcerpt,
  serializeSearchIndexForInlineScript,
  stripMarkdown,
} from "../../../src/output/html/search-index.js";
import type { WikiPage } from "../../../src/types.js";

function samplePage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    slug: "agents",
    title: "Agents",
    category: "root",
    content: [
      "# Agents",
      "",
      "> Source: `AGENTS.md`",
      "",
      "Agent instructions for the project.",
      "",
      "## Setup",
      "",
      "Run `npm install` to begin.",
    ].join("\n"),
    sourcePath: "AGENTS.md",
    description: "Agent instructions.",
    sections: [],
    ...overrides,
  };
}

describe("buildSearchIndex", () => {
  it("returns one document per wiki page", () => {
    const pages = [
      samplePage(),
      samplePage({
        slug: "spec",
        title: "Spec",
        sourcePath: "SPEC.md",
        content: "# Spec\n\nProject specification.",
      }),
    ];

    const index = buildSearchIndex(pages);

    expect(index.version).toBe(SEARCH_INDEX_VERSION);
    expect(index.documents).toHaveLength(2);
  });

  it("includes required schema fields on each document", () => {
    const index = buildSearchIndex([samplePage()]);

    expect(index.documents[0]).toEqual({
      slug: "agents",
      title: "Agents",
      category: "root",
      categoryLabel: "Project Root",
      description: "Agent instructions.",
      body: expect.any(String),
    });
  });

  it("uses a bounded plain-text body fallback when description is empty", () => {
    const body = `<script>alert("body")</script> ${"word ".repeat(600)}`;
    const index = buildSearchIndex([
      samplePage({ description: "", content: body }),
    ]);

    expect(index.documents[0].description).toBe("");
    expect(index.documents[0].body.length).toBe(BODY_EXCERPT_MAX);
    expect(index.documents[0].body).not.toContain("<script>");
  });

  it("uses an unknown category key as its human-readable fallback label", () => {
    const index = buildSearchIndex([samplePage({ category: "custom-guides" })]);

    expect(index.documents[0].categoryLabel).toBe("custom-guides");
  });

  it("document count matches buildWiki page count", () => {
    const wiki = buildWiki([
      {
        file: {
          path: "/tmp/AGENTS.md",
          relativePath: "AGENTS.md",
          category: "root",
          title: "Agents",
        },
        frontmatter: {},
        title: "Agents",
        description: "Agent instructions.",
        sections: [],
        rawContent: "Agent body content.",
      },
      {
        file: {
          path: "/tmp/SPEC.md",
          relativePath: "SPEC.md",
          category: "root",
          title: "Spec",
        },
        frontmatter: {},
        title: "Spec",
        description: "Project spec.",
        sections: [],
        rawContent: "Spec body content.",
      },
    ]);

    const index = buildSearchIndex(wiki.pages);

    expect(index.documents).toHaveLength(wiki.pages.length);
    expect(index.documents.map((doc) => doc.slug).sort()).toEqual(
      wiki.pages.map((page) => page.slug).sort(),
    );
  });
});

describe("stripMarkdown", () => {
  it("removes headings, links, and inline code", () => {
    const plain = stripMarkdown(
      "## Title\n\nSee [Agents](agents.md) and run `npm test`.",
    );

    expect(plain).toBe("Title See Agents and run npm test.");
  });

  it("caps body excerpt length", () => {
    const longBody = "word ".repeat(500);
    const excerpt = extractBodyExcerpt(longBody, BODY_EXCERPT_MAX);

    expect(excerpt.length).toBe(BODY_EXCERPT_MAX);
  });
});

describe("serializeSearchIndexForInlineScript", () => {
  it("escapes HTML-like user text without changing the parsed values", () => {
    const index = buildSearchIndex([
      samplePage({
        title: '</script><script>alert("title")</script>',
        description: "<img src=x onerror=alert(1)>",
        content: "<script>alert('body')</script>",
      }),
    ]);

    const serialized = serializeSearchIndexForInlineScript(index);

    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(index);
  });
});
