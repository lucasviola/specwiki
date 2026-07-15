import fs from "node:fs/promises";
import path from "node:path";
import { CATEGORY_LABELS } from "../config/patterns.js";
import { log } from "../core/Logger.js";
import type { WikiPage } from "../types.js";
import { assertPathConfined } from "./wiki.js";

export function buildLlmsTxt(pages: WikiPage[]): string {
  const byCategory = new Map<string, WikiPage[]>();

  for (const page of pages) {
    const categoryPages = byCategory.get(page.category) ?? [];
    categoryPages.push(page);
    byCategory.set(page.category, categoryPages);
  }

  const lines = [
    "# Spec Wiki",
    "",
    "> Generated index of documentation discovered by specwiki.",
  ];

  const categories = [...byCategory.keys()].sort((left, right) =>
    (CATEGORY_LABELS[left] ?? left).localeCompare(
      CATEGORY_LABELS[right] ?? right,
    ),
  );

  for (const category of categories) {
    lines.push("", `## ${CATEGORY_LABELS[category] ?? category}`, "");

    for (const page of byCategory.get(category)!) {
      const description = page.description.trim();
      lines.push(
        `- [${page.title}](${page.slug}.md)${description ? `: ${description}` : ""}`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function writeLlmsTxt(
  outputDir: string,
  pages: WikiPage[],
): Promise<string> {
  const filePath = path.join(outputDir, "llms.txt");
  assertPathConfined(outputDir, filePath, "llms.txt");

  try {
    await fs.writeFile(filePath, buildLlmsTxt(pages), "utf-8");
  } catch (err) {
    log.error("output.error", {
      relativePath: "llms.txt",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  log.info("output.write", { relativePath: "llms.txt" });
  return filePath;
}
