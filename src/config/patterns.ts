/**
 * Default glob patterns for discovering AI spec files across common
 * frameworks, agent configs, and spec-driven development layouts.
 */
export const DEFAULT_SPEC_PATTERNS = [
  // Root-level agent / spec files
  "AGENTS.md",
  "SPEC.md",
  "CLAUDE.md",
  "GEMINI.md",
  "llms.txt",

  // Cursor rules
  ".cursor/rules/**/*.{md,mdc}",
  ".cursor/skills/**/SKILL.md",

  // Spec-driven frameworks
  "specs/**/*.{md,mdc}",
  "spec/**/*.{md,mdc}",
  "openspec/**/*.{md,mdc}",
  ".kiro/specs/**/*.{md,mdc}",
  "docs/specs/**/*.{md,mdc}",
  "requirements/**/*.{md,mdc}",

  // Agent transcripts and plans (optional but useful)
  "docs/plans/**/*.{md,mdc}",

  // GitHub Copilot
  ".github/copilot-instructions.md",
];

const EMPTY_PATTERNS_MESSAGE =
  "Patterns must be a comma-separated list of non-empty globs";
const UNBALANCED_PATTERNS_MESSAGE =
  "Patterns must use balanced glob delimiters";
const OUTSIDE_PROJECT_PATTERNS_MESSAGE =
  "Patterns must stay within the project root";
const CLOSING_DELIMITERS: Record<string, string> = {
  "}": "{",
  "]": "[",
  ")": "(",
};

function escapesProjectRoot(pattern: string): boolean {
  const candidate =
    pattern.startsWith("!") && !pattern.startsWith("!(")
      ? pattern.slice(1)
      : pattern;
  const normalized = candidate.replace(/\\/g, "/");

  return (
    /(?:^|[,{(|])(?:\/|[A-Za-z]:\/)/.test(normalized) ||
    /(?:^|[/{,(|])\.\.(?:\/|[},)|]|$)/.test(normalized)
  );
}

export function parsePatternList(value: string): string[] {
  const patterns: string[] = [];
  const delimiters: string[] = [];
  let current = "";
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      if (delimiters.at(-1) === CLOSING_DELIMITERS[character]) {
        delimiters.pop();
      }
      current += character;
      escaped = false;
      continue;
    }

    if (character === "\\") {
      current += character;
      escaped = true;
      continue;
    }

    if (character === "{" || character === "[" || character === "(") {
      delimiters.push(character);
      current += character;
      continue;
    }

    if (character === "}" || character === "]" || character === ")") {
      const expectedOpening = CLOSING_DELIMITERS[character];
      const activeOpening = delimiters.at(-1);
      if (activeOpening === expectedOpening) {
        delimiters.pop();
      }
      current += character;
      continue;
    }

    if (character === "," && delimiters.length === 0) {
      patterns.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (delimiters.length > 0) {
    throw new Error(UNBALANCED_PATTERNS_MESSAGE);
  }

  patterns.push(current.trim());

  if (patterns.some((pattern) => pattern.length === 0)) {
    throw new Error(EMPTY_PATTERNS_MESSAGE);
  }

  if (patterns.some(escapesProjectRoot)) {
    throw new Error(OUTSIDE_PROJECT_PATTERNS_MESSAGE);
  }

  return patterns;
}

export const CATEGORY_LABELS: Record<string, string> = {
  root: "Project Root",
  "cursor-rules": "Cursor Rules",
  "cursor-skills": "Cursor Skills",
  specs: "Specifications",
  spec: "Specifications",
  openspec: "OpenSpec",
  kiro: "Kiro Specs",
  "docs-specs": "Documentation Specs",
  requirements: "Requirements",
  plans: "Plans",
  github: "GitHub",
  other: "Other",
};
