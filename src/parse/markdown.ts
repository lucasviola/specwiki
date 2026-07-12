import fs from "node:fs/promises";
import matter from "gray-matter";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdownLang from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import { marked, type Tokens } from "marked";
import { log } from "../core/Logger.js";
import type { ParsedSpec, SpecFile, SpecSection } from "../types.js";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function createAnchorAllocator(): (title: string) => string {
  const seen = new Map<string, number>();
  let emptyCounter = 0;

  return (title: string): string => {
    const base = slugify(title);
    if (!base || /^-*$/.test(base)) {
      emptyCounter += 1;
      return `section-${emptyCounter}`;
    }

    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (count === 0) {
      return base;
    }
    return `${base}-${count + 1}`;
  };
}

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdownLang);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightCode(text: string, language: string): string | null {
  if (!hljs.getLanguage(language)) {
    return null;
  }

  try {
    return hljs.highlight(text, { language, ignoreIllegals: true }).value;
  } catch (err) {
    log.error("render.error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

let allocateHeadingAnchor = createAnchorAllocator();

marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth, text, raw }: Tokens.Heading) {
      const inner = this.parser.parseInline(tokens);
      const tag = `h${depth}`;

      if (depth >= 2 && depth <= 6) {
        const rawTitle =
          raw
            .trim()
            .match(/^#+\s+(.+?)\s*#*\s*$/)?.[1]
            ?.trim() ?? text;
        const id = allocateHeadingAnchor(rawTitle);
        const permalink = `<a class="heading-permalink" href="#${id}" aria-label="Link to this section">&#182;</a>`;
        return `<${tag} id="${id}">${inner}${permalink}</${tag}>\n`;
      }

      return `<${tag}>${inner}</${tag}>\n`;
    },
    code({ text, lang, escaped }: Tokens.Code) {
      const language = lang?.trim().split(/\s+/)[0]?.toLowerCase();

      if (language) {
        const highlighted = highlightCode(text, language);
        if (highlighted !== null) {
          return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>\n`;
        }
      }

      const body = escaped ? text : escapeHtml(text);
      return `<pre><code>${body}</code></pre>\n`;
    },
  },
});

function extractSections(content: string): SpecSection[] {
  const lines = content.split("\n");
  const sections: SpecSection[] = [];
  let current: SpecSection | null = null;
  const contentLines: string[] = [];
  const allocateAnchor = createAnchorAllocator();

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
      current = {
        level,
        title,
        content: "",
        anchor: allocateAnchor(title),
      };
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
  allocateHeadingAnchor = createAnchorAllocator();
  try {
    return marked.parse(markdown, { async: false }) as string;
  } catch (err) {
    log.error("render.error", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
