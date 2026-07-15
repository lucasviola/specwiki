import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../../src/core/Logger.js";
import {
  HtmlRenderer,
  getHtmlRenderer,
  resetHtmlRendererCache,
} from "../../../src/output/html/renderer.js";
import type { WikiIndexMeta, WikiPage } from "../../../src/types.js";

function emptyIndexMeta(): WikiIndexMeta {
  return {
    rootIntro: null,
    rootIntroSource: null,
    categoryIntros: new Map(),
    readmeIndexCount: 0,
  };
}

function samplePage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    slug: "spec",
    title: "Custom Spec Title",
    category: "root",
    content: "# Custom Spec Title",
    sourcePath: "SPEC.md",
    description: "Short description.",
    sections: [
      {
        level: 2,
        title: "Requirements",
        content: "Must preserve markdown.",
        anchor: "requirements",
      },
    ],
    ...overrides,
  };
}

describe("HtmlRenderer", () => {
  let renderer: HtmlRenderer;

  beforeEach(async () => {
    resetHtmlRendererCache();
    log.setVerbose(false);
    renderer = await HtmlRenderer.create();
  });

  afterEach(() => {
    resetHtmlRendererCache();
  });

  it("renders root and category README intros on index page", () => {
    const indexMeta: WikiIndexMeta = {
      rootIntro: "# Root README\n\nProject overview from README.",
      rootIntroSource: "README.md",
      categoryIntros: new Map([
        [
          "other",
          {
            content: "Nested packages intro.",
            sourcePaths: ["packages/nested/README.md"],
          },
        ],
      ]),
      readmeIndexCount: 2,
    };

    const html = renderer.renderIndex(
      [
        samplePage({
          slug: "readme",
          title: "Readme",
          sourcePath: "README.md",
        }),
        samplePage({
          slug: "packages-nested-agents",
          title: "Agent Instructions",
          category: "other",
          sourcePath: "packages/nested/AGENTS.md",
        }),
        samplePage({
          slug: "packages-nested-readme",
          title: "Readme",
          category: "other",
          sourcePath: "packages/nested/README.md",
        }),
      ],
      indexMeta,
    );

    expect(html).toContain("Project overview from README.");
    expect(html).not.toContain(
      "Structured documentation generated from AI specs",
    );
    expect(html).toContain("Nested packages intro.");
    expect(html).toContain('id="category-other"');
  });

  it("omits category nav groups when category has only README pages", () => {
    const html = renderer.renderArticle(
      samplePage({
        slug: "orphan-readme",
        title: "Readme",
        category: "other",
        sourcePath: "orphan/README.md",
      }),
      [
        samplePage({
          slug: "orphan-readme",
          title: "Readme",
          category: "other",
          sourcePath: "orphan/README.md",
        }),
      ],
      "<p>Orphan README body</p>",
    );

    expect(html).not.toContain('href="index.html#category-other"');
    expect(html).toContain('href="index.html"');
  });

  it("renders index page with Main Page portal and category nav", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta());

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain(
      '<link rel="stylesheet" href="assets/specwiki.css">',
    );
    expect(html).not.toContain('href="assets/highlight.css"');
    expect(html).toContain("<title>Spec Wiki — Spec Wiki</title>");
    expect(html).toContain('<header class="specwiki-header">');
    expect(html).toContain('<nav class="category-nav"');
    expect(html).toContain('id="content"');
    expect(html).toContain("<h1>Main Page</h1>");
    expect(html).toContain('href="spec.html"');
    expect(html).toContain('id="all-pages"');
    expect(html).toContain("All pages");
    expect(html).not.toMatch(/href="[^"]*\.md"/);
    expect(html).not.toContain("<style>");
  });

  it("renders the [[specwiki]] wordmark and generator meta in the layout", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta());

    expect(html).toContain('<meta name="generator" content="specwiki">');
    expect(html).toContain('class="specwiki-logo"');
    expect(html).toContain(
      '<span class="specwiki-logo-bracket">[[</span>specwiki<span class="specwiki-logo-bracket">]]</span>',
    );
  });

  it("renders a storage-safe theme initializer before stylesheets", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta());
    const initializer = html.indexOf("data-specwiki-theme-init");
    const stylesheet = html.indexOf(
      '<link rel="stylesheet" href="assets/specwiki.css">',
    );

    expect(initializer).toBeGreaterThan(-1);
    expect(initializer).toBeLessThan(stylesheet);
    expect(html).toContain('localStorage.getItem("specwiki-theme")');
    expect(html).toContain('theme === "light" || theme === "dark"');
    expect(html).toContain("document.documentElement.dataset.theme = theme");
    expect(html).not.toContain("fetch(");
  });

  it("renders an accessible progressively enhanced theme toggle", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta());

    expect(html).toContain('id="specwiki-theme-toggle"');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Switch color theme"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toMatch(/id="specwiki-theme-toggle"[^>]*hidden/);
    expect(html).toContain("data-specwiki-theme-toggle");
    expect(html).toContain('localStorage.setItem("specwiki-theme"');
    expect(html).not.toContain("console.");
  });

  it("renders search chrome when includeSearch is enabled", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta(), {
      includeSearch: true,
      searchIndexJson: '{"version":1,"documents":[]}',
    });

    expect(html).toContain('id="specwiki-search-input"');
    expect(html).toContain('id="search-index"');
    expect(html).toContain('src="assets/lunr.min.js"');
    expect(html).toContain('src="assets/search.js"');
  });

  it("omits search chrome when includeSearch is disabled", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta(), {
      includeSearch: false,
    });

    expect(html).not.toContain("specwiki-search-input");
    expect(html).not.toContain("search-index");
  });

  it("renders article page with infobox, breadcrumb, TOC, and category nav", () => {
    const page = samplePage();
    const html = renderer.renderArticle(page, [page], "<p>Body</p>");

    expect(html).toContain("<title>Custom Spec Title — Spec Wiki</title>");
    expect(html).toContain('class="category-nav"');
    expect(html).toContain('class="infobox"');
    expect(html).toContain('class="toc"');
    expect(html).toContain('id="content"');
    expect(html).toContain('class="breadcrumb"');
    expect(html).toContain("Main Page");
    expect(html).toContain("Project Root");
    expect(html).toContain("<code>SPEC.md</code>");
    expect(html).toContain('href="#requirements"');
    expect(html).toContain('class="mw-parser-output"');
    expect(html).toContain(
      '<link rel="stylesheet" href="assets/highlight.css">',
    );
    expect(html).toContain("<p>Body</p>");
  });

  it("escapes ampersands in title without double-escaping body HTML", () => {
    const page = samplePage({ title: "Tom & Jerry" });
    const html = renderer.renderArticle(
      page,
      [page],
      "<p>Content &amp; more</p>",
    );

    expect(html).toContain("<title>Tom &amp; Jerry — Spec Wiki</title>");
    expect(html).toContain("<p>Content &amp; more</p>");
  });

  it("escapes script injection payloads in titles and metadata", () => {
    const malicious = '<script>alert("x")</script>';
    const page = samplePage({
      title: malicious,
      sourcePath: malicious,
      description: malicious,
    });
    const html = renderer.renderArticle(page, [page], "<p>Safe</p>");
    const escaped = "&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;";

    expect(html).toContain(`<title>${escaped} — Spec Wiki</title>`);
    expect(html).not.toContain("<script>");
    expect(html).toContain(`<code>${escaped}</code>`);
  });

  it("omits TOC rail when page has no sections", () => {
    const page = samplePage({ sections: [] });
    const html = renderer.renderArticle(page, [page], "<p>Body</p>");

    expect(html).not.toContain('class="toc"');
    expect(html).toContain('id="content"');
  });

  it("uses relative inter-page links safe for file:// navigation", () => {
    const page = samplePage();
    const html = renderer.renderArticle(page, [page], "<p>Body</p>");

    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="spec.html"');
    expect(html).not.toMatch(/href="\/[^"]*"/);
    expect(html).not.toMatch(/href="https?:\/\//);
  });

  it("throws when required article fields are missing", () => {
    const page = samplePage({ title: "", sourcePath: "" });

    expect(() => renderer.renderArticle(page, [page], "<p>Body</p>")).toThrow(
      /Missing required template fields/,
    );
  });

  it("bundles wikimedia-ui-base tokens with specwiki layout CSS", async () => {
    const css = await HtmlRenderer.bundleCss();

    expect(css).toContain("--background-color-base");
    expect(css).toContain("--color-primary");
    expect(css).toContain("--font-family-base");
    expect(css).toContain(".specwiki-header");
    expect(css).toContain(".specwiki-logo-bracket");
    expect(css).toContain(".category-nav");
    expect(css).toContain(".infobox");
    expect(css).toContain(".toc");
  });

  it("reads highlight theme CSS from bundled assets or node_modules", async () => {
    const css = await HtmlRenderer.readHighlightCss();

    expect(css).toContain(".hljs");
  });

  it("reuses cached renderer from getHtmlRenderer", async () => {
    const first = await getHtmlRenderer();
    const second = await getHtmlRenderer();

    expect(first).toBe(second);
  });

  it("emits output.error path on template load failure", async () => {
    const readSpy = vi
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(new Error("missing template"));

    await expect(HtmlRenderer.create()).rejects.toThrow("missing template");
    readSpy.mockRestore();
  });

  it("emits output.error path on CSS bundle failure", async () => {
    const readSpy = vi
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(new Error("missing css"));

    await expect(HtmlRenderer.bundleCss()).rejects.toThrow("missing css");
    readSpy.mockRestore();
  });
});

describe("HtmlRenderer asset paths", () => {
  it("resolves templates relative to the renderer module", async () => {
    const renderer = await HtmlRenderer.create();
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta());

    expect(html).toContain('href="assets/specwiki.css"');
    expect(html).not.toMatch(/href="\/assets\//);
  });
});
