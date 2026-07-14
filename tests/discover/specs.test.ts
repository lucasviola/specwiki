import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import { DEFAULT_SPEC_PATTERNS } from "../../src/config/patterns.js";
import {
  buildDiscoveryIgnores,
  deriveCategory,
  deriveTitle,
  discoverSpecs,
  LARGE_SET_THRESHOLD,
} from "../../src/discover/specs.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/sample-project",
);

const tempDirs: string[] = [];
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.setVerbose(false);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  vi.restoreAllMocks();
  log.setVerbose(false);
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

function parseStderrLines(): Record<string, unknown>[] {
  return stderrSpy.mock.calls
    .map(([chunk]) => String(chunk).trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("buildDiscoveryIgnores", () => {
  it("includes static ignores and optional project-relative paths", () => {
    expect(buildDiscoveryIgnores()).toEqual([
      "**/.git/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/wiki/**",
      "**/.specwiki/**",
      "**/coverage/**",
      "**/.venv/**",
      "**/vendor/**",
    ]);
    expect(buildDiscoveryIgnores(["site", "docs/wiki"])).toEqual([
      "**/.git/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/wiki/**",
      "**/.specwiki/**",
      "**/coverage/**",
      "**/.venv/**",
      "**/vendor/**",
      "site/**",
      "docs/wiki/**",
    ]);
  });

  it("skips empty, dot, and parent-relative ignore paths", () => {
    expect(buildDiscoveryIgnores(["", ".", "..", "../outside"])).toEqual(
      buildDiscoveryIgnores(),
    );
  });
});

describe("deriveCategory", () => {
  it.each([
    ["AGENTS.md", "root"],
    ["SPEC.md", "root"],
    [".cursor\\rules\\example.mdc", "cursor-rules"],
    [".cursor/rules/nested/rule.mdc", "cursor-rules"],
    [".cursor/skills/my-skill/SKILL.md", "cursor-skills"],
    ["specs/feature.md", "specs"],
    ["spec/feature.md", "spec"],
    ["openspec/change.md", "openspec"],
    [".kiro/specs/design.md", "kiro"],
    ["docs/specs/architecture.md", "docs-specs"],
    ["docs/plans/roadmap.md", "plans"],
    ["requirements/req-001.md", "requirements"],
    [".github/copilot-instructions.md", "github"],
    ["_bmad-output/planning/artifact.md", "bmad-output"],
    [".agents/skills/bmad-skill/SKILL.md", "agent-skills"],
    ["packages/nested/AGENTS.md", "other"],
    ["README.md", "root"],
    ["docs/README.md", "other"],
    ["docs/notes/general-notes.md", "other"],
    ["src/lib/internal.md", "other"],
    [".cursor/other/file.md", "other"],
  ])("maps %s to category %s", (relativePath, expected) => {
    expect(deriveCategory(relativePath)).toBe(expected);
  });

  it("checks prefix order before falling back to other", () => {
    expect(deriveCategory(".cursor/rules/foo.mdc")).toBe("cursor-rules");
    expect(deriveCategory(".cursor/skills/foo/SKILL.md")).toBe("cursor-skills");
    expect(deriveCategory("docs/specs/arch.md")).toBe("docs-specs");
    expect(deriveCategory("docs/plans/plan.md")).toBe("plans");
  });
});

describe("deriveTitle", () => {
  it.each([
    [".cursor/skills/my-skill/SKILL.md", "My Skill"],
    ["AGENTS.md", "Agent Instructions"],
    ["SPEC.md", "Project Specification"],
    ["CLAUDE.md", "Claude Instructions"],
    ["GEMINI.md", "Gemini Instructions"],
    [".cursor/rules/example.mdc", "Example"],
    ["specs/feature.md", "Feature"],
    ["requirements/req-001.md", "Req 001"],
    ["docs/specs/my_architecture.md", "My Architecture"],
    ["openspec/change-proposal.md", "Change Proposal"],
  ])("maps %s to title %s", (relativePath, expected) => {
    expect(deriveTitle(relativePath)).toBe(expected);
  });

  it("title-cases multi-word SKILL parent directories", () => {
    expect(deriveTitle(".cursor/skills/code-review/SKILL.md")).toBe(
      "Code Review",
    );
  });
});

describe("discoverSpecs", () => {
  it("discovers at least five specs on the sample fixture", async () => {
    const specs = await discoverSpecs({ projectRoot: fixtureRoot });

    expect(specs.length).toBeGreaterThanOrEqual(5);
    expect(specs.length).toBe(17);
  });

  it("discovers and categorizes spec files in a project tree", async () => {
    const specs = await discoverSpecs({ projectRoot: fixtureRoot });

    expect(specs.length).toBeGreaterThan(0);

    const byPath = Object.fromEntries(
      specs.map((spec) => [spec.relativePath, spec]),
    );

    expect(byPath["AGENTS.md"]).toMatchObject({
      category: "root",
      title: "Agent Instructions",
    });
    expect(byPath["SPEC.md"]).toMatchObject({
      category: "root",
      title: "Project Specification",
    });
    expect(byPath[".cursor/rules/example.mdc"]).toMatchObject({
      category: "cursor-rules",
      title: "Example",
    });
    expect(byPath[".cursor/skills/my-skill/SKILL.md"]).toMatchObject({
      category: "cursor-skills",
      title: "My Skill",
    });
    expect(byPath["specs/feature.md"]).toMatchObject({
      category: "specs",
      title: "Feature",
    });
    expect(byPath["docs/specs/architecture.md"]).toMatchObject({
      category: "docs-specs",
      title: "Architecture",
    });
    expect(byPath["docs/plans/roadmap.md"]).toMatchObject({
      category: "plans",
      title: "Roadmap",
    });
    expect(byPath["requirements/req-001.md"]).toMatchObject({
      category: "requirements",
      title: "Req 001",
    });
    expect(byPath[".github/copilot-instructions.md"]).toMatchObject({
      category: "github",
      title: "Copilot Instructions",
    });
    expect(byPath["openspec/change.md"]).toMatchObject({
      category: "openspec",
      title: "Change",
    });
    expect(byPath["packages/nested/AGENTS.md"]).toMatchObject({
      category: "other",
      title: "Agent Instructions",
    });
    expect(byPath["packages/nested/README.md"]).toMatchObject({
      category: "other",
      title: "Readme",
    });
    expect(byPath["_bmad-output/planning/artifact.md"]).toMatchObject({
      category: "bmad-output",
      title: "Artifact",
    });
    expect(byPath[".agents/skills/bmad-skill/SKILL.md"]).toMatchObject({
      category: "agent-skills",
      title: "Bmad Skill",
    });
    expect(byPath["README.md"]).toMatchObject({
      category: "root",
      title: "Readme",
    });
    expect(byPath["docs/README.md"]).toMatchObject({
      category: "other",
      title: "Readme",
    });
    expect(byPath["docs/notes/general-notes.md"]).toMatchObject({
      category: "other",
      title: "General Notes",
    });
  });

  it("sorts results by category then path", async () => {
    const specs = await discoverSpecs({ projectRoot: fixtureRoot });

    for (let i = 1; i < specs.length; i++) {
      const prev = specs[i - 1];
      const curr = specs[i];
      const catCompare = prev.category.localeCompare(curr.category);

      expect(
        catCompare < 0 ||
          (catCompare === 0 &&
            prev.relativePath.localeCompare(curr.relativePath) <= 0),
      ).toBe(true);
    }
  });

  it("returns an empty list when no specs match", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-discover-empty-"),
    );
    tempDirs.push(emptyRoot);

    const specs = await discoverSpecs({
      projectRoot: emptyRoot,
      patterns: ["AGENTS.md"],
    });

    expect(specs).toEqual([]);
  });

  it("emits discover.empty on stderr when verbose and no specs match", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-discover-empty-verbose-"),
    );
    tempDirs.push(emptyRoot);
    log.setVerbose(true);

    const specs = await discoverSpecs({
      projectRoot: emptyRoot,
      patterns: ["AGENTS.md"],
    });

    expect(specs).toEqual([]);

    const lines = parseStderrLines();
    const events = lines.map((line) => line.event);

    expect(events).toEqual([
      "discover.start",
      "discover.empty",
      "discover.complete",
    ]);
    expect(lines[1]).toMatchObject({
      event: "discover.empty",
      level: "info",
      projectRoot: emptyRoot,
      patternCount: 1,
    });
    expect(lines.at(-1)).toMatchObject({
      event: "discover.complete",
      matchCount: 0,
    });
  });

  it("does not emit discover.empty on stderr in default mode", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-discover-empty-quiet-"),
    );
    tempDirs.push(emptyRoot);
    log.setVerbose(false);

    await discoverSpecs({
      projectRoot: emptyRoot,
      patterns: ["AGENTS.md"],
    });

    expect(parseStderrLines()).toEqual([]);
  });

  it("does not emit discover info logs on stderr in default mode", async () => {
    log.setVerbose(false);

    await discoverSpecs({ projectRoot: fixtureRoot });

    expect(parseStderrLines()).toEqual([]);
  });

  it("emits discover.start and discover.match on stderr when verbose", async () => {
    log.setVerbose(true);

    const specs = await discoverSpecs({ projectRoot: fixtureRoot });
    const lines = parseStderrLines();
    const events = lines.map((line) => line.event);

    expect(events[0]).toBe("discover.start");
    expect(events.filter((event) => event === "discover.match")).toHaveLength(
      specs.length,
    );
    expect(events.at(-1)).toBe("discover.complete");

    const startLine = lines[0];
    const completeLine = lines.at(-1);
    expect(startLine).toMatchObject({
      event: "discover.start",
      level: "info",
      projectRoot: fixtureRoot,
    });
    expect(startLine?.patternCount).toBe(DEFAULT_SPEC_PATTERNS.length);
    expect(completeLine).toMatchObject({
      event: "discover.complete",
      level: "info",
      projectRoot: fixtureRoot,
      matchCount: specs.length,
    });

    for (const spec of specs) {
      expect(events).toContain("discover.match");
      expect(
        lines.some(
          (line) =>
            line.event === "discover.match" &&
            line.relativePath === spec.relativePath,
        ),
      ).toBe(true);
    }
  });

  it("emits discover.error and rethrows when glob fails", async () => {
    vi.resetModules();
    vi.doMock("fast-glob", () => ({
      default: vi.fn().mockRejectedValue(new Error("glob failed")),
    }));

    const { discoverSpecs: discoverSpecsWithMockedGlob } =
      await import("../../src/discover/specs.js");

    await expect(
      discoverSpecsWithMockedGlob({ projectRoot: fixtureRoot }),
    ).rejects.toThrow("glob failed");

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "discover.error",
      level: "error",
      projectRoot: fixtureRoot,
      message: "glob failed",
    });

    vi.doUnmock("fast-glob");
    vi.resetModules();
  });

  it("emits discover.error with string message when glob throws non-Error", async () => {
    vi.resetModules();
    vi.doMock("fast-glob", () => ({
      default: vi.fn().mockRejectedValue("glob string failure"),
    }));

    const { discoverSpecs: discoverSpecsWithMockedGlob } =
      await import("../../src/discover/specs.js");

    await expect(
      discoverSpecsWithMockedGlob({ projectRoot: fixtureRoot }),
    ).rejects.toBe("glob string failure");

    const lines = parseStderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      event: "discover.error",
      level: "error",
      projectRoot: fixtureRoot,
      message: "glob string failure",
    });

    vi.doUnmock("fast-glob");
    vi.resetModules();
  });

  it("rejects glob matches that resolve outside the project root", async () => {
    const outsidePath = path.resolve(fixtureRoot, "..", "outside.md");
    vi.resetModules();
    vi.doMock("fast-glob", () => ({
      default: vi.fn().mockResolvedValue([outsidePath]),
    }));

    const { discoverSpecs: discoverSpecsWithOutsideMatch } =
      await import("../../src/discover/specs.js");

    await expect(
      discoverSpecsWithOutsideMatch({
        projectRoot: fixtureRoot,
        patterns: ["[.][.]/**/*.md"],
      }),
    ).rejects.toThrow("Discovered path is outside the project root");

    const lines = parseStderrLines();
    expect(lines.at(-1)).toMatchObject({
      event: "discover.error",
      level: "error",
      projectRoot: fixtureRoot,
      message: "Discovered path is outside the project root",
    });

    vi.doUnmock("fast-glob");
    vi.resetModules();
  });

  it("ignores node_modules, dist, wiki, .specwiki, .git, coverage, .venv, and vendor directories", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-discover-ignore-"),
    );
    tempDirs.push(projectRoot);

    const ignoredDirs = [
      "node_modules/pkg",
      "dist",
      "wiki",
      ".specwiki",
      ".git/objects",
      "coverage/lcov-report",
      ".venv/lib",
      "vendor/pkg",
    ] as const;

    for (const dir of ignoredDirs) {
      await fs.mkdir(path.join(projectRoot, dir), { recursive: true });
      await fs.writeFile(
        path.join(projectRoot, dir, "ignored.md"),
        "# Ignored",
      );
    }

    await fs.writeFile(path.join(projectRoot, "AGENTS.md"), "# Agents");

    const specs = await discoverSpecs({ projectRoot });

    expect(specs).toHaveLength(1);
    expect(specs[0]?.relativePath).toBe("AGENTS.md");
  });

  it("excludes custom output directories when ignorePaths is set", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-discover-output-ignore-"),
    );
    tempDirs.push(projectRoot);

    await fs.mkdir(path.join(projectRoot, "site"), { recursive: true });
    await fs.writeFile(path.join(projectRoot, "notes.md"), "# Source notes");
    await fs.writeFile(
      path.join(projectRoot, "site", "notes.md"),
      "# Generated wiki page",
    );

    const withoutIgnore = await discoverSpecs({ projectRoot });
    expect(withoutIgnore.map((spec) => spec.relativePath).sort()).toEqual([
      "notes.md",
      "site/notes.md",
    ]);

    const withIgnore = await discoverSpecs({
      projectRoot,
      ignorePaths: ["site"],
    });
    expect(withIgnore.map((spec) => spec.relativePath)).toEqual(["notes.md"]);
  });

  it("emits discover.large-set when verbose and match count exceeds threshold", async () => {
    vi.resetModules();
    const largeMatchSet = Array.from(
      { length: LARGE_SET_THRESHOLD + 1 },
      (_, index) => path.join(fixtureRoot, `bulk/file-${index}.md`),
    );
    vi.doMock("fast-glob", () => ({
      default: vi.fn().mockResolvedValue(largeMatchSet),
    }));

    const { discoverSpecs: discoverSpecsWithLargeSet } =
      await import("../../src/discover/specs.js");
    const { log: verboseLog } = await import("../../src/core/Logger.js");
    verboseLog.setVerbose(true);

    const specs = await discoverSpecsWithLargeSet({ projectRoot: fixtureRoot });

    expect(specs).toHaveLength(LARGE_SET_THRESHOLD + 1);

    const lines = parseStderrLines();
    expect(lines.some((line) => line.event === "discover.large-set")).toBe(
      true,
    );
    expect(lines.find((line) => line.event === "discover.large-set")).toEqual(
      expect.objectContaining({
        event: "discover.large-set",
        matchCount: LARGE_SET_THRESHOLD + 1,
      }),
    );

    vi.doUnmock("fast-glob");
    vi.resetModules();
  });
});
