import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import chalk from "chalk";
import { DEFAULT_SPEC_PATTERNS } from "../config/patterns.js";
import { log } from "../core/Logger.js";
import { PathEscapeError, resolveOutputWithinProject } from "../core/paths.js";
import { discoverSpecs } from "../discover/specs.js";
import { parseSpecFile } from "../parse/markdown.js";
import { compareWikiOutput, directoryHasWikiFiles } from "../output/compare.js";
import { writeLlmsTxt } from "../output/llms.js";
import { buildWiki, writeHtmlWiki, writeWiki } from "../output/wiki.js";
import type {
  GenerateOptions,
  JsonGenerateResult,
  JsonListResult,
  SpecFile,
  WikiPage,
} from "../types.js";

const ZERO_SPECS_TIP =
  "Tip: specwiki discovers .md and .mdc files anywhere in your project — AGENTS.md, .cursor/rules/, specs/, README.md, and similar paths.";

type CliCommand = "generate" | "list";

type CliError = Error & { cliErrorLogged?: boolean };

export class WikiCheckFailedError extends Error {
  readonly cliErrorLogged = true;

  constructor(message: string) {
    super(message);
    this.name = "WikiCheckFailedError";
  }
}

function printZeroSpecsMessage(): void {
  console.log(chalk.yellow("No spec files found."));
  console.log(chalk.dim(ZERO_SPECS_TIP));
}

function createListJsonResult(specFiles: SpecFile[]): JsonListResult {
  const categories = new Map<string, JsonListResult["categories"][number]>();

  for (const file of specFiles) {
    const category = categories.get(file.category) ?? {
      name: file.category,
      files: [],
    };
    category.files.push({
      relativePath: file.relativePath,
      title: file.title,
      category: file.category,
    });
    categories.set(file.category, category);
  }

  return {
    categories: [...categories.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
  };
}

function createGenerateJsonResult(
  outputDir: string,
  pages: WikiPage[],
): JsonGenerateResult {
  return {
    specCount: pages.length,
    outputDir,
    pages: pages.map(({ slug, title, category, sourcePath, description }) => ({
      slug,
      title,
      category,
      sourcePath,
      description,
    })),
  };
}

function printJsonResult(
  command: CliCommand,
  result: JsonListResult | JsonGenerateResult,
): void {
  if ("categories" in result) {
    log.info("output.json", {
      command,
      categoryCount: result.categories.length,
      specCount: result.categories.reduce(
        (count, category) => count + category.files.length,
        0,
      ),
    });
  } else {
    log.info("output.json", {
      command,
      pageCount: result.pages.length,
      specCount: result.specCount,
    });
  }
  console.log(JSON.stringify(result));
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

async function generateWikiToDirectory(
  outputDir: string,
  wiki: Awaited<ReturnType<typeof buildWiki>>,
  options: Pick<GenerateOptions, "noSearch" | "emitLlmsTxt"> & {
    projectRoot: string;
  },
): Promise<void> {
  await writeWiki(outputDir, wiki);
  await writeHtmlWiki(outputDir, wiki, {
    noSearch: options.noSearch,
    projectRoot: options.projectRoot,
  });
  if (options.emitLlmsTxt) {
    await writeLlmsTxt(outputDir, wiki.pages);
  }
}

async function runWikiCheck(
  expectedRoot: string,
  actualRoot: string,
  verbose: boolean,
): Promise<void> {
  const result = await compareWikiOutput(expectedRoot, actualRoot);

  if (verbose) {
    log.info("check.diff", {
      fileCount: result.fileCount,
      diffCount: result.diffCount,
    });
  }

  if (result.fresh) {
    return;
  }

  log.error("check.fail", {
    diffCount: result.diffCount,
    missingCount: result.missing.length,
    extraCount: result.extra.length,
    changedCount: result.changed.length,
  });

  console.log(
    chalk.red(
      `✗ Wiki is stale (${result.diffCount} difference(s) in ${result.fileCount} expected file(s))`,
    ),
  );

  throw new WikiCheckFailedError("Wiki output is stale");
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
    let resolvedOutput: string;
    try {
      resolvedOutput = await resolveOutputWithinProject(
        resolvedProjectRoot,
        outputDir,
      );
    } catch (err) {
      if (err instanceof PathEscapeError) {
        log.error("output.error", { message: err.message });
        propagateCliError("generate", err);
      }
      throw err;
    }

    const relativeOutput = path.relative(resolvedProjectRoot, resolvedOutput);
    const outputIgnorePath =
      relativeOutput.length > 0 && !relativeOutput.startsWith("..")
        ? relativeOutput
        : undefined;

    const specFiles = await discoverSpecs({
      projectRoot: resolvedProjectRoot,
      patterns: options.patterns,
      ignorePaths: outputIgnorePath ? [outputIgnorePath] : undefined,
    });

    if (specFiles.length === 0) {
      if (options.check) {
        const hasStaleOutput = await directoryHasWikiFiles(resolvedOutput);
        if (hasStaleOutput) {
          log.error("check.fail", {
            diffCount: 1,
            missingCount: 0,
            extraCount: 1,
            changedCount: 0,
          });
          console.log(
            chalk.red(
              "✗ Wiki is stale (output exists but no specs were discovered)",
            ),
          );
          throw new WikiCheckFailedError("Wiki output is stale");
        }
        if (options.verbose) {
          log.info("check.diff", { fileCount: 0, diffCount: 0 });
        }
        return;
      }
      if (options.json) {
        printJsonResult("generate", {
          specCount: 0,
          outputDir: resolvedOutput,
          pages: [],
        });
        return;
      }
      printZeroSpecsMessage();
      return;
    }

    const parsed = await Promise.all(specFiles.map(parseSpecFile));
    const wiki = buildWiki(parsed);

    if (options.check) {
      const tempRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), "specwiki-check-"),
      );
      try {
        await generateWikiToDirectory(tempRoot, wiki, {
          noSearch: options.noSearch,
          emitLlmsTxt: options.emitLlmsTxt,
          projectRoot: resolvedProjectRoot,
        });
        await runWikiCheck(tempRoot, resolvedOutput, Boolean(options.verbose));
      } finally {
        try {
          await fs.rm(tempRoot, { force: true, recursive: true });
        } catch (err) {
          log.error("check.cleanup", {
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
      return;
    }

    const written = await writeWiki(resolvedOutput, wiki);
    const htmlWritten = await writeHtmlWiki(resolvedOutput, wiki, {
      noSearch: options.noSearch,
      projectRoot: resolvedProjectRoot,
    });
    if (options.emitLlmsTxt) {
      await writeLlmsTxt(resolvedOutput, wiki.pages);
    }

    log.info("generate.summary", {
      pageCount: wiki.pages.length,
      markdownFiles: written.length,
      htmlFiles: htmlWritten.length,
    });

    if (options.json) {
      printJsonResult(
        "generate",
        createGenerateJsonResult(resolvedOutput, wiki.pages),
      );
      return;
    }

    console.log(
      chalk.green(`✓ Generated wiki with ${wiki.pages.length} page(s)`),
    );
    console.log(chalk.dim(`  Markdown: ${resolvedOutput}/`));
    console.log(chalk.dim(`  HTML:     ${resolvedOutput}/html/`));
    console.log(
      chalk.dim(`  ${written.length + htmlWritten.length} files written`),
    );
  } catch (err) {
    if (err instanceof WikiCheckFailedError) {
      throw err;
    }
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
      if (options.json) {
        printJsonResult("list", { categories: [] });
        return;
      }
      printZeroSpecsMessage();
      return;
    }

    if (options.json) {
      printJsonResult("list", createListJsonResult(specFiles));
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
