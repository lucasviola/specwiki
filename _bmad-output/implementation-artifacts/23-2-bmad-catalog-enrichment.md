---
baseline_commit: 4f5f0d315589f52372d31c44020f877bd8d6bd94
---

# Story 23.2: BMad Catalog Enrichment

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a BMad Method user,
I want Agent Skills grouped by team personas and SDLC phase with human labels,
so that the drawer reflects how I think about the workflow, not folder names.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project . --output /tmp/specwiki-nav23-bmad` — under **Agent Skills**, the nav view model shows **Your team** (persona titles with icons) first, then phase groups (Analysis → Planning → Solutioning → Implementation → Core utilities → Deprecated → Uncatalogued) with CSV display names on workflow pages. Missing CSV projects still get S23.1 L0 path grouping only.

**Binds:** FR-033 (proposed extension) | **Depends:** S23.1 | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **AD:** AD-4, AD-6, AD-8, AD-11

## Acceptance Criteria

### Functional

1. `loadNavGroupingContext(projectRoot)` **loads** BMad catalog data when present:
   - Read `{projectRoot}/_bmad/_config/bmad-help.csv` if it exists
   - Scan `{projectRoot}/.agents/skills/*/customize.toml` for `[agent]` vs `[workflow]` and agent `name` / `title` / `icon`
   - Return `NavGroupingContext` with `loaded: true` and skill-lookup maps when CSV was found and parsed; otherwise `loaded: false` (empty maps)
   - Load **once** per HTML generation (already wired via `writeHtmlWiki` → renderer). Do not re-read files inside `buildCategoryNavSubgroups`.
2. When `categoryKey === "agent-skills"` **and** `context?.loaded === true`, `buildCategoryNavSubgroups` uses **hybrid L1/L2 grouping** instead of L0 path segments for that category. Non–`agent-skills` categories ignore catalog context (keep L0 / BMAD L3).
3. **Hybrid subgroup order** (fixed; omit empty groups):
   1. Your team
   2. Analysis (`phase: 1-analysis`)
   3. Planning (`2-planning`)
   4. Solutioning (`3-solutioning`)
   5. Implementation (`4-implementation`)
   6. Core utilities (`module: Core` **or** `phase: anytime`)
   7. Deprecated (CSV `description` contains `DEPRECATED`, case-insensitive)
   8. Uncatalogued (skill folder not in CSV and not `[agent]`)
4. **Membership rules** (resolve skill id = first path segment after `.agents/skills/`):
   - `[agent]` in that skill’s `customize.toml` → **Your team** (even if skill is absent from CSV)
   - Else if CSV row marks Deprecated → **Deprecated**
   - Else if CSV `phase` is `1-analysis` / `2-planning` / `3-solutioning` / `4-implementation` → matching phase group
   - Else if CSV `module` is `Core` **or** `phase` is `anytime` → **Core utilities**
   - Else if skill appears in CSV but phase/module are empty/unrecognized → **Core utilities** (single defensive bucket; do not invent new top-level groups)
   - Else → **Uncatalogued**
5. **Multi-row CSV skills:** when multiple CSV rows share the same `skill` value, pick **one** stable row for membership + display-name:
   - Prefer a row with non-empty `phase` that is an SDLC phase (`1-analysis`…`4-implementation`) over `anytime`
   - Prefer `module` containing `BMad Method` (or non-`Core`) over `Core` when phases tie
   - Skip `_meta` rows and rows with empty `skill`
   - Deterministic: same CSV always yields the same membership
6. **L4 labels:**
   - Workflow / catalogued pages: use CSV `display-name` as `NavPage.title` when present; else keep wiki page title
   - Agent pages: `NavPage.title` = `` `{icon} {name} — {title}` `` from TOML `[agent]` when all three (or name+title) are available; omit missing icon without breaking format; else keep wiki page title
   - Subgroup **labels** are the human names in AC #3 (e.g. `Your team`, `Analysis`), not folder names
   - Subgroup **keys** are stable slug fragments: `your-team`, `analysis`, `planning`, `solutioning`, `implementation`, `core-utilities`, `deprecated`, `uncatalogued`
7. **Sort within each hybrid subgroup:** by display title (case-insensitive). Do not re-sort other categories’ L0/L3 page order rules.
8. **Reuse S23.1 finalization:** singleton promotion, 2-level depth cap, `collapsible` / `open` / `pageCount`, and index vs article open defaults still apply. Hybrid Agent Skills are typically **one level** of subgroups (phase buckets); do not invent a second depth unless a future rule requires it — prefer flat pages under each phase group.
9. **Graceful degradation (must not fail generate):**
   - Missing CSV → `loaded: false`; Agent Skills stay on **L0** path grouping (S23.1 behavior)
   - Missing/unreadable `customize.toml` for a skill → still group via CSV when possible; agent label falls back to page title
   - Malformed CSV line or TOML → skip that row/file; continue; never throw out of `loadNavGroupingContext` / grouping for parse errors
   - `projectRoot` omitted → no context (already true); no change to generate CLI flags
10. **No change** to Markdown wiki, discovery (`deriveCategory`), slug generation, page output paths, top-level `CATEGORY_LABELS`, templates/CSS nested disclosure (S23.3), index portal subgroup parity (S23.4), or search `subgroupLabel` (S23.5). Infer only — no required skill frontmatter or project file edits.
11. Generated wiki remains `file://`-safe: no network I/O, CDN, server, new **runtime** npm dependencies, nav state in `localStorage`/`sessionStorage`, or `fetch()` during generate or browse.
12. Mustache-escape all user-derived labels/titles (NFR-011). Do not put catalog strings into unescaped script contexts. Path-confine reads under `projectRoot` (NFR-008/009).

### Logging & diagnostics (§0.8)

13. Reuse existing verbose `output.write` / generate coverage; do **not** add a new log event type unless a failure mode truly needs it. Optional: one debug/verbose line that CSV was loaded (counts only — skills/agents found), never full file contents.
14. Do not log full CSV/TOML bodies, secrets, or entire page bodies (NFR-007).

### Quality measures

15. Unit tests in `tests/output/html/nav-grouping.test.ts` cover: CSV+TOML load → `loaded: true`; missing CSV → L0; hybrid order; agent label format; CSV display-name; Uncatalogued; Core/`anytime`; multi-row skill stability; singleton promotion under hybrid groups; non–agent-skills ignore catalog.
16. Renderer tests (optional but preferred) assert Agent Skills subgroups/labels when a populated `navGroupingContext` is passed; existing S19.5 / S23.1 flat and L0/L3 cases stay green.
17. Fixture under `tests/fixtures/sample-project` includes a **minimal** `_bmad/_config/bmad-help.csv` plus at least one `[agent]` and one `[workflow]` skill under `.agents/skills/` so unit/generate tests do not require the full self-repo catalog.
18. Complete HARNESS §0.2 quality gate passes; `src/output/html/` coverage remains ≥ 90% on touched paths.

## Tasks / Subtasks

- [x] Implement BMad catalog enrichment (AC: 1–18)
  - [x] RED: extend `tests/output/html/nav-grouping.test.ts` — replace stub-only `loadNavGroupingContext` expectation with fixture-based load; add hybrid Agent Skills cases (order, labels, Uncatalogued, degradation).
  - [x] RED: add thin sample-project (or temp-dir) fixtures: mini `bmad-help.csv`, `.agents/skills/{agent,workflow}/customize.toml` + `SKILL.md` pages.
  - [x] GREEN: expand `NavGroupingContext` with skill catalog maps; implement CSV + TOML readers (local minimal parsers — **no new runtime deps**).
  - [x] GREEN: in `buildCategoryNavSubgroups`, when `agent-skills` + `context.loaded`, build hybrid subgroups; else existing L0/L3 path.
  - [x] GREEN: apply L4 titles on `NavPage`; stable subgroup keys/labels; within-group title sort.
  - [x] GREEN: graceful skip on malformed files; missing CSV → `loaded: false`.
  - [x] REFACTOR: keep all parsing/grouping inside `nav-grouping.ts` (or a private sibling under `src/output/html/` imported only by it); renderer/`wiki.ts` stay thin — already wire `context`.
  - [x] UPDATE: `IMPLEMENTATION.md`, sprint-status; run quality gate, automated code review, QA analysis.

## Dev Notes

### UX / product intent

S23.1 shipped the grouping module + universal L0 path baseline (+ BMAD Output L3). Agent Skills on a BMad project still look like a filesystem dump of skill folders. S23.2 fills **L1/L2/L4** so the drawer matches the BMad mental model: personas first, then SDLC phases with human display names.

**Owner decisions locked (2026-07-17):**

| Topic                 | Decision                                               |
| --------------------- | ------------------------------------------------------ |
| Agent Skills axis     | Hybrid: Your team pinned first, then SDLC phase groups |
| Metadata              | Infer only — optional CSV/TOML when present            |
| Nesting               | 2 levels max (hybrid groups are typically depth-1)     |
| Singletons            | Promote — no “Misc (1)” wrappers                       |
| Agent vs Cursor       | Keep separate top-level categories                     |
| Nested `<details>` UI | **S23.3** — not this story                             |

### Inference model (this story)

| Layer | Signal                                    | S23.2                                       |
| ----- | ----------------------------------------- | ------------------------------------------- |
| L0    | Path segments                             | Fallback when CSV absent / non–agent-skills |
| L1    | `bmad-help.csv` phase/module/display-name | **In scope**                                |
| L2    | `customize.toml` `[agent]` / `[workflow]` | **In scope**                                |
| L3    | BMAD Output conventions                   | Unchanged (S23.1)                           |
| L4    | CSV/TOML display labels                   | **In scope**                                |

### Current code state (read before editing)

**`src/output/html/nav-grouping.ts` (S23.1):**

```ts
export interface NavGroupingContext {
  /** Reserved for S23.2 CSV/TOML enrichment. */
  readonly loaded: boolean;
}

export async function loadNavGroupingContext(
  _projectRoot: string,
): Promise<NavGroupingContext> {
  return { loaded: false };
}
```

- `options.context` is accepted by `buildCategoryNavSubgroups` but **never read** — S23.2 must consume it for `agent-skills`.
- L0/L3, singleton promotion, open flags, depth cap already implemented — **reuse**, do not fork a parallel tree builder for Agent Skills if you can map hybrid buckets onto the same `NavSubgroup` finalize path.

**Already wired (do not re-plumb unless broken):**

- `writeHtmlWiki` → `loadNavGroupingContext(projectRoot)` once when `projectRoot` set
- `generate` passes `projectRoot`
- `buildNavCategories` passes `context` into `buildCategoryNavSubgroups`
- Templates show static subgroup headings; nested disclosure is S23.3

### Suggested `NavGroupingContext` shape (guide)

```ts
export interface AgentSkillCatalogEntry {
  skillId: string;
  displayName?: string; // CSV display-name
  phase?: string; // e.g. "4-implementation" | "anytime"
  module?: string; // e.g. "BMad Method" | "Core"
  description?: string; // for DEPRECATED detection
  isAgent: boolean; // [agent] section present
  agentName?: string;
  agentTitle?: string;
  agentIcon?: string;
}

export interface NavGroupingContext {
  readonly loaded: boolean;
  readonly skillsById: ReadonlyMap<string, AgentSkillCatalogEntry>;
}
```

Adjust field names if clearer; keep `loaded` as the degrade switch.

### CSV contract (`_bmad/_config/bmad-help.csv`)

Header columns:

```
module,skill,display-name,menu-code,description,action,args,phase,preceded-by,followed-by,required,output-location,outputs
```

- Join key: CSV `skill` ↔ folder under `.agents/skills/{skill}/`
- Quoted fields with commas exist (e.g. `bmad-prd`) — parser must be RFC4180-aware enough for quotes
- Skip `_meta` and empty `skill`
- Do **not** use `_bmad/_config/skill-manifest.csv` (different schema)

### TOML contract (`.agents/skills/*/customize.toml`)

- `[agent]` → Your team; extract scalars `name`, `title`, `icon` (example: John / Product Manager / 📋 → `📋 John — Product Manager`)
- `[workflow]` → not Your team; display names come from CSV, not TOML
- No file in this repo has both `[agent]` and `[workflow]`; if both appear, **`[agent]` wins** for membership
- Full TOML AST not required — section detect + scalar extract is enough

### Parsers — do not add runtime deps

`package.json` has no CSV/TOML libraries. Epic 23 / AD-11: **no new runtime dependencies**. Implement minimal private helpers in `nav-grouping.ts` (or `nav-grouping-catalog.ts` sibling). Do not pull in `smol-toml`, `csv-parse`, `papaparse`, `@iarna/toml`, etc.

### Anti-patterns (prevent)

1. Putting CSV/TOML logic in `renderer.ts` / `generate.ts`
2. Failing the whole generate when one TOML is broken
3. Merging Agent Skills + Cursor Skills categories
4. Requiring SKILL.md frontmatter edits
5. Nesting `<details>` or search grouping in this story
6. Using `skill-manifest.csv` instead of `bmad-help.csv`
7. Breaking L0/L3 tests for other categories
8. Logging full catalog file contents
9. Reimplementing singleton/depth/open-state from scratch instead of reusing finalize helpers

### Out of scope (explicit)

| Defer to          | Work                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------- |
| S23.3             | Nested `<details>` partials, CSS tokens, subgroup count badges                          |
| S23.4             | Index portal subgroup parity + anchors                                                  |
| S23.5             | Search `subgroupLabel` / `searchGroupLabel`                                             |
| Never (this epic) | Unify Agent + Cursor Skills; flyouts; truncate-primary; Markdown/discovery/slug changes |

### Testing requirements

- Primary: synthetic `WikiPage[]` + temp/fixture project dirs for `loadNavGroupingContext` — do not require full self-repo generate for unit cases.
- Dogfood demo: generate against `--project .` (this repo has real CSV + agent TOMLs).
- Keep S23.1 L0/L3 / singleton / open-flag tests green.
- Quality gate: `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build`.

### Project structure notes

| Action                    | Path                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| UPDATE                    | `src/output/html/nav-grouping.ts` (primary — context + hybrid grouping + parsers)                                      |
| OPTIONAL CREATE           | `src/output/html/nav-grouping-catalog.ts` (private catalog load/parse only if file would exceed maintainability)       |
| UPDATE                    | `tests/output/html/nav-grouping.test.ts`                                                                               |
| UPDATE                    | `tests/output/html/renderer.test.ts` (Agent Skills + loaded context)                                                   |
| CREATE/UPDATE             | `tests/fixtures/sample-project/_bmad/_config/bmad-help.csv`                                                            |
| CREATE/UPDATE             | `tests/fixtures/sample-project/.agents/skills/*/customize.toml` + `SKILL.md` as needed                                 |
| UPDATE                    | `IMPLEMENTATION.md`                                                                                                    |
| UPDATE                    | `_bmad-output/implementation-artifacts/sprint-status.yaml`                                                             |
| DO NOT TOUCH (this story) | discovery, Markdown writer, nested disclosure CSS/templates beyond what already exists, `search-index.ts`, `search.js` |

### Previous story intelligence (S23.1)

- Landed in commit `8e9e216` (`feat(output): add path-based nav grouping baseline`).
- Stub test currently asserts `loaded: false` always — **must update**.
- Review fix: index portal uses `portalPages` flat list when `hasSubgroups` — do not regress that; S23.4 owns portal subgroups.
- Coverage was ~96% on `src/output/html/` — keep ≥ 90%.
- Fixture sample-project already has nested BMAD Output + Cursor Skills; Agent Skills catalog fixtures are the new gap for S23.2.

### Git intelligence

Recent relevant commits: `8e9e216` nav grouping baseline; surrounding commits are site/versioning chores. No prior story loads `bmad-help.csv` or skill `customize.toml` in `src/`.

### References

- [Source: `_bmad-output/implementation-artifacts/epic-23-navigation-drawer-hierarchy.md` — S23.2 outline, hybrid order, L1–L4]
- [Source: `_bmad-output/implementation-artifacts/epic-23-context.md` — technical decisions]
- [Source: `_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md` — deferred L1/L2/L4, module contracts]
- [Source: `_bmad-output/planning-artifacts/ux/nav-drawer-hierarchy-brief.md`]
- [Source: `src/output/html/nav-grouping.ts` — stub context + L0/L3]
- [Source: `_bmad/_config/bmad-help.csv` — real column schema]
- [Source: `.agents/skills/bmad-agent-pm/customize.toml` — `[agent]` example]
- [Source: `.agents/skills/bmad-create-story/customize.toml` — `[workflow]` example]
- [Source: `HARNESS.md` — §0.2 gate, §0.8 logging, §0.9 security]
- [Source: `_bmad-output/planning-artifacts/discovery/project-context.md` — escape, offline, deps]

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Debug Log References

### Completion Notes List

- Implemented `loadNavGroupingContext` to parse `_bmad/_config/bmad-help.csv` + `.agents/skills/*/customize.toml` into `skillsById` (no new runtime deps).
- Hybrid Agent Skills grouping: Your team → Analysis → Planning → Solutioning → Implementation → Core utilities → Deprecated → Uncatalogued with L4 CSV/TOML titles.
- Missing CSV degrades to S23.1 L0; non–agent-skills categories ignore catalog; singleton/finalize path reused.
- Sample-project fixtures + unit/renderer coverage; quality gate green (504 tests).
- Review patches: realpath confinement on CSV/TOML reads; DEPRECATED membership preserved across multi-row CSV ties.

### File List

- src/output/html/nav-grouping-catalog.ts (new)
- src/output/html/nav-grouping.ts
- src/output/html/renderer.ts
- tests/output/html/nav-grouping.test.ts
- tests/output/html/renderer.test.ts
- tests/commands/generate.test.ts
- tests/discover/specs.test.ts
- tests/fixtures/sample-project/_bmad/_config/bmad-help.csv (new)
- tests/fixtures/sample-project/.agents/skills/bmad-agent-pm/* (new)
- tests/fixtures/sample-project/.agents/skills/bmad-brainstorming/* (new)
- tests/fixtures/sample-project/.agents/skills/bmad-create-story/* (new)
- tests/fixtures/sample-project/.agents/skills/bmad-help/* (new)
- tests/fixtures/sample-project/.agents/skills/bmad-legacy-skill/* (new)
- IMPLEMENTATION.md
- .gitignore (allow sample-project `_bmad/` catalog fixture)
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/23-2-bmad-catalog-enrichment.md

## Change Log

- 2026-07-17: Implemented BMad catalog enrichment (hybrid Agent Skills nav) — ready for review.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-17  
**Review outcome:** Changes Requested → Patches applied  
**Reviewer model:** claude-sonnet-5-thinking-high (Bugbot)

### Action Items

- [x] [AI-Review][Patch] Equal-score multi-row CSV merge can keep a non-DEPRECATED description and miss Deprecated membership when a tied later row carries DEPRECATED (`nav-grouping-catalog.ts` mergeCsvRow)
- [x] [AI-Review][Patch] Catalog reads use lexical `catalogPath` only — add realpath confinement for CSV/TOML so symlinks cannot escape `projectRoot`

### Review Findings

| Severity | Location                              | Finding                                           | Triage |
| -------- | ------------------------------------- | ------------------------------------------------- | ------ |
| Med      | `nav-grouping-catalog.ts` mergeCsvRow | Tied CSV rows ignore later DEPRECATED description | Patch  |
| Med      | `nav-grouping-catalog.ts` catalogPath | No realpath confinement on catalog reads          | Patch  |

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** gpt-5.6-sol-medium  
**Review date:** 2026-07-17

### AC coverage

Strong coverage for hybrid order/labels/L4 titles, degradation to L0, singleton finalize, renderer subgroup labels, and sample-project fixtures. Partial gaps: multi-row field atomicity, symlink realpath, catalog-derived HTML injection assertion, verbose log payload assertion.

### Regression risks

- Multi-row merge non-atomic fields (stale DEPRECATED / display-name)
- Malformed `[agent]` TOML could over-classify as Your team
- Symlink-escaping catalog reads under untrusted project trees
- Universal `grouping.pages` use is intentional for L4 titles — watch category flat-page regressions

### Gaps

- Symlink escape tests; equal-score DEPRECATED membership; catalog title Mustache escape render test; verbose-gated log assertion

### Manual validation steps

1. `npm test -- tests/output/html/nav-grouping.test.ts` — catalog loading, hybrid grouping, degradation, sorting, and singleton tests pass
2. `npm test -- tests/output/html/renderer.test.ts -t "subgroup"` — renderer subgroup and legacy navigation assertions pass
3. `rm -rf /tmp/specwiki-nav23-bmad-fixture && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23-bmad-fixture` — generation completes with hybrid Agent Skills labels
4. `rg -n "Your team|Analysis|Core utilities|Deprecated" /tmp/specwiki-nav23-bmad-fixture/html` — generated navigation contains hybrid group labels
5. `rm -rf /tmp/specwiki-nav23-bmad && npm run dev generate -- --project . --output /tmp/specwiki-nav23-bmad` — dogfood generation completes with persona + SDLC grouping
6. `npm run dev open -- --project . --output /tmp/specwiki-nav23-bmad` — opens via `file://`; category disclosure works; no console errors
7. `! rg -n "Your team|Core utilities" /tmp/specwiki-nav23-bmad/wiki` — Markdown wiki has no HTML nav enrichment labels
