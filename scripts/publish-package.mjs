#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runVerifyPackage } from "./verify-package.mjs";

const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/**
 * @param {string[]} argv
 */
export function parsePublishArgs(argv) {
  return {
    confirm: argv.includes("--confirm"),
    dryRun: argv.includes("--dry-run"),
    verbose: argv.includes("--verbose"),
  };
}

/**
 * @param {string} message
 * @param {boolean} verbose
 */
function log(message, verbose) {
  if (verbose) {
    console.log(`publish.package ${message}`);
  }
}

function readPackageVersion() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  return { name: pkg.name, version: pkg.version };
}

/**
 * @param {string[]} [argv]
 */
export function runPublishPackage(argv = process.argv.slice(2)) {
  const { confirm, dryRun, verbose } = parsePublishArgs(argv);
  const { name, version } = readPackageVersion();

  if (!confirm && !dryRun) {
    console.error(`publish-package: refusing to publish ${name}@${version}`);
    console.error("");
    console.error("This script runs local verification, then npm publish.");
    console.error("Re-run with --confirm when you are ready to publish:");
    console.error("");
    console.error("  npm run publish:package -- --confirm");
    console.error("");
    console.error("Preview registry output without publishing:");
    console.error("");
    console.error("  npm run publish:package -- --dry-run");
    console.error("");
    console.error(
      "Prerequisites: npm login, Node >=20, clean git state (recommended).",
    );
    process.exit(1);
  }

  log("verify start", verbose);
  runVerifyPackage();
  log("verify ok", verbose);

  const npmArgs = dryRun ? ["publish", "--dry-run"] : ["publish"];
  log(`${dryRun ? "dry-run" : "publish"} start`, verbose);

  const result = spawnSync("npm", npmArgs, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(
      dryRun ? "npm publish --dry-run failed" : "npm publish failed",
    );
  }

  log(`${dryRun ? "dry-run" : "publish"} ok`, verbose);

  if (dryRun) {
    console.log(`publish-package: dry-run succeeded for ${name}@${version}`);
  } else {
    console.log(`publish-package: published ${name}@${version} to npm`);
    console.log(`Verify: npx ${name}@${version} --version`);
  }
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  try {
    runPublishPackage();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`publish-package: ${message}`);
    process.exit(1);
  }
}
