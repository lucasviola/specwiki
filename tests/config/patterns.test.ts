import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABELS,
  DEFAULT_SPEC_PATTERNS,
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
});
