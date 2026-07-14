import fs from "node:fs/promises";
import os from "node:os";
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
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-dogfood-"),
    );

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
        path.join(outputDir, "index.md"),
        "utf-8",
      );
      const htmlIndexContent = await fs.readFile(
        path.join(outputDir, "html", "index.html"),
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
      await fs.rm(outputDir, { force: true, recursive: true });
    }
  });
});

describe("cli generate --no-search", () => {
  it("omits search-index.json when --no-search is passed", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-nosearch-"),
    );

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
        fs.stat(path.join(outputDir, "html", "search-index.json")),
      ).rejects.toMatchObject({ code: "ENOENT" });

      const indexHtml = await fs.readFile(
        path.join(outputDir, "html", "index.html"),
        "utf-8",
      );
      expect(indexHtml).not.toContain("specwiki-search-input");
    } finally {
      await fs.rm(outputDir, { force: true, recursive: true });
    }
  });
});

describe("cli generate --verbose", () => {
  it("emits cli.command before discover.start on stderr", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-generate-"),
    );

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
      await fs.rm(outputDir, { force: true, recursive: true });
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
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-cli-exit-success-"),
    );

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
      await fs.rm(outputDir, { force: true, recursive: true });
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
