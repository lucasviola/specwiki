import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SPEC_PATTERNS } from "../../src/config/patterns.js";
import { log } from "../../src/core/Logger.js";
import { generateWiki, listSpecs } from "../../src/commands/generate.js";
import * as wikiModule from "../../src/output/wiki.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/sample-project",
);

const collisionFixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/collision-project",
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

function ignoredFixtureOutput(projectRoot: string, label = "run"): string {
  const outputDir = path.join(".specwiki", `${label}-${randomUUID()}`);
  tempDirs.push(path.join(projectRoot, outputDir));
  return outputDir;
}

describe("generateWiki", () => {
  it("writes an llms.txt manifest only when explicitly enabled", async () => {
    const projectRoot = fixtureRoot;
    const defaultOutput = ignoredFixtureOutput(projectRoot, "llms-default");
    const enabledOutput = ignoredFixtureOutput(projectRoot, "llms-enabled");

    await generateWiki({
      projectRoot,
      outputDir: defaultOutput,
    });
    await expect(
      fs.stat(path.join(projectRoot, defaultOutput, "llms.txt")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });

    await generateWiki({
      projectRoot,
      outputDir: enabledOutput,
      emitLlmsTxt: true,
      verbose: true,
    });

    await expect(
      fs.readFile(path.join(projectRoot, enabledOutput, "llms.txt"), "utf-8"),
    ).resolves.toContain("# Spec Wiki");
    expect(parseStderrLines()).toContainEqual(
      expect.objectContaining({
        event: "output.write",
        relativePath: "llms.txt",
      }),
    );
  });

  it("prints a stable JSON result after writing the wiki", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "json");

    await generateWiki({
      projectRoot,
      outputDir,
      json: true,
    });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      specCount: number;
      outputDir: string;
      pages: Array<Record<string, unknown>>;
    };

    expect(result.specCount).toBe(result.pages.length);
    expect(result.outputDir).toBe(path.resolve(projectRoot, outputDir));
    expect(result.pages.map((page) => page.sourcePath).slice(0, 4)).toEqual([
      ".agents/skills/bmad-skill/SKILL.md",
      "_bmad-output/planning/artifact.md",
      ".cursor/rules/example.mdc",
      ".cursor/skills/my-skill/SKILL.md",
    ]);
    expect(Object.keys(result.pages[0] ?? {})).toEqual([
      "slug",
      "title",
      "category",
      "sourcePath",
      "description",
    ]);
    expect(result.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: expect.any(String),
          title: expect.any(String),
          category: expect.any(String),
          sourcePath: expect.any(String),
          description: expect.any(String),
        }),
      ]),
    );
    expect(
      await fs.stat(path.join(projectRoot, outputDir, "index.md")),
    ).toBeDefined();
  });

  it("prints an empty JSON result without creating output for zero specs", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-"),
    );
    const outputDir = path.join(projectRoot, "wiki");
    tempDirs.push(projectRoot);

    await generateWiki({ projectRoot, outputDir, json: true });

    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0]))).toEqual({
      specCount: 0,
      outputDir: path.resolve(outputDir),
      pages: [],
    });
    await expect(fs.stat(outputDir)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("writes wiki output for discovered specs", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "writes");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const indexPath = path.join(projectRoot, outputDir, "index.md");
    const htmlIndexPath = path.join(
      projectRoot,
      outputDir,
      "html",
      "index.html",
    );

    expect(await fs.readFile(indexPath, "utf-8")).toContain("# Spec Wiki");
    expect(await fs.readFile(htmlIndexPath, "utf-8")).toContain("<html");
    expect(logSpy).toHaveBeenCalled();
  });

  it("does not re-discover generated wiki pages on a second run with custom output dir", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-generate-output-ignore-"),
    );
    tempDirs.push(projectRoot);
    const outputDir = path.join(projectRoot, "site");

    await fs.writeFile(
      path.join(projectRoot, "notes.md"),
      "# Notes\n\nSource content.",
    );

    await generateWiki({ projectRoot, outputDir });
    await generateWiki({ projectRoot, outputDir });

    const generatedNotes = await fs.readFile(
      path.join(outputDir, "notes.md"),
      "utf-8",
    );
    expect(generatedNotes).toContain("Source content.");
    expect(generatedNotes).not.toContain("Generated wiki page");
  });

  it("emits parse.file diagnostics on stderr when verbose is enabled", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "parse-verbose");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const lines = parseStderrLines();
    const parseEvents = lines.filter((line) => line.event === "parse.file");
    const matchCount = lines.filter(
      (line) => line.event === "discover.match",
    ).length;

    expect(parseEvents.length).toBe(matchCount);
    expect(parseEvents.length).toBeGreaterThan(0);
    for (const event of parseEvents) {
      expect(event.relativePath).toBeTruthy();
      expect(JSON.stringify(event)).not.toMatch(/rawContent|frontmatter/);
    }
  });

  it("binds README content into wiki index markdown and HTML on fixture", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "readme-index");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const indexContent = await fs.readFile(
      path.join(projectRoot, outputDir, "index.md"),
      "utf-8",
    );
    const htmlIndex = await fs.readFile(
      path.join(projectRoot, outputDir, "html", "index.html"),
      "utf-8",
    );

    expect(indexContent).toContain(
      "Root README for extended default pattern discovery.",
    );
    expect(indexContent).not.toContain(
      "Structured documentation generated from AI specs",
    );
    expect(indexContent).toContain(
      "This nested README drives the Other category index introduction.",
    );
    expect(htmlIndex).toContain(
      "Root README for extended default pattern discovery.",
    );
    expect(htmlIndex).toContain(
      "This nested README drives the Other category index introduction.",
    );
    expect(
      await fs.readFile(
        path.join(projectRoot, outputDir, "readme.md"),
        "utf-8",
      ),
    ).toContain("Root README for extended default pattern discovery.");

    const lines = parseStderrLines();
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "parse.readme-index",
        relativePath: "packages/nested/README.md",
        category: "other",
      }),
    );
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "output.index",
        readmeIndexCount: 2,
      }),
    );
  });

  it("emits output.write and generate.summary on stderr when verbose is enabled", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "output-verbose");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const lines = parseStderrLines();
    const writeEvents = lines.filter((line) => line.event === "output.write");
    const mdWrites = writeEvents.filter((event) =>
      String(event.relativePath).endsWith(".md"),
    );
    const htmlWrites = writeEvents.filter((event) =>
      String(event.relativePath).startsWith("html/"),
    );
    const summaryEvent = lines.find(
      (line) => line.event === "generate.summary",
    );

    expect(writeEvents.length).toBeGreaterThan(0);
    expect(mdWrites.some((event) => event.relativePath === "index.md")).toBe(
      true,
    );
    expect(
      htmlWrites.some((event) => event.relativePath === "html/index.html"),
    ).toBe(true);
    for (const event of writeEvents) {
      expect(event.relativePath).toBeTruthy();
      expect(JSON.stringify(event)).not.toMatch(/rawContent|frontmatter/);
    }

    expect(summaryEvent?.pageCount).toBe(mdWrites.length - 1);
    expect(summaryEvent?.markdownFiles).toBe(mdWrites.length);
    expect(summaryEvent?.htmlFiles).toBe(htmlWrites.length);
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
      "Tip: specwiki discovers .md and .mdc files anywhere in your project",
    );
  });

  it("emits cli.command on stderr when verbose is enabled", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "cli-command");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const lines = parseStderrLines();
    const commandEvent = lines.find((line) => line.event === "cli.command");

    expect(commandEvent).toMatchObject({
      event: "cli.command",
      level: "info",
      command: "generate",
      projectRoot,
      outputDir: path.resolve(projectRoot, outputDir),
      verbose: true,
      patternCount: DEFAULT_SPEC_PATTERNS.length,
    });
    expect(
      lines.findIndex((line) => line.event === "cli.command"),
    ).toBeLessThan(lines.findIndex((line) => line.event === "discover.start"));
  });

  it("does not emit cli.command when verbose is disabled", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "cli-quiet");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: false,
    });

    const lines = parseStderrLines();
    expect(lines.some((line) => line.event === "cli.command")).toBe(false);
  });

  it("does not print verbose scan diagnostics on stdout when verbose", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "stdout-verbose");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const output = logSpy.mock.calls.flat().join(" ");
    expect(output).not.toContain("Scanning");
    expect(output).not.toContain("Found 6 spec file(s):");
    expect(output).toContain("Generated wiki");
  });

  it("emits cli.error and rethrows when writeWiki fails", async () => {
    const projectRoot = fixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "write-fail");

    vi.spyOn(wikiModule, "writeWiki").mockRejectedValueOnce(
      new Error("disk full"),
    );

    await expect(
      generateWiki({
        projectRoot,
        outputDir,
        verbose: true,
      }),
    ).rejects.toThrow("disk full");

    const lines = parseStderrLines();
    const cliError = lines.find((line) => line.event === "cli.error");
    expect(cliError).toMatchObject({
      event: "cli.error",
      level: "error",
      command: "generate",
      message: "disk full",
    });
    expect(JSON.stringify(cliError)).not.toMatch(/stack/);
  });

  it("disambiguates slug collisions and emits output.slug-collision when verbose", async () => {
    const projectRoot = collisionFixtureRoot;
    const outputDir = ignoredFixtureOutput(projectRoot, "collision");

    await generateWiki({
      projectRoot,
      outputDir,
      verbose: true,
    });

    const lines = parseStderrLines();
    const collisionEvents = lines.filter(
      (line) => line.event === "output.slug-collision",
    );
    expect(collisionEvents).toHaveLength(1);
    expect(collisionEvents[0]?.sourcePath).toBe("specs/foo/bar.md");
    expect(collisionEvents[0]?.originalSlug).toBe("specs-foo-bar");

    const mdFiles = (
      await fs.readdir(path.join(projectRoot, outputDir))
    ).filter((name) => name.endsWith(".md"));
    const pageFiles = mdFiles.filter((name) => name !== "index.md");
    expect(pageFiles).toHaveLength(3);
    expect(new Set(pageFiles).size).toBe(3);
    expect(pageFiles).toContain("specs-foo-bar.md");

    const indexContent = await fs.readFile(
      path.join(projectRoot, outputDir, "index.md"),
      "utf-8",
    );
    for (const fileName of pageFiles) {
      expect(indexContent).toContain(`](${fileName})`);
    }
  });

  it("rejects output directory escaping project root", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-generate-escape-"),
    );
    tempDirs.push(projectRoot);

    await expect(
      generateWiki({ projectRoot, outputDir: "../outside" }),
    ).rejects.toThrow(/project root/i);

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("output.error");
    expect(events).toContain("cli.error");
  });

  it("rejects symlinked output directory escaping project root", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-generate-symlink-"),
    );
    const outsideDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-generate-outside-"),
    );
    tempDirs.push(projectRoot, outsideDir);
    await fs.symlink(outsideDir, path.join(projectRoot, "wiki"));

    await expect(
      generateWiki({ projectRoot, outputDir: "wiki" }),
    ).rejects.toThrow(/project root/i);

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("output.error");
    expect(events).toContain("cli.error");
  });

  it("generates into the project root when --output is .", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-generate-root-output-"),
    );
    tempDirs.push(projectRoot);
    await fs.writeFile(
      path.join(projectRoot, "SPEC.md"),
      "# Root Spec\n\nProject-root output.",
    );

    await generateWiki({ projectRoot, outputDir: "." });

    await expect(
      fs.readFile(path.join(projectRoot, "index.md"), "utf-8"),
    ).resolves.toContain("# Spec Wiki");
  });
});

const stripAnsi = (value: string) =>
  // eslint-disable-next-line no-control-regex -- strip chalk ANSI codes in test assertions
  value.replace(/\u001b\[[0-9;]*m/g, "");

describe("listSpecs", () => {
  it("prints a JSON-only category result in discovery order", async () => {
    await listSpecs({
      projectRoot: fixtureRoot,
      outputDir: "wiki",
      json: true,
    });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      categories: Array<{
        name: string;
        files: Array<{ relativePath: string; title: string; category: string }>;
      }>;
    };

    expect(
      result.categories.map((category) => ({
        name: category.name,
        relativePaths: category.files.map((file) => file.relativePath),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "agent-skills",
          "relativePaths": [
            ".agents/skills/bmad-skill/SKILL.md",
          ],
        },
        {
          "name": "bmad-output",
          "relativePaths": [
            "_bmad-output/planning/artifact.md",
          ],
        },
        {
          "name": "cursor-rules",
          "relativePaths": [
            ".cursor/rules/example.mdc",
          ],
        },
        {
          "name": "cursor-skills",
          "relativePaths": [
            ".cursor/skills/my-skill/SKILL.md",
          ],
        },
        {
          "name": "docs-specs",
          "relativePaths": [
            "docs/specs/architecture.md",
          ],
        },
        {
          "name": "github",
          "relativePaths": [
            ".github/copilot-instructions.md",
          ],
        },
        {
          "name": "openspec",
          "relativePaths": [
            "openspec/change.md",
          ],
        },
        {
          "name": "other",
          "relativePaths": [
            "docs/notes/general-notes.md",
            "docs/README.md",
            "packages/nested/AGENTS.md",
            "packages/nested/README.md",
          ],
        },
        {
          "name": "plans",
          "relativePaths": [
            "docs/plans/roadmap.md",
          ],
        },
        {
          "name": "requirements",
          "relativePaths": [
            "requirements/req-001.md",
          ],
        },
        {
          "name": "root",
          "relativePaths": [
            "AGENTS.md",
            "README.md",
            "SPEC.md",
          ],
        },
        {
          "name": "specs",
          "relativePaths": [
            "specs/feature.md",
          ],
        },
      ]
    `);
    expect(result.categories.map((category) => category.name)).toEqual(
      [...result.categories.map((category) => category.name)].sort(),
    );
    expect(result.categories).toContainEqual(
      expect.objectContaining({
        name: "root",
        files: expect.arrayContaining([
          {
            relativePath: "AGENTS.md",
            title: "Agent Instructions",
            category: "root",
          },
        ]),
      }),
    );
    expect(
      result.categories
        .find((category) => category.name === "other")
        ?.files.map((file) => file.relativePath),
    ).toEqual([
      "docs/notes/general-notes.md",
      "docs/README.md",
      "packages/nested/AGENTS.md",
      "packages/nested/README.md",
    ]);
    expect(Object.keys(result.categories[0]?.files[0] ?? {})).toEqual([
      "relativePath",
      "title",
      "category",
    ]);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("prints an empty JSON categories result for zero specs", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-list-"),
    );
    tempDirs.push(emptyRoot);

    await listSpecs({
      projectRoot: emptyRoot,
      outputDir: "wiki",
      json: true,
    });

    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0])))
      .toMatchInlineSnapshot(`
      {
        "categories": [],
      }
    `);
  });

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
      "Tip: specwiki discovers .md and .mdc files anywhere in your project",
    );
  });

  it("emits cli.command and discover diagnostics on stderr when verbose is enabled", async () => {
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
    const commandEvent = lines.find((line) => line.event === "cli.command");

    expect(commandEvent).toMatchObject({
      event: "cli.command",
      level: "info",
      command: "list",
      projectRoot: fixtureRoot,
      verbose: true,
      patternCount: DEFAULT_SPEC_PATTERNS.length,
    });
    expect(events[0]).toBe("cli.command");
    expect(events[1]).toBe("discover.start");
    expect(events.at(-1)).toBe("discover.complete");
    expect(matchCount).toBeGreaterThan(0);
    expect(completeLine?.matchCount).toBe(matchCount);
  });

  it("does not emit cli.command when verbose is disabled", async () => {
    await listSpecs({
      projectRoot: fixtureRoot,
      outputDir: "wiki",
      verbose: false,
    });

    const lines = parseStderrLines();
    expect(lines.some((line) => line.event === "cli.command")).toBe(false);
  });

  it("emits cli.error and rethrows when discoverSpecs fails", async () => {
    const discoverModule = await import("../../src/discover/specs.js");
    vi.spyOn(discoverModule, "discoverSpecs").mockRejectedValueOnce(
      new Error("discover boom"),
    );

    await expect(
      listSpecs({
        projectRoot: fixtureRoot,
        outputDir: "wiki",
        verbose: true,
      }),
    ).rejects.toThrow("discover boom");

    const lines = parseStderrLines();
    const cliError = lines.find((line) => line.event === "cli.error");
    expect(cliError).toMatchObject({
      event: "cli.error",
      level: "error",
      command: "list",
      message: "discover boom",
    });
  });
});
