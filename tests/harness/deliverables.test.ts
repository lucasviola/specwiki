import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("HARNESS §13 deliverables — meta guards", () => {
  it("package.json defines all §0.2 quality-gate scripts", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    for (const script of [
      "test",
      "lint",
      "format",
      "coverage",
      "typecheck",
      "build",
    ]) {
      expect(pkg.scripts[script], `missing script: ${script}`).toBeTruthy();
    }
  });

  it("vitest.config.ts enforces 90% coverage thresholds", () => {
    const configSource = readSource("vitest.config.ts");

    for (const metric of ["lines", "functions", "branches", "statements"]) {
      expect(configSource).toMatch(new RegExp(`${metric}:\\s*90`, "i"));
    }
  });

  it("IMPLEMENTATION.md contains build log and epic checklist", () => {
    const impl = readSource("IMPLEMENTATION.md");

    expect(impl).toContain("## Build Log");
    expect(impl).toContain("## MVP Epic Progression Checklist");
    expect(impl).toContain("§13 Deliverables Checklist");
  });
});

describe("HARNESS §13 deliverables — structured logging (§0.8)", () => {
  const pipelineModules = [
    "src/discover/specs.ts",
    "src/parse/markdown.ts",
    "src/output/wiki.ts",
    "src/commands/generate.ts",
    "src/cli.ts",
  ];

  it.each(pipelineModules)("imports structured Logger: %s", (modulePath) => {
    const source = readSource(modulePath);
    expect(source).toMatch(/from\s+["'].*Logger\.js["']/);
    expect(source).toMatch(/log\.(info|error)/);
  });

  it("discover module emits required §0.8 events", () => {
    const source = readSource("src/discover/specs.ts");
    for (const event of [
      "discover.start",
      "discover.match",
      "discover.empty",
      "discover.complete",
      "discover.error",
    ]) {
      expect(source).toContain(event);
    }
  });

  it("parse module emits required §0.8 events", () => {
    const source = readSource("src/parse/markdown.ts");
    for (const event of ["parse.file", "parse.error", "render.error"]) {
      expect(source).toContain(event);
    }
  });

  it("output module emits required §0.8 events", () => {
    const source = readSource("src/output/wiki.ts");
    for (const event of [
      "output.write",
      "output.error",
      "output.slug-collision",
    ]) {
      expect(source).toContain(event);
    }
  });

  it("commands module emits cli.command and generate.summary", () => {
    const source = readSource("src/commands/generate.ts");
    expect(source).toContain("cli.command");
    expect(source).toContain("generate.summary");
    expect(source).toContain("cli.error");
  });
});
