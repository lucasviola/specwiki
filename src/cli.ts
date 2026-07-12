#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import { generateWiki, listSpecs } from "./commands/generate.js";

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
    await generateWiki({
      projectRoot: path.resolve(opts.project),
      outputDir: opts.output,
      verbose: opts.verbose,
    });
  });

program
  .command("list")
  .description("List discovered spec files without generating")
  .option("-p, --project <path>", "Project root to scan", process.cwd())
  .action(async (opts) => {
    await listSpecs({
      projectRoot: path.resolve(opts.project),
      outputDir: "wiki",
    });
  });

program.parse();
