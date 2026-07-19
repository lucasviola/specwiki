#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** @typedef {'start' | 'ok' | 'fail' | 'skip'} PrepStatus */

export const QUALITY_GATE_STEPS = [
  "test",
  "lint",
  "format",
  "coverage",
  "typecheck",
  "build",
];

/** Production dependency audit; runs after the HARNESS §0.2 quality gate. */
export const AUDIT_STEP = "audit";

export const PREPUBLISH_STEPS = [...QUALITY_GATE_STEPS, AUDIT_STEP];

/**
 * @param {string} step
 * @param {PrepStatus} status
 */
export function formatPrepMessage(step, status) {
  return `publish.prep ${step} ${status}`;
}

/**
 * @param {string[]} argv
 */
export function parsePrepublishArgs(argv) {
  return {
    verbose: argv.includes("--verbose"),
    dryRun: argv.includes("--dry-run"),
  };
}

/**
 * @param {string} step
 * @param {boolean} verbose
 * @param {boolean} dryRun
 */
export function runGateStep(step, verbose, dryRun) {
  if (verbose) {
    console.log(formatPrepMessage(step, dryRun ? "skip" : "start"));
  }

  if (dryRun) {
    if (verbose) {
      console.log(formatPrepMessage(step, "ok"));
    }
    return 0;
  }

  const result = spawnSync("npm", ["run", step], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const exitCode = result.status ?? 1;

  if (verbose) {
    console.log(formatPrepMessage(step, exitCode === 0 ? "ok" : "fail"));
  }

  if (exitCode !== 0 && step === AUDIT_STEP) {
    console.error(
      "publish.prep audit blocked: npm audit failed for production dependencies.",
    );
    console.error(
      "Run `npm run audit` for details. See README maintainer section for time-bounded exceptions.",
    );
  }

  return exitCode;
}

/**
 * @param {string[]} [argv]
 */
export function runPrepublishCheck(argv = process.argv.slice(2)) {
  const { verbose, dryRun } = parsePrepublishArgs(argv);

  for (const step of PREPUBLISH_STEPS) {
    const exitCode = runGateStep(step, verbose, dryRun);
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  runPrepublishCheck();
}
