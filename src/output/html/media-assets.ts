import fs from "node:fs/promises";
import path from "node:path";
import { log } from "../../core/Logger.js";
import {
  assertConfinedUnder,
  assertRealpathConfinedUnder,
} from "../../core/paths.js";
import { renderMarkdown } from "../../parse/markdown.js";

export interface MediaHtmlContext {
  mediaResolver?: MediaAssetResolver;
}

export interface MediaAssetResolverOptions {
  projectRoot: string;
  outputDir: string;
  htmlDir: string;
}

function escapeHtmlAttribute(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export class MediaAssetResolver {
  private readonly copyJobs = new Map<string, string>();

  constructor(private readonly options: MediaAssetResolverOptions) {}

  registerAsset(projectRelative: string): string {
    const wikiSrc = `media/${projectRelative.replace(/\\/g, "/")}`;
    const destPath = path.join(this.options.htmlDir, wikiSrc);
    this.copyJobs.set(projectRelative, destPath);
    return wikiSrc;
  }

  rewriteHtml(html: string, sourceRelativePath: string): string {
    return html.replace(/<img\b[^>]*>/gi, (tag) =>
      this.rewriteImgTag(tag, sourceRelativePath),
    );
  }

  async copyAssets(): Promise<string[]> {
    const written: string[] = [];

    for (const [projectRelative, destPath] of this.copyJobs) {
      const sourcePath = path.join(this.options.projectRoot, projectRelative);
      const outputRelative = path
        .relative(this.options.outputDir, destPath)
        .replace(/\\/g, "/");

      try {
        await assertRealpathConfinedUnder(
          this.options.projectRoot,
          sourcePath,
          projectRelative,
        );
        assertConfinedUnder(this.options.outputDir, destPath, outputRelative);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(sourcePath, destPath);
        written.push(destPath);
        log.info("output.write", { relativePath: outputRelative });
        log.info("output.media", {
          sourcePath: projectRelative,
          relativePath: outputRelative,
        });
      } catch (err) {
        log.error("output.error", {
          relativePath: outputRelative,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return written;
  }

  private rewriteImgTag(tag: string, sourceRelativePath: string): string {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    if (!srcMatch) {
      return tag;
    }

    const quote = srcMatch[1];
    const src = srcMatch[2];
    const projectRelative = resolveProjectRelativePath(src, sourceRelativePath);
    if (!projectRelative) {
      return tag;
    }

    const wikiSrc = this.registerAsset(projectRelative);

    return tag.replace(srcMatch[0], `src=${quote}${wikiSrc}${quote}`);
  }
}

export function rewriteMarkdownImageSyntax(
  markdown: string,
  sourceRelativePath: string,
  resolver: MediaAssetResolver,
): string {
  let result = "";
  let index = 0;

  while (index < markdown.length) {
    if (markdown[index] === "!" && markdown[index + 1] === "[") {
      const altStart = index + 2;
      const closeIndex = markdown.indexOf("](", altStart);
      if (closeIndex !== -1) {
        const urlStart = closeIndex + 2;
        const urlEnd = markdown.indexOf(")", urlStart);
        if (urlEnd !== -1) {
          const alt = markdown.slice(altStart, closeIndex);
          const rawSrc = markdown.slice(urlStart, urlEnd).trim();
          const src = rawSrc.split(/\s+/)[0] ?? rawSrc;
          const projectRelative = resolveProjectRelativePath(
            src,
            sourceRelativePath,
          );
          if (projectRelative) {
            const wikiSrc = resolver.registerAsset(projectRelative);
            result += `<img src="${wikiSrc}" alt="${escapeHtmlAttribute(alt)}">`;
            index = urlEnd + 1;
            continue;
          }
        }
      }
    }

    result += markdown[index];
    index += 1;
  }

  return result;
}

export function renderMarkdownHtml(
  markdown: string,
  sourceRelativePath: string,
  renderOptions: MediaHtmlContext = {},
): string {
  let prepared = markdown;
  if (renderOptions.mediaResolver && sourceRelativePath) {
    prepared = rewriteMarkdownImageSyntax(
      prepared,
      sourceRelativePath,
      renderOptions.mediaResolver,
    );
  }

  const html = renderMarkdown(prepared);
  if (!renderOptions.mediaResolver || !sourceRelativePath) {
    return html;
  }
  return renderOptions.mediaResolver.rewriteHtml(html, sourceRelativePath);
}

export function isLocalAssetSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) {
    return false;
  }
  if (/^[\w+]+:/.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return false;
  }
  if (trimmed.startsWith("media/")) {
    return false;
  }
  return true;
}

export function resolveProjectRelativePath(
  src: string,
  sourceRelativePath: string,
): string | null {
  if (!isLocalAssetSrc(src)) {
    return null;
  }

  const normalizedSrc = src.replace(/\\/g, "/").split("#")[0]?.split("?")[0];
  if (!normalizedSrc) {
    return null;
  }

  const normalizedSource = sourceRelativePath.replace(/\\/g, "/");
  const sourceDir = path.posix.dirname(normalizedSource);
  const joined =
    sourceDir === "." ? normalizedSrc : `${sourceDir}/${normalizedSrc}`;
  const projectRelative = path.posix.normalize(joined);

  if (
    projectRelative.startsWith("..") ||
    path.posix.isAbsolute(projectRelative)
  ) {
    return null;
  }

  return projectRelative;
}
