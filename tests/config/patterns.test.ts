import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABELS,
  DEFAULT_SPEC_PATTERNS,
  parsePatternList,
} from "../../src/config/patterns.js";

describe("patterns config", () => {
  const LEGACY_PATTERN_COUNT = 15;
  const EXTENDED_PATTERN_COUNT = 4;
  const CATCH_ALL_PATTERN_COUNT = 1;

  it("includes common root spec filenames", () => {
    expect(DEFAULT_SPEC_PATTERNS).toContain("AGENTS.md");
    expect(DEFAULT_SPEC_PATTERNS).toContain("SPEC.md");
  });

  it("includes extended default patterns appended after legacy entries", () => {
    expect(DEFAULT_SPEC_PATTERNS).toContain("**/AGENTS.md");
    expect(DEFAULT_SPEC_PATTERNS).toContain("_bmad-output/**/*.md");
    expect(DEFAULT_SPEC_PATTERNS).toContain(".agents/skills/**/SKILL.md");
    expect(DEFAULT_SPEC_PATTERNS).toContain("**/README.md");
    expect(DEFAULT_SPEC_PATTERNS).toContain("**/*.{md,mdc}");
    expect(DEFAULT_SPEC_PATTERNS).toContain(".cursor/rules/**/*.{md,mdc}");
    expect(DEFAULT_SPEC_PATTERNS.length).toBe(
      LEGACY_PATTERN_COUNT + EXTENDED_PATTERN_COUNT + CATCH_ALL_PATTERN_COUNT,
    );

    const legacyTail = DEFAULT_SPEC_PATTERNS.slice(0, LEGACY_PATTERN_COUNT);
    expect(legacyTail).toEqual([
      "AGENTS.md",
      "SPEC.md",
      "CLAUDE.md",
      "GEMINI.md",
      "llms.txt",
      ".cursor/rules/**/*.{md,mdc}",
      ".cursor/skills/**/SKILL.md",
      "specs/**/*.{md,mdc}",
      "spec/**/*.{md,mdc}",
      "openspec/**/*.{md,mdc}",
      ".kiro/specs/**/*.{md,mdc}",
      "docs/specs/**/*.{md,mdc}",
      "requirements/**/*.{md,mdc}",
      "docs/plans/**/*.{md,mdc}",
      ".github/copilot-instructions.md",
    ]);
  });

  it("appends catch-all markdown pattern after extended entries", () => {
    expect(DEFAULT_SPEC_PATTERNS.at(-1)).toBe("**/*.{md,mdc}");
    expect(DEFAULT_SPEC_PATTERNS.slice(LEGACY_PATTERN_COUNT, -1)).toEqual([
      "**/AGENTS.md",
      "_bmad-output/**/*.md",
      ".agents/skills/**/SKILL.md",
      "**/README.md",
    ]);
  });

  it("maps categories to display labels", () => {
    expect(CATEGORY_LABELS.root).toBe("Project Root");
    expect(CATEGORY_LABELS["cursor-rules"]).toBe("Cursor Rules");
    expect(CATEGORY_LABELS["bmad-output"]).toBe("BMAD Output");
    expect(CATEGORY_LABELS["agent-skills"]).toBe("Agent Skills");
  });

  it.each([
    ["custom/**/*.md", ["custom/**/*.md"]],
    [
      " custom/**/*.md, docs/plans/**/*.md ",
      ["custom/**/*.md", "docs/plans/**/*.md"],
    ],
    [
      "**/*.{md,mdc},src/**/+(SPEC|AGENTS).md",
      ["**/*.{md,mdc}", "src/**/+(SPEC|AGENTS).md"],
    ],
    [
      "docs/[a,b]/**/*.md,escaped\\,comma.md",
      ["docs/[a,b]/**/*.md", "escaped\\,comma.md"],
    ],
    [
      "literal\\{name}.md,literal\\[name].md",
      ["literal\\{name}.md", "literal\\[name].md"],
    ],
    [
      "src/**/+(literal\\{name}|other).md",
      ["src/**/+(literal\\{name}|other).md"],
    ],
    ["{literal\\}.md", ["{literal\\}.md"]],
  ])("parses custom pattern list %j", (value, expected) => {
    expect(parsePatternList(value)).toEqual(expected);
  });

  it.each([
    "",
    "   ",
    ",specs/**/*.md",
    "specs/**/*.md,",
    "specs/**/*.md,,docs/**/*.md",
  ])("rejects empty pattern entries in %j", (value) => {
    expect(() => parsePatternList(value)).toThrow(
      "Patterns must be a comma-separated list of non-empty globs",
    );
  });

  it.each(["**/*.{md,mdc", "docs/[abc/**/*.md", "src/**/+(SPEC|AGENTS.md"])(
    "rejects unbalanced glob delimiters in %j",
    (value) => {
      expect(() => parsePatternList(value)).toThrow(
        "Patterns must use balanced glob delimiters",
      );
    },
  );

  it.each([
    "../**/*.md",
    "docs/../../secrets/*.md",
    "/tmp/**/*.md",
    "C:\\Users\\**\\*.md",
    "{../**/*.md,docs/**/*.md}",
    "!{../**/*.md}",
    "@(../secrets/*.md|docs/**/*.md)",
    "{/tmp/**/*.md,docs/**/*.md}",
  ])("rejects patterns that can escape the project root: %j", (value) => {
    expect(() => parsePatternList(value)).toThrow(
      "Patterns must stay within the project root",
    );
  });
});
