import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readPackageVersion } from "../../src/version.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("readPackageVersion", () => {
  it("returns the version field from package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    ) as { version: string };

    expect(readPackageVersion()).toBe(pkg.version);
  });
});
