#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import path from "node:path";
import {
  generateWiki,
  isCliErrorLogged,
  listSpecs,
} from "./commands/generate.js";
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
    log.error("cli.error", {
      command: resolveCommandForUsageError(),
      message: err.message,
    });
    process.exit(2);
  }

  process.exit(err.exitCode ?? 1);
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
  .option("--no-search", "Skip client-side search index and JS")
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      await generateWiki({
        projectRoot: path.resolve(opts.project),
        outputDir: opts.output,
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
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      await listSpecs({
        projectRoot: path.resolve(opts.project),
        outputDir: "wiki",
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

try {
  program.parse();
} catch (err) {
  if (err instanceof CommanderError) {
    handleCommanderError(err);
  }
  throw err;
}
