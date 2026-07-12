import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { discoverSpecs } from "../../src/discover/specs.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/sample-project",
);

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

describe("discoverSpecs", () => {
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
});
