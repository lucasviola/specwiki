import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { log } from "../core/Logger.js";
import { CATEGORY_LABELS } from "../config/patterns.js";
import { renderMarkdown } from "../parse/markdown.js";
import { getHtmlRenderer, HtmlRenderer } from "./html/renderer.js";
import type { ParsedSpec, WikiOutput, WikiPage } from "../types.js";

const PATH_ESCAPE_MESSAGE = "Path escapes output directory";

export class PathTraversalError extends Error {
  constructor(relativePath: string) {
    super(`${PATH_ESCAPE_MESSAGE}: ${relativePath}`);
    this.name = "PathTraversalError";
  }
}

export function assertPathConfined(
  outputDir: string,
  targetPath: string,
  relativePathForLog: string,
): void {
  const resolvedRoot = path.resolve(outputDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    log.error("output.error", {
      relativePath: relativePathForLog,
      message: PATH_ESCAPE_MESSAGE,
    });
    throw new PathTraversalError(relativePathForLog);
  }
}

export function pageSlug(spec: ParsedSpec): string {
  const base = spec.file.relativePath
    .replace(/\.(md|mdc|txt)$/, "")
    .replace(/[/\\]/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return base || "untitled";
}

function slugHash(relativePath: string): string {
  return createHash("sha256").update(relativePath).digest("hex").slice(0, 8);
}

function assignUniqueSlugs(specs: ParsedSpec[]): Map<string, string> {
  const entries = specs.map((spec) => ({
    spec,
    base: pageSlug(spec),
  }));

  const byBase = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = byBase.get(entry.base) ?? [];
    list.push(entry);
    byBase.set(entry.base, list);
  }

  const slugByPath = new Map<string, string>();

  for (const [, group] of byBase) {
    if (group.length === 1) {
      slugByPath.set(group[0].spec.file.relativePath, group[0].base);
      continue;
    }

    const sorted = [...group].sort((a, b) =>
      a.spec.file.relativePath.localeCompare(b.spec.file.relativePath),
    );

    for (let i = 0; i < sorted.length; i++) {
      const { spec, base } = sorted[i];
      if (i === 0) {
        slugByPath.set(spec.file.relativePath, base);
        continue;
      }

      const disambiguated = `${base}-${slugHash(spec.file.relativePath)}`;
      log.info("output.slug-collision", {
        originalSlug: base,
        disambiguatedSlug: disambiguated,
        sourcePath: spec.file.relativePath,
      });
      slugByPath.set(spec.file.relativePath, disambiguated);
    }
  }

  return slugByPath;
}

function buildPageContent(spec: ParsedSpec): string {
  const lines: string[] = [
    `# ${spec.title}`,
    "",
    `> Source: \`${spec.file.relativePath}\``,
    "",
  ];

  if (spec.description) {
    lines.push(spec.description, "");
  }

  if (spec.sections.length > 0) {
    lines.push("## Table of Contents", "");
    for (const section of spec.sections) {
      const indent = "  ".repeat(Math.max(0, section.level - 2));
      lines.push(`${indent}- [${section.title}](#${section.anchor})`);
    }
    lines.push("");
  }

  lines.push("---", "");
  lines.push(spec.rawContent);

  return lines.join("\n");
}

function buildIndex(pages: WikiPage[]): string {
  const byCategory = new Map<string, WikiPage[]>();

  for (const page of pages) {
    const list = byCategory.get(page.category) ?? [];
    list.push(page);
    byCategory.set(page.category, list);
  }

  const lines: string[] = [
    "# Spec Wiki",
    "",
    "Structured documentation generated from AI specs, agent instructions,",
    "and spec-driven development files in this project.",
    "",
    `**${pages.length}** spec file${pages.length === 1 ? "" : "s"} indexed.`,
    "",
    "---",
    "",
  ];

  const sortedCategories = [...byCategory.keys()].sort((a, b) => {
    const labelA = CATEGORY_LABELS[a] ?? a;
    const labelB = CATEGORY_LABELS[b] ?? b;
    return labelA.localeCompare(labelB);
  });

  for (const category of sortedCategories) {
    const categoryPages = byCategory.get(category)!;
    const label = CATEGORY_LABELS[category] ?? category;

    lines.push(`## ${label}`, "");

    for (const page of categoryPages) {
      lines.push(`- [${page.title}](${page.slug}.md) — \`${page.sourcePath}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildWiki(specs: ParsedSpec[]): WikiOutput {
  const slugByPath = assignUniqueSlugs(specs);

  const pages: WikiPage[] = specs.map((spec) => ({
    slug: slugByPath.get(spec.file.relativePath) ?? pageSlug(spec),
    title: spec.title,
    category: spec.file.category,
    content: buildPageContent(spec),
    sourcePath: spec.file.relativePath,
    description: spec.description,
    sections: spec.sections,
  }));

  return {
    pages,
    indexContent: buildIndex(pages),
  };
}

export async function writeWiki(
  outputDir: string,
  wiki: WikiOutput,
): Promise<string[]> {
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (err) {
    log.error("output.error", {
      relativePath: ".",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const written: string[] = [];

  const indexPath = path.join(outputDir, "index.md");
  assertPathConfined(outputDir, indexPath, "index.md");
  try {
    await fs.writeFile(indexPath, wiki.indexContent, "utf-8");
  } catch (err) {
    log.error("output.error", {
      relativePath: "index.md",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  written.push(indexPath);
  log.info("output.write", { relativePath: "index.md" });

  for (const page of wiki.pages) {
    const filePath = path.join(outputDir, `${page.slug}.md`);
    const relativePath = `${page.slug}.md`;
    assertPathConfined(outputDir, filePath, relativePath);
    try {
      await fs.writeFile(filePath, page.content, "utf-8");
    } catch (err) {
      log.error("output.error", {
        relativePath,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    written.push(filePath);
    log.info("output.write", { relativePath: `${page.slug}.md` });
  }

  return written;
}

export async function writeHtmlWiki(
  outputDir: string,
  wiki: WikiOutput,
): Promise<string[]> {
  const htmlDir = path.join(outputDir, "html");
  try {
    await fs.mkdir(htmlDir, { recursive: true });
  } catch (err) {
    log.error("output.error", {
      relativePath: "html",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  let renderer: HtmlRenderer;
  try {
    renderer = await getHtmlRenderer();
  } catch (err) {
    log.error("output.error", {
      relativePath: "html/templates",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const written: string[] = [];

  const assetsDir = path.join(htmlDir, "assets");
  try {
    await fs.mkdir(assetsDir, { recursive: true });
  } catch (err) {
    log.error("output.error", {
      relativePath: "html/assets",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  let bundledCss: string;
  try {
    bundledCss = await HtmlRenderer.bundleCss();
  } catch (err) {
    log.error("output.error", {
      relativePath: "html/assets/specwiki.css",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const cssPath = path.join(assetsDir, HtmlRenderer.bundledCssFilename());
  const cssRelativePath = "html/assets/specwiki.css";
  assertPathConfined(outputDir, cssPath, cssRelativePath);
  try {
    await fs.writeFile(cssPath, bundledCss, "utf-8");
  } catch (err) {
    log.error("output.error", {
      relativePath: cssRelativePath,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  written.push(cssPath);
  log.info("output.write", { relativePath: cssRelativePath });

  let indexHtml: string;
  try {
    log.info("output.render", { kind: "index", slug: "index" });
    indexHtml = renderer.renderIndex(wiki.pages);
  } catch (err) {
    log.error("output.error", {
      relativePath: "html/index.html",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const indexPath = path.join(htmlDir, "index.html");
  assertPathConfined(outputDir, indexPath, "html/index.html");
  try {
    await fs.writeFile(indexPath, indexHtml, "utf-8");
  } catch (err) {
    log.error("output.error", {
      relativePath: "html/index.html",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  written.push(indexPath);
  log.info("output.write", { relativePath: "html/index.html" });

  for (const page of wiki.pages) {
    let html: string;
    try {
      log.info("output.render", { kind: "article", slug: page.slug });
      html = renderer.renderArticle(
        page,
        wiki.pages,
        renderMarkdown(page.content),
      );
    } catch (err) {
      log.error("output.error", {
        relativePath: `html/${page.slug}.html`,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    const filePath = path.join(htmlDir, `${page.slug}.html`);
    const relativePath = `html/${page.slug}.html`;
    assertPathConfined(outputDir, filePath, relativePath);
    try {
      await fs.writeFile(filePath, html, "utf-8");
    } catch (err) {
      log.error("output.error", {
        relativePath,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    written.push(filePath);
    log.info("output.write", { relativePath });
  }

  return written;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
