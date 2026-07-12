import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import Mustache from "mustache";
import { CATEGORY_LABELS } from "../../config/patterns.js";
import type { SpecSection, WikiPage } from "../../types.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const TEMPLATES_DIR = path.join(moduleDir, "templates");
const ASSETS_DIR = path.join(moduleDir, "assets");
const BUNDLED_CSS_FILENAME = "specwiki.css";
const HIGHLIGHT_CSS_FILENAME = "highlight.css";

interface NavPage {
  title: string;
  slug: string;
  href: string;
  sourcePath: string;
}

interface NavCategory {
  key: string;
  label: string;
  anchor: string;
  pages: NavPage[];
  active: boolean;
}

interface TocEntry {
  title: string;
  href: string;
  level: number;
}

interface BreadcrumbSegment {
  label: string;
  href?: string;
  first: boolean;
}

export interface HtmlRenderOptions {
  includeSearch?: boolean;
  searchIndexJson?: string;
}

interface AllPagesEntry {
  title: string;
  slug: string;
  href: string;
}

export class HtmlRenderer {
  private readonly layoutTemplate: string;
  private readonly indexTemplate: string;
  private readonly articleTemplate: string;

  private constructor(layout: string, index: string, article: string) {
    this.layoutTemplate = layout;
    this.indexTemplate = index;
    this.articleTemplate = article;
  }

  static async create(): Promise<HtmlRenderer> {
    const [layout, index, article] = await Promise.all([
      fs.readFile(path.join(TEMPLATES_DIR, "layout.mustache"), "utf-8"),
      fs.readFile(path.join(TEMPLATES_DIR, "index.mustache"), "utf-8"),
      fs.readFile(path.join(TEMPLATES_DIR, "article.mustache"), "utf-8"),
    ]);
    return new HtmlRenderer(layout, index, article);
  }

  renderIndex(
    pages: WikiPage[],
    renderOptions: HtmlRenderOptions = {},
  ): string {
    const categories = buildNavCategories(pages);
    const pageCount = pages.length;
    const allPages = buildAllPagesList(pages);
    const body = Mustache.render(this.indexTemplate, {
      categories,
      pageCount,
      pageCountLabel: pageCount === 1 ? "spec file" : "spec files",
      allPages,
    });
    return Mustache.render(this.layoutTemplate, {
      pageTitle: "Spec Wiki",
      body,
      includeHighlightCss: false,
      includeSearch: Boolean(renderOptions.includeSearch),
      searchIndexJson: renderOptions.searchIndexJson ?? "",
    });
  }

  renderArticle(
    page: WikiPage,
    allPages: WikiPage[],
    contentHtml: string,
    renderOptions: HtmlRenderOptions = {},
  ): string {
    validateArticlePage(page);

    const categories = buildNavCategories(allPages, page.category);
    const categoryLabel = categoryLabelFor(page.category);
    const tocEntries = buildTocEntries(page.sections);
    const breadcrumbs = buildBreadcrumbs(page, categoryLabel);

    const body = Mustache.render(this.articleTemplate, {
      categories,
      breadcrumbs,
      title: page.title,
      categoryLabel,
      sourcePath: page.sourcePath,
      description: page.description,
      hasDescription: Boolean(page.description),
      content: contentHtml,
      tocEntries,
      hasToc: tocEntries.length > 0,
    });

    return Mustache.render(this.layoutTemplate, {
      pageTitle: page.title,
      body,
      includeHighlightCss: true,
      includeSearch: Boolean(renderOptions.includeSearch),
      searchIndexJson: renderOptions.searchIndexJson ?? "",
    });
  }

  static async bundleCss(): Promise<string> {
    const wikimediaPath =
      require.resolve("wikimedia-ui-base/wikimedia-ui-base.css");
    const customPath = path.join(ASSETS_DIR, BUNDLED_CSS_FILENAME);
    const [wikimedia, custom] = await Promise.all([
      fs.readFile(wikimediaPath, "utf-8"),
      fs.readFile(customPath, "utf-8"),
    ]);
    return `${wikimedia}\n\n${custom}`;
  }

  static bundledCssFilename(): string {
    return BUNDLED_CSS_FILENAME;
  }

  static highlightCssFilename(): string {
    return HIGHLIGHT_CSS_FILENAME;
  }

  static async readHighlightCss(): Promise<string> {
    const highlightPath = require.resolve("highlight.js/styles/github.min.css");
    return fs.readFile(highlightPath, "utf-8");
  }
}

function categoryLabelFor(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function categoryAnchor(category: string): string {
  return `category-${category}`;
}

function buildAllPagesList(pages: WikiPage[]): AllPagesEntry[] {
  return [...pages]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((page) => ({
      title: page.title,
      slug: page.slug,
      href: `${page.slug}.html`,
    }));
}

function buildNavCategories(
  pages: WikiPage[],
  activeCategory?: string,
): NavCategory[] {
  const byCategory = new Map<string, WikiPage[]>();

  for (const page of pages) {
    const list = byCategory.get(page.category) ?? [];
    list.push(page);
    byCategory.set(page.category, list);
  }

  const sortedKeys = [...byCategory.keys()].sort((a, b) =>
    categoryLabelFor(a).localeCompare(categoryLabelFor(b)),
  );

  return sortedKeys.map((key) => ({
    key,
    label: categoryLabelFor(key),
    anchor: categoryAnchor(key),
    active: key === activeCategory,
    pages: (byCategory.get(key) ?? []).map((page) => ({
      title: page.title,
      slug: page.slug,
      href: `${page.slug}.html`,
      sourcePath: page.sourcePath,
    })),
  }));
}

function buildTocEntries(sections: SpecSection[]): TocEntry[] {
  return sections
    .filter((section) => section.level >= 2 && section.level <= 6)
    .map((section) => ({
      title: section.title,
      href: `#${section.anchor}`,
      level: section.level,
    }));
}

function buildBreadcrumbs(
  page: WikiPage,
  categoryLabel: string,
): BreadcrumbSegment[] {
  return [
    { label: "Main Page", href: "index.html", first: true },
    {
      label: categoryLabel,
      href: `index.html#${categoryAnchor(page.category)}`,
      first: false,
    },
    { label: page.title, first: false },
  ];
}

function validateArticlePage(page: WikiPage): void {
  const missing: string[] = [];

  if (!page.title) {
    missing.push("title");
  }
  if (!page.category) {
    missing.push("category");
  }
  if (!page.sourcePath) {
    missing.push("sourcePath");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required template fields: ${missing.join(", ")}`);
  }
}

let cachedRenderer: HtmlRenderer | null = null;

export async function getHtmlRenderer(): Promise<HtmlRenderer> {
  if (!cachedRenderer) {
    cachedRenderer = await HtmlRenderer.create();
  }
  return cachedRenderer;
}

export function resetHtmlRendererCache(): void {
  cachedRenderer = null;
}
