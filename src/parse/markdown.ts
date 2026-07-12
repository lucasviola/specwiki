import fs from "node:fs/promises";
import matter from "gray-matter";
import { marked } from "marked";
import { log } from "../core/Logger.js";
import type { ParsedSpec, SpecFile, SpecSection } from "../types.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractSections(content: string): SpecSection[] {
  const lines = content.split("\n");
  const sections: SpecSection[] = [];
  let current: SpecSection | null = null;
  const contentLines: string[] = [];

  const flush = () => {
    if (current) {
      current.content = contentLines.join("\n").trim();
      sections.push(current);
      contentLines.length = 0;
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      current = { level, title, content: "", anchor: slugify(title) };
    } else if (current) {
      contentLines.push(line);
    }
  }
  flush();

  return sections;
}

function extractDescription(content: string): string {
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#"));

  return paragraphs[0]?.slice(0, 300) ?? "";
}

export async function parseSpecFile(file: SpecFile): Promise<ParsedSpec> {
  try {
    const raw = await fs.readFile(file.path, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    const title =
      (typeof frontmatter.title === "string" && frontmatter.title) ||
      file.title;

    const sections = extractSections(content);
    const parsed: ParsedSpec = {
      file,
      frontmatter,
      title,
      description: extractDescription(content),
      sections,
      rawContent: content,
    };

    log.info("parse.file", {
      relativePath: file.relativePath,
      sectionCount: sections.length,
    });

    return parsed;
  } catch (err) {
    log.error("parse.error", {
      path: file.relativePath,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
