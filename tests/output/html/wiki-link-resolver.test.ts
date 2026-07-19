import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { log } from "../../../src/core/Logger.js";
import {
  buildWikiLinkIndex,
  createHtmlLinkResolver,
} from "../../../src/output/html/wiki-link-resolver.js";
import type { WikiPage } from "../../../src/types.js";

function page(
  sourcePath: string,
  slug: string,
  overrides: Partial<WikiPage> = {},
): WikiPage {
  return {
    slug,
    title: slug,
    category: "root",
    content: "",
    sourcePath,
    description: "",
    sections: [],
    ...overrides,
  };
}

function resolverFor(
  pages: WikiPage[],
  sourcePath: string,
  projectRoot = "/tmp/project",
): (href: string) => string {
  return createHtmlLinkResolver({
    index: buildWikiLinkIndex(pages),
    sourcePath,
    projectRoot,
  });
}

describe("buildWikiLinkIndex", () => {
  it("maps normalized source paths to slugs", () => {
    const index = buildWikiLinkIndex([
      page("README.md", "readme"),
      page("docs/adr/index.md", "docs-adr-index"),
      page("docs/adr/template.md", "docs-adr-template"),
    ]);

    expect(index.lookup("readme.md")).toBe("readme");
    expect(index.lookup("docs/adr/template.md")).toBe("docs-adr-template");
    expect(index.lookup("docs/adr/template")).toBe("docs-adr-template");
  });

  it("uses collision-aware slugs from WikiPage", () => {
    const index = buildWikiLinkIndex([
      page("specs/foo/bar.md", "specs-foo-bar"),
      page("specs/nested/bar.md", "specs-foo-bar-deadbeef"),
    ]);

    expect(index.lookup("specs/nested/bar.md")).toBe("specs-foo-bar-deadbeef");
  });
});

describe("createHtmlLinkResolver", () => {
  const pages = [
    page("README.md", "readme"),
    page("CHANGELOG.md", "changelog"),
    page("HARNESS.md", "harness"),
    page("docs/adr/index.md", "docs-adr-index"),
    page("docs/adr/template.md", "docs-adr-template"),
    page(
      "_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md",
      "_bmad-output-planning-artifacts-discovery-architecture-architecture-spine",
    ),
    page(
      "_bmad-output/implementation-artifacts/23-7-breadcrumb-subgroup-parity.md",
      "23-7-breadcrumb-subgroup-parity",
    ),
    page(
      "_bmad-output/implementation-artifacts/improvements/23-imp-3-breadcrumb-subgroup-parity.md",
      "23-imp-3-breadcrumb-subgroup-parity-abc12345",
    ),
    page(".cursor/rules/spec.mdc", "cursor-rules-spec"),
  ];

  it("resolves same-directory relative links", () => {
    const resolve = resolverFor(pages, "docs/adr/index.md");
    expect(resolve("./template.md")).toBe("docs-adr-template.html");
  });

  it("resolves bare filename links from project root", () => {
    const resolve = resolverFor(pages, "README.md");
    expect(resolve("CHANGELOG.md")).toBe("changelog.html");
  });

  it("resolves parent traversal links", () => {
    const resolve = resolverFor(
      pages,
      "_bmad-output/implementation-artifacts/improvements/23-imp-3-breadcrumb-subgroup-parity.md",
    );
    expect(resolve("../23-7-breadcrumb-subgroup-parity.md")).toBe(
      "23-7-breadcrumb-subgroup-parity.html",
    );
  });

  it("resolves cross-tree links", () => {
    const resolve = resolverFor(pages, "docs/adr/index.md");
    expect(
      resolve(
        "../../_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md",
      ),
    ).toBe(
      "_bmad-output-planning-artifacts-discovery-architecture-architecture-spine.html",
    );
  });

  it("preserves URL fragments", () => {
    const resolve = resolverFor(pages, "README.md");
    expect(resolve("./HARNESS.md#section")).toBe("harness.html#section");
  });

  it("passes through external https links", () => {
    const resolve = resolverFor(pages, "README.md");
    const href = "https://github.com/example/specwiki";
    expect(resolve(href)).toBe(href);
  });

  it("passes through anchor-only links", () => {
    const resolve = resolverFor(pages, "README.md");
    expect(resolve("#requirements")).toBe("#requirements");
  });

  it("passes through undiscovered spec-like links and logs when verbose", () => {
    log.setVerbose(true);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    const resolve = resolverFor(pages, "README.md");
    expect(resolve("./missing.md")).toBe("./missing.md");

    const lines = stderrSpy.mock.calls
      .map(([chunk]) => String(chunk).trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "output.link-unresolved",
        sourcePath: "README.md",
        href: "./missing.md",
      }),
    );

    stderrSpy.mockRestore();
    log.setVerbose(false);
  });

  it("does not log unresolved links when verbose is disabled", () => {
    log.setVerbose(false);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    const resolve = resolverFor(pages, "README.md");
    expect(resolve("./missing.md")).toBe("./missing.md");
    expect(stderrSpy).not.toHaveBeenCalled();

    stderrSpy.mockRestore();
  });

  it("passes through path escape attempts", () => {
    const resolve = resolverFor(pages, "README.md");
    expect(resolve("../../../../etc/passwd")).toBe("../../../../etc/passwd");
  });

  it("passes through dangerous javascript links without rewriting", () => {
    const resolve = resolverFor(pages, "README.md");
    const href = "javascript:alert(1)";
    expect(resolve(href)).toBe(href);
  });

  it("passes through data and vbscript schemes", () => {
    const resolve = resolverFor(pages, "README.md");
    expect(resolve("data:text/html,hi")).toBe("data:text/html,hi");
    expect(resolve("vbscript:msgbox(1)")).toBe("vbscript:msgbox(1)");
  });

  it("resolves .mdc targets when discovered", () => {
    const resolve = resolverFor(pages, "README.md");
    expect(resolve(".cursor/rules/spec.mdc")).toBe("cursor-rules-spec.html");
  });

  it("passes through mailto links", () => {
    const resolve = resolverFor(pages, "README.md");
    const href = "mailto:team@example.com";
    expect(resolve(href)).toBe(href);
  });

  it("passes through protocol-relative URLs", () => {
    const resolve = resolverFor(pages, "README.md");
    const href = "//cdn.example.com/lib.js";
    expect(resolve(href)).toBe(href);
  });

  it("rejects resolved paths that escape projectRoot", () => {
    const resolve = resolverFor(pages, "README.md", "/tmp/project");
    const escaped = path.posix.join("..", "..", "outside.md");
    expect(resolve(escaped)).toBe(escaped);
  });

  it("normalizes backslash source paths", () => {
    const resolve = resolverFor(
      [page("docs\\adr\\template.md", "docs-adr-template")],
      "docs\\adr\\index.md",
    );
    expect(resolve("./template.md")).toBe("docs-adr-template.html");
  });
});
