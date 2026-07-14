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

  // Extended POST-MVP discovery (S8.3)
  "**/AGENTS.md",
  "_bmad-output/**/*.md",
  ".agents/skills/**/SKILL.md",
  "**/README.md",

  // Broad markdown discovery (S17.1)
  "**/*.{md,mdc}",
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

function validateSinglePattern(pattern: string): void {
  if (pattern.length === 0) {
    throw new Error(EMPTY_PATTERNS_MESSAGE);
  }

  const delimiters: string[] = [];
  let escaped = false;

  for (const character of pattern) {
    if (escaped) {
      if (delimiters.at(-1) === CLOSING_DELIMITERS[character]) {
        delimiters.pop();
      }
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === "{" || character === "[" || character === "(") {
      delimiters.push(character);
      continue;
    }

    if (character === "}" || character === "]" || character === ")") {
      const expectedOpening = CLOSING_DELIMITERS[character];
      const activeOpening = delimiters.at(-1);
      if (activeOpening === expectedOpening) {
        delimiters.pop();
      }
    }
  }

  if (delimiters.length > 0) {
    throw new Error(UNBALANCED_PATTERNS_MESSAGE);
  }

  if (escapesProjectRoot(pattern)) {
    throw new Error(OUTSIDE_PROJECT_PATTERNS_MESSAGE);
  }
}

export function validatePatternList(patterns: string[]): string[] {
  const normalized = patterns.map((pattern) => pattern.trim());

  if (normalized.length === 0) {
    throw new Error(EMPTY_PATTERNS_MESSAGE);
  }

  for (const pattern of normalized) {
    validateSinglePattern(pattern);
  }

  return normalized;
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

  return validatePatternList(patterns);
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
  "bmad-output": "BMAD Output",
  "agent-skills": "Agent Skills",
  other: "Other",
};
