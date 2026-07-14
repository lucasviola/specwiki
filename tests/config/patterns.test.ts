import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABELS,
  DEFAULT_SPEC_PATTERNS,
  parsePatternList,
} from "../../src/config/patterns.js";

describe("patterns config", () => {
  it("includes common root spec filenames", () => {
    expect(DEFAULT_SPEC_PATTERNS).toContain("AGENTS.md");
    expect(DEFAULT_SPEC_PATTERNS).toContain("SPEC.md");
  });

  it("maps categories to display labels", () => {
    expect(CATEGORY_LABELS.root).toBe("Project Root");
    expect(CATEGORY_LABELS["cursor-rules"]).toBe("Cursor Rules");
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
