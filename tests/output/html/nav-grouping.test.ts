import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCategoryNavSubgroups,
  categoryPathPrefix,
  humanizeSegment,
  loadNavGroupingContext,
} from "../../../src/output/html/nav-grouping.js";
import {
  catalogPath,
  parseCsvLine,
  parseSkillCustomizeToml,
} from "../../../src/output/html/nav-grouping-catalog.js";
import { log } from "../../../src/core/Logger.js";
import type { WikiPage } from "../../../src/types.js";

const SAMPLE_PROJECT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/sample-project",
);

const tempDirs: string[] = [];

async function makeTempProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "specwiki-nav23-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

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
    it("loads CSV + TOML catalog from sample-project fixture", async () => {
      const ctx = await loadNavGroupingContext(SAMPLE_PROJECT);
      expect(ctx.loaded).toBe(true);
      expect(ctx.skillsById.get("bmad-agent-pm")?.isAgent).toBe(true);
      expect(ctx.skillsById.get("bmad-agent-pm")?.agentName).toBe("John");
      expect(ctx.skillsById.get("bmad-create-story")?.displayName).toBe(
        "Create Story",
      );
      expect(ctx.skillsById.get("bmad-brainstorming")?.phase).toBe(
        "1-analysis",
      );
      expect(ctx.skillsById.get("bmad-help")?.module).toBe("Core");
      expect(ctx.skillsById.get("bmad-legacy-skill")?.description).toMatch(
        /DEPRECATED/i,
      );
    });

    it("returns loaded false when bmad-help.csv is missing", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, ".agents", "skills", "solo"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, ".agents", "skills", "solo", "customize.toml"),
        '[agent]\nname = "Ada"\ntitle = "Analyst"\n',
      );

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.loaded).toBe(false);
      expect(ctx.skillsById.size).toBe(0);
    });

    it("skips malformed CSV rows and TOML files without throwing", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.mkdir(path.join(root, ".agents", "skills", "good-skill"), {
        recursive: true,
      });
      await fs.mkdir(path.join(root, ".agents", "skills", "bad-toml"), {
        recursive: true,
      });
      await fs.mkdir(path.join(root, ".agents", "skills", "csv-agent"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        [
          "module,skill,display-name,menu-code,description,action,args,phase,preceded-by,followed-by,required,output-location,outputs",
          'BMad Method,good-skill,Good Skill,GS,"Has, comma",,,1-analysis,,,false,,',
          'BMad Method,quoted,Quote Skill,QS,"He said ""hi""",,,2-planning,,,false,,',
          "not-enough-columns",
          "BMad Method,_meta,,,,,,,,,false,,",
          "BMad Method,csv-agent,CSV Agent,CA,,,,3-solutioning,,,false,,",
          "",
        ].join("\n"),
      );
      await fs.writeFile(
        path.join(root, ".agents", "skills", "good-skill", "customize.toml"),
        "[workflow]\n",
      );
      await fs.writeFile(
        path.join(root, ".agents", "skills", "bad-toml", "customize.toml"),
        "[[[not valid toml",
      );
      await fs.writeFile(
        path.join(root, ".agents", "skills", "csv-agent", "customize.toml"),
        "[agent]\r\nname = 'Alex'\r\ntitle = 'Architect'\r\nicon = '🏗️'\r\n[workflow]\r\n",
      );

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.loaded).toBe(true);
      expect(ctx.skillsById.get("good-skill")?.displayName).toBe("Good Skill");
      expect(ctx.skillsById.get("quoted")?.displayName).toBe("Quote Skill");
      expect(ctx.skillsById.get("quoted")?.description).toBe('He said "hi"');
      expect(ctx.skillsById.has("bad-toml")).toBe(false);
      expect(ctx.skillsById.get("csv-agent")?.isAgent).toBe(true);
      expect(ctx.skillsById.get("csv-agent")?.agentName).toBe("Alex");
    });

    it("loads CSV without a skills directory and ignores CSV missing skill column", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        "module,display-name,phase\nBMad Method,Nope,1-analysis\n",
      );

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.loaded).toBe(true);
      expect(ctx.skillsById.size).toBe(0);
    });

    it("prefers a later SDLC CSV row over an earlier anytime row for the same skill", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.mkdir(path.join(root, ".agents", "skills", "flip-skill"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        [
          "skill,display-name,phase,module,description",
          "flip-skill,Flip Core,anytime,Core,",
          "flip-skill,Flip Method,2-planning,BMad Method,",
          ",Empty Skill,1-analysis,BMad Method,",
        ].join("\n"),
      );
      await fs.writeFile(
        path.join(root, ".agents", "skills", "flip-skill", "customize.toml"),
        "[workflow]\n",
      );
      // Directory without customize.toml should be skipped quietly.
      await fs.mkdir(path.join(root, ".agents", "skills", "no-toml"), {
        recursive: true,
      });

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.skillsById.get("flip-skill")?.displayName).toBe("Flip Method");
      expect(ctx.skillsById.get("flip-skill")?.phase).toBe("2-planning");
      expect(ctx.skillsById.has("no-toml")).toBe(false);
    });

    it("keeps DEPRECATED membership when a tied later CSV row marks the skill deprecated", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        [
          "skill,display-name,phase,module,description",
          "tied-skill,Active Name,4-implementation,BMad Method,Still active",
          "tied-skill,Legacy Name,4-implementation,BMad Method,DEPRECATED — retired",
        ].join("\n"),
      );

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.skillsById.get("tied-skill")?.displayName).toBe("Active Name");
      expect(ctx.skillsById.get("tied-skill")?.description).toMatch(
        /DEPRECATED/i,
      );

      const result = buildCategoryNavSubgroups(
        [
          wikiPage({
            slug: "tied-a",
            title: "Tied A",
            category: "agent-skills",
            sourcePath: ".agents/skills/tied-skill/SKILL.md",
          }),
          wikiPage({
            slug: "tied-b",
            title: "Tied B",
            category: "agent-skills",
            sourcePath: ".agents/skills/tied-skill/README.md",
          }),
        ],
        {
          categoryKey: "agent-skills",
          indexBuild: true,
          context: ctx,
        },
      );

      expect(result.subgroups.map((sg) => sg.key)).toEqual(["deprecated"]);
    });

    it("ignores bmad-help.csv when it is a symlink escaping the project root", async () => {
      const root = await makeTempProject();
      const outside = await fs.mkdtemp(
        path.join(os.tmpdir(), "specwiki-nav23-outside-"),
      );
      tempDirs.push(outside);
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.writeFile(
        path.join(outside, "bmad-help.csv"),
        "skill,display-name,phase,module,description\nescape-skill,Escaped,1-analysis,BMad Method,\n",
      );
      await fs.symlink(
        path.join(outside, "bmad-help.csv"),
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
      );

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.loaded).toBe(false);
      expect(ctx.skillsById.size).toBe(0);
    });

    it("skips customize.toml when it is a symlink escaping the project root", async () => {
      const root = await makeTempProject();
      const outside = await fs.mkdtemp(
        path.join(os.tmpdir(), "specwiki-nav23-toml-out-"),
      );
      tempDirs.push(outside);
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.mkdir(path.join(root, ".agents", "skills", "escape-agent"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        "skill,display-name,phase,module,description\n",
      );
      await fs.writeFile(
        path.join(outside, "customize.toml"),
        '[agent]\nname = "Eve"\ntitle = "Escaped"\nicon = "😈"\n',
      );
      await fs.symlink(
        path.join(outside, "customize.toml"),
        path.join(root, ".agents", "skills", "escape-agent", "customize.toml"),
      );

      const ctx = await loadNavGroupingContext(root);
      expect(ctx.loaded).toBe(true);
      expect(ctx.skillsById.has("escape-agent")).toBe(false);
    });
  });

  describe("catalog parsers", () => {
    it("parses quoted CSV fields and escaped quotes", () => {
      expect(parseCsvLine('a,"b,c","d""e"')).toEqual(["a", "b,c", 'd"e']);
    });

    it("extracts agent scalars and prefers [agent] over [workflow]", () => {
      expect(
        parseSkillCustomizeToml(
          '[workflow]\n[agent]\nname = "A"\ntitle = "B"\nicon = "C"\n',
        ),
      ).toEqual({
        isAgent: true,
        agentName: "A",
        agentTitle: "B",
        agentIcon: "C",
      });
      expect(parseSkillCustomizeToml("[workflow]\n")).toEqual({
        isAgent: false,
      });
      expect(parseSkillCustomizeToml('name = "x"\n')).toEqual({
        isAgent: false,
      });
    });

    it("rejects catalog paths that escape the project root", () => {
      expect(() => catalogPath("/tmp/project", "..", "etc")).toThrow(
        /escapes project root/,
      );
      expect(
        catalogPath("/tmp/project", "_bmad", "_config", "bmad-help.csv"),
      ).toBe(path.resolve("/tmp/project", "_bmad", "_config", "bmad-help.csv"));
    });

    it("returns empty context when catalog loading throws unexpectedly", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        "skill,display-name,phase,module,description\nx,X,1-analysis,BMad Method,\n",
      );

      const spy = vi.spyOn(log, "info").mockImplementation(() => {
        throw new Error("boom");
      });
      try {
        const ctx = await loadNavGroupingContext(root);
        expect(ctx.loaded).toBe(false);
      } finally {
        spy.mockRestore();
      }
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

  describe("BMad catalog hybrid Agent Skills grouping", () => {
    function agentSkillPages(): WikiPage[] {
      return [
        wikiPage({
          slug: "agent-pm",
          title: "PM Wiki Title",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-agent-pm/SKILL.md",
        }),
        wikiPage({
          slug: "brainstorm",
          title: "Brainstorm Wiki",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-brainstorming/SKILL.md",
        }),
        wikiPage({
          slug: "create-story",
          title: "Create Story Wiki",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-create-story/SKILL.md",
        }),
        wikiPage({
          slug: "help",
          title: "Help Wiki",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-help/SKILL.md",
        }),
        wikiPage({
          slug: "legacy",
          title: "Legacy Wiki",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-legacy-skill/SKILL.md",
        }),
        wikiPage({
          slug: "uncat",
          title: "Zebra Uncatalogued",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-skill/SKILL.md",
        }),
        wikiPage({
          slug: "uncat-b",
          title: "Alpha Uncatalogued",
          category: "agent-skills",
          sourcePath: ".agents/skills/mystery-skill/SKILL.md",
        }),
      ];
    }

    it("uses hybrid order, labels, and L4 titles when catalog is loaded", async () => {
      const ctx = await loadNavGroupingContext(SAMPLE_PROJECT);
      // Duplicate pages so each hybrid bucket has ≥2 members (avoids singleton promotion).
      const pages = [
        ...agentSkillPages(),
        wikiPage({
          slug: "agent-pm-2",
          title: "PM Second",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-agent-pm/README.md",
        }),
        wikiPage({
          slug: "brainstorm-2",
          title: "Brainstorm Second",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-brainstorming/README.md",
        }),
        wikiPage({
          slug: "create-story-2",
          title: "Create Story Second",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-create-story/README.md",
        }),
        wikiPage({
          slug: "help-2",
          title: "Help Second",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-help/README.md",
        }),
        wikiPage({
          slug: "legacy-2",
          title: "Legacy Second",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-legacy-skill/README.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "agent-skills",
        indexBuild: true,
        context: ctx,
      });

      expect(result.subgroups.map((sg) => sg.key)).toEqual([
        "your-team",
        "analysis",
        "implementation",
        "core-utilities",
        "deprecated",
        "uncatalogued",
      ]);
      expect(result.subgroups.map((sg) => sg.label)).toEqual([
        "Your team",
        "Analysis",
        "Implementation",
        "Core utilities",
        "Deprecated",
        "Uncatalogued",
      ]);

      const yourTeam = result.subgroups.find((sg) => sg.key === "your-team")!;
      expect(
        yourTeam.pages.every((p) => p.title === "📋 John — Product Manager"),
      ).toBe(true);

      const analysis = result.subgroups.find((sg) => sg.key === "analysis")!;
      expect(
        analysis.pages.every((p) => p.title === "Brainstorm Project"),
      ).toBe(true);

      const impl = result.subgroups.find((sg) => sg.key === "implementation")!;
      expect(impl.pages.every((p) => p.title === "Create Story")).toBe(true);

      const core = result.subgroups.find((sg) => sg.key === "core-utilities")!;
      expect(core.pages.every((p) => p.title === "BMad Help")).toBe(true);

      const deprecated = result.subgroups.find(
        (sg) => sg.key === "deprecated",
      )!;
      expect(deprecated.pages.map((p) => p.slug).sort()).toEqual([
        "legacy",
        "legacy-2",
      ]);

      const uncat = result.subgroups.find((sg) => sg.key === "uncatalogued")!;
      expect(uncat.pages.map((p) => p.title)).toEqual([
        "Alpha Uncatalogued",
        "Zebra Uncatalogued",
      ]);
    });

    it("falls back to L0 path grouping when catalog is not loaded", () => {
      const pages = [
        wikiPage({
          slug: "a",
          title: "A",
          category: "agent-skills",
          sourcePath: ".agents/skills/team-a/skill-a/SKILL.md",
        }),
        wikiPage({
          slug: "b",
          title: "B",
          category: "agent-skills",
          sourcePath: ".agents/skills/team-a/skill-b/SKILL.md",
        }),
        wikiPage({
          slug: "c",
          title: "C",
          category: "agent-skills",
          sourcePath: ".agents/skills/team-b/skill-c/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "agent-skills",
        indexBuild: true,
        context: { loaded: false, skillsById: new Map() },
      });

      expect(result.subgroups.map((sg) => sg.label)).toEqual(["Team A"]);
      expect(result.pages.map((p) => p.slug)).toEqual(["c"]);
    });

    it("ignores catalog context for non-agent-skills categories", async () => {
      const ctx = await loadNavGroupingContext(SAMPLE_PROJECT);
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
        context: ctx,
      });

      expect(result.subgroups[0].label).toBe("Team A");
      expect(result.subgroups.map((sg) => sg.key)).not.toContain("your-team");
    });

    it("promotes singleton hybrid subgroups", async () => {
      const ctx = await loadNavGroupingContext(SAMPLE_PROJECT);
      const pages = [
        wikiPage({
          slug: "agent-pm",
          title: "PM",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-agent-pm/SKILL.md",
        }),
        wikiPage({
          slug: "brainstorm",
          title: "Brainstorm",
          category: "agent-skills",
          sourcePath: ".agents/skills/bmad-brainstorming/SKILL.md",
        }),
      ];

      const result = buildCategoryNavSubgroups(pages, {
        categoryKey: "agent-skills",
        indexBuild: true,
        context: ctx,
      });

      expect(result.hasSubgroups).toBe(false);
      expect(result.pages).toHaveLength(2);
      expect(result.pages.map((p) => p.title)).toEqual(
        expect.arrayContaining([
          "📋 John — Product Manager",
          "Brainstorm Project",
        ]),
      );
    });

    it("places paths outside .agents/skills into Uncatalogued under hybrid mode", () => {
      const result = buildCategoryNavSubgroups(
        [
          wikiPage({
            slug: "odd-a",
            title: "Odd A",
            category: "agent-skills",
            sourcePath: "elsewhere/odd-a.md",
          }),
          wikiPage({
            slug: "odd-b",
            title: "Odd B",
            category: "agent-skills",
            sourcePath: "elsewhere/odd-b.md",
          }),
        ],
        {
          categoryKey: "agent-skills",
          indexBuild: true,
          context: { loaded: true, skillsById: new Map() },
        },
      );

      expect(result.subgroups.map((sg) => sg.key)).toEqual(["uncatalogued"]);
      expect(result.subgroups[0].pages.map((p) => p.slug)).toEqual([
        "odd-a",
        "odd-b",
      ]);
    });

    it("maps planning, solutioning, and unrecognized CSV rows to hybrid buckets", () => {
      const skillsById = new Map([
        [
          "plan-skill",
          {
            skillId: "plan-skill",
            isAgent: false,
            inCsv: true,
            phase: "2-planning",
            displayName: "Plan It",
            module: "BMad Method",
          },
        ],
        [
          "solution-skill",
          {
            skillId: "solution-skill",
            isAgent: false,
            inCsv: true,
            phase: "3-solutioning",
            displayName: "Solve It",
            module: "BMad Method",
          },
        ],
        [
          "weird-skill",
          {
            skillId: "weird-skill",
            isAgent: false,
            inCsv: true,
            phase: "9-unknown",
            displayName: "Weird",
            module: "BMad Method",
          },
        ],
      ]);

      const result = buildCategoryNavSubgroups(
        [
          wikiPage({
            slug: "plan",
            title: "Plan Wiki",
            category: "agent-skills",
            sourcePath: ".agents/skills/plan-skill/SKILL.md",
          }),
          wikiPage({
            slug: "plan-2",
            title: "Plan Wiki 2",
            category: "agent-skills",
            sourcePath: ".agents/skills/plan-skill/README.md",
          }),
          wikiPage({
            slug: "sol",
            title: "Sol Wiki",
            category: "agent-skills",
            sourcePath: ".agents/skills/solution-skill/SKILL.md",
          }),
          wikiPage({
            slug: "sol-2",
            title: "Sol Wiki 2",
            category: "agent-skills",
            sourcePath: ".agents/skills/solution-skill/README.md",
          }),
          wikiPage({
            slug: "weird",
            title: "Weird Wiki",
            category: "agent-skills",
            sourcePath: ".agents/skills/weird-skill/SKILL.md",
          }),
          wikiPage({
            slug: "weird-2",
            title: "Weird Wiki 2",
            category: "agent-skills",
            sourcePath: ".agents/skills/weird-skill/README.md",
          }),
        ],
        {
          categoryKey: "agent-skills",
          indexBuild: true,
          context: { loaded: true, skillsById },
        },
      );

      expect(result.subgroups.map((sg) => sg.key)).toEqual([
        "planning",
        "solutioning",
        "core-utilities",
      ]);
      expect(result.subgroups[0].pages[0].title).toBe("Plan It");
      expect(result.subgroups[1].pages[0].title).toBe("Solve It");
      expect(result.subgroups[2].pages[0].title).toBe("Weird");
    });

    it("omits agent icon when missing without breaking name—title format", async () => {
      const root = await makeTempProject();
      await fs.mkdir(path.join(root, "_bmad", "_config"), { recursive: true });
      await fs.mkdir(path.join(root, ".agents", "skills", "bmad-agent-ux"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, "_bmad", "_config", "bmad-help.csv"),
        [
          "module,skill,display-name,menu-code,description,action,args,phase,preceded-by,followed-by,required,output-location,outputs",
          "BMad Method,_meta,,,,,,,,,false,,",
        ].join("\n"),
      );
      await fs.writeFile(
        path.join(root, ".agents", "skills", "bmad-agent-ux", "customize.toml"),
        '[agent]\nname = "Sally"\ntitle = "UX Designer"\n',
      );

      const ctx = await loadNavGroupingContext(root);
      const result = buildCategoryNavSubgroups(
        [
          wikiPage({
            slug: "ux",
            title: "UX Wiki",
            category: "agent-skills",
            sourcePath: ".agents/skills/bmad-agent-ux/SKILL.md",
          }),
          wikiPage({
            slug: "ux-2",
            title: "UX Wiki 2",
            category: "agent-skills",
            sourcePath: ".agents/skills/bmad-agent-ux/extra.md",
          }),
        ],
        {
          categoryKey: "agent-skills",
          indexBuild: true,
          context: ctx,
        },
      );

      expect(result.subgroups[0].pages[0].title).toBe("Sally — UX Designer");
    });
  });
});
