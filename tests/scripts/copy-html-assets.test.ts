import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("copy-html-assets", () => {
  it("preserves the local variable-based highlight theme in dist", () => {
    const source = fs.readFileSync(
      path.join(projectRoot, "scripts/copy-html-assets.mjs"),
      "utf8",
    );

    expect(source).toContain('copyDir("assets", "assets")');
    expect(source).not.toContain("highlight.js/styles/github.min.css");
  });
});
