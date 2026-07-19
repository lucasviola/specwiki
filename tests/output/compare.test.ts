import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  compareWikiOutput,
  directoryHasWikiFiles,
} from "../../src/output/compare.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

async function createTempDir(label: string): Promise<string> {
  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), `specwiki-compare-${label}-`),
  );
  tempDirs.push(dir);
  return dir;
}

describe("compareWikiOutput", () => {
  it("reports fresh when trees match", async () => {
    const expectedRoot = await createTempDir("expected");
    const actualRoot = await createTempDir("actual");

    await fs.mkdir(path.join(expectedRoot, "html"), { recursive: true });
    await fs.mkdir(path.join(actualRoot, "html"), { recursive: true });
    await fs.writeFile(path.join(expectedRoot, "index.md"), "# Index\n");
    await fs.writeFile(path.join(actualRoot, "index.md"), "# Index\n");
    await fs.writeFile(
      path.join(expectedRoot, "html/index.html"),
      "<html></html>\n",
    );
    await fs.writeFile(
      path.join(actualRoot, "html/index.html"),
      "<html></html>\n",
    );

    const result = await compareWikiOutput(expectedRoot, actualRoot);

    expect(result).toEqual({
      fresh: true,
      diffCount: 0,
      fileCount: 2,
      missing: [],
      extra: [],
      changed: [],
    });
  });

  it("reports missing, extra, and changed files", async () => {
    const expectedRoot = await createTempDir("expected-diff");
    const actualRoot = await createTempDir("actual-diff");

    await fs.writeFile(path.join(expectedRoot, "index.md"), "# Index\n");
    await fs.writeFile(path.join(expectedRoot, "page.md"), "# Page\n");
    await fs.writeFile(path.join(actualRoot, "index.md"), "# Changed\n");
    await fs.writeFile(path.join(actualRoot, "extra.md"), "# Extra\n");

    const result = await compareWikiOutput(expectedRoot, actualRoot);

    expect(result.fresh).toBe(false);
    expect(result.diffCount).toBe(3);
    expect(result.missing).toEqual(["page.md"]);
    expect(result.extra).toEqual(["extra.md"]);
    expect(result.changed).toEqual(["index.md"]);
  });

  it("treats a missing actual directory as stale", async () => {
    const expectedRoot = await createTempDir("expected-only");
    await fs.writeFile(path.join(expectedRoot, "index.md"), "# Index\n");

    const result = await compareWikiOutput(
      expectedRoot,
      path.join(expectedRoot, "missing"),
    );

    expect(result.fresh).toBe(false);
    expect(result.missing).toEqual(["index.md"]);
  });
});

describe("directoryHasWikiFiles", () => {
  it("returns false for missing or empty directories", async () => {
    const emptyRoot = await createTempDir("empty");
    const missingRoot = path.join(emptyRoot, "missing");

    expect(await directoryHasWikiFiles(emptyRoot)).toBe(false);
    expect(await directoryHasWikiFiles(missingRoot)).toBe(false);
  });

  it("returns true when files exist", async () => {
    const root = await createTempDir("has-files");
    await fs.writeFile(path.join(root, "index.md"), "# Index\n");

    expect(await directoryHasWikiFiles(root)).toBe(true);
  });
});
