import fs from "node:fs/promises";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

function parseJsonStderrLines(stderr: string): Record<string, unknown>[] {
  return stderr
    .trim()
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const cliPath = path.join(projectRoot, "src/cli.ts");
const fixtureRoot = path.join(projectRoot, "tests/fixtures/sample-project");

function ignoredFixtureOutput(label = "run"): string {
  return path.join(".specwiki", `${label}-${randomUUID()}`);
}

describe("cli list --verbose", () => {
  it("emits structured discover logs on stderr", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx/esm",
        cliPath,
        "list",
        "--verbose",
        "--project",
        fixtureRoot,
      ],
      { cwd: projectRoot },
    );

    expect(stdout).toContain("Found");
    expect(stdout).toContain("Agent Instructions — AGENTS.md");

    const lines = stderr
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const events = lines.map((line) => line.event);

    expect(events[0]).toBe("cli.command");
    expect(events[1]).toBe("discover.start");
    expect(events.at(-1)).toBe("discover.complete");
    expect(lines.filter((line) => line.event === "discover.match").length).toBe(
      lines.find((line) => line.event === "discover.complete")?.matchCount,
    );
  });
});

describe("cli JSON output", () => {
  it("prints one list result on stdout and diagnostics only on stderr", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx/esm",
        cliPath,
        "list",
        "--json",
        "--verbose",
        "--project",
        fixtureRoot,
      ],
      { cwd: projectRoot },
    );

    const result = JSON.parse(stdout) as {
      categories: Array<{
        name: string;
        files: Array<{ relativePath: string; title: string; category: string }>;
      }>;
    };
    const stderrLines = parseJsonStderrLines(stderr);

    expect(result.categories.map((category) => category.name)).toEqual(
      [...result.categories.map((category) => category.name)].sort(),
    );
    expect(
      result.categories.flatMap((category) => category.files),
    ).toContainEqual({
      relativePath: "AGENTS.md",
      title: "Agent Instructions",
      category: "root",
    });
    expect(stdout).not.toContain("\u001b");
    expect(stdout).not.toMatch(/Found |Tip:/);
    expect(stderrLines).toContainEqual(
      expect.objectContaining({
        event: "output.json",
        command: "list",
        categoryCount: result.categories.length,
      }),
    );
  });

  it("writes the wiki then prints a generate JSON result", async () => {
    const outputDir = ignoredFixtureOutput("json");

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--json",
          "--verbose",
          "--project",
          fixtureRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );

      const result = JSON.parse(stdout) as {
        specCount: number;
        outputDir: string;
        pages: Array<Record<string, unknown>>;
      };
      const stderrLines = parseJsonStderrLines(stderr);

      expect(result.specCount).toBe(result.pages.length);
      expect(result.outputDir).toBe(path.resolve(fixtureRoot, outputDir));
      expect(result.pages[0]).toEqual({
        slug: expect.any(String),
        title: expect.any(String),
        category: expect.any(String),
        sourcePath: expect.any(String),
        description: expect.any(String),
      });
      expect(
        await fs.stat(path.join(fixtureRoot, outputDir, "html", "index.html")),
      ).toBeDefined();
      expect(stderrLines).toContainEqual(
        expect.objectContaining({
          event: "output.json",
          command: "generate",
          specCount: result.specCount,
          pageCount: result.pages.length,
        }),
      );
    } finally {
      await fs.rm(path.join(fixtureRoot, outputDir), {
        force: true,
        recursive: true,
      });
    }
  });

  it("writes an llms.txt manifest when generate receives --emit-llms-txt", async () => {
    const outputDir = ignoredFixtureOutput("llms");

    try {
      const { stderr } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--emit-llms-txt",
          "--verbose",
          "--project",
          fixtureRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );

      const manifest = await fs.readFile(
        path.join(fixtureRoot, outputDir, "llms.txt"),
        "utf-8",
      );
      expect(manifest).toMatch(/^# Spec Wiki\n/);
      expect(manifest).toContain("## Project Root");
      expect(parseJsonStderrLines(stderr)).toContainEqual(
        expect.objectContaining({
          event: "output.write",
          relativePath: "llms.txt",
        }),
      );
    } finally {
      await fs.rm(path.join(fixtureRoot, outputDir), {
        force: true,
        recursive: true,
      });
    }
  });

  it("returns JSON empty results without a human tip or output directory", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-json-empty-"),
    );
    const outputDir = path.join(emptyRoot, "wiki");

    try {
      const listResult = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "list",
          "--json",
          "--project",
          emptyRoot,
        ],
        { cwd: projectRoot },
      );
      expect(JSON.parse(listResult.stdout)).toEqual({ categories: [] });
      expect(listResult.stderr).toBe("");

      const generateResult = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--json",
          "--project",
          emptyRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );
      expect(JSON.parse(generateResult.stdout)).toEqual({
        specCount: 0,
        outputDir: path.resolve(outputDir),
        pages: [],
      });
      await expect(fs.stat(outputDir)).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await fs.rm(emptyRoot, { force: true, recursive: true });
    }
  });
});

describe("cli list zero-match", () => {
  it("exits 0 with helpful tip on empty project", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-empty-"),
    );

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "list", "--project", emptyRoot],
        { cwd: projectRoot },
      );

      expect(stdout).toContain("No spec files found");
      expect(stdout).toContain(
        "Tip: specwiki discovers .md and .mdc files anywhere in your project",
      );
      expect(stderr).toBe("");
    } finally {
      await fs.rm(emptyRoot, { force: true, recursive: true });
    }
  });

  it("emits discover.empty on stderr when verbose on empty project", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-empty-verbose-"),
    );

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "list",
          "--verbose",
          "--project",
          emptyRoot,
        ],
        { cwd: projectRoot },
      );

      expect(stdout).toContain("No spec files found");
      expect(stdout).toContain(
        "Tip: specwiki discovers .md and .mdc files anywhere in your project",
      );

      const lines = stderr
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      const events = lines.map((line) => line.event);

      expect(events).toEqual([
        "cli.command",
        "discover.start",
        "discover.empty",
        "discover.complete",
      ]);
      expect(lines[2]).toMatchObject({
        event: "discover.empty",
        level: "info",
        patternCount: expect.any(Number),
      });
      expect(lines.at(-1)).toMatchObject({
        event: "discover.complete",
        matchCount: 0,
      });
    } finally {
      await fs.rm(emptyRoot, { force: true, recursive: true });
    }
  });
});

describe("dogfood — sample-project fixture", () => {
  const REQUIRED_PIPELINE_EVENTS = [
    "cli.command",
    "discover.start",
    "discover.complete",
    "parse.file",
    "output.write",
    "generate.summary",
  ] as const;

  it("generates categorized markdown + HTML wiki with full verbose pipeline logs in < 60s", async () => {
    const outputDir = ignoredFixtureOutput("dogfood");

    try {
      const startedAt = Date.now();
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--verbose",
          "--project",
          fixtureRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );
      const elapsedMs = Date.now() - startedAt;

      expect(stdout).toContain("Generated wiki");
      expect(elapsedMs).toBeLessThan(60_000);

      const lines = stderr
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      const events = lines.map((line) => line.event);

      expect(events[0]).toBe("cli.command");
      expect(events[1]).toBe("discover.start");
      expect(events).toContain("discover.complete");
      expect(events).toContain("generate.summary");

      const matchCount = lines.filter(
        (line) => line.event === "discover.match",
      ).length;
      const parseCount = lines.filter(
        (line) => line.event === "parse.file",
      ).length;
      const writeEvents = lines.filter((line) => line.event === "output.write");
      const summary = lines.find((line) => line.event === "generate.summary");

      expect(matchCount).toBeGreaterThanOrEqual(5);
      expect(parseCount).toBe(matchCount);
      expect(summary?.pageCount).toBeGreaterThanOrEqual(5);

      for (const eventName of REQUIRED_PIPELINE_EVENTS) {
        expect(events).toContain(eventName);
      }

      expect(events.indexOf("discover.complete")).toBeLessThan(
        events.indexOf("parse.file"),
      );
      expect(events.indexOf("parse.file")).toBeLessThan(
        events.indexOf("output.write"),
      );
      expect(events.indexOf("output.write")).toBeLessThan(
        events.indexOf("generate.summary"),
      );

      const indexContent = await fs.readFile(
        path.join(fixtureRoot, outputDir, "index.md"),
        "utf-8",
      );
      const htmlIndexContent = await fs.readFile(
        path.join(fixtureRoot, outputDir, "html", "index.html"),
        "utf-8",
      );

      expect(indexContent).toContain("# Spec Wiki");
      expect(indexContent).toMatch(/## Cursor Rules/);
      expect(indexContent).toMatch(/## (Project Root|root)/i);
      expect(htmlIndexContent).toContain("<html");
      expect(htmlIndexContent).toContain("Spec Wiki");

      expect(
        writeEvents.some((event) => event.relativePath === "index.md"),
      ).toBe(true);
      expect(
        writeEvents.some((event) => event.relativePath === "html/index.html"),
      ).toBe(true);
    } finally {
      await fs.rm(path.join(fixtureRoot, outputDir), {
        force: true,
        recursive: true,
      });
    }
  });
});

describe("cli generate --no-search", () => {
  it("omits search-index.json when --no-search is passed", async () => {
    const outputDir = ignoredFixtureOutput("nosearch");

    try {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--project",
          fixtureRoot,
          "--output",
          outputDir,
          "--no-search",
        ],
        { cwd: projectRoot },
      );

      expect(stdout).toContain("Generated wiki");
      await expect(
        fs.stat(path.join(fixtureRoot, outputDir, "html", "search-index.json")),
      ).rejects.toMatchObject({ code: "ENOENT" });

      const indexHtml = await fs.readFile(
        path.join(fixtureRoot, outputDir, "html", "index.html"),
        "utf-8",
      );
      expect(indexHtml).not.toContain("specwiki-search-input");
    } finally {
      await fs.rm(path.join(fixtureRoot, outputDir), {
        force: true,
        recursive: true,
      });
    }
  });
});

describe("cli generate --verbose", () => {
  it("emits cli.command before discover.start on stderr", async () => {
    const outputDir = ignoredFixtureOutput("generate");

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--verbose",
          "--project",
          fixtureRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );

      expect(stdout).toContain("Generated wiki");
      expect(stdout).not.toContain("Scanning");

      const lines = stderr
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      const events = lines.map((line) => line.event);

      expect(events[0]).toBe("cli.command");
      expect(events[1]).toBe("discover.start");
      expect(lines[0]).toMatchObject({
        event: "cli.command",
        level: "info",
        command: "generate",
      });
    } finally {
      await fs.rm(path.join(fixtureRoot, outputDir), {
        force: true,
        recursive: true,
      });
    }
  });
});

describe("cli --patterns", () => {
  it("uses a custom pattern override for list and generate", async () => {
    const customRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-patterns-"),
    );
    const outputDir = path.join(customRoot, "generated");

    try {
      await fs.mkdir(path.join(customRoot, "custom"), { recursive: true });
      await fs.writeFile(
        path.join(customRoot, "AGENTS.md"),
        "# Default-only agent file",
      );
      await fs.writeFile(
        path.join(customRoot, "custom", "notes.md"),
        "# Custom Notes\n\nCustom discovery content.",
      );

      const listResult = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "list",
          "--project",
          customRoot,
          "--patterns",
          " custom/**/*.md ",
        ],
        { cwd: projectRoot },
      );

      expect(listResult.stdout).toContain("Notes — custom/notes.md");
      expect(listResult.stdout).not.toContain("AGENTS.md");

      await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--project",
          customRoot,
          "--output",
          outputDir,
          "--patterns",
          "custom/**/*.md",
        ],
        { cwd: projectRoot },
      );

      expect(
        await fs.readFile(path.join(outputDir, "custom-notes.md"), "utf-8"),
      ).toContain("Custom discovery content.");
      expect(
        await fs.readFile(
          path.join(outputDir, "html", "custom-notes.html"),
          "utf-8",
        ),
      ).toContain("Custom Notes");
      await expect(
        fs.stat(path.join(outputDir, "agents.md")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await fs.rm(customRoot, { force: true, recursive: true });
    }
  });

  it("emits a sanitized override diagnostic only in verbose mode", async () => {
    const verboseResult = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx/esm",
        cliPath,
        "list",
        "--project",
        fixtureRoot,
        "--patterns",
        "specs/**/*.md, docs/plans/**/*.md",
        "--verbose",
      ],
      { cwd: projectRoot },
    );
    const verboseLines = parseJsonStderrLines(verboseResult.stderr);
    const override = verboseLines.filter(
      (line) => line.event === "config.patterns-override",
    );

    expect(override).toEqual([
      {
        event: "config.patterns-override",
        level: "info",
        patternCount: 2,
      },
    ]);
    expect(JSON.stringify(override)).not.toContain("specs/**/*.md");

    const quietResult = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx/esm",
        cliPath,
        "list",
        "--project",
        fixtureRoot,
        "--patterns",
        "specs/**/*.md",
      ],
      { cwd: projectRoot },
    );
    expect(quietResult.stderr).toBe("");
  });

  it.each([
    "",
    "specs/**/*.md,",
    "**/*.{md,mdc",
    "../**/*.md",
    "{../**/*.md,docs/**/*.md}",
  ])(
    "exits 2 and emits config.error for invalid pattern input %j",
    async (patterns) => {
      try {
        await execFileAsync(
          process.execPath,
          [
            "--import",
            "tsx/esm",
            cliPath,
            "list",
            "--project",
            fixtureRoot,
            "--patterns",
            patterns,
          ],
          { cwd: projectRoot },
        );
        expect.fail("expected invalid patterns to exit non-zero");
      } catch (err) {
        const execError = err as { code?: number; stderr?: string };
        expect(execError.code).toBe(2);

        const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
        expect(
          lines.find((line) => line.event === "config.error"),
        ).toMatchObject({
          event: "config.error",
          level: "error",
          message: expect.stringContaining("Patterns must"),
        });
        expect(lines.find((line) => line.event === "cli.error")).toMatchObject({
          event: "cli.error",
          level: "error",
          command: "list",
        });
        if (patterns) {
          expect(JSON.stringify(lines)).not.toContain(patterns);
        }
      }
    },
  );

  it("exits 2 and emits config.error when the patterns value is missing", async () => {
    try {
      await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "list",
          "--project",
          fixtureRoot,
          "--patterns",
        ],
        { cwd: projectRoot },
      );
      expect.fail("expected missing patterns value to exit non-zero");
    } catch (err) {
      const execError = err as { code?: number; stderr?: string };
      expect(execError.code).toBe(2);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
      expect(lines.find((line) => line.event === "config.error")).toMatchObject(
        {
          event: "config.error",
          level: "error",
          message: "Patterns option requires a comma-separated glob list",
        },
      );
      expect(lines.find((line) => line.event === "cli.error")).toMatchObject({
        event: "cli.error",
        level: "error",
        command: "list",
      });
    }
  });
});

describe("cli project config", () => {
  it("uses patterns from specwiki.config.json for list and generate", async () => {
    const customRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-config-"),
    );
    const outputDir = path.join(customRoot, "generated");

    try {
      await fs.mkdir(path.join(customRoot, "custom"), { recursive: true });
      await fs.writeFile(
        path.join(customRoot, "AGENTS.md"),
        "# Default-only agent file",
      );
      await fs.writeFile(
        path.join(customRoot, "custom", "notes.md"),
        "# Config Notes\n\nConfig discovery content.",
      );
      await fs.writeFile(
        path.join(customRoot, "specwiki.config.json"),
        JSON.stringify({ patterns: ["custom/**/*.md"] }),
      );

      const listResult = await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "list", "--project", customRoot],
        { cwd: projectRoot },
      );

      expect(listResult.stdout).toContain("Notes — custom/notes.md");
      expect(listResult.stdout).not.toContain("AGENTS.md");

      await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--project",
          customRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );

      expect(
        await fs.readFile(path.join(outputDir, "custom-notes.md"), "utf-8"),
      ).toContain("Config discovery content.");
    } finally {
      await fs.rm(customRoot, { force: true, recursive: true });
    }
  });

  it("emits config.load only in verbose mode", async () => {
    const customRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-config-verbose-"),
    );

    try {
      await fs.writeFile(
        path.join(customRoot, "specwiki.config.json"),
        JSON.stringify({ patterns: ["specs/**/*.md"] }),
      );

      const verboseResult = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "list",
          "--project",
          customRoot,
          "--verbose",
        ],
        { cwd: projectRoot },
      );
      const verboseLines = parseJsonStderrLines(verboseResult.stderr);
      expect(
        verboseLines.filter((line) => line.event === "config.load"),
      ).toEqual([
        {
          event: "config.load",
          level: "info",
          sourcePath: "specwiki.config.json",
        },
      ]);

      const quietResult = await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "list", "--project", customRoot],
        { cwd: projectRoot },
      );
      expect(quietResult.stderr).toBe("");
    } finally {
      await fs.rm(customRoot, { force: true, recursive: true });
    }
  });

  it("exits 2 and emits config.error for invalid config files", async () => {
    const customRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-config-invalid-"),
    );

    try {
      await fs.writeFile(
        path.join(customRoot, "specwiki.config.json"),
        '{"patterns":["../**/*.md"]}',
      );

      try {
        await execFileAsync(
          process.execPath,
          ["--import", "tsx/esm", cliPath, "list", "--project", customRoot],
          { cwd: projectRoot },
        );
        expect.fail("expected invalid config to exit non-zero");
      } catch (err) {
        const execError = err as { code?: number; stderr?: string };
        expect(execError.code).toBe(2);

        const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
        expect(
          lines.find((line) => line.event === "config.error"),
        ).toMatchObject({
          event: "config.error",
          level: "error",
          message: "Patterns must stay within the project root",
        });
      }
    } finally {
      await fs.rm(customRoot, { force: true, recursive: true });
    }
  });
});

describe("cli exit codes", () => {
  it("exits 2 and emits cli.error for unknown option", async () => {
    try {
      await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "generate", "--bogus-flag"],
        { cwd: projectRoot },
      );
      expect.fail("expected generate with unknown option to exit non-zero");
    } catch (err) {
      const execError = err as { code?: number; stderr?: string };
      expect(execError.code).toBe(2);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));

      const cliError = lines.find((line) => line.event === "cli.error");
      expect(cliError).toMatchObject({
        event: "cli.error",
        level: "error",
        command: "generate",
      });
      expect(cliError?.message).toBeTruthy();
    }
  });

  it("exits 2 and emits cli.error for unknown command", async () => {
    try {
      await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "bogus-cmd"],
        { cwd: projectRoot },
      );
      expect.fail("expected unknown command to exit non-zero");
    } catch (err) {
      const execError = err as { code?: number; stderr?: string };
      expect(execError.code).toBe(2);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));

      const cliError = lines.find((line) => line.event === "cli.error");
      expect(cliError).toMatchObject({
        event: "cli.error",
        level: "error",
        command: "bogus-cmd",
      });
    }
  });

  it("exits 2 and emits cli.error when --project value is missing", async () => {
    try {
      await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "generate", "--project"],
        { cwd: projectRoot },
      );
      expect.fail("expected missing --project value to exit non-zero");
    } catch (err) {
      const execError = err as { code?: number; stderr?: string };
      expect(execError.code).toBe(2);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));

      const cliError = lines.find((line) => line.event === "cli.error");
      expect(cliError).toMatchObject({
        event: "cli.error",
        level: "error",
        command: "generate",
      });
    }
  });

  it("exits 0 on successful generate", async () => {
    const outputDir = ignoredFixtureOutput("exit-success");

    try {
      const { stderr } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--project",
          fixtureRoot,
          "--output",
          outputDir,
        ],
        { cwd: projectRoot },
      );

      expect(stderr).not.toContain('"event":"cli.error"');
    } finally {
      await fs.rm(path.join(fixtureRoot, outputDir), {
        force: true,
        recursive: true,
      });
    }
  });
});

describe("cli generate failure", () => {
  it("exits 1 and emits cli.error when output path is not writable", async () => {
    const blockedOutput = "AGENTS.md";

    try {
      await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--project",
          fixtureRoot,
          "--output",
          blockedOutput,
        ],
        { cwd: projectRoot },
      );
      expect.fail("expected generate to exit non-zero");
    } catch (err) {
      const execError = err as {
        code?: number;
        stderr?: string;
      };
      expect(execError.code).toBe(1);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));

      const cliError = lines.find((line) => line.event === "cli.error");
      expect(cliError).toMatchObject({
        event: "cli.error",
        level: "error",
        command: "generate",
      });
      expect(cliError?.message).toBeTruthy();
    }
  });
});

describe("cli init", () => {
  it("lists init in --help alongside generate, list, and open", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx/esm", cliPath, "--help"],
      { cwd: projectRoot },
    );

    expect(stdout).toContain("generate");
    expect(stdout).toContain("list");
    expect(stdout).toContain("open");
    expect(stdout).toContain("init");
  });

  it("documents --force in init --help", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx/esm", cliPath, "init", "--help"],
      { cwd: projectRoot },
    );

    expect(stdout).toContain("--force");
    expect(stdout).toMatch(/overwrite/i);
    expect(stdout).toMatch(/\.js/i);
  });

  it("creates specwiki.config.json and list loads it", async () => {
    const initRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-init-"),
    );
    await fs.writeFile(
      path.join(initRoot, "notes.md"),
      "# Notes\n\nInit scaffold test.",
    );

    try {
      const initResult = await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "init", "--project", initRoot],
        { cwd: projectRoot },
      );

      expect(initResult.stdout).toContain("Created specwiki.config.json");
      expect(initResult.stdout).toContain("specwiki list");
      expect(initResult.stdout).toContain("specwiki generate");

      const configPath = path.join(initRoot, "specwiki.config.json");
      const config = JSON.parse(await fs.readFile(configPath, "utf-8")) as {
        patterns: string[];
      };
      expect(config.patterns.length).toBeGreaterThan(0);

      const listResult = await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "list", "--project", initRoot],
        { cwd: projectRoot },
      );
      expect(listResult.stdout).toContain("Notes — notes.md");
    } finally {
      await fs.rm(initRoot, { force: true, recursive: true });
    }
  });

  it("exits 2 when config exists without --force", async () => {
    const initRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-init-exists-"),
    );

    try {
      await fs.writeFile(
        path.join(initRoot, "specwiki.config.json"),
        '{"patterns":["specs/**/*.md"]}',
      );

      try {
        await execFileAsync(
          process.execPath,
          ["--import", "tsx/esm", cliPath, "init", "--project", initRoot],
          { cwd: projectRoot },
        );
        expect.fail("expected init to exit non-zero");
      } catch (err) {
        const execError = err as {
          code?: number;
          stdout?: string;
          stderr?: string;
        };
        expect(execError.code).toBe(2);
        expect(String(execError.stdout ?? "")).toMatch(/already exists/i);

        const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
        expect(lines.some((line) => line.event === "init.error")).toBe(true);
      }
    } finally {
      await fs.rm(initRoot, { force: true, recursive: true });
    }
  });

  it("overwrites json with --force but rejects js config", async () => {
    const initRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-init-force-"),
    );

    try {
      await fs.writeFile(
        path.join(initRoot, "specwiki.config.json"),
        '{"patterns":["custom/**/*.md"]}',
      );

      const forceResult = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "init",
          "--project",
          initRoot,
          "--force",
        ],
        { cwd: projectRoot },
      );
      expect(forceResult.stdout).toContain("Created specwiki.config.json");

      const config = JSON.parse(
        await fs.readFile(path.join(initRoot, "specwiki.config.json"), "utf-8"),
      ) as { patterns: string[] };
      expect(config.patterns).toContain("**/*.{md,mdc}");

      await fs.writeFile(
        path.join(initRoot, "specwiki.config.js"),
        'export default { patterns: ["specs/**/*.md"] };',
      );
      await fs.rm(path.join(initRoot, "specwiki.config.json"));

      try {
        await execFileAsync(
          process.execPath,
          [
            "--import",
            "tsx/esm",
            cliPath,
            "init",
            "--project",
            initRoot,
            "--force",
          ],
          { cwd: projectRoot },
        );
        expect.fail("expected init to exit non-zero when js config exists");
      } catch (err) {
        const execError = err as { code?: number; stderr?: string };
        expect(execError.code).toBe(2);

        const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
        expect(lines.some((line) => line.event === "init.error")).toBe(true);
      }
    } finally {
      await fs.rm(initRoot, { force: true, recursive: true });
    }
  });
});

describe("cli open", () => {
  it("lists open in --help alongside generate and list", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx/esm", cliPath, "--help"],
      { cwd: projectRoot },
    );

    expect(stdout).toContain("generate");
    expect(stdout).toContain("list");
    expect(stdout).toContain("open");
  });

  it("exits 1 with actionable message when wiki index is missing", async () => {
    const emptyProject = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-open-missing-"),
    );

    try {
      await execFileAsync(
        process.execPath,
        ["--import", "tsx/esm", cliPath, "open", "--project", emptyProject],
        { cwd: projectRoot },
      );
      expect.fail("expected open to exit non-zero");
    } catch (err) {
      const execError = err as {
        code?: number;
        stdout?: string;
        stderr?: string;
      };
      expect(execError.code).toBe(1);
      expect(String(execError.stdout ?? "")).toMatch(/generate/i);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
      const openError = lines.find((line) => line.event === "open.error");
      expect(openError).toMatchObject({
        event: "open.error",
        level: "error",
      });
    } finally {
      await fs.rm(emptyProject, { force: true, recursive: true });
    }
  });

  it("exits 1 when output path escapes project root", async () => {
    try {
      await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "open",
          "--project",
          fixtureRoot,
          "--output",
          "../outside",
        ],
        { cwd: projectRoot },
      );
      expect.fail("expected open to exit non-zero");
    } catch (err) {
      const execError = err as {
        code?: number;
        stderr?: string;
      };
      expect(execError.code).toBe(1);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
      expect(lines.some((line) => line.event === "open.error")).toBe(true);
    }
  });

  it("exits 1 when generate output path escapes project root", async () => {
    try {
      await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx/esm",
          cliPath,
          "generate",
          "--project",
          fixtureRoot,
          "--output",
          "../outside",
        ],
        { cwd: projectRoot },
      );
      expect.fail("expected generate to exit non-zero");
    } catch (err) {
      const execError = err as {
        code?: number;
        stderr?: string;
      };
      expect(execError.code).toBe(1);

      const lines = parseJsonStderrLines(String(execError.stderr ?? ""));
      expect(lines.some((line) => line.event === "output.error")).toBe(true);
      expect(lines.some((line) => line.event === "cli.error")).toBe(true);
    }
  });
});
