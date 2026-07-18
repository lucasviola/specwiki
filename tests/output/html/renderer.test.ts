import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../../src/core/Logger.js";
import {
  HtmlRenderer,
  buildNavCategories,
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

  it("renders collapsible category navigation with route-aware defaults", () => {
    const rootFirst = samplePage({
      slug: "root-first",
      title: "Root First",
      sourcePath: "FIRST.md",
    });
    const rootSecond = samplePage({
      slug: "root-second",
      title: "Root Second",
      sourcePath: "SECOND.md",
    });
    const onlyOther = samplePage({
      slug: "other-only",
      title: "Other Only",
      category: "other",
      sourcePath: "other/ONLY.md",
    });

    const indexHtml = renderer.renderIndex(
      [rootFirst, rootSecond, onlyOther],
      emptyIndexMeta(),
    );
    expect(indexHtml).toMatch(
      /<details class="category-nav-group" data-category="root"\s*>/,
    );
    expect(indexHtml).not.toContain(
      '<details class="category-nav-group" data-category="root" open>',
    );
    expect(indexHtml).toContain('<summary class="category-nav-summary">');
    expect(indexHtml).toContain('href="index.html#category-root"');
    expect(indexHtml).toContain(
      '<span class="category-nav-count" aria-label="2 pages">2</span>',
    );
    expect(indexHtml).toContain(
      '<div class="category-nav-group" data-category="other">',
    );
    expect(indexHtml).not.toContain('data-category="other" open');

    const articleHtml = renderer.renderArticle(
      rootFirst,
      [rootFirst, rootSecond, onlyOther],
      "<p>Body</p>",
    );
    expect(articleHtml).toContain(
      '<details class="category-nav-group category-nav-active" data-category="root" open>',
    );
    expect(articleHtml).toContain(
      '<div class="category-nav-group" data-category="other">',
    );
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

  it("renders an accessible progressively enhanced navigation drawer", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta());

    expect(html).toMatch(
      /id="specwiki-nav-toggle"[\s\S]*?type="button"[\s\S]*?hidden[\s\S]*?aria-controls="specwiki-nav-drawer"[\s\S]*?aria-expanded="false"/,
    );
    expect(html).toContain('aria-label="Open category navigation"');
    expect(html).toContain('id="specwiki-nav-drawer"');
    expect(html).toContain('id="specwiki-nav-close"');
    expect(html).toContain('aria-label="Close category navigation"');
    expect(html).toContain('id="specwiki-nav-backdrop"');
    expect(html).toContain("data-specwiki-nav-drawer");
    expect(html).toContain('root.classList.add("specwiki-nav-enhanced")');
    expect(html).toContain(
      'toggle.setAttribute("aria-expanded", String(open))',
    );
    expect(html).toContain("drawer.inert = !open");
    expect(html).toContain("drawer.inert = false");
    expect(html).toContain('event.key === "Escape"');
    expect(html).toContain('backdrop.addEventListener("click"');
    expect(html).toContain('close.addEventListener("click"');
    expect(html).not.toContain("console.");
    expect(html).not.toContain("fetch(");
  });

  it("uses the same responsive drawer shell on article pages", () => {
    const page = samplePage();
    const html = renderer.renderArticle(page, [page], "<p>Body</p>");

    expect(html).toContain(
      '<aside id="specwiki-nav-drawer" class="specwiki-nav-drawer">',
    );
    expect(html).toContain('<nav class="category-nav"');
    expect(html).toContain('id="specwiki-nav-close"');
    expect(html).toContain('class="toc"');
  });

  it("renders search chrome when includeSearch is enabled", () => {
    const html = renderer.renderIndex([samplePage()], emptyIndexMeta(), {
      includeSearch: true,
      searchIndexJson: '{"version":1,"documents":[]}',
    });

    expect(html).toMatch(
      /id="specwiki-search-input"[\s\S]*?role="combobox"[\s\S]*?aria-autocomplete="list"[\s\S]*?aria-controls="specwiki-search-results"[\s\S]*?aria-expanded="false"/,
    );
    expect(html).toMatch(
      /id="specwiki-search-results"[\s\S]*?role="listbox"[\s\S]*?hidden/,
    );
    expect(html).toContain('id="specwiki-search-groups"');
    expect(html).toContain('id="specwiki-search-status"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('id="search-index"');
    expect(html).toContain('src="assets/lunr.min.js"');
    expect(html).toContain('src="assets/search.js"');
    expect(html).not.toContain("fetch(");
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

  it("escapes a long final breadcrumb label", () => {
    const title = 'IMPLEMENTATION <script>alert("x")</script> Guide';
    const page = samplePage({ title });

    const html = renderer.renderArticle(page, [page], "<p>Body</p>");

    expect(html).toContain(
      "IMPLEMENTATION &lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt; Guide",
    );
    expect(html).not.toContain(`IMPLEMENTATION ${title}`);
  });

  it("includes Cursor Skills subgroup labels in article breadcrumbs", () => {
    const pages = [
      samplePage({
        slug: "skill-a",
        title: "Skill A",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
      }),
      samplePage({
        slug: "skill-b",
        title: "Skill B",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
      }),
    ];

    const html = renderer.renderArticle(pages[0], pages, "<p>Body</p>", {
      navGroupingContext: { loaded: false },
    });

    const breadcrumb = html.match(
      /<nav class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/,
    )?.[0];
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb).toContain("Main Page");
    expect(breadcrumb).toContain("Cursor Skills");
    expect(breadcrumb).toContain("<span>Team A</span>");
    expect(breadcrumb).toContain('<span aria-current="page">Skill A</span>');
    expect(breadcrumb).not.toMatch(/<span aria-current="page">Team A<\/span>/);
    expect(breadcrumb?.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("includes BMAD Output L1 and L2 subgroup labels in article breadcrumbs", () => {
    const pages = [
      samplePage({
        slug: "story-19",
        title: "Story 19",
        category: "bmad-output",
        sourcePath:
          "_bmad-output/implementation-artifacts/19-5-collapsible-category-navigation.md",
      }),
      samplePage({
        slug: "story-19b",
        title: "Story 19b",
        category: "bmad-output",
        sourcePath: "_bmad-output/implementation-artifacts/19-6-other-story.md",
      }),
      samplePage({
        slug: "story-23",
        title: "Story 23",
        category: "bmad-output",
        sourcePath:
          "_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md",
      }),
      samplePage({
        slug: "story-23b",
        title: "Story 23b",
        category: "bmad-output",
        sourcePath:
          "_bmad-output/implementation-artifacts/23-2-bmad-catalog-enrichment.md",
      }),
    ];

    const html = renderer.renderArticle(pages[0], pages, "<p>Body</p>", {
      navGroupingContext: { loaded: false },
    });

    const breadcrumb = html.match(
      /<nav class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/,
    )?.[0];
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb).toContain("BMAD Output");
    expect(breadcrumb).toContain("<span>Implementation Stories</span>");
    expect(breadcrumb).toContain("<span>Epic 19</span>");
    expect(breadcrumb).toContain('<span aria-current="page">Story 19</span>');
    expect(breadcrumb?.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("keeps flat-category breadcrumbs without subgroup segments", () => {
    const pages = [
      samplePage({ slug: "a", title: "First", sourcePath: "FIRST.md" }),
      samplePage({ slug: "b", title: "Second", sourcePath: "SECOND.md" }),
    ];

    const html = renderer.renderArticle(pages[0], pages, "<p>Body</p>", {
      navGroupingContext: { loaded: false },
    });

    const breadcrumb = html.match(
      /<nav class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/,
    )?.[0];
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb).toContain("Main Page");
    expect(breadcrumb).toContain("Project Root");
    expect(breadcrumb).toContain('<span aria-current="page">First</span>');
    expect(breadcrumb).not.toContain("<span>Team A</span>");
    expect(breadcrumb?.match(/ › /g)).toHaveLength(2);
    expect(breadcrumb?.match(/aria-current="page"/g)).toHaveLength(1);
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

  it("throws when an article category is missing", () => {
    const page = samplePage({ category: "" });

    expect(() => renderer.renderArticle(page, [page], "<p>Body</p>")).toThrow(
      /Missing required template fields: category/,
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
    expect(css).toMatch(
      /\.category-nav-subgroup-label\s*\{[^}]*color:\s*var\(--color-base--subtle\)/,
    );
    expect(css).toMatch(
      /\.category-nav-subgroup-pages\s*>\s*li\s*>\s*a\s*\{[^}]*color:\s*var\(--color-base\)/,
    );
    expect(css).toContain(".category-nav-subgroup-group");
    expect(css).toContain(".category-nav-subgroup-summary");
    expect(css).toMatch(/\.category-nav-subgroup-group\s*>\s*summary::before/);
    expect(css).toMatch(
      /\.category-nav-subgroup-group\[open\]\s*>\s*summary::before/,
    );
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

describe("buildNavCategories subgroups", () => {
  let renderer: HtmlRenderer;

  beforeEach(async () => {
    resetHtmlRendererCache();
    renderer = await HtmlRenderer.create();
  });

  afterEach(() => {
    resetHtmlRendererCache();
  });

  it("exposes subgroup fields for nested cursor-skills paths", () => {
    const pages: WikiPage[] = [
      samplePage({
        slug: "skill-a",
        title: "Skill A",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
      }),
      samplePage({
        slug: "skill-b",
        title: "Skill B",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
      }),
    ];

    const categories = buildNavCategories(pages, undefined, undefined, {
      navGroupingContext: { loaded: false },
    });
    const cursorSkills = categories.find((c) => c.key === "cursor-skills");

    expect(cursorSkills?.hasSubgroups).toBe(true);
    expect(cursorSkills?.subgroups?.[0].label).toBe("Team A");
    expect(cursorSkills?.subgroups?.[0].pages).toHaveLength(2);
  });

  it("preserves flat pages for categories without nested segments", () => {
    const pages = [
      samplePage({ slug: "a", sourcePath: "FIRST.md" }),
      samplePage({ slug: "b", sourcePath: "SECOND.md" }),
    ];

    const categories = buildNavCategories(pages, undefined, undefined, {
      navGroupingContext: { loaded: false },
    });
    const root = categories.find((c) => c.key === "root");

    expect(root?.hasSubgroups).toBeUndefined();
    expect(root?.pages).toHaveLength(2);
    expect(root?.collapsible).toBe(true);
  });

  it("keeps S19.5 category disclosure flags with subgroups present", () => {
    const active = samplePage({
      slug: "skill-a",
      title: "Skill A",
      category: "cursor-skills",
      sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
    });
    const pages = [
      active,
      samplePage({
        slug: "skill-b",
        title: "Skill B",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
      }),
    ];

    const categories = buildNavCategories(pages, "cursor-skills", active, {
      navGroupingContext: { loaded: false },
    });
    const cursorSkills = categories.find((c) => c.key === "cursor-skills");

    expect(cursorSkills?.open).toBe(true);
    expect(cursorSkills?.active).toBe(true);
    expect(cursorSkills?.collapsible).toBe(true);
    expect(cursorSkills?.subgroups?.[0].open).toBe(true);
  });

  it("uses raw category key as label for unknown categories", () => {
    const pages = [
      samplePage({
        slug: "custom",
        title: "Custom",
        category: "custom-category",
        sourcePath: "custom-category/doc.md",
      }),
    ];

    const categories = buildNavCategories(pages, undefined, undefined, {
      navGroupingContext: { loaded: false },
    });

    expect(categories[0].label).toBe("custom-category");
  });

  it("renders nested collapsible subgroup details closed on index", () => {
    const pages = [
      samplePage({
        slug: "skill-a",
        title: "Skill A",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
      }),
      samplePage({
        slug: "skill-b",
        title: "Skill B",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
      }),
      samplePage({
        slug: "skill-c",
        title: "Skill C",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-b/skill-c/SKILL.md",
      }),
      samplePage({
        slug: "skill-d",
        title: "Skill D",
        category: "cursor-skills",
        sourcePath: ".cursor/skills/team-b/skill-d/SKILL.md",
      }),
    ];

    const html = renderer.renderIndex(pages, emptyIndexMeta(), {
      navGroupingContext: { loaded: false },
    });

    expect(html).toContain(
      '<details class="category-nav-subgroup-group" data-subgroup="team-a"',
    );
    expect(html).toContain(
      '<details class="category-nav-subgroup-group" data-subgroup="team-b"',
    );
    expect(html).not.toMatch(/data-subgroup="team-a"[^>]*\sopen/);
    expect(html).not.toMatch(/data-subgroup="team-b"[^>]*\sopen/);
    expect(html).toContain('<summary class="category-nav-subgroup-summary">');
    expect(html).toContain('class="category-nav-subgroup-label"');
    expect(html).toContain("Team A");
    expect(html).toContain(
      '<span class="category-nav-count" aria-label="2 pages">2</span>',
    );
    expect(html).toContain('href="skill-a.html"');
    expect(html).toContain('href="skill-b.html"');
  });

  it("opens the active subgroup chain on article views", () => {
    const pages = [
      samplePage({
        slug: "story-19",
        title: "Story 19",
        category: "bmad-output",
        sourcePath:
          "_bmad-output/implementation-artifacts/19-5-collapsible-category-navigation.md",
      }),
      samplePage({
        slug: "story-19b",
        title: "Story 19b",
        category: "bmad-output",
        sourcePath: "_bmad-output/implementation-artifacts/19-6-other-story.md",
      }),
      samplePage({
        slug: "story-23",
        title: "Story 23",
        category: "bmad-output",
        sourcePath:
          "_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md",
      }),
      samplePage({
        slug: "story-23b",
        title: "Story 23b",
        category: "bmad-output",
        sourcePath:
          "_bmad-output/implementation-artifacts/23-2-bmad-catalog-enrichment.md",
      }),
    ];

    const html = renderer.renderArticle(pages[0], pages, "<p>Body</p>", {
      navGroupingContext: { loaded: false },
    });

    expect(html).toMatch(/data-subgroup="implementation-stories"[^>]*\sopen/);
    expect(html).toMatch(
      /data-subgroup="implementation-stories&#x2F;epic-19"[^>]*\sopen/,
    );
    expect(html).not.toMatch(
      /data-subgroup="implementation-stories&#x2F;epic-23"[^>]*\sopen/,
    );
    expect(html).toContain("category-nav-subgroup-nested");
    expect(html).toContain('href="story-19.html"');
  });

  it("exposes hybrid Agent Skills subgroup labels when catalog context is loaded", () => {
    const skillsById = new Map([
      [
        "bmad-agent-pm",
        {
          skillId: "bmad-agent-pm",
          isAgent: true,
          agentName: "John",
          agentTitle: "Product Manager",
          agentIcon: "📋",
          inCsv: false,
        },
      ],
      [
        "bmad-brainstorming",
        {
          skillId: "bmad-brainstorming",
          isAgent: false,
          displayName: "Brainstorm Project",
          phase: "1-analysis",
          module: "BMad Method",
          inCsv: true,
        },
      ],
      [
        "bmad-create-story",
        {
          skillId: "bmad-create-story",
          isAgent: false,
          displayName: "Create Story",
          phase: "4-implementation",
          module: "BMad Method",
          inCsv: true,
        },
      ],
    ]);

    const pages = [
      samplePage({
        slug: "agent-pm",
        title: "PM Wiki",
        category: "agent-skills",
        sourcePath: ".agents/skills/bmad-agent-pm/SKILL.md",
      }),
      samplePage({
        slug: "agent-pm-2",
        title: "PM Wiki 2",
        category: "agent-skills",
        sourcePath: ".agents/skills/bmad-agent-pm/README.md",
      }),
      samplePage({
        slug: "brainstorm",
        title: "Brainstorm Wiki",
        category: "agent-skills",
        sourcePath: ".agents/skills/bmad-brainstorming/SKILL.md",
      }),
      samplePage({
        slug: "brainstorm-2",
        title: "Brainstorm Wiki 2",
        category: "agent-skills",
        sourcePath: ".agents/skills/bmad-brainstorming/README.md",
      }),
      samplePage({
        slug: "create-story",
        title: "Create Story Wiki",
        category: "agent-skills",
        sourcePath: ".agents/skills/bmad-create-story/SKILL.md",
      }),
      samplePage({
        slug: "create-story-2",
        title: "Create Story Wiki 2",
        category: "agent-skills",
        sourcePath: ".agents/skills/bmad-create-story/README.md",
      }),
    ];

    const categories = buildNavCategories(pages, undefined, undefined, {
      navGroupingContext: { loaded: true, skillsById },
    });
    const agentSkills = categories.find((c) => c.key === "agent-skills");

    expect(agentSkills?.hasSubgroups).toBe(true);
    expect(agentSkills?.subgroups?.map((sg) => sg.label)).toEqual([
      "Your team",
      "Analysis",
      "Implementation",
    ]);
    expect(agentSkills?.subgroups?.[0].subgroups?.[0].label).toBe(
      "📋 John — Product Manager",
    );
    expect(
      agentSkills?.subgroups?.[0].subgroups?.[0].pages.map((p) => p.title),
    ).toEqual(["PM Wiki", "PM Wiki 2"]);
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
