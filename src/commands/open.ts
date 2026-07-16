import chalk from "chalk";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { log } from "../core/Logger.js";
import {
  assertConfinedUnder as assertConfinedUnderPath,
  assertRealpathConfinedUnder as assertRealpathConfinedUnderPath,
  PathEscapeError,
  resolveOutputWithinProject,
} from "../core/paths.js";
import type { OpenOptions } from "../types.js";

const execFileAsync = promisify(execFile);

const INDEX_RELATIVE_PATH = path.join("html", "index.html");
const MISSING_INDEX_MESSAGE =
  "Wiki index not found. Run `specwiki generate` first.";

type LaunchHandler = (command: string, args: string[]) => Promise<void>;
type OpenError = Error & { cliErrorLogged?: boolean };

let launchHandler: LaunchHandler = async (command, args) => {
  await execFileAsync(command, args);
};

export function setLaunchHandlerForTests(handler: LaunchHandler): void {
  launchHandler = handler;
}

export function resetLaunchHandlerForTests(): void {
  launchHandler = async (command, args) => {
    await execFileAsync(command, args);
  };
}

function throwOpenError(message: string): never {
  console.log(chalk.yellow(message));
  const error: OpenError = new Error(message);
  error.cliErrorLogged = true;
  throw error;
}

function handlePathEscape(label: string, err: unknown): never {
  if (err instanceof PathEscapeError) {
    log.error("open.error", {
      message: `Path escapes allowed directory: ${label}`,
    });
    throwOpenError(err.message);
  }
  throw err;
}

function assertConfinedUnder(
  root: string,
  target: string,
  label: string,
): void {
  try {
    assertConfinedUnderPath(root, target, label);
  } catch (err) {
    handlePathEscape(label, err);
  }
}

async function assertRealpathConfinedUnder(
  root: string,
  target: string,
  label: string,
): Promise<void> {
  try {
    await assertRealpathConfinedUnderPath(root, target, label);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    if (err instanceof Error && (err as OpenError).cliErrorLogged) {
      throw err;
    }
    if (err instanceof PathEscapeError) {
      handlePathEscape(label, err);
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("open.error", { message });
    throwOpenError(message);
  }
}

async function resolveIndexPath(
  projectRoot: string,
  outputDir: string,
): Promise<string> {
  let resolvedOutput: string;
  try {
    resolvedOutput = await resolveOutputWithinProject(projectRoot, outputDir);
  } catch (err) {
    handlePathEscape("output directory", err);
  }

  const indexPath = path.join(resolvedOutput!, INDEX_RELATIVE_PATH);
  assertConfinedUnder(resolvedOutput!, indexPath, INDEX_RELATIVE_PATH);

  return indexPath;
}

function getBrowserLauncher(): {
  command: string;
  buildArgs: (indexPath: string) => string[];
} {
  switch (process.platform) {
    case "darwin":
      return { command: "open", buildArgs: (indexPath) => [indexPath] };
    case "win32":
      return {
        command: "cmd",
        buildArgs: (indexPath) => ["/c", "start", "", indexPath],
      };
    default:
      return {
        command: "xdg-open",
        buildArgs: (indexPath) => [indexPath],
      };
  }
}

export async function openWiki(options: OpenOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));
  const resolvedProjectRoot = path.resolve(options.projectRoot);
  const resolvedOutput = path.resolve(resolvedProjectRoot, options.outputDir);

  log.info("cli.command", {
    command: "open",
    projectRoot: resolvedProjectRoot,
    outputDir: resolvedOutput,
    verbose: Boolean(options.verbose),
  });

  let indexPath: string;
  try {
    indexPath = await resolveIndexPath(resolvedProjectRoot, options.outputDir);
  } catch (err) {
    if (err instanceof Error && (err as OpenError).cliErrorLogged) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("open.error", { message });
    throwOpenError(message);
  }

  try {
    await fs.access(indexPath);
    await assertRealpathConfinedUnder(
      resolvedProjectRoot,
      indexPath,
      INDEX_RELATIVE_PATH,
    );
  } catch (err) {
    if (err instanceof Error && (err as OpenError).cliErrorLogged) {
      throw err;
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      log.error("open.error", {
        message: MISSING_INDEX_MESSAGE,
        indexPath,
      });
      throwOpenError(MISSING_INDEX_MESSAGE);
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("open.error", { message, indexPath });
    throwOpenError(`Cannot access wiki index: ${message}`);
  }

  const { command, buildArgs } = getBrowserLauncher();
  try {
    await launchHandler(command, buildArgs(indexPath));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("open.error", { message, indexPath });
    throwOpenError(`Failed to open browser: ${message}`);
  }

  log.info("open.launch", { indexPath });

  console.log(chalk.green("Opened wiki in browser"));
  console.log(chalk.dim(`  ${indexPath}`));
}

export function isOpenErrorLogged(err: unknown): boolean {
  return err instanceof Error && (err as OpenError).cliErrorLogged === true;
}
