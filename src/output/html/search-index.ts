import type { WikiPage } from "../../types.js";

export const SEARCH_INDEX_VERSION = 1;
export const BODY_EXCERPT_MAX = 2000;

export interface SearchIndexDocument {
  slug: string;
  title: string;
  category: string;
  description: string;
  body: string;
}

export interface SearchIndex {
  version: number;
  documents: SearchIndexDocument[];
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/^---[\s\S]*?---\n/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractBodyExcerpt(
  content: string,
  maxLength = BODY_EXCERPT_MAX,
): string {
  const plain = stripMarkdown(content);
  if (plain.length <= maxLength) {
    return plain;
  }
  return plain.slice(0, maxLength);
}

export function buildSearchIndex(pages: WikiPage[]): SearchIndex {
  return {
    version: SEARCH_INDEX_VERSION,
    documents: pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      category: page.category,
      description: page.description,
      body: extractBodyExcerpt(page.content),
    })),
  };
}

export function serializeSearchIndexForInlineScript(
  index: SearchIndex,
): string {
  return JSON.stringify(index).replace(/</g, "\\u003c");
}
