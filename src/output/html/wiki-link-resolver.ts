import path from "node:path";
import { log } from "../../core/Logger.js";
import type { WikiPage } from "../../types.js";

const SPEC_LIKE_EXT = /\.(md|mdc|txt)$/i;

export interface WikiLinkIndex {
  lookup(resolvedRelativePath: string): string | undefined;
}

function toPosix(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
}

function toIndexKey(relativePath: string): string {
  return toPosix(relativePath).toLowerCase();
}

function parseScheme(href: string): string | null {
  const match = href.match(/^([a-z][a-z0-9+.-]*):/i);
  return match ? match[1].toLowerCase() : null;
}

function splitHref(href: string): { path: string; fragment: string } {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return { path: href, fragment: "" };
  }
  return {
    path: href.slice(0, hashIndex),
    fragment: href.slice(hashIndex),
  };
}

function isConfinedUnderProjectRoot(
  projectRoot: string,
  resolvedRelativePath: string,
): boolean {
  const normalized = toPosix(path.posix.normalize(resolvedRelativePath));
  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.posix.isAbsolute(normalized)
  ) {
    return false;
  }

  if (!projectRoot) {
    return true;
  }

  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(resolvedRoot, normalized);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function buildWikiLinkIndex(pages: WikiPage[]): WikiLinkIndex {
  const byKey = new Map<string, string>();

  for (const page of pages) {
    const key = toIndexKey(page.sourcePath);
    byKey.set(key, page.slug);

    const withoutExt = key.replace(/\.(md|mdc|txt)$/, "");
    if (!byKey.has(withoutExt)) {
      byKey.set(withoutExt, page.slug);
    }
  }

  return {
    lookup(resolvedRelativePath: string): string | undefined {
      const key = toIndexKey(resolvedRelativePath);
      return byKey.get(key) ?? byKey.get(key.replace(/\.(md|mdc|txt)$/, ""));
    },
  };
}

export function createHtmlLinkResolver(options: {
  index: WikiLinkIndex;
  sourcePath: string;
  projectRoot: string;
}): (href: string) => string {
  const sourceDir = path.posix.dirname(toPosix(options.sourcePath));

  return (href: string): string => {
    if (!href || href.startsWith("#")) {
      return href;
    }

    if (href.startsWith("//")) {
      return href;
    }

    const scheme = parseScheme(href);
    if (scheme) {
      return href;
    }

    const { path: hrefPath, fragment } = splitHref(href);
    if (!hrefPath) {
      return href;
    }

    const resolvedRelative = path.posix.normalize(
      path.posix.join(sourceDir, hrefPath),
    );

    if (!isConfinedUnderProjectRoot(options.projectRoot, resolvedRelative)) {
      return href;
    }

    const slug = options.index.lookup(resolvedRelative);
    if (slug) {
      return `${slug}.html${fragment}`;
    }

    if (SPEC_LIKE_EXT.test(hrefPath)) {
      log.info("output.link-unresolved", {
        sourcePath: options.sourcePath,
        href,
      });
    }

    return href;
  };
}
