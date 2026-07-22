import type { WikiPage } from "../../types.js";
import {
  loadNavGroupingContext,
  type AgentSkillCatalogEntry,
  type NavGroupingContext,
} from "./nav-grouping-catalog.js";

export type { AgentSkillCatalogEntry, NavGroupingContext };
export { loadNavGroupingContext };

export interface NavPage {
  title: string;
  slug: string;
  href: string;
  sourcePath: string;
}

export interface NavSubgroup {
  key: string;
  label: string;
  pageCount: number;
  collapsible: boolean;
  open: boolean;
  pages: NavPage[];
  subgroups?: NavSubgroup[];
}

export interface CategoryNavGroupingResult {
  pages: NavPage[];
  subgroups: NavSubgroup[];
  hasSubgroups: boolean;
}

export interface BuildCategoryNavSubgroupsOptions {
  categoryKey: string;
  activePageSlug?: string;
  activeSourcePath?: string;
  /** When true, multi-page subgroups start collapsed (index view). */
  indexBuild?: boolean;
  context?: NavGroupingContext;
}

const HYBRID_GROUPS = [
  { key: "your-team", label: "Your team" },
  { key: "analysis", label: "Analysis" },
  { key: "planning", label: "Planning" },
  { key: "solutioning", label: "Solutioning" },
  { key: "implementation", label: "Implementation" },
  { key: "core-utilities", label: "Core utilities" },
  { key: "deprecated", label: "Deprecated" },
  { key: "uncatalogued", label: "Uncatalogued" },
] as const;

type HybridGroupKey = (typeof HYBRID_GROUPS)[number]["key"];

const CATEGORY_PATH_PREFIXES: Record<string, string> = {
  "cursor-rules": ".cursor/rules/",
  "cursor-skills": ".cursor/skills/",
  "agent-skills": ".agents/skills/",
  "bmad-output": "_bmad-output/",
  specs: "specs/",
  spec: "spec/",
  openspec: "openspec/",
  kiro: ".kiro/",
  "docs-specs": "docs/specs/",
  plans: "docs/plans/",
  adr: "docs/adr/",
  requirements: "requirements/",
  github: ".github/",
  root: "",
};

const FOLDER_LABELS: Record<string, string> = {
  planning: "Planning",
  "planning-artifacts": "Planning",
  "implementation-artifacts": "Implementation Stories",
  "implementation-stories": "Implementation Stories",
  "epic-context": "Epic Context",
  discovery: "Discovery",
  research: "Research",
  other: "Other",
};

const STORY_FILENAME_PATTERN = /^(\d+)-(\d+)-/;

function storyNumbers(sourcePath: string): { epic: number; story: number } {
  const filename = sourcePath.split("/").pop() ?? sourcePath;
  const match = filename.match(STORY_FILENAME_PATTERN);
  return {
    epic: parseInt(match?.[1] ?? "0", 10),
    story: parseInt(match?.[2] ?? "0", 10),
  };
}

interface MutableSubgroupNode {
  key: string;
  label: string;
  pages: NavPage[];
  children: Map<string, MutableSubgroupNode>;
  order: number;
}

let subgroupOrderCounter = 0;

export function buildCategoryNavSubgroups(
  pages: WikiPage[],
  options: BuildCategoryNavSubgroupsOptions,
): CategoryNavGroupingResult {
  subgroupOrderCounter = 0;

  if (
    options.categoryKey === "agent-skills" &&
    options.context?.loaded === true
  ) {
    return buildHybridAgentSkillsGrouping(pages, options);
  }

  const rootPages: NavPage[] = [];
  const rootChildren = new Map<string, MutableSubgroupNode>();

  for (const page of pages) {
    const navPage = toNavPage(page);
    const segments = resolveSubgroupSegments(
      page.sourcePath,
      options.categoryKey,
    );

    if (segments.length === 0) {
      rootPages.push(navPage);
      continue;
    }

    insertIntoTree(rootChildren, segments, navPage);
  }

  if (options.categoryKey === "bmad-output") {
    sortImplementationStoryPages(rootChildren);
  }

  const subgroups = finalizeSubgroups(rootChildren, options);
  const promotedPages = [...rootPages, ...subgroups.rootPromoted];

  const visibleSubgroups = subgroups.subgroups;
  const hasSubgroups = visibleSubgroups.length > 0;

  return {
    pages: promotedPages,
    subgroups: visibleSubgroups,
    hasSubgroups,
  };
}

function buildHybridAgentSkillsGrouping(
  pages: WikiPage[],
  options: BuildCategoryNavSubgroupsOptions,
): CategoryNavGroupingResult {
  const skillsById = options.context?.skillsById ?? new Map();
  /** phase → skillId ("" for orphans) → wiki pages */
  const buckets = new Map<HybridGroupKey, Map<string, WikiPage[]>>();

  for (const page of pages) {
    const skillId = agentSkillIdFromPath(page.sourcePath);
    const entry = skillId ? skillsById.get(skillId) : undefined;
    const groupKey = resolveHybridGroupKey(entry);
    const skillKey = skillId ?? "";
    let phaseSkills = buckets.get(groupKey);
    if (!phaseSkills) {
      phaseSkills = new Map();
      buckets.set(groupKey, phaseSkills);
    }
    const list = phaseSkills.get(skillKey) ?? [];
    list.push(page);
    phaseSkills.set(skillKey, list);
  }

  const rootChildren = new Map<string, MutableSubgroupNode>();
  for (const group of HYBRID_GROUPS) {
    const phaseSkills = buckets.get(group.key);
    if (!phaseSkills || phaseSkills.size === 0) {
      continue;
    }

    const phaseNode: MutableSubgroupNode = {
      key: group.key,
      label: group.label,
      pages: [],
      children: new Map(),
      order: subgroupOrderCounter++,
    };

    const skillEntries = [...phaseSkills.entries()].sort(
      ([idA, pagesA], [idB, pagesB]) => {
        const labelA = resolveHybridSkillLabel(
          idA,
          pagesA[0],
          skillsById.get(idA),
        );
        const labelB = resolveHybridSkillLabel(
          idB,
          pagesB[0],
          skillsById.get(idB),
        );
        return labelA.localeCompare(labelB, undefined, { sensitivity: "base" });
      },
    );

    for (const [skillKey, skillPages] of skillEntries) {
      const entry = skillKey ? skillsById.get(skillKey) : undefined;

      // Paths outside .agents/skills/ stay as direct Uncatalogued leaves.
      if (!skillKey) {
        for (const page of skillPages) {
          phaseNode.pages.push(toNavPage(page));
        }
        continue;
      }

      const skillLabel = resolveHybridSkillLabel(
        skillKey,
        skillPages[0],
        entry,
      );

      // Single-page skills: L4 title on the phase leaf (no L2 wrapper).
      if (skillPages.length === 1) {
        phaseNode.pages.push(
          toNavPage(
            skillPages[0],
            resolveAgentSkillTitle(skillPages[0], entry),
          ),
        );
        continue;
      }

      const nestedPages = skillPages
        .map((page) => toNavPage(page))
        .sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
        );

      phaseNode.children.set(skillKey, {
        key: `${group.key}/${skillKey}`,
        label: skillLabel,
        pages: nestedPages,
        children: new Map(),
        order: subgroupOrderCounter++,
      });
    }

    phaseNode.pages.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );

    rootChildren.set(group.key, phaseNode);
  }

  const subgroups = finalizeSubgroups(rootChildren, options);
  return {
    pages: subgroups.rootPromoted,
    subgroups: subgroups.subgroups,
    hasSubgroups: subgroups.subgroups.length > 0,
  };
}

function resolveHybridSkillLabel(
  skillId: string,
  page: WikiPage,
  entry: AgentSkillCatalogEntry | undefined,
): string {
  if (!skillId) {
    return page.title;
  }

  if (entry?.isAgent && entry.agentName && entry.agentTitle) {
    return resolveAgentSkillTitle(page, entry);
  }

  if (entry?.displayName) {
    return entry.displayName;
  }

  // Stable label for uncatalogued multi-page skills (not first-page wiki title).
  return humanizeFolderLabel(skillId, [skillId]);
}

function agentSkillIdFromPath(sourcePath: string): string | null {
  const normalized = normalizePath(sourcePath);
  const prefix = ".agents/skills/";
  if (!normalized.startsWith(prefix)) {
    return null;
  }
  const skillId = normalized.slice(prefix.length).split("/")[0];
  return skillId || null;
}

function resolveHybridGroupKey(
  entry: AgentSkillCatalogEntry | undefined,
): HybridGroupKey {
  if (entry?.isAgent) {
    return "your-team";
  }

  if (entry?.description?.toLowerCase().includes("deprecated")) {
    return "deprecated";
  }

  switch (entry?.phase) {
    case "1-analysis":
      return "analysis";
    case "2-planning":
      return "planning";
    case "3-solutioning":
      return "solutioning";
    case "4-implementation":
      return "implementation";
    default:
      break;
  }

  if (entry?.module === "Core" || entry?.phase === "anytime") {
    return "core-utilities";
  }

  if (entry?.inCsv) {
    return "core-utilities";
  }

  return "uncatalogued";
}

function resolveAgentSkillTitle(
  page: WikiPage,
  entry: AgentSkillCatalogEntry | undefined,
): string {
  if (entry?.isAgent && entry.agentName && entry.agentTitle) {
    return entry.agentIcon
      ? `${entry.agentIcon} ${entry.agentName} — ${entry.agentTitle}`
      : `${entry.agentName} — ${entry.agentTitle}`;
  }

  if (entry?.displayName) {
    return entry.displayName;
  }

  return page.title;
}

function toNavPage(page: WikiPage, titleOverride?: string): NavPage {
  return {
    title: titleOverride ?? page.title,
    slug: page.slug,
    href: `${page.slug}.html`,
    sourcePath: page.sourcePath,
  };
}

function normalizePath(sourcePath: string): string {
  return sourcePath.replace(/\\/g, "/");
}

function resolveSubgroupSegments(
  sourcePath: string,
  categoryKey: string,
): string[] {
  const normalized = normalizePath(sourcePath);

  if (categoryKey === "bmad-output") {
    const bmadSegments = resolveBmadOutputSegments(normalized);
    if (bmadSegments !== null) {
      return bmadSegments;
    }
  }

  return resolveL0Segments(normalized, categoryKey);
}

function resolveBmadOutputSegments(normalized: string): string[] | null {
  if (!normalized.startsWith("_bmad-output/")) {
    return null;
  }

  const relative = normalized.slice("_bmad-output/".length);
  const dirParts = relative.split("/");
  const filename = dirParts.pop() ?? "";

  if (dirParts[0] === "planning-artifacts" || dirParts[0] === "planning") {
    if (dirParts[0] === "planning-artifacts") {
      const childKey = dirParts[1] ?? "other";
      return ["planning", childKey];
    }
    if (dirParts.length === 1) {
      return ["planning"];
    }
    return ["planning", dirParts[1]];
  }

  if (dirParts[0] === "implementation-artifacts") {
    if (dirParts.length === 1 && filename.startsWith("epic-")) {
      return ["epic-context"];
    }

    const storyMatch = filename.match(STORY_FILENAME_PATTERN);
    if (storyMatch) {
      const epicNum = storyMatch[1];
      return ["implementation-stories", `epic-${epicNum}`];
    }

    if (dirParts.length > 1) {
      return resolveL0Segments(normalized, "bmad-output");
    }

    return ["other"];
  }

  return null;
}

function resolveL0Segments(normalized: string, categoryKey: string): string[] {
  const prefix = CATEGORY_PATH_PREFIXES[categoryKey];

  if (categoryKey === "other") {
    const parts = normalized.split("/");
    if (parts.length <= 1) {
      return [];
    }
    return parts.slice(0, Math.min(2, parts.length - 1));
  }

  if (prefix === undefined) {
    return [];
  }

  if (prefix === "") {
    const parts = normalized.split("/");
    if (parts.length <= 1) {
      return [];
    }
    return parts.slice(0, Math.min(2, parts.length - 1));
  }

  if (!normalized.startsWith(prefix)) {
    return [];
  }

  const relative = normalized.slice(prefix.length);
  const dirParts = relative.split("/");
  dirParts.pop();

  if (dirParts.length === 0) {
    return [];
  }

  return dirParts.slice(0, 2);
}

function insertIntoTree(
  root: Map<string, MutableSubgroupNode>,
  segments: string[],
  page: NavPage,
): void {
  const capped = segments.slice(0, 2);
  let current = root;
  let path: string[] = [];

  for (let i = 0; i < capped.length; i++) {
    const segment = capped[i];
    path = [...path, segment];
    const key = path.join("/");

    if (!current.has(segment)) {
      current.set(segment, {
        key,
        label: humanizeFolderLabel(segment, path),
        pages: [],
        children: new Map(),
        order: subgroupOrderCounter++,
      });
    }

    const node = current.get(segment)!;

    if (i === capped.length - 1) {
      node.pages.push(page);
    } else {
      current = node.children;
    }
  }
}

function humanizeFolderLabel(segment: string, path: string[]): string {
  if (segment.startsWith("epic-")) {
    const num = segment.slice("epic-".length);
    return `Epic ${num}`;
  }

  if (FOLDER_LABELS[segment]) {
    return FOLDER_LABELS[segment];
  }

  if (path[0] === "planning" && path.length === 2) {
    return (
      FOLDER_LABELS[segment] ??
      segment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );
  }

  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function sortImplementationStoryPages(
  root: Map<string, MutableSubgroupNode>,
): void {
  const implNode = root.get("implementation-stories");
  if (!implNode) {
    return;
  }

  const epicEntries = [...implNode.children.entries()].sort(([, a], [, b]) => {
    const epicA = parseInt(a.key.match(/epic-(\d+)/)?.[1] ?? "0", 10);
    const epicB = parseInt(b.key.match(/epic-(\d+)/)?.[1] ?? "0", 10);
    if (epicA !== epicB) {
      return epicA - epicB;
    }
    return a.order - b.order;
  });

  implNode.children = new Map(epicEntries);

  for (const [, epicNode] of epicEntries) {
    epicNode.pages.sort((a, b) => {
      const numsA = storyNumbers(a.sourcePath);
      const numsB = storyNumbers(b.sourcePath);
      if (numsA.epic !== numsB.epic) {
        return numsA.epic - numsB.epic;
      }
      return numsA.story - numsB.story;
    });
  }
}

interface FinalizeResult {
  promoted: NavPage[];
  subgroup?: NavSubgroup;
}

function finalizeSubgroups(
  nodes: Map<string, MutableSubgroupNode>,
  options: BuildCategoryNavSubgroupsOptions,
): { subgroups: NavSubgroup[]; rootPromoted: NavPage[] } {
  const result: NavSubgroup[] = [];
  const rootPromoted: NavPage[] = [];

  const sortedNodes = [...nodes.values()].sort((a, b) => a.order - b.order);

  for (const node of sortedNodes) {
    const finalized = finalizeNode(node, options);
    rootPromoted.push(...finalized.promoted);
    if (finalized.subgroup) {
      result.push(finalized.subgroup);
    }
  }

  return { subgroups: result, rootPromoted };
}

function finalizeNode(
  node: MutableSubgroupNode,
  options: BuildCategoryNavSubgroupsOptions,
): FinalizeResult {
  const promoted: NavPage[] = [...node.pages];
  const childSubgroups: NavSubgroup[] = [];

  const sortedChildren = [...node.children.values()].sort(
    (a, b) => a.order - b.order,
  );

  for (const child of sortedChildren) {
    const finalizedChild = finalizeNode(child, options);
    promoted.push(...finalizedChild.promoted);
    if (finalizedChild.subgroup) {
      childSubgroups.push(finalizedChild.subgroup);
    }
  }

  const totalPageCount =
    promoted.length + childSubgroups.reduce((sum, sg) => sum + sg.pageCount, 0);

  if (totalPageCount === 0) {
    return { promoted: [] };
  }

  if (totalPageCount === 1 && promoted.length === 1) {
    return { promoted };
  }

  const containsActive = nodeOrChildrenContainActive(
    promoted,
    childSubgroups,
    options,
  );
  const collapsible = totalPageCount > 1;

  const subgroup: NavSubgroup = {
    key: node.key,
    label: node.label,
    pageCount: totalPageCount,
    collapsible,
    open: containsActive,
    pages: promoted,
  };

  if (childSubgroups.length > 0) {
    subgroup.subgroups = childSubgroups;
    applyIndexOpenState(subgroup, options);
  }

  if (options.indexBuild && collapsible && !containsActive) {
    subgroup.open = false;
  }

  return { promoted: [], subgroup };
}

function applyIndexOpenState(
  subgroup: NavSubgroup,
  options: BuildCategoryNavSubgroupsOptions,
): void {
  if (!options.indexBuild) {
    return;
  }

  for (const child of subgroup.subgroups ?? []) {
    const childActive = subgroupContainsActiveInChild(child, options);
    if (child.collapsible && !childActive) {
      child.open = false;
    }
    applyIndexOpenState(child, options);
  }
}

function nodeOrChildrenContainActive(
  pages: NavPage[],
  childSubgroups: NavSubgroup[],
  options: BuildCategoryNavSubgroupsOptions,
): boolean {
  if (!options.activePageSlug && !options.activeSourcePath) {
    return false;
  }

  for (const page of pages) {
    if (
      page.slug === options.activePageSlug ||
      page.sourcePath === options.activeSourcePath
    ) {
      return true;
    }
  }

  for (const child of childSubgroups) {
    if (subgroupContainsActiveInChild(child, options)) {
      return true;
    }
  }

  return false;
}

function subgroupContainsActiveInChild(
  subgroup: NavSubgroup,
  options: Pick<
    BuildCategoryNavSubgroupsOptions,
    "activePageSlug" | "activeSourcePath"
  >,
): boolean {
  if (!options.activePageSlug && !options.activeSourcePath) {
    return false;
  }

  for (const page of subgroup.pages) {
    if (
      page.slug === options.activePageSlug ||
      page.sourcePath === options.activeSourcePath
    ) {
      return true;
    }
  }

  for (const child of subgroup.subgroups ?? []) {
    if (subgroupContainsActiveInChild(child, options)) {
      return true;
    }
  }

  return false;
}

export interface SubgroupTrailSegment {
  key: string;
  label: string;
}

/**
 * Walk finalized category subgroups and return the ordered ancestor trail
 * (outer → inner) for the active page. Does not include the page itself.
 */
export function resolveActiveSubgroupTrail(
  subgroups: NavSubgroup[],
  options: Pick<
    BuildCategoryNavSubgroupsOptions,
    "activePageSlug" | "activeSourcePath"
  >,
): SubgroupTrailSegment[] {
  const trail: SubgroupTrailSegment[] = [];

  function walk(nodes: NavSubgroup[]): boolean {
    for (const node of nodes) {
      if (!subgroupContainsActiveInChild(node, options)) {
        continue;
      }
      trail.push({ key: node.key, label: node.label });
      if (node.subgroups?.length) {
        walk(node.subgroups);
      }
      return true;
    }
    return false;
  }

  walk(subgroups);
  return trail;
}

/** Exported for unit tests — maps category keys to path strip prefixes. */
export function categoryPathPrefix(categoryKey: string): string | undefined {
  return CATEGORY_PATH_PREFIXES[categoryKey];
}

/** Exported for unit tests — humanizes a folder segment. */
export function humanizeSegment(segment: string): string {
  return humanizeFolderLabel(segment, [segment]);
}
