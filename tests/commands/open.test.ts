import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import {
  openWiki,
  resetLaunchHandlerForTests,
  setLaunchHandlerForTests,
} from "../../src/commands/open.js";

const tempDirs: string[] = [];
const launchCalls: Array<{ command: string; args: string[] }> = [];
let logSpy: ReturnType<typeof vi.spyOn>;
let stderrSpy: ReturnType<typeof vi.spyOn>;
let platformSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  log.setVerbose(false);
  launchCalls.length = 0;
  setLaunchHandlerForTests(async (command, args) => {
    launchCalls.push({ command, args });
  });
  logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  log.setVerbose(false);
  resetLaunchHandlerForTests();
  logSpy.mockRestore();
  stderrSpy.mockRestore();
  platformSpy?.mockRestore();
  platformSpy = undefined;
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

async function createProjectWithIndex(): Promise<{
  projectRoot: string;
  indexPath: string;
}> {
  const projectRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "specwiki-open-project-"),
  );
  tempDirs.push(projectRoot);
  const indexPath = path.join(projectRoot, "wiki", "html", "index.html");
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, "<html><body>Wiki</body></html>");
  return { projectRoot, indexPath };
}

describe("openWiki", () => {
  it("opens index.html with platform launcher on success", async () => {
    const { projectRoot, indexPath } = await createProjectWithIndex();
    platformSpy = vi
      .spyOn(process, "platform", "get")
      .mockReturnValue("darwin");

    await openWiki({ projectRoot, outputDir: "wiki" });

    expect(launchCalls).toEqual([{ command: "open", args: [indexPath] }]);
    const stdout = logSpy.mock.calls.map(([chunk]) => String(chunk)).join("\n");
    expect(stdout).toContain("Opened wiki in browser");
    expect(stdout).toContain(indexPath);
  });

  it("uses xdg-open on linux", async () => {
    const { projectRoot, indexPath } = await createProjectWithIndex();
    platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("linux");

    await openWiki({ projectRoot, outputDir: "wiki" });

    expect(launchCalls).toEqual([{ command: "xdg-open", args: [indexPath] }]);
  });

  it("uses cmd start on windows", async () => {
    const { projectRoot, indexPath } = await createProjectWithIndex();
    platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("win32");

    await openWiki({ projectRoot, outputDir: "wiki" });

    expect(launchCalls).toEqual([
      { command: "cmd", args: ["/c", "start", "", indexPath] },
    ]);
  });

  it("emits open.error and throws when index is missing", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-open-missing-"),
    );
    tempDirs.push(projectRoot);
    await fs.mkdir(path.join(projectRoot, "wiki", "html"), { recursive: true });

    await expect(openWiki({ projectRoot, outputDir: "wiki" })).rejects.toThrow(
      /generate/i,
    );

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("open.error");
    expect(launchCalls).toHaveLength(0);
  });

  it("rejects output directory escaping project root", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-open-escape-"),
    );
    tempDirs.push(projectRoot);

    await expect(
      openWiki({ projectRoot, outputDir: "../outside" }),
    ).rejects.toThrow(/project/i);

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("open.error");
    expect(launchCalls).toHaveLength(0);
  });

  it("emits open.launch and cli.command when verbose", async () => {
    const { projectRoot, indexPath } = await createProjectWithIndex();

    await openWiki({ projectRoot, outputDir: "wiki", verbose: true });

    const events = parseStderrLines();
    expect(events.some((line) => line.event === "cli.command")).toBe(true);
    expect(events.some((line) => line.event === "open.launch")).toBe(true);
    const launch = events.find((line) => line.event === "open.launch");
    expect(launch?.indexPath).toBe(indexPath);
  });

  it("does not emit open.launch when quiet", async () => {
    const { projectRoot } = await createProjectWithIndex();

    await openWiki({ projectRoot, outputDir: "wiki", verbose: false });

    const events = parseStderrLines().map((line) => line.event);
    expect(events).not.toContain("open.launch");
    expect(events).not.toContain("cli.command");
  });

  it("emits open.error when browser spawn fails", async () => {
    const { projectRoot } = await createProjectWithIndex();
    setLaunchHandlerForTests(async () => {
      throw new Error("spawn failed");
    });

    await expect(openWiki({ projectRoot, outputDir: "wiki" })).rejects.toThrow(
      /browser/i,
    );

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("open.error");
  });

  it("rejects symlinked output directory escaping project root", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-open-symlink-"),
    );
    const outsideDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-open-outside-"),
    );
    tempDirs.push(projectRoot, outsideDir);
    const indexPath = path.join(outsideDir, "html", "index.html");
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    await fs.writeFile(indexPath, "<html><body>Outside</body></html>");
    await fs.symlink(outsideDir, path.join(projectRoot, "wiki"));

    await expect(openWiki({ projectRoot, outputDir: "wiki" })).rejects.toThrow(
      /project/i,
    );

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("open.error");
    expect(launchCalls).toHaveLength(0);
  });

  it("reports access errors separately from missing index", async () => {
    const { projectRoot } = await createProjectWithIndex();
    const accessSpy = vi
      .spyOn(fs, "access")
      .mockRejectedValueOnce(
        Object.assign(new Error("permission denied"), { code: "EACCES" }),
      );

    try {
      await expect(
        openWiki({ projectRoot, outputDir: "wiki" }),
      ).rejects.toThrow(/access wiki index/i);
    } finally {
      accessSpy.mockRestore();
    }

    const events = parseStderrLines().map((line) => line.event);
    expect(events).toContain("open.error");
    expect(launchCalls).toHaveLength(0);
  });
});
