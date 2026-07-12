import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import {
  deriveCategory,
  deriveTitle,
  discoverSpecs,
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
    expect(specs.length).toBe(10);
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
    expect(startLine?.patternCount).toBeGreaterThan(0);
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

  it("ignores node_modules, dist, wiki, and .specwiki directories", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-discover-ignore-"),
    );
    tempDirs.push(projectRoot);

    await fs.mkdir(path.join(projectRoot, "node_modules", "pkg"), {
      recursive: true,
    });
    await fs.mkdir(path.join(projectRoot, "dist"), { recursive: true });
    await fs.mkdir(path.join(projectRoot, "wiki"), { recursive: true });
    await fs.mkdir(path.join(projectRoot, ".specwiki"), { recursive: true });
    await fs.writeFile(path.join(projectRoot, "AGENTS.md"), "# Agents");
    await fs.writeFile(
      path.join(projectRoot, "node_modules", "pkg", "AGENTS.md"),
      "# Ignored",
    );
    await fs.writeFile(
      path.join(projectRoot, "dist", "AGENTS.md"),
      "# Ignored",
    );
    await fs.writeFile(
      path.join(projectRoot, "wiki", "AGENTS.md"),
      "# Ignored",
    );
    await fs.writeFile(
      path.join(projectRoot, ".specwiki", "AGENTS.md"),
      "# Ignored",
    );

    const specs = await discoverSpecs({ projectRoot });

    expect(specs).toHaveLength(1);
    expect(specs[0]?.relativePath).toBe("AGENTS.md");
  });
});
