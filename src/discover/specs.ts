import fg from "fast-glob";
import path from "node:path";
import { DEFAULT_SPEC_PATTERNS } from "../config/patterns.js";
import { log } from "../core/Logger.js";
import type { DiscoverOptions, SpecFile } from "../types.js";

/** Match count above which verbose mode emits a performance heads-up. */
export const LARGE_SET_THRESHOLD = 500;

/** Path-prefix category for discovery and list grouping. Exported for tests. */
export function deriveCategory(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");

  if (!normalized.includes("/")) return "root";
  if (normalized.startsWith(".cursor/rules/")) return "cursor-rules";
  if (normalized.startsWith(".cursor/skills/")) return "cursor-skills";
  if (normalized.startsWith("specs/")) return "specs";
  if (normalized.startsWith("spec/")) return "spec";
  if (normalized.startsWith("openspec/")) return "openspec";
  if (normalized.startsWith(".specs/")) return "tlc-specs";
  if (normalized.startsWith(".kiro/")) return "kiro";
  if (normalized.startsWith("docs/specs/")) return "docs-specs";
  if (normalized.startsWith("docs/plans/")) return "plans";
  if (normalized.startsWith("docs/adr/")) return "adr";
  if (normalized.startsWith("requirements/")) return "requirements";
  if (normalized.startsWith(".github/")) return "github";
  if (normalized.startsWith("_bmad-output/")) return "bmad-output";
  if (normalized.startsWith(".agents/skills/")) return "agent-skills";

  return "other";
}

/** Human-readable title from basename; special cases for agent/skill files. Exported for tests. */
export function deriveTitle(relativePath: string): string {
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
  if (basename === "README") return "Readme";

  return basename
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATIC_DISCOVERY_IGNORES = [
  "**/.git/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/wiki/**",
  "**/.specwiki/**",
  "**/coverage/**",
  "**/.venv/**",
  "**/vendor/**",
] as const;

/** Build fast-glob ignore list, optionally excluding project-relative output dirs. */
export function buildDiscoveryIgnores(ignorePaths?: string[]): string[] {
  const ignores: string[] = [...STATIC_DISCOVERY_IGNORES];

  for (const ignorePath of ignorePaths ?? []) {
    const normalized = ignorePath.replace(/\\/g, "/").replace(/\/$/, "");
    if (
      normalized.length === 0 ||
      normalized === "." ||
      normalized === ".." ||
      normalized.startsWith("../")
    ) {
      continue;
    }
    ignores.push(`${normalized}/**`);
  }

  return ignores;
}

export async function discoverSpecs(
  options: DiscoverOptions,
): Promise<SpecFile[]> {
  const patterns = options.patterns ?? DEFAULT_SPEC_PATTERNS;

  log.info("discover.start", {
    projectRoot: options.projectRoot,
    patternCount: patterns.length,
  });

  let entries: string[];
  try {
    entries = await fg(patterns, {
      cwd: options.projectRoot,
      absolute: true,
      onlyFiles: true,
      dot: true,
      ignore: buildDiscoveryIgnores(options.ignorePaths),
    });
  } catch (err) {
    log.error("discover.error", {
      projectRoot: options.projectRoot,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  for (const filePath of entries) {
    const relativePath = path.relative(options.projectRoot, filePath);
    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      const message = "Discovered path is outside the project root";
      log.error("discover.error", {
        projectRoot: options.projectRoot,
        message,
      });
      throw new Error(message);
    }
  }

  const specs = entries
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

  for (const spec of specs) {
    log.info("discover.match", { relativePath: spec.relativePath });
  }

  if (specs.length === 0) {
    log.info("discover.empty", {
      projectRoot: options.projectRoot,
      patternCount: patterns.length,
    });
  }

  log.info("discover.complete", {
    projectRoot: options.projectRoot,
    matchCount: specs.length,
  });

  if (specs.length > LARGE_SET_THRESHOLD) {
    log.info("discover.large-set", { matchCount: specs.length });
  }

  return specs;
}
