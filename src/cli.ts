#!/usr/bin/env node

import { Command, CommanderError, InvalidArgumentError } from "commander";
import path from "node:path";
import {
  generateWiki,
  isCliErrorLogged,
  listSpecs,
} from "./commands/generate.js";
import {
  getInitExitCode,
  initConfig,
  isInitErrorLogged,
} from "./commands/init.js";
import { isOpenErrorLogged, openWiki } from "./commands/open.js";
import { parsePatternList } from "./config/patterns.js";
import { ConfigError, resolveEffectivePatterns } from "./config/loader.js";
import { log } from "./core/Logger.js";

const USAGE_ERROR_CODES = new Set([
  "commander.unknownOption",
  "commander.unknownCommand",
  "commander.missingArgument",
  "commander.optionMissingArgument",
  "commander.missingMandatoryOptionValue",
  "commander.conflictingOption",
  "commander.excessArguments",
  "commander.invalidArgument",
]);

let patternsValidationMessage: string | undefined;

function resolveCommandForUsageError(): string {
  const entryIndex = process.argv.findIndex(
    (arg) =>
      arg.endsWith("cli.ts") ||
      arg.endsWith("cli.js") ||
      arg.endsWith("/specwiki") ||
      arg === "specwiki",
  );
  const args =
    entryIndex >= 0
      ? process.argv.slice(entryIndex + 1)
      : process.argv.slice(2);
  const subcommand = args.find((arg) => !arg.startsWith("-"));
  return subcommand ?? "specwiki";
}

function handleCommanderError(err: CommanderError): never {
  if (USAGE_ERROR_CODES.has(err.code)) {
    if (
      err.code === "commander.optionMissingArgument" &&
      err.message.includes("--patterns")
    ) {
      log.error("config.error", {
        message: "Patterns option requires a comma-separated glob list",
      });
    }
    const message =
      err.code === "commander.invalidArgument" && patternsValidationMessage
        ? `Invalid --patterns value: ${patternsValidationMessage}`
        : err.message;
    patternsValidationMessage = undefined;
    log.error("cli.error", {
      command: resolveCommandForUsageError(),
      message,
    });
    process.exit(2);
  }

  process.exit(err.exitCode ?? 1);
}

function parsePatternsOption(value: string): string[] {
  try {
    return parsePatternList(value);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid patterns";
    patternsValidationMessage = message;
    log.error("config.error", { message });
    throw new InvalidArgumentError(message);
  }
}

function emitPatternsOverride(patterns: string[] | undefined): void {
  if (patterns) {
    log.info("config.patterns-override", { patternCount: patterns.length });
  }
}

async function resolveCommandPatterns(
  command: string,
  projectRoot: string,
  cliPatterns: string[] | undefined,
  verbose: boolean,
): Promise<string[] | undefined> {
  if (cliPatterns) {
    emitPatternsOverride(cliPatterns);
    return cliPatterns;
  }

  try {
    const resolved = await resolveEffectivePatterns({
      projectRoot,
      cliPatterns,
    });

    if (resolved.configSource && verbose) {
      log.info("config.load", { sourcePath: resolved.configSource });
    }

    return resolved.patterns;
  } catch (err) {
    const message =
      err instanceof ConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Invalid configuration";
    log.error("config.error", { message });
    log.error("cli.error", { command, message });
    process.exit(2);
  }
}

const program = new Command();

program.exitOverride();

program
  .name("specwiki")
  .description("Transform AI specs into structured wiki-like documentation")
  .version("0.1.0");

program
  .command("generate")
  .description("Discover specs and generate wiki documentation")
  .option("-p, --project <path>", "Project root to scan", process.cwd())
  .option(
    "-o, --output <dir>",
    "Output directory (relative to project)",
    "wiki",
  )
  .option("-v, --verbose", "Show detailed output")
  .option(
    "--patterns <globs>",
    "Comma-separated glob patterns (replaces defaults)",
    parsePatternsOption,
  )
  .option("--no-search", "Skip client-side search index and JS")
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      const projectRoot = path.resolve(opts.project);
      const patterns = await resolveCommandPatterns(
        "generate",
        projectRoot,
        opts.patterns,
        Boolean(opts.verbose),
      );
      await generateWiki({
        projectRoot,
        outputDir: opts.output,
        patterns,
        verbose: opts.verbose,
        noSearch: opts.search === false,
      });
    } catch (err) {
      if (!isCliErrorLogged(err)) {
        log.error("cli.error", {
          command: "generate",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List discovered spec files without generating")
  .option("-p, --project <path>", "Project root to scan", process.cwd())
  .option("-v, --verbose", "Show detailed discover diagnostics on stderr")
  .option(
    "--patterns <globs>",
    "Comma-separated glob patterns (replaces defaults)",
    parsePatternsOption,
  )
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      const projectRoot = path.resolve(opts.project);
      const patterns = await resolveCommandPatterns(
        "list",
        projectRoot,
        opts.patterns,
        Boolean(opts.verbose),
      );
      await listSpecs({
        projectRoot,
        outputDir: "wiki",
        patterns,
        verbose: opts.verbose,
      });
    } catch (err) {
      if (!isCliErrorLogged(err)) {
        log.error("cli.error", {
          command: "list",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Scaffold specwiki.config.json with default discovery patterns")
  .option("-p, --project <path>", "Project root", process.cwd())
  .option(
    "-f, --force",
    "Overwrite specwiki.config.json when it exists (never overwrites .js config)",
  )
  .option("-v, --verbose", "Show detailed output")
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      const projectRoot = path.resolve(opts.project);
      await initConfig({
        projectRoot,
        force: Boolean(opts.force),
        verbose: opts.verbose,
      });
    } catch (err) {
      if (!isInitErrorLogged(err) && !isCliErrorLogged(err)) {
        log.error("cli.error", {
          command: "init",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      process.exit(getInitExitCode(err));
    }
  });

program
  .command("open")
  .description("Open the generated HTML wiki in the default browser")
  .option("-p, --project <path>", "Project root", process.cwd())
  .option(
    "-o, --output <dir>",
    "Output directory (relative to project)",
    "wiki",
  )
  .option("-v, --verbose", "Show detailed output")
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      const projectRoot = path.resolve(opts.project);
      await openWiki({
        projectRoot,
        outputDir: opts.output,
        verbose: opts.verbose,
      });
    } catch (err) {
      if (!isOpenErrorLogged(err) && !isCliErrorLogged(err)) {
        log.error("cli.error", {
          command: "open",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      process.exit(1);
    }
  });

try {
  program.parse();
} catch (err) {
  if (err instanceof CommanderError) {
    handleCommanderError(err);
  }
  throw err;
}
