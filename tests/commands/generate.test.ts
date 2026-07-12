import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import { generateWiki, listSpecs } from "../../src/commands/generate.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/sample-project",
);

const tempDirs: string[] = [];
let logSpy: ReturnType<typeof vi.spyOn>;
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.setVerbose(false);
  logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  log.setVerbose(false);
  logSpy.mockRestore();
  stderrSpy.mockRestore();
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

describe("generateWiki", () => {
  it("writes wiki output for discovered specs", async () => {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-out-"));
    tempDirs.push(outputDir);

    await generateWiki({
      projectRoot: fixtureRoot,
      outputDir,
      verbose: true,
    });

    const indexPath = path.join(outputDir, "index.md");
    const htmlIndexPath = path.join(outputDir, "html", "index.html");

    expect(await fs.readFile(indexPath, "utf-8")).toContain("# Spec Wiki");
    expect(await fs.readFile(htmlIndexPath, "utf-8")).toContain("<html");
    expect(logSpy).toHaveBeenCalled();
  });

  it("prints a helpful message when no specs are found", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-"),
    );
    tempDirs.push(emptyRoot);

    await generateWiki({
      projectRoot: emptyRoot,
      outputDir: "wiki",
    });

    const output = logSpy.mock.calls.flat().join(" ");
    expect(output).toContain("No spec files found");
    expect(output).toContain(
      "Tip: specwiki looks for AGENTS.md, SPEC.md, .cursor/rules/",
    );
  });
});

const stripAnsi = (value: string) =>
  // eslint-disable-next-line no-control-regex -- strip chalk ANSI codes in test assertions
  value.replace(/\u001b\[[0-9;]*m/g, "");

describe("listSpecs", () => {
  it("groups discovered specs by category with headers", async () => {
    await listSpecs({
      projectRoot: fixtureRoot,
      outputDir: "wiki",
    });

    const lines = logSpy.mock.calls.map(([line]) => stripAnsi(String(line)));
    const output = lines.join("\n");

    expect(output).toContain("Found");
    expect(output).toMatch(/cursor-rules/);
    expect(output).toMatch(/openspec/);
    expect(output).toMatch(/root/);

    const cursorRulesIndex = lines.findIndex((line) => line === "cursor-rules");
    const openspecIndex = lines.findIndex((line) => line === "openspec");
    const rootIndex = lines.findIndex((line) => line === "root");

    expect(cursorRulesIndex).toBeGreaterThan(-1);
    expect(openspecIndex).toBeGreaterThan(-1);
    expect(rootIndex).toBeGreaterThan(-1);

    expect(lines[cursorRulesIndex + 1]).toContain("Example — .cursor/rules/");
    expect(lines[openspecIndex + 1]).toContain("Change — openspec/");
    expect(lines[rootIndex + 1]).toContain("Agent Instructions — AGENTS.md");
  });

  it("shows human-readable titles for SKILL and agent files", async () => {
    await listSpecs({
      projectRoot: fixtureRoot,
      outputDir: "wiki",
    });

    const output = logSpy.mock.calls
      .map(([line]) => stripAnsi(String(line)))
      .join("\n");

    expect(output).toContain("Agent Instructions — AGENTS.md");
    expect(output).toContain("Project Specification — SPEC.md");
    expect(output).toContain("My Skill — .cursor/skills/my-skill/SKILL.md");
  });

  it("prints a helpful message when no specs are found", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-list-"),
    );
    tempDirs.push(emptyRoot);

    await listSpecs({
      projectRoot: emptyRoot,
      outputDir: "wiki",
    });

    const output = logSpy.mock.calls.flat().join(" ");
    expect(output).toContain("No spec files found");
    expect(output).toContain(
      "Tip: specwiki looks for AGENTS.md, SPEC.md, .cursor/rules/",
    );
  });

  it("emits discover diagnostics on stderr when verbose is enabled", async () => {
    await listSpecs({
      projectRoot: fixtureRoot,
      outputDir: "wiki",
      verbose: true,
    });

    const lines = parseStderrLines();
    const events = lines.map((line) => line.event);
    const matchCount = lines.filter(
      (line) => line.event === "discover.match",
    ).length;
    const completeLine = lines.find(
      (line) => line.event === "discover.complete",
    );

    expect(events[0]).toBe("discover.start");
    expect(events.at(-1)).toBe("discover.complete");
    expect(matchCount).toBeGreaterThan(0);
    expect(completeLine?.matchCount).toBe(matchCount);
  });
});
