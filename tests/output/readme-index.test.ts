import { describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import {
  categoryHasNonReadmePages,
  isReadmeFile,
  isRootReadme,
  logIndexSummary,
  resolveReadmeIndexBindings,
} from "../../src/output/readme-index.js";
import type { ParsedSpec } from "../../src/types.js";

function parsedSpec(
  relativePath: string,
  category: string,
  rawContent: string,
): ParsedSpec {
  return {
    file: {
      path: `/tmp/${relativePath}`,
      relativePath,
      category,
      title: "Readme",
    },
    frontmatter: {},
    title: "Readme",
    description: "",
    sections: [],
    rawContent,
  };
}

function agentSpec(relativePath: string, category: string): ParsedSpec {
  return {
    file: {
      path: `/tmp/${relativePath}`,
      relativePath,
      category,
      title: "Agent Instructions",
    },
    frontmatter: {},
    title: "Agent Instructions",
    description: "",
    sections: [],
    rawContent: "Agent body",
  };
}

describe("isReadmeFile", () => {
  it("matches README.md case-insensitively", () => {
    expect(isReadmeFile("README.md")).toBe(true);
    expect(isReadmeFile("docs/readme.md")).toBe(true);
    expect(isReadmeFile("SPEC.md")).toBe(false);
  });

  it("detects root README on Windows-style paths", () => {
    expect(isRootReadme("README.md")).toBe(true);
    expect(isRootReadme("packages\\nested\\README.md")).toBe(false);
  });
});

describe("categoryHasNonReadmePages", () => {
  it("returns false when category only contains README files", () => {
    const specs = [parsedSpec("orphan/README.md", "other", "Orphan intro")];
    expect(categoryHasNonReadmePages(specs, "other")).toBe(false);
  });

  it("returns true when category contains non-README specs", () => {
    const specs = [
      parsedSpec("packages/nested/README.md", "other", "Nested intro"),
      agentSpec("packages/nested/AGENTS.md", "other"),
    ];
    expect(categoryHasNonReadmePages(specs, "other")).toBe(true);
  });
});

describe("resolveReadmeIndexBindings", () => {
  it("binds nested README on Windows-style paths to category intro", () => {
    const bindings = resolveReadmeIndexBindings([
      parsedSpec(
        "packages\\nested\\README.md",
        "other",
        "Nested packages intro.",
      ),
      agentSpec("packages\\nested\\AGENTS.md", "other"),
    ]);

    expect(bindings.rootIntro).toBeNull();
    expect(bindings.categoryIntros.get("other")?.content).toBe(
      "Nested packages intro.",
    );
  });

  it("binds root README to main index intro", () => {
    const bindings = resolveReadmeIndexBindings([
      parsedSpec("README.md", "root", "Root project overview."),
      agentSpec("AGENTS.md", "root"),
    ]);

    expect(bindings.rootIntro).toBe("Root project overview.");
    expect(bindings.rootIntroSource).toBe("README.md");
    expect(bindings.categoryIntros.size).toBe(0);
    expect(bindings.readmeIndexCount).toBe(1);
  });

  it("binds folder README when directory has other specs", () => {
    const bindings = resolveReadmeIndexBindings([
      parsedSpec(
        "packages/nested/README.md",
        "other",
        "Nested packages intro.",
      ),
      agentSpec("packages/nested/AGENTS.md", "other"),
    ]);

    expect(bindings.rootIntro).toBeNull();
    expect(bindings.categoryIntros.get("other")).toEqual({
      content: "Nested packages intro.",
      sourcePaths: ["packages/nested/README.md"],
      segments: [
        {
          content: "Nested packages intro.",
          sourcePath: "packages/nested/README.md",
        },
      ],
    });
    expect(bindings.readmeIndexCount).toBe(1);
  });

  it("merges multiple folder READMEs in one category with per-source segments", () => {
    const bindings = resolveReadmeIndexBindings([
      parsedSpec("packages/a/README.md", "other", "Package A intro."),
      agentSpec("packages/a/AGENTS.md", "other"),
      parsedSpec("packages/b/README.md", "other", "Package B intro."),
      agentSpec("packages/b/AGENTS.md", "other"),
    ]);

    expect(bindings.categoryIntros.get("other")).toEqual({
      content: "Package A intro.\n\nPackage B intro.",
      sourcePaths: ["packages/a/README.md", "packages/b/README.md"],
      segments: [
        {
          content: "Package A intro.",
          sourcePath: "packages/a/README.md",
        },
        {
          content: "Package B intro.",
          sourcePath: "packages/b/README.md",
        },
      ],
    });
    expect(bindings.readmeIndexCount).toBe(2);
  });

  it("skips folder README when directory has no other specs", () => {
    const bindings = resolveReadmeIndexBindings([
      parsedSpec("docs/README.md", "other", "Docs folder only."),
    ]);

    expect(bindings.categoryIntros.size).toBe(0);
    expect(bindings.readmeIndexCount).toBe(0);
  });

  it("skips folder README when category has only README files", () => {
    const bindings = resolveReadmeIndexBindings([
      parsedSpec("orphan/README.md", "other", "Orphan only."),
    ]);

    expect(bindings.categoryIntros.size).toBe(0);
    expect(bindings.readmeIndexCount).toBe(0);
  });

  it("emits parse.readme-index for folder bindings when verbose", () => {
    log.setVerbose(true);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    resolveReadmeIndexBindings([
      parsedSpec(
        "packages/nested/README.md",
        "other",
        "Nested packages intro.",
      ),
      agentSpec("packages/nested/AGENTS.md", "other"),
    ]);

    const events = stderrSpy.mock.calls
      .map(([chunk]) => String(chunk).trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(events).toContainEqual(
      expect.objectContaining({
        event: "parse.readme-index",
        relativePath: "packages/nested/README.md",
        category: "other",
      }),
    );

    stderrSpy.mockRestore();
    log.setVerbose(false);
  });

  it("does not emit parse.readme-index for root README", () => {
    log.setVerbose(true);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    resolveReadmeIndexBindings([
      parsedSpec("README.md", "root", "Root intro."),
      agentSpec("AGENTS.md", "root"),
    ]);

    const events = stderrSpy.mock.calls
      .map(([chunk]) => String(chunk).trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(
      events.filter((event) => event.event === "parse.readme-index"),
    ).toHaveLength(0);

    stderrSpy.mockRestore();
    log.setVerbose(false);
  });
});

describe("logIndexSummary", () => {
  it("emits output.index with readmeIndexCount", () => {
    log.setVerbose(true);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    logIndexSummary(2);

    const event = stderrSpy.mock.calls
      .map(([chunk]) => String(chunk).trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .find((line) => line.event === "output.index");

    expect(event).toMatchObject({
      event: "output.index",
      readmeIndexCount: 2,
    });

    stderrSpy.mockRestore();
    log.setVerbose(false);
  });
});
