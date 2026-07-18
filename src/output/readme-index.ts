import path from "node:path";
import { log } from "../core/Logger.js";
import type { ParsedSpec } from "../types.js";

export interface CategoryReadmeIntroSegment {
  content: string;
  sourcePath: string;
}

export interface CategoryReadmeIntro {
  segments: CategoryReadmeIntroSegment[];
  sourcePaths: string[];
}

export interface ReadmeIndexBindings {
  rootIntro: string | null;
  rootIntroSource: string | null;
  categoryIntros: Map<string, CategoryReadmeIntro>;
  readmeIndexCount: number;
}

export function isReadmeFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return path.posix.basename(normalized).toLowerCase() === "readme.md";
}

export function isRootReadme(relativePath: string): boolean {
  return isReadmeFile(relativePath) && directoryKey(relativePath) === "";
}

function directoryKey(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const dir = path.posix.dirname(normalized);
  return dir === "." ? "" : dir;
}

function specsInDirectory(
  specs: ParsedSpec[],
  directory: string,
): ParsedSpec[] {
  return specs.filter(
    (spec) => directoryKey(spec.file.relativePath) === directory,
  );
}

function hasOtherSpecsInDirectory(
  specs: ParsedSpec[],
  readmePath: string,
): boolean {
  const directory = directoryKey(readmePath);
  return specsInDirectory(specs, directory).some(
    (spec) => spec.file.relativePath !== readmePath,
  );
}

export function categoryHasNonReadmePages(
  specs: ParsedSpec[],
  category: string,
): boolean {
  return specs.some(
    (spec) =>
      spec.file.category === category && !isReadmeFile(spec.file.relativePath),
  );
}

export function resolveReadmeIndexBindings(
  specs: ParsedSpec[],
): ReadmeIndexBindings {
  const categoryIntros = new Map<string, CategoryReadmeIntro>();
  let rootIntro: string | null = null;
  let rootIntroSource: string | null = null;
  let readmeIndexCount = 0;

  const readmeSpecs = specs
    .filter((spec) => isReadmeFile(spec.file.relativePath))
    .sort((a, b) => a.file.relativePath.localeCompare(b.file.relativePath));

  for (const readme of readmeSpecs) {
    const { relativePath, category } = readme.file;

    if (isRootReadme(relativePath)) {
      rootIntro = readme.rawContent;
      rootIntroSource = relativePath;
      readmeIndexCount += 1;
      continue;
    }

    if (!hasOtherSpecsInDirectory(specs, relativePath)) {
      continue;
    }

    if (!categoryHasNonReadmePages(specs, category)) {
      continue;
    }

    log.info("parse.readme-index", { relativePath, category });

    const existing = categoryIntros.get(category);
    if (existing) {
      existing.segments.push({
        content: readme.rawContent,
        sourcePath: relativePath,
      });
      existing.sourcePaths.push(relativePath);
    } else {
      categoryIntros.set(category, {
        segments: [
          {
            content: readme.rawContent,
            sourcePath: relativePath,
          },
        ],
        sourcePaths: [relativePath],
      });
    }
    readmeIndexCount += 1;
  }

  return {
    rootIntro,
    rootIntroSource,
    categoryIntros,
    readmeIndexCount,
  };
}

export function logIndexSummary(readmeIndexCount: number): void {
  log.info("output.index", { readmeIndexCount });
}
