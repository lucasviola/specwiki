export interface SpecFile {
  path: string;
  relativePath: string;
  category: string;
  title: string;
}

export interface SpecSection {
  level: number;
  title: string;
  content: string;
  anchor: string;
}

export interface ParsedSpec {
  file: SpecFile;
  frontmatter: Record<string, unknown>;
  title: string;
  description: string;
  sections: SpecSection[];
  rawContent: string;
}

export interface WikiPage {
  slug: string;
  title: string;
  category: string;
  content: string;
  sourcePath: string;
  description: string;
  sections: SpecSection[];
}

export interface WikiIndexMeta {
  rootIntro: string | null;
  rootIntroSource: string | null;
  categoryIntros: Map<string, { content: string; sourcePaths: string[] }>;
  readmeIndexCount: number;
}

export interface WikiOutput {
  pages: WikiPage[];
  indexContent: string;
  indexMeta: WikiIndexMeta;
}

export interface GenerateOptions {
  projectRoot: string;
  outputDir: string;
  patterns?: string[];
  verbose?: boolean;
  noSearch?: boolean;
}

export interface WriteHtmlWikiOptions {
  noSearch?: boolean;
}

export interface DiscoverOptions {
  projectRoot: string;
  patterns?: string[];
}
