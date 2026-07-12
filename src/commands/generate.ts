import chalk from "chalk";
import path from "node:path";
import { DEFAULT_SPEC_PATTERNS } from "../config/patterns.js";
import { log } from "../core/Logger.js";
import { discoverSpecs } from "../discover/specs.js";
import { parseSpecFile } from "../parse/markdown.js";
import { buildWiki, writeHtmlWiki, writeWiki } from "../output/wiki.js";
import type { GenerateOptions } from "../types.js";

const ZERO_SPECS_TIP =
  "Tip: specwiki looks for AGENTS.md, SPEC.md, .cursor/rules/, specs/, openspec/, and similar paths.";

type CliCommand = "generate" | "list";

type CliError = Error & { cliErrorLogged?: boolean };

function printZeroSpecsMessage(): void {
  console.log(chalk.yellow("No spec files found."));
  console.log(chalk.dim(ZERO_SPECS_TIP));
}

function emitCliCommand(command: CliCommand, options: GenerateOptions): void {
  const patterns = options.patterns ?? DEFAULT_SPEC_PATTERNS;
  const projectRoot = path.resolve(options.projectRoot);

  log.info("cli.command", {
    command,
    projectRoot,
    ...(command === "generate"
      ? { outputDir: path.resolve(projectRoot, options.outputDir) }
      : {}),
    verbose: Boolean(options.verbose),
    patternCount: patterns.length,
  });
}

function propagateCliError(command: CliCommand, err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  log.error("cli.error", { command, message });
  const error: CliError = err instanceof Error ? err : new Error(message);
  error.cliErrorLogged = true;
  throw error;
}

export async function generateWiki(options: GenerateOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));
  const { projectRoot, outputDir } = options;
  const resolvedProjectRoot = path.resolve(projectRoot);

  emitCliCommand("generate", {
    ...options,
    projectRoot: resolvedProjectRoot,
  });

  try {
    const specFiles = await discoverSpecs({
      projectRoot: resolvedProjectRoot,
      patterns: options.patterns,
    });

    if (specFiles.length === 0) {
      printZeroSpecsMessage();
      return;
    }

    const parsed = await Promise.all(specFiles.map(parseSpecFile));
    const wiki = buildWiki(parsed);

    const resolvedOutput = path.resolve(resolvedProjectRoot, outputDir);
    const written = await writeWiki(resolvedOutput, wiki);
    const htmlWritten = await writeHtmlWiki(resolvedOutput, wiki, {
      noSearch: options.noSearch,
    });

    log.info("generate.summary", {
      pageCount: wiki.pages.length,
      markdownFiles: written.length,
      htmlFiles: htmlWritten.length,
    });

    console.log(
      chalk.green(`✓ Generated wiki with ${wiki.pages.length} page(s)`),
    );
    console.log(chalk.dim(`  Markdown: ${resolvedOutput}/`));
    console.log(chalk.dim(`  HTML:     ${resolvedOutput}/html/`));
    console.log(
      chalk.dim(`  ${written.length + htmlWritten.length} files written`),
    );
  } catch (err) {
    propagateCliError("generate", err);
  }
}

export async function listSpecs(options: GenerateOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));
  const resolvedProjectRoot = path.resolve(options.projectRoot);

  emitCliCommand("list", {
    ...options,
    projectRoot: resolvedProjectRoot,
  });

  try {
    const specFiles = await discoverSpecs({
      projectRoot: resolvedProjectRoot,
      patterns: options.patterns,
    });

    if (specFiles.length === 0) {
      printZeroSpecsMessage();
      return;
    }

    const byCategory = new Map<string, typeof specFiles>();

    for (const file of specFiles) {
      const list = byCategory.get(file.category) ?? [];
      list.push(file);
      byCategory.set(file.category, list);
    }

    console.log(chalk.bold(`Found ${specFiles.length} spec file(s):\n`));

    for (const [category, files] of [...byCategory.entries()].sort()) {
      console.log(chalk.cyan(category));
      for (const file of files) {
        console.log(`  ${file.title} — ${file.relativePath}`);
      }
      console.log();
    }
  } catch (err) {
    propagateCliError("list", err);
  }
}

export function isCliErrorLogged(err: unknown): boolean {
  return err instanceof Error && (err as CliError).cliErrorLogged === true;
}
