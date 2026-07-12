import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWiki, listSpecs } from "../../src/commands/generate.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/sample-project",
);

const tempDirs: string[] = [];
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(async () => {
  logSpy.mockRestore();
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

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

    expect(logSpy.mock.calls.flat().join(" ")).toContain("No spec files found");
  });
});

describe("listSpecs", () => {
  it("groups discovered specs by category", async () => {
    await listSpecs({
      projectRoot: fixtureRoot,
      outputDir: "wiki",
    });

    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Found");
    expect(output).toContain("cursor-rules");
    expect(output).toContain("AGENTS.md");
  });

  it("prints a message when no specs are found", async () => {
    const emptyRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-list-"),
    );
    tempDirs.push(emptyRoot);

    await listSpecs({
      projectRoot: emptyRoot,
      outputDir: "wiki",
    });

    expect(logSpy.mock.calls.flat().join(" ")).toContain("No spec files found");
  });
});
