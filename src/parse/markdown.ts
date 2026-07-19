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

export interface RenderMarkdownOptions {
  linkResolver?: (href: string) => string;
}

let allocateHeadingAnchor = createAnchorAllocator();
let activeLinkResolver: ((href: string) => string) | undefined;

marked.use({
  gfm: true,
  renderer: {
    link({ href, title, tokens }: Tokens.Link) {
      const inner = this.parser.parseInline(tokens);
      const rawHref = href ?? "";
      const resolvedHref = activeLinkResolver
        ? activeLinkResolver(rawHref)
        : rawHref;
      const escapedHref = escapeHtml(resolvedHref);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapedHref}"${titleAttr}>${inner}</a>`;
    },
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

function stripFrontmatterBlock(raw: string): string {
  if (!raw.startsWith("---")) {
    return raw;
  }

  const openingLineEnd = raw.indexOf("\n");
  if (openingLineEnd === -1) {
    return raw;
  }

  const closingIndex = raw.indexOf("\n---", openingLineEnd);
  if (closingIndex === -1) {
    return raw;
  }

  let contentStart = closingIndex + 4;
  if (raw[contentStart] === "\r") {
    contentStart += 1;
  }
  if (raw[contentStart] === "\n") {
    contentStart += 1;
  }

  let content = raw.slice(contentStart);
  if (content.startsWith("\r\n")) {
    content = content.slice(2);
  } else if (content.startsWith("\n")) {
    content = content.slice(1);
  }
  return content;
}

function parseFileContent(raw: string): {
  frontmatter: Record<string, unknown>;
  content: string;
  frontmatterFallback: boolean;
} {
  try {
    const { data, content } = matter(raw);
    return { frontmatter: data, content, frontmatterFallback: false };
  } catch {
    return {
      frontmatter: {},
      content: stripFrontmatterBlock(raw),
      frontmatterFallback: true,
    };
  }
}

export async function parseSpecFile(file: SpecFile): Promise<ParsedSpec> {
  try {
    const raw = await fs.readFile(file.path, "utf-8");
    const { frontmatter, content, frontmatterFallback } = parseFileContent(raw);

    if (frontmatterFallback) {
      log.info("parse.frontmatter-fallback", {
        relativePath: file.relativePath,
      });
    }

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

export function renderMarkdown(
  markdown: string,
  options: RenderMarkdownOptions = {},
): string {
  allocateHeadingAnchor = createAnchorAllocator();
  const previousLinkResolver = activeLinkResolver;
  activeLinkResolver = options.linkResolver;
  try {
    return marked.parse(markdown, { async: false }) as string;
  } catch (err) {
    log.error("render.error", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    activeLinkResolver = previousLinkResolver;
  }
}
