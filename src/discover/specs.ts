import fg from "fast-glob";
import path from "node:path";
import { DEFAULT_SPEC_PATTERNS } from "../config/patterns.js";
import type { DiscoverOptions, SpecFile } from "../types.js";

function deriveCategory(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");

  if (!normalized.includes("/")) return "root";
  if (normalized.startsWith(".cursor/rules/")) return "cursor-rules";
  if (normalized.startsWith(".cursor/skills/")) return "cursor-skills";
  if (normalized.startsWith("specs/")) return "specs";
  if (normalized.startsWith("spec/")) return "spec";
  if (normalized.startsWith("openspec/")) return "openspec";
  if (normalized.startsWith(".kiro/specs/")) return "kiro";
  if (normalized.startsWith("docs/specs/")) return "docs-specs";
  if (normalized.startsWith("docs/plans/")) return "plans";
  if (normalized.startsWith("requirements/")) return "requirements";
  if (normalized.startsWith(".github/")) return "github";

  return "other";
}

function deriveTitle(relativePath: string): string {
  const basename = path.basename(relativePath, path.extname(relativePath));

  if (basename === "SKILL") {
    const parent = path.basename(path.dirname(relativePath));
    return parent
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  if (basename === "AGENTS") return "Agent Instructions";
  if (basename === "SPEC") return "Project Specification";
  if (basename === "CLAUDE") return "Claude Instructions";
  if (basename === "GEMINI") return "Gemini Instructions";

  return basename
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function discoverSpecs(
  options: DiscoverOptions,
): Promise<SpecFile[]> {
  const patterns = options.patterns ?? DEFAULT_SPEC_PATTERNS;

  const entries = await fg(patterns, {
    cwd: options.projectRoot,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/wiki/**",
      "**/.specwiki/**",
    ],
  });

  return entries
    .map((filePath) => {
      const relativePath = path.relative(options.projectRoot, filePath);
      return {
        path: filePath,
        relativePath,
        category: deriveCategory(relativePath),
        title: deriveTitle(relativePath),
      };
    })
    .sort((a, b) => {
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      return a.relativePath.localeCompare(b.relativePath);
    });
}
