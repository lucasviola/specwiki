#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const REQUIRED_TAR_ENTRIES = [
  "package/package.json",
  "package/README.md",
  "package/LICENSE",
  "package/dist/cli.js",
];

export const FORBIDDEN_TAR_PREFIXES = [
  "package/src/",
  "package/tests/",
  "package/_bmad-output/",
  "package/.agents/",
  "package/.cursor/",
  "package/.githooks/",
];

/**
 * @param {string[]} entries
 */
export function validateTarballEntries(entries) {
  const missing = REQUIRED_TAR_ENTRIES.filter(
    (entry) => !entries.includes(entry),
  );
  if (missing.length > 0) {
    throw new Error(`tarball missing required entries: ${missing.join(", ")}`);
  }

  const forbidden = entries.filter((entry) =>
    FORBIDDEN_TAR_PREFIXES.some((prefix) => entry.startsWith(prefix)),
  );
  if (forbidden.length > 0) {
    throw new Error(
      `tarball contains forbidden entries: ${forbidden.slice(0, 5).join(", ")}`,
    );
  }
}

/**
 * @param {string} tarballPath
 */
export function listTarballEntries(tarballPath) {
  const result = spawnSync("tar", ["-tzf", tarballPath], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || "failed to inspect package tarball",
    );
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * npm publish --dry-run sets npm_config_dry_run, which makes nested npm pack/install
 * simulate instead of writing files. Strip dry-run config for real subprocess work.
 *
 * @param {NodeJS.ProcessEnv} [overrides]
 */
export function npmSubprocessEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.npm_config_dry_run;
  delete env.npm_config_dryRun;
  return env;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 */
function run(command, args, options = {}) {
  const env =
    command === "npm"
      ? npmSubprocessEnv(
          options.env && typeof options.env === "object" ? options.env : {},
        )
      : options.env;

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
    ...(env ? { env } : {}),
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim();
    const message = stderr
      ? `${command} ${args.join(" ")} failed: ${stderr}`
      : `${command} ${args.join(" ")} failed`;
    throw new Error(message);
  }
}

function readPackageNameVersion() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  return { name: pkg.name, version: pkg.version };
}

/**
 * @param {{ skipBuild?: boolean }} [options]
 */
export function runVerifyPackage(options = {}) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "specwiki-verify-"));
  const packDir = path.join(tempRoot, "pack");
  const installDir = path.join(tempRoot, "install");
  let tarballPath = "";

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(installDir, { recursive: true });

  try {
    if (!options.skipBuild) {
      run("npm", ["run", "build"], { cwd: projectRoot });
    }

    run("npm", ["pack", "--pack-destination", packDir, "--silent"], {
      cwd: projectRoot,
      stdio: "pipe",
    });

    const { name, version } = readPackageNameVersion();
    tarballPath = path.join(packDir, `${name}-${version}.tgz`);
    if (!fs.existsSync(tarballPath)) {
      throw new Error(`expected tarball at ${name}-${version}.tgz`);
    }

    const entries = listTarballEntries(tarballPath);
    validateTarballEntries(entries);

    execSync("npm init -y", {
      cwd: installDir,
      stdio: "pipe",
      env: npmSubprocessEnv(),
    });
    run("npm", ["install", tarballPath], { cwd: installDir, stdio: "pipe" });

    const help = spawnSync("npx", ["--no-install", "specwiki", "--help"], {
      cwd: installDir,
      encoding: "utf8",
      shell: process.platform === "win32",
      env: npmSubprocessEnv({ npm_config_yes: "false" }),
    });

    if (help.status !== 0) {
      throw new Error(help.stderr?.trim() || "specwiki --help failed");
    }

    if (
      !help.stdout.includes(
        "Transform AI specs into structured wiki-like documentation",
      )
    ) {
      throw new Error("specwiki --help output missing CLI description");
    }

    console.log("verify-package: tarball validated and CLI --help succeeded");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  try {
    runVerifyPackage();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`verify-package: ${message}`);
    process.exit(1);
  }
}
