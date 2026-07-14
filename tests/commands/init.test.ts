import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SPEC_PATTERNS } from "../../src/config/patterns.js";
import * as patternsModule from "../../src/config/patterns.js";
import {
  getInitExitCode,
  initConfig,
  isInitErrorLogged,
} from "../../src/commands/init.js";
import { log } from "../../src/core/Logger.js";

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

async function createProjectDir(): Promise<string> {
  const projectRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "specwiki-init-project-"),
  );
  tempDirs.push(projectRoot);
  return projectRoot;
}

describe("initConfig", () => {
  it("creates specwiki.config.json with default patterns", async () => {
    const projectRoot = await createProjectDir();

    await initConfig({ projectRoot });

    const configPath = path.join(projectRoot, "specwiki.config.json");
    const content = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(content) as { patterns: string[] };

    expect(parsed.patterns).toEqual(DEFAULT_SPEC_PATTERNS);
    expect(content).toContain("\n  ");
    expect(content.endsWith("\n")).toBe(true);

    const stdout = logSpy.mock.calls.map(([chunk]) => String(chunk)).join("\n");
    expect(stdout).toContain("Created specwiki.config.json");
    expect(stdout).toContain(configPath);
    expect(stdout).toContain("specwiki list");
    expect(stdout).toContain("specwiki generate");
  });

  it("emits init.error and throws when json config exists without force", async () => {
    const projectRoot = await createProjectDir();
    await fs.writeFile(
      path.join(projectRoot, "specwiki.config.json"),
      '{"patterns":["specs/**/*.md"]}',
    );

    await expect(initConfig({ projectRoot })).rejects.toThrow(
      /already exists/i,
    );

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("init.error");
    expect(isInitErrorLogged(new Error("test"))).toBe(false);
  });

  it("exits with code 2 when json config exists without force", async () => {
    const projectRoot = await createProjectDir();
    await fs.writeFile(
      path.join(projectRoot, "specwiki.config.json"),
      '{"patterns":["specs/**/*.md"]}',
    );

    try {
      await initConfig({ projectRoot });
      expect.fail("expected init to throw");
    } catch (err) {
      expect(getInitExitCode(err)).toBe(2);
      expect(isInitErrorLogged(err)).toBe(true);
    }
  });

  it("overwrites json config when force is passed", async () => {
    const projectRoot = await createProjectDir();
    const configPath = path.join(projectRoot, "specwiki.config.json");
    await fs.writeFile(configPath, '{"patterns":["custom/**/*.md"]}');

    await initConfig({ projectRoot, force: true });

    const parsed = JSON.parse(await fs.readFile(configPath, "utf-8")) as {
      patterns: string[];
    };
    expect(parsed.patterns).toEqual(DEFAULT_SPEC_PATTERNS);
  });

  it("rejects when js config exists even with force", async () => {
    const projectRoot = await createProjectDir();
    await fs.writeFile(
      path.join(projectRoot, "specwiki.config.js"),
      'export default { patterns: ["specs/**/*.md"] };',
    );

    await expect(initConfig({ projectRoot, force: true })).rejects.toThrow(
      /specwiki\.config\.js/i,
    );

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("init.error");
    await expect(
      fs.access(path.join(projectRoot, "specwiki.config.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects when js config exists without force", async () => {
    const projectRoot = await createProjectDir();
    await fs.writeFile(
      path.join(projectRoot, "specwiki.config.js"),
      'export default { patterns: ["specs/**/*.md"] };',
    );

    await expect(initConfig({ projectRoot })).rejects.toThrow(
      /specwiki\.config\.js/i,
    );
  });

  it("emits init.write and cli.command when verbose", async () => {
    const projectRoot = await createProjectDir();

    await initConfig({ projectRoot, verbose: true });

    const events = parseStderrLines();
    expect(events.some((line) => line.event === "cli.command")).toBe(true);
    expect(events.some((line) => line.event === "init.write")).toBe(true);
    const writeEvent = events.find((line) => line.event === "init.write");
    expect(writeEvent?.sourcePath).toBe("specwiki.config.json");
  });

  it("does not emit init.write or cli.command when quiet", async () => {
    const projectRoot = await createProjectDir();

    await initConfig({ projectRoot, verbose: false });

    const events = parseStderrLines().map((line) => line.event);
    expect(events).not.toContain("init.write");
    expect(events).not.toContain("cli.command");
  });

  it("emits init.error when write fails", async () => {
    const projectRoot = await createProjectDir();
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockRejectedValueOnce(new Error("disk full"));

    try {
      await expect(initConfig({ projectRoot })).rejects.toThrow(/disk full/i);
    } finally {
      writeSpy.mockRestore();
    }

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("init.error");
  });

  it("creates project directory when it does not exist", async () => {
    const parent = await createProjectDir();
    const projectRoot = path.join(parent, "nested", "new-project");

    await initConfig({ projectRoot });

    const configPath = path.join(projectRoot, "specwiki.config.json");
    expect(await fs.readFile(configPath, "utf-8")).toContain('"patterns"');
  });

  it("uses exit code 1 for write failures", async () => {
    const projectRoot = await createProjectDir();
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockRejectedValueOnce(new Error("disk full"));

    try {
      await initConfig({ projectRoot });
      expect.fail("expected init to throw");
    } catch (err) {
      expect(getInitExitCode(err)).toBe(1);
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("handles non-Error scaffold build failures", async () => {
    const projectRoot = await createProjectDir();
    const validateSpy = vi
      .spyOn(patternsModule, "validatePatternList")
      .mockImplementation(() => {
        throw "bad scaffold";
      });

    try {
      await expect(initConfig({ projectRoot })).rejects.toThrow(
        /Failed to build config scaffold/,
      );
    } finally {
      validateSpy.mockRestore();
    }
  });

  it("handles non-Error write failures", async () => {
    const projectRoot = await createProjectDir();
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockRejectedValueOnce("disk full");

    try {
      let caught: unknown;
      try {
        await initConfig({ projectRoot });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message).toMatch(/Failed to write config file/);
      expect(getInitExitCode(caught)).toBe(1);
    } finally {
      writeSpy.mockRestore();
    }
  });
});

describe("init helpers", () => {
  it("getInitExitCode returns 1 for unknown errors", () => {
    expect(getInitExitCode("boom")).toBe(1);
    expect(getInitExitCode(new Error("no exit code"))).toBe(1);
  });

  it("isInitErrorLogged returns false for unlogged errors", () => {
    expect(isInitErrorLogged(new Error("plain"))).toBe(false);
    expect(isInitErrorLogged(null)).toBe(false);
  });
});
