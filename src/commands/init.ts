import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_SPEC_PATTERNS,
  validatePatternList,
} from "../config/patterns.js";
import { log } from "../core/Logger.js";
import type { InitOptions } from "../types.js";

const CONFIG_JSON = "specwiki.config.json";
const CONFIG_JS = "specwiki.config.js";

const CONFIG_EXISTS_MESSAGE =
  "Config file already exists. Use --force to overwrite specwiki.config.json.";
const CONFIG_JS_EXISTS_MESSAGE =
  "specwiki.config.js already exists. Edit it manually or remove it before running --force.";

type InitError = Error & { exitCode?: number; cliErrorLogged?: boolean };

function throwInitError(message: string, exitCode = 2): never {
  console.log(chalk.yellow(message));
  log.error("init.error", { message });
  const error: InitError = new Error(message);
  error.exitCode = exitCode;
  error.cliErrorLogged = true;
  throw error;
}

function assertConfinedUnderProject(
  projectRoot: string,
  targetPath: string,
): void {
  const relative = path.relative(projectRoot, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throwInitError("Config file must stay within the project root");
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildScaffoldContent(): string {
  const patterns = validatePatternList([...DEFAULT_SPEC_PATTERNS]);
  return `${JSON.stringify({ patterns }, null, 2)}\n`;
}

export async function initConfig(options: InitOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));
  const resolvedProjectRoot = path.resolve(options.projectRoot);

  if (options.verbose) {
    log.info("cli.command", {
      command: "init",
      projectRoot: resolvedProjectRoot,
      force: Boolean(options.force),
      verbose: true,
    });
  }

  const jsonPath = path.join(resolvedProjectRoot, CONFIG_JSON);
  const jsPath = path.join(resolvedProjectRoot, CONFIG_JS);

  assertConfinedUnderProject(resolvedProjectRoot, jsonPath);

  const jsExists = await fileExists(jsPath);
  const jsonExists = await fileExists(jsonPath);

  if (jsExists) {
    throwInitError(CONFIG_JS_EXISTS_MESSAGE);
  }

  if (jsonExists && !options.force) {
    throwInitError(CONFIG_EXISTS_MESSAGE);
  }

  let content: string;
  try {
    content = buildScaffoldContent();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to build config scaffold";
    throwInitError(message);
  }

  try {
    await fs.mkdir(resolvedProjectRoot, { recursive: true });
    await fs.writeFile(jsonPath, content, "utf-8");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to write config file";
    throwInitError(message, 1);
  }

  if (options.verbose) {
    log.info("init.write", { sourcePath: CONFIG_JSON });
  }

  console.log(chalk.green(`Created ${CONFIG_JSON}`));
  console.log(chalk.dim(`  ${jsonPath}`));
  console.log(chalk.dim("Next: specwiki list, then specwiki generate"));
}

export function isInitErrorLogged(err: unknown): boolean {
  return err instanceof Error && (err as InitError).cliErrorLogged === true;
}

export function getInitExitCode(err: unknown): number {
  if (err instanceof Error && typeof (err as InitError).exitCode === "number") {
    return (err as InitError).exitCode!;
  }
  return 1;
}
