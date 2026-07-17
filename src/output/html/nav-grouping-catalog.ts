import fs from "node:fs/promises";
import path from "node:path";
import { log } from "../../core/Logger.js";
import {
  assertRealpathConfinedUnder,
  PathEscapeError,
} from "../../core/paths.js";

export interface AgentSkillCatalogEntry {
  skillId: string;
  displayName?: string;
  phase?: string;
  module?: string;
  description?: string;
  isAgent: boolean;
  agentName?: string;
  agentTitle?: string;
  agentIcon?: string;
  /** True when at least one non-_meta CSV row contributed to this entry. */
  inCsv: boolean;
}

export interface NavGroupingContext {
  readonly loaded: boolean;
  readonly skillsById: ReadonlyMap<string, AgentSkillCatalogEntry>;
}

const SDLC_PHASES = new Set([
  "1-analysis",
  "2-planning",
  "3-solutioning",
  "4-implementation",
]);

function emptyContext(): NavGroupingContext {
  return { loaded: false, skillsById: new Map() };
}

interface CsvSkillRow {
  module: string;
  skill: string;
  displayName: string;
  description: string;
  phase: string;
}

export async function loadNavGroupingContext(
  projectRoot: string,
): Promise<NavGroupingContext> {
  try {
    const resolvedRoot = path.resolve(projectRoot);
    const csvPath = catalogPath(
      resolvedRoot,
      "_bmad",
      "_config",
      "bmad-help.csv",
    );

    const csvText = await readConfinedFile(
      resolvedRoot,
      csvPath,
      "bmad-help.csv",
    );
    if (csvText === null) {
      return emptyContext();
    }

    const skillsById = new Map<string, AgentSkillCatalogEntry>();
    for (const row of parseBmadHelpCsv(csvText)) {
      mergeCsvRow(skillsById, row);
    }

    await enrichFromSkillTomls(resolvedRoot, skillsById);

    let agentCount = 0;
    for (const entry of skillsById.values()) {
      if (entry.isAgent) {
        agentCount += 1;
      }
    }

    log.info("output.write", {
      relativePath: "_bmad/_config/bmad-help.csv",
      skillsLoaded: skillsById.size,
      agentsFound: agentCount,
    });

    return { loaded: true, skillsById };
  } catch {
    return emptyContext();
  }
}

/** Exported for unit tests — keeps catalog reads under projectRoot. */
export function catalogPath(root: string, ...parts: string[]): string {
  const resolved = path.resolve(root, ...parts);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("catalog path escapes project root");
  }
  return resolved;
}

async function readConfinedFile(
  projectRoot: string,
  targetPath: string,
  label: string,
): Promise<string | null> {
  try {
    await assertRealpathConfinedUnder(projectRoot, targetPath, label);
  } catch (err) {
    if (err instanceof PathEscapeError) {
      return null;
    }
    throw err;
  }

  try {
    return await fs.readFile(targetPath, "utf-8");
  } catch {
    return null;
  }
}

function descriptionLooksDeprecated(description: string | undefined): boolean {
  return (description ?? "").toLowerCase().includes("deprecated");
}

function parseBmadHelpCsv(text: string): CsvSkillRow[] {
  const lines = text.split(/\r?\n/);
  const headerFields = parseCsvLine(lines[0] || "");
  const index = {
    module: headerFields.indexOf("module"),
    skill: headerFields.indexOf("skill"),
    displayName: headerFields.indexOf("display-name"),
    description: headerFields.indexOf("description"),
    phase: headerFields.indexOf("phase"),
  };

  if (index.skill < 0) {
    return [];
  }

  const rows: CsvSkillRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const fields = parseCsvLine(line);
    const skill = (fields[index.skill] || "").trim();
    if (!skill || skill === "_meta") {
      continue;
    }

    rows.push({
      module: fieldAt(fields, index.module),
      skill,
      displayName: fieldAt(fields, index.displayName),
      description: fieldAt(fields, index.description),
      phase: fieldAt(fields, index.phase),
    });
  }

  return rows;
}

function fieldAt(fields: string[], index: number): string {
  if (index < 0 || index >= fields.length) {
    return "";
  }
  return fields[index].trim();
}

/** Minimal RFC4180 line parser (quoted fields, escaped quotes). */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      fields.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  fields.push(current);
  return fields;
}

function csvRowScore(row: CsvSkillRow): number {
  let score = 0;
  if (SDLC_PHASES.has(row.phase)) {
    score += 100;
  } else if (row.phase === "anytime") {
    score += 10;
  }
  if (
    row.module.includes("BMad Method") ||
    (row.module && row.module !== "Core")
  ) {
    score += 5;
  } else if (row.module === "Core") {
    score += 1;
  }
  return score;
}

function mergeCsvRow(
  skillsById: Map<string, AgentSkillCatalogEntry>,
  row: CsvSkillRow,
): void {
  const existing = skillsById.get(row.skill);
  if (!existing) {
    skillsById.set(row.skill, {
      skillId: row.skill,
      displayName: row.displayName || undefined,
      phase: row.phase || undefined,
      module: row.module || undefined,
      description: row.description || undefined,
      isAgent: false,
      inCsv: true,
    });
    return;
  }

  const existingAsRow: CsvSkillRow = {
    module: existing.module || "",
    skill: existing.skillId,
    displayName: existing.displayName || "",
    description: existing.description || "",
    phase: existing.phase || "",
  };

  const priorDeprecatedDescription = descriptionLooksDeprecated(
    existing.description,
  )
    ? existing.description
    : undefined;

  if (csvRowScore(row) > csvRowScore(existingAsRow)) {
    if (row.displayName) {
      existing.displayName = row.displayName;
    }
    if (row.phase) {
      existing.phase = row.phase;
    }
    if (row.module) {
      existing.module = row.module;
    }
    if (row.description) {
      existing.description = row.description;
    }
  }

  // Any CSV row marking DEPRECATED wins membership, even on score ties / losses.
  if (descriptionLooksDeprecated(row.description)) {
    existing.description = row.description;
  } else if (priorDeprecatedDescription) {
    existing.description = priorDeprecatedDescription;
  }

  existing.inCsv = true;
}

async function enrichFromSkillTomls(
  projectRoot: string,
  skillsById: Map<string, AgentSkillCatalogEntry>,
): Promise<void> {
  const skillsDir = catalogPath(projectRoot, ".agents", "skills");

  try {
    await assertRealpathConfinedUnder(
      projectRoot,
      skillsDir,
      "agent skills directory",
    );
  } catch (err) {
    if (err instanceof PathEscapeError) {
      return;
    }
    throw err;
  }

  let entries: string[];
  try {
    entries = await fs.readdir(skillsDir);
  } catch {
    return;
  }

  for (const skillId of entries) {
    let tomlPath: string;
    try {
      tomlPath = catalogPath(
        projectRoot,
        ".agents",
        "skills",
        skillId,
        "customize.toml",
      );
    } catch {
      continue;
    }

    const tomlText = await readConfinedFile(
      projectRoot,
      tomlPath,
      `customize.toml (${skillId})`,
    );
    if (tomlText === null) {
      continue;
    }

    const parsed = parseSkillCustomizeToml(tomlText);
    const existing = skillsById.get(skillId);
    if (existing) {
      if (parsed.isAgent) {
        existing.isAgent = true;
        existing.agentName = parsed.agentName;
        existing.agentTitle = parsed.agentTitle;
        existing.agentIcon = parsed.agentIcon;
      }
      continue;
    }

    if (parsed.isAgent) {
      skillsById.set(skillId, {
        skillId,
        isAgent: true,
        agentName: parsed.agentName,
        agentTitle: parsed.agentTitle,
        agentIcon: parsed.agentIcon,
        inCsv: false,
      });
    }
  }
}

interface ParsedSkillToml {
  isAgent: boolean;
  agentName?: string;
  agentTitle?: string;
  agentIcon?: string;
}

/** Section detect + scalar extract — not a full TOML AST. */
export function parseSkillCustomizeToml(text: string): ParsedSkillToml {
  if (!/^\s*\[agent\]\s*$/m.test(text)) {
    return { isAgent: false };
  }

  const agentBody = extractTomlSection(text, "agent");
  return {
    isAgent: true,
    agentName: extractTomlString(agentBody, "name"),
    agentTitle: extractTomlString(agentBody, "title"),
    agentIcon: extractTomlString(agentBody, "icon"),
  };
}

function extractTomlSection(text: string, section: string): string {
  const header = new RegExp(
    String.raw`^\s*\[${section}\]\s*(?:\r?\n|$)`,
    "m",
  ).exec(text);
  if (!header) {
    return "";
  }

  const rest = text.slice(header.index + header[0].length);
  const nextHeader = rest.search(/^\s*\[[^\]]+\]\s*$/m);
  return nextHeader === -1 ? rest : rest.slice(0, nextHeader);
}

function extractTomlString(
  sectionBody: string,
  key: string,
): string | undefined {
  const pattern = new RegExp(
    String.raw`^\s*${key}\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$`,
    "m",
  );
  const match = sectionBody.match(pattern);
  const value = match?.[1] ?? match?.[2];
  return value ? value : undefined;
}
