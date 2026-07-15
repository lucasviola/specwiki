import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type PackageJson = {
  bin: Record<string, string>;
  files: string[];
  license: string;
  scripts: Record<string, string>;
};

function readPackageJson(): PackageJson {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  ) as PackageJson;
}

describe("npm publish contract", () => {
  it("allowlists only consumer package artifacts", () => {
    const pkg = readPackageJson();

    expect(pkg.files).toEqual(["dist", "README.md", "LICENSE"]);
    expect(pkg.files).not.toContain("src");
    expect(pkg.files).not.toContain("tests");
    expect(pkg.files).not.toContain("_bmad-output");
  });

  it("keeps the built CLI as the published executable", () => {
    expect(readPackageJson().bin).toEqual({ specwiki: "./dist/cli.js" });
  });

  it("ships the declared MIT license", () => {
    const pkg = readPackageJson();
    const license = fs.readFileSync(path.join(projectRoot, "LICENSE"), "utf8");

    expect(pkg.license).toBe("MIT");
    expect(license).toContain("MIT License");
  });

  it("does not configure git hooks during consumer installs", () => {
    const { scripts } = readPackageJson();

    expect(scripts.prepare).toBeUndefined();
    expect(scripts["setup-hooks"]).toBe("git config core.hooksPath .githooks");
  });
});
