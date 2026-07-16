import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function readPackageVersion(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = path.join(moduleDir, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    version?: unknown;
  };

  if (typeof pkg.version !== "string" || pkg.version.length === 0) {
    throw new Error("package.json is missing a valid version field");
  }

  return pkg.version;
}
