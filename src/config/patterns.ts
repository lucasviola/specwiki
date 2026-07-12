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
