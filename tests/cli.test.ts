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
        "Tip: specwiki looks for AGENTS.md, SPEC.md, .cursor/rules/",
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
        "Tip: specwiki looks for AGENTS.md, SPEC.md, .cursor/rules/",
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
