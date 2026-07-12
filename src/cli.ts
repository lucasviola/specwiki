#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import {
  generateWiki,
  isCliErrorLogged,
  listSpecs,
} from "./commands/generate.js";
import { log } from "./core/Logger.js";

const program = new Command();

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
  .action(async (opts) => {
    try {
      log.setVerbose(Boolean(opts.verbose));
      await generateWiki({
        projectRoot: path.resolve(opts.project),
        outputDir: opts.output,
        verbose: opts.verbose,
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

program.parse();
