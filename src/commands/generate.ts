import chalk from "chalk";
import path from "node:path";
import { log } from "../core/Logger.js";
import { discoverSpecs } from "../discover/specs.js";
import { parseSpecFile } from "../parse/markdown.js";
import { buildWiki, writeHtmlWiki, writeWiki } from "../output/wiki.js";
import type { GenerateOptions } from "../types.js";

const ZERO_SPECS_TIP =
  "Tip: specwiki looks for AGENTS.md, SPEC.md, .cursor/rules/, specs/, openspec/, and similar paths.";

function printZeroSpecsMessage(): void {
  console.log(chalk.yellow("No spec files found."));
  console.log(chalk.dim(ZERO_SPECS_TIP));
}

export async function generateWiki(options: GenerateOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));
  const { projectRoot, outputDir, verbose } = options;

  if (verbose) {
    console.log(chalk.dim(`Scanning ${projectRoot} for AI specs...`));
  }

  const specFiles = await discoverSpecs({
    projectRoot,
    patterns: options.patterns,
  });

  if (specFiles.length === 0) {
    printZeroSpecsMessage();
    return;
  }

  if (verbose) {
    console.log(chalk.dim(`Found ${specFiles.length} spec file(s):`));
    for (const file of specFiles) {
      console.log(chalk.dim(`  ${file.relativePath}`));
    }
  }

  const parsed = await Promise.all(specFiles.map(parseSpecFile));
  const wiki = buildWiki(parsed);

  const resolvedOutput = path.resolve(projectRoot, outputDir);
  const written = await writeWiki(resolvedOutput, wiki);
  const htmlWritten = await writeHtmlWiki(resolvedOutput, wiki);

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
}

export async function listSpecs(options: GenerateOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));

  const specFiles = await discoverSpecs({
    projectRoot: options.projectRoot,
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
}
