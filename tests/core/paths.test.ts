import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertConfinedUnder,
  assertRealpathConfinedUnder,
  PathEscapeError,
  resolveOutputWithinProject,
} from "../../src/core/paths.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

describe("paths", () => {
  it("assertConfinedUnder throws PathEscapeError for parent escapes", () => {
    expect(() =>
      assertConfinedUnder("/tmp/project", "/tmp/outside", "output directory"),
    ).toThrow(PathEscapeError);
  });

  it("assertRealpathConfinedUnder ignores ENOENT targets", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-paths-"));
    tempDirs.push(root);

    await expect(
      assertRealpathConfinedUnder(root, path.join(root, "missing"), "missing"),
    ).resolves.toBeUndefined();
  });

  it("assertRealpathConfinedUnder rethrows unexpected fs errors", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-paths-"));
    tempDirs.push(root);
    const spy = vi
      .spyOn(fs, "realpath")
      .mockRejectedValueOnce(new Error("boom"));

    await expect(
      assertRealpathConfinedUnder(root, path.join(root, "wiki"), "wiki"),
    ).rejects.toThrow("boom");

    spy.mockRestore();
  });

  it("assertRealpathConfinedUnder throws PathEscapeError for symlink escapes", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-paths-root-"),
    );
    const outside = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-paths-outside-"),
    );
    tempDirs.push(root, outside);
    await fs.symlink(outside, path.join(root, "wiki"));

    await expect(
      assertRealpathConfinedUnder(root, path.join(root, "wiki"), "wiki"),
    ).rejects.toThrow(PathEscapeError);
  });

  it("resolveOutputWithinProject returns a confined output path", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-paths-"));
    tempDirs.push(root);

    const resolved = await resolveOutputWithinProject(root, "wiki");

    expect(resolved).toBe(path.join(root, "wiki"));
  });
});
