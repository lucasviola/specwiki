import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import Mustache from "mustache";
import { escapeHtml } from "../wiki.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const TEMPLATES_DIR = path.join(moduleDir, "templates");
const ASSETS_DIR = path.join(moduleDir, "assets");
const BUNDLED_CSS_FILENAME = "specwiki.css";

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

  renderIndex(title: string, contentHtml: string): string {
    return this.renderPage(title, contentHtml, this.indexTemplate);
  }

  renderArticle(title: string, contentHtml: string): string {
    return this.renderPage(title, contentHtml, this.articleTemplate);
  }

  private renderPage(
    title: string,
    contentHtml: string,
    bodyTemplate: string,
  ): string {
    const pageTitle = escapeHtml(title);
    const body = Mustache.render(bodyTemplate, { content: contentHtml });
    return Mustache.render(this.layoutTemplate, { pageTitle, body });
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
