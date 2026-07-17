import { describe, expect, it } from "vitest";
import {
  buildCategoryNavSubgroups,
  categoryPathPrefix,
  humanizeSegment,
  loadNavGroupingContext,
} from "../../../src/output/html/nav-grouping.js";
import type { WikiPage } from "../../../src/types.js";

function wikiPage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    slug: "page",
    title: "Page",
    category: "bmad-output",
    content: "# Page",
    sourcePath: "_bmad-output/page.md",
    description: "",
    sections: [],
    ...overrides,
  };
}

describe("nav-grouping", () => {
  describe("categoryPathPrefix", () => {
    it("maps known category keys to strip prefixes", () => {
      expect(categoryPathPrefix("cursor-skills")).toBe(".cursor/skills/");
      expect(categoryPathPrefix("bmad-output")).toBe("_bmad-output/");
      expect(categoryPathPrefix("root")).toBe("");
    });
  });

  describe("humanizeSegment", () => {
    it("title-cases unknown folder segments", () => {
      expect(humanizeSegment("my-folder")).toBe("My Folder");
    });

    it("uses known folder label aliases", () => {
      expect(humanizeSegment("planning-artifacts")).toBe("Planning");
    });
  });

  describe("loadNavGroupingContext", () => {
    it("returns a stub context for S23.1", async () => {
      const ctx = await loadNavGroupingContext("/tmp/project");
      expect(ctx.loaded).toBe(false);
    });
  });

  describe("L0 path-segment grouping", () => {
    it("groups cursor-skills pages by first path segment", () => {
      const pages = [
        wikiPage({
          slug: "skill-a",
          title: "Skill A",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
        }),
        wikiPage({
          slug: "skill-b",
          title: "Skill B",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
        }),
        wikiPage({
          slug: "skill-c",
          title: "Skill C",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-b/skill-c/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "cursor-skills",
        indexBuild: true,
      });

      expect(result.hasSubgroups).toBe(true);
      expect(result.subgroups.map((sg) => sg.label)).toEqual(["Team A"]);
      expect(result.subgroups[0].pageCount).toBe(2);
      expect(result.pages.map((p) => p.slug)).toEqual(["skill-c"]);
    });

    it("caps nesting at two levels inside a category", () => {
      const pages = [
        wikiPage({
          slug: "deep-a",
          title: "Deep A",
          category: "specs",
          sourcePath: "specs/alpha/beta/deep-a.md",
        }),
        wikiPage({
          slug: "deep-b",
          title: "Deep B",
          category: "specs",
          sourcePath: "specs/alpha/beta/deep-b.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "specs",
        indexBuild: true,
      });

      expect(result.subgroups).toHaveLength(1);
      expect(result.subgroups[0].label).toBe("Alpha");
      expect(result.subgroups[0].subgroups).toHaveLength(1);
      expect(result.subgroups[0].subgroups![0].label).toBe("Beta");
      expect(
        result.subgroups[0].subgroups![0].pages.map((p) => p.slug),
      ).toEqual(["deep-a", "deep-b"]);
    });

    it("keeps root category files without path segments flat", () => {
      const pages = [
        wikiPage({
          slug: "spec",
          title: "Spec",
          category: "root",
          sourcePath: "SPEC.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "root",
        indexBuild: true,
      });

      expect(result.hasSubgroups).toBe(false);
      expect(result.pages).toHaveLength(1);
    });
  });

  describe("BMAD Output L3 conventions", () => {
    it("groups planning-artifacts under Planning with child folder labels", () => {
      const pages = [
        wikiPage({
          slug: "prd-a",
          title: "PRD A",
          sourcePath: "_bmad-output/planning-artifacts/discovery/prd-a.md",
        }),
        wikiPage({
          slug: "prd-b",
          title: "PRD B",
          sourcePath: "_bmad-output/planning-artifacts/discovery/prd-b.md",
        }),
        wikiPage({
          slug: "research-a",
          title: "Research A",
          sourcePath: "_bmad-output/planning-artifacts/research/report-a.md",
        }),
        wikiPage({
          slug: "research-b",
          title: "Research B",
          sourcePath: "_bmad-output/planning-artifacts/research/report-b.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      const planning = result.subgroups.find((sg) => sg.label === "Planning");
      expect(planning).toBeDefined();
      expect(planning!.subgroups!.map((sg) => sg.label)).toEqual([
        "Discovery",
        "Research",
      ]);
    });

    it("groups implementation story files under Implementation Stories and Epic N", () => {
      const pages = [
        wikiPage({
          slug: "story-19-5",
          title: "Story 19.5",
          sourcePath:
            "_bmad-output/implementation-artifacts/19-5-collapsible-category-navigation.md",
        }),
        wikiPage({
          slug: "story-19-1",
          title: "Story 19.1",
          sourcePath:
            "_bmad-output/implementation-artifacts/19-1-dark-mode-pre-paint-theme-toggle.md",
        }),
        wikiPage({
          slug: "story-23-1",
          title: "Story 23.1",
          sourcePath:
            "_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md",
        }),
        wikiPage({
          slug: "story-23-2",
          title: "Story 23.2",
          sourcePath:
            "_bmad-output/implementation-artifacts/23-2-bmad-catalog-enrichment.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      const impl = result.subgroups.find(
        (sg) => sg.label === "Implementation Stories",
      );
      expect(impl).toBeDefined();
      const epicLabels = impl!.subgroups!.map((sg) => sg.label);
      expect(epicLabels).toEqual(["Epic 19", "Epic 23"]);
      expect(impl!.subgroups![0].pages.map((p) => p.slug)).toEqual([
        "story-19-1",
        "story-19-5",
      ]);
    });

    it("places epic context files in Epic Context subgroup", () => {
      const pages = [
        wikiPage({
          slug: "epic-23",
          title: "Epic 23 Context",
          sourcePath:
            "_bmad-output/implementation-artifacts/epic-23-context.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].slug).toBe("epic-23");
      expect(result.subgroups).toHaveLength(0);
    });

    it("maps fixture planning alias to Planning subgroup", () => {
      const pages = [
        wikiPage({
          slug: "artifact",
          title: "Artifact",
          sourcePath: "_bmad-output/planning/artifact.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].slug).toBe("artifact");
    });
  });

  describe("singleton promotion", () => {
    it("promotes single-page subgroups to direct category links", () => {
      const pages = [
        wikiPage({
          slug: "only-one",
          title: "Only One",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/lonely/skill/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "cursor-skills",
        indexBuild: true,
      });

      expect(result.hasSubgroups).toBe(false);
      expect(result.subgroups).toHaveLength(0);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].slug).toBe("only-one");
    });

    it("promotes single-child chains when each level has one page", () => {
      const pages = [
        wikiPage({
          slug: "solo",
          title: "Solo",
          category: "specs",
          sourcePath: "specs/only/child/solo.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "specs",
        indexBuild: true,
      });

      expect(result.hasSubgroups).toBe(false);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].slug).toBe("solo");
    });
  });

  describe("active-page open flags", () => {
    it("opens the subgroup containing the active page on article builds", () => {
      const pages = [
        wikiPage({
          slug: "skill-a",
          title: "Skill A",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
        }),
        wikiPage({
          slug: "skill-b",
          title: "Skill B",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
        }),
        wikiPage({
          slug: "skill-c",
          title: "Skill C",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-b/skill-c/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "cursor-skills",
        activePageSlug: "skill-a",
        activeSourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
        indexBuild: false,
      });

      const teamA = result.subgroups.find((sg) => sg.label === "Team A");
      expect(teamA!.open).toBe(true);
      expect(result.pages[0].slug).toBe("skill-c");
    });

    it("opens parent and child subgroups when active page is depth-2", () => {
      const pages = [
        wikiPage({
          slug: "story-19-5",
          title: "Story 19.5",
          sourcePath:
            "_bmad-output/implementation-artifacts/19-5-collapsible-category-navigation.md",
        }),
        wikiPage({
          slug: "story-19-1",
          title: "Story 19.1",
          sourcePath:
            "_bmad-output/implementation-artifacts/19-1-dark-mode-pre-paint-theme-toggle.md",
        }),
        wikiPage({
          slug: "story-23-1",
          title: "Story 23.1",
          sourcePath:
            "_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md",
        }),
        wikiPage({
          slug: "story-23-2",
          title: "Story 23.2",
          sourcePath:
            "_bmad-output/implementation-artifacts/23-2-bmad-catalog-enrichment.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        activePageSlug: "story-19-5",
        indexBuild: false,
      });

      const impl = result.subgroups.find(
        (sg) => sg.label === "Implementation Stories",
      );
      const epic19 = impl!.subgroups!.find((sg) => sg.label === "Epic 19");
      const epic23 = impl!.subgroups!.find((sg) => sg.label === "Epic 23");
      expect(impl!.open).toBe(true);
      expect(epic19!.open).toBe(true);
      expect(epic23!.open).toBe(false);
    });

    it("leaves multi-page subgroups closed on index builds", () => {
      const pages = [
        wikiPage({
          slug: "skill-a",
          title: "Skill A",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
        }),
        wikiPage({
          slug: "skill-b",
          title: "Skill B",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "cursor-skills",
        indexBuild: true,
      });

      expect(result.subgroups[0].open).toBe(false);
    });

    it("matches active pages by sourcePath when slug is omitted", () => {
      const pages = [
        wikiPage({
          slug: "skill-a",
          title: "Skill A",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
        }),
        wikiPage({
          slug: "skill-b",
          title: "Skill B",
          category: "cursor-skills",
          sourcePath: ".cursor/skills/team-a/skill-b/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "cursor-skills",
        activeSourcePath: ".cursor/skills/team-a/skill-a/SKILL.md",
        indexBuild: false,
      });

      expect(result.subgroups[0].open).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("groups other-category pages by first path segment", () => {
      const pages = [
        wikiPage({
          slug: "agents",
          title: "Agents",
          category: "other",
          sourcePath: "packages/nested/AGENTS.md",
        }),
        wikiPage({
          slug: "readme",
          title: "Readme",
          category: "other",
          sourcePath: "packages/nested/README.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "other",
        indexBuild: true,
      });

      expect(result.subgroups[0].label).toBe("Packages");
      expect(result.subgroups[0].subgroups![0].label).toBe("Nested");
      expect(result.subgroups[0].subgroups![0].pages).toHaveLength(2);
    });

    it("returns undefined prefix for unknown categories", () => {
      expect(categoryPathPrefix("unknown")).toBeUndefined();
    });

    it("promotes a lone child subgroup page to the parent", () => {
      const pages = [
        wikiPage({
          slug: "nested",
          title: "Nested",
          category: "specs",
          sourcePath: "specs/group/leaf/nested.md",
        }),
        wikiPage({
          slug: "sibling",
          title: "Sibling",
          category: "specs",
          sourcePath: "specs/group/sibling.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "specs",
        indexBuild: true,
      });

      const group = result.subgroups.find((sg) => sg.label === "Group");
      expect(group?.pages.map((p) => p.slug)).toContain("nested");
      expect(group?.pages.map((p) => p.slug)).toContain("sibling");
    });

    it("falls back to L0 for odd bmad-output paths", () => {
      const pages = [
        wikiPage({
          slug: "misc",
          title: "Misc",
          sourcePath: "_bmad-output/custom/misc.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      expect(result.pages[0].slug).toBe("misc");
    });

    it("uses L0 for nested paths under implementation-artifacts", () => {
      const pages = [
        wikiPage({
          slug: "notes",
          title: "Notes",
          sourcePath: "_bmad-output/implementation-artifacts/archive/notes.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      expect(result.pages[0].slug).toBe("notes");
    });

    it("ignores path segments when source path lacks the category prefix", () => {
      const pages = [
        wikiPage({
          slug: "outside",
          title: "Outside",
          category: "specs",
          sourcePath: "other/feature.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "specs",
        indexBuild: true,
      });

      expect(result.pages[0].slug).toBe("outside");
    });

    it("opens nested planning subgroups for the active page", () => {
      const pages = [
        wikiPage({
          slug: "prd-a",
          title: "PRD A",
          sourcePath: "_bmad-output/planning-artifacts/discovery/prd-a.md",
        }),
        wikiPage({
          slug: "prd-b",
          title: "PRD B",
          sourcePath: "_bmad-output/planning-artifacts/discovery/prd-b.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        activePageSlug: "prd-a",
        indexBuild: false,
      });

      const planning = result.subgroups.find((sg) => sg.label === "Planning");
      const discovery = planning!.subgroups!.find(
        (sg) => sg.label === "Discovery",
      );
      expect(planning!.open).toBe(true);
      expect(discovery!.open).toBe(true);
    });

    it("groups orphan implementation-artifacts root files under Other", () => {
      const pages = [
        wikiPage({
          slug: "orphan-a",
          title: "Orphan A",
          sourcePath: "_bmad-output/implementation-artifacts/orphan-a.md",
        }),
        wikiPage({
          slug: "orphan-b",
          title: "Orphan B",
          sourcePath: "_bmad-output/implementation-artifacts/orphan-b.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "bmad-output",
        indexBuild: true,
      });

      const other = result.subgroups.find((sg) => sg.label === "Other");
      expect(other?.pages).toHaveLength(2);
    });

    it("returns empty grouping for unknown category keys", () => {
      const pages = [
        wikiPage({
          slug: "doc",
          title: "Doc",
          category: "unknown",
          sourcePath: "folder/doc.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "unknown",
        indexBuild: true,
      });

      expect(result.hasSubgroups).toBe(false);
      expect(result.pages[0].slug).toBe("doc");
    });
  });
});
