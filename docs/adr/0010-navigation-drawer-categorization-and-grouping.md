# ADR-0010: Navigation drawer categorization and grouping

## Status

accepted

## Date

2026-07-19

## Context

Specwiki discovers markdown and `.mdc` files across a project — agent configs, BMAD artifacts, specs, ADRs, Cursor rules, and catch-all documentation — and renders them as a static HTML wiki with a left navigation drawer (desktop) and slide-in drawer (mobile).

Two distinct problems must be solved:

1. **Top-level categorization** — Which drawer section does a file belong to? Users expect "Agent Skills" and "BMAD Output" to be separate from "Cursor Rules" or "Architecture Decisions," not one undifferentiated list sorted by path.
2. **In-category grouping** — Within large categories (e.g. ~176 Agent Skills links, ~79 BMAD Output files), a flat filesystem-ordered list is unusable. Users need a **project map** that reflects workflow (SDLC phases, epics, planning vs implementation) rather than raw folder names.

Epic 19 (S19.5) solved category-level collapsible `<details>` groups. Epic 23 extended this with **intra-category subgroups** using a layered inference model.

Constraints that shaped the design:

- **Infer-only metadata** — No required frontmatter or per-file nav config; grouping must work on existing BMAD and tool layouts without authors editing skill files.
- **Static output** — All grouping is computed at `generate` time; no client-side nav tree construction or server API (ADR-0004).
- **Path confinement** — BMAD catalog reads (`bmad-help.csv`, `customize.toml`) must stay under the project root (ADR-0001).
- **HTML-only subgroups** — Markdown index (`wiki/index.md`), `llms.txt`, and CLI `--json` output remain **flat per category**; subgroup structure is an HTML presentation concern.
- **No user-configurable nav rules** — Discovery patterns (`specwiki.config.json`, `--patterns`) control _which files appear_, not *how they group.

**Why infer-only / hardcoded rules over a config-driven nav map:** Specwiki's zero-config promise applies to grouping as well as discovery. A `navGroups` block in `specwiki.config.json` would introduce a second grouping DSL to maintain, validate, and document — with no existing project layouts depending on it. Path-prefix categories and folder conventions already encode the mental model; enriching from BMAD's existing catalog files (`bmad-help.csv`, `customize.toml`) avoids asking authors to edit skill frontmatter while still yielding workflow-oriented nav for BMAD projects.

**Why max nesting depth is 2:** Owner decision in the Epic 23 UX brief — keeps native `<details>` trees scannable on mobile drawer and desktop sidebar without flyout submenus (rejected in Epic 19 UX research). Deeper folder trees are truncated rather than rendered as a third disclosure level; the Mustache templates enforce this structurally (see UI contract).

## Decision

Adopt a **two-tier navigation hierarchy** with hardcoded, path-driven rules and optional BMAD catalog enrichment:

### Tier 1 — Top-level categories (discovery time)

Every discovered file receives a **category key** via first-match path-prefix rules in `deriveCategory()` (`src/discover/specs.ts`). Categories are sorted alphabetically by human label (`CATEGORY_LABELS` in `src/config/patterns.ts`), not by key.

| Path prefix       | Category key     | Label                  |
| ----------------- | ---------------- | ---------------------- |
| (no `/`)          | `root`           | Project Root           |
| `.cursor/rules/`  | `cursor-rules`   | Cursor Rules           |
| `.cursor/skills/` | `cursor-skills`  | Cursor Skills          |
| `specs/`, `spec/` | `specs` / `spec` | Specifications         |
| `openspec/`       | `openspec`       | OpenSpec               |
| `.specs/`         | `tlc-specs`      | TLC Spec-Driven        |
| `.kiro/`          | `kiro`           | Kiro Specs             |
| `docs/specs/`     | `docs-specs`     | Documentation Specs    |
| `docs/plans/`     | `plans`          | Plans                  |
| `docs/adr/`       | `adr`            | Architecture Decisions |
| `requirements/`   | `requirements`   | Requirements           |
| `.github/`        | `github`         | GitHub                 |
| `_bmad-output/`   | `bmad-output`    | BMAD Output            |
| `.agents/skills/` | `agent-skills`   | Agent Skills           |
| anything else     | `other`          | Other                  |

**Discovery patterns** (`DEFAULT_SPEC_PATTERNS`) determine which files enter the wiki. `fast-glob` unions all inclusion patterns — array order does not imply precedence. Framework-specific globs (e.g. `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md`) remain for readability and for root-level files (`AGENTS.md`, `llms.txt`) the catch-all does not reach; the S17.1 catch-all `**/*.{md,mdc}` also matches most nested markdown the specific globs cover. Files matching no pattern are excluded entirely — they never reach categorization. Category assignment is independent of pattern order and comes solely from `deriveCategory()` path prefixes.

**Title derivation** (`deriveTitle()`) is independent of nav grouping: basename humanization with special cases for `SKILL.md`, `AGENTS.md`, `README.md`, etc.

### Tier 2 — In-category subgroups (HTML render time)

Subgroup _tree-building_ logic lives in `src/output/html/nav-grouping.ts`; classification inputs (SDLC phase, module, deprecated flag, agent identity) are computed upstream in `src/output/html/nav-grouping-catalog.ts` and consumed via `NavGroupingContext`. The renderer (`buildNavCategories` in `src/output/html/renderer.ts`) calls `buildCategoryNavSubgroups()` per category and passes the result to Mustache templates.

#### Layered inference model

| Layer  | Signal                                           | Applies to                    | Purpose                                                              |
| ------ | ------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------- |
| **L0** | Path segments (max 2 deep)                       | All categories (baseline)     | Strip category prefix → take up to 2 directory segments → build tree |
| **L1** | `_bmad/_config/bmad-help.csv`                    | Agent Skills (when CSV loads) | SDLC phase, module, display name, deprecated detection               |
| **L2** | `.agents/skills/*/customize.toml` `[agent]`      | Agent Skills                  | Persona name/title/icon → "Your team" bucket                         |
| **L3** | BMAD folder conventions + story filename pattern | BMAD Output                   | Planning vs implementation, epic grouping                            |
| **L4** | CSV display names, agent title/icon              | Agent Skills                  | Leaf link text and L2 subgroup labels (structural, not cosmetic)     |

#### L0 — Universal path-segment baseline

For every category except Agent Skills with a loaded catalog:

1. Strip the category path prefix (`CATEGORY_PATH_PREFIXES` in `nav-grouping.ts`, mirrors `deriveCategory()` prefixes).
2. Take up to **two** directory segments after the prefix as subgroup path (hard depth cap — implemented independently in `resolveL0Segments()` and `insertIntoTree()`; see Neutral consequences).
3. Build a tree via `insertIntoTree()`.
4. **Singleton promotion** — If a subgroup (or promotion chain) contains exactly one page, flatten it to a direct category link (no wrapper `<details>`).
5. **Collapsible state** — Multi-page subgroups are collapsible; `open` is true when containing the active page; on index builds, non-active subgroups start collapsed.

Known folder segments map to display labels via `FOLDER_LABELS` (e.g. `planning-artifacts` → "Planning", `epic-N` → "Epic N"). Unknown segments are title-cased kebab (`my-folder` → "My Folder").

The `other` category uses the first two path segments relative to project root (excluding filename) when no dedicated prefix applies.

#### L3 — BMAD Output enricher

When `categoryKey === "bmad-output"`, `resolveBmadOutputSegments()` overrides L0:

| Source path pattern                                      | Subgroup segments                       | Label chain                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_bmad-output/planning-artifacts/{child}/…`              | `["planning", child]`                   | Planning → Discovery / Research / …                                                                                                                                                                                                                                                                                                      |
| `_bmad-output/planning/{child}/…`                        | `["planning", child]` or `["planning"]` | Planning                                                                                                                                                                                                                                                                                                                                 |
| `_bmad-output/implementation-artifacts/epic-*.md` (root) | `["epic-context"]`                      | Epic Context                                                                                                                                                                                                                                                                                                                             |
| `_bmad-output/implementation-artifacts/{N}-{M}-*.md`     | `["implementation-stories", "epic-N"]`  | Implementation Stories → Epic N                                                                                                                                                                                                                                                                                                          |
| Non-story root files in `implementation-artifacts/`      | `["other"]`                             | Other                                                                                                                                                                                                                                                                                                                                    |
| Nested subdirs under `implementation-artifacts/`         | falls back to L0                        | path-based — **known bug:** segment key `"implementation-artifacts"` collides in label with story-file key `"implementation-stories"` (both map to "Implementation Stories" in `FOLDER_LABELS`); see [23-IMP-4](../../_bmad-output/implementation-artifacts/improvements/23-imp-4-bmad-output-implementation-stories-label-collision.md) |
| Other `_bmad-output/` paths                              | falls back to L0                        | path-based                                                                                                                                                                                                                                                                                                                               |

Story files sort by epic/story numbers parsed from the `^(\d+)-(\d+)-` filename prefix.

#### L1/L2/L4 — Agent Skills hybrid grouping

Activated only when **both** conditions hold:

- `categoryKey === "agent-skills"`
- `loadNavGroupingContext()` returns `loaded: true` (i.e. `_bmad/_config/bmad-help.csv` exists and parses)

**Catalog load** (`src/output/html/nav-grouping-catalog.ts`):

1. Read and parse `_bmad/_config/bmad-help.csv` — columns: `module`, `skill`, `display-name`, `description`, `phase`, …
2. Merge duplicate skill rows by score (SDLC phase > anytime > Core; any row with "deprecated" in description wins permanently).
3. Enrich from `.agents/skills/{skillId}/customize.toml` — detect `[agent]` section for `name`, `title`, `icon`.

**Hybrid phase buckets** (fixed display order in `HYBRID_GROUPS`):

1. Your team — `isAgent: true` from TOML
2. Analysis — `phase: 1-analysis`
3. Planning — `phase: 2-planning`
4. Solutioning — `phase: 3-solutioning`
5. Implementation — `phase: 4-implementation`
6. Core utilities — `module: Core`, `phase: anytime`, or CSV-listed skill with unrecognized phase
7. Deprecated — description contains "deprecated"
8. Uncatalogued — skill folder not in CSV, or paths outside `.agents/skills/`

**Classification precedence** in `resolveHybridGroupKey()` is `isAgent` → `deprecated` → phase → core-utilities → uncatalogued — which does **not** match the display-order numbering above. A deprecated agent persona is bucketed under **Your team**, not **Deprecated**, because the `isAgent` check short-circuits before the deprecated check runs.

Within each phase bucket:

- **Single-page skill** → direct leaf with L4 title (CSV `display-name`, or `{icon} {name} — {title}` for agents)
- **Multi-page skill** → nested L2 subgroup keyed by skill ID; pages sorted by title
- Paths outside `.agents/skills/` → Uncatalogued direct leaves

**Fallback:** If CSV is missing or fails to load, Agent Skills uses plain L0 path-segment grouping (same as Cursor Skills).

#### BMAD integration boundary

BMAD contributes through **two separate top-level categories** by design:

| BMAD artifact                 | Category          | Grouping strategy                                 |
| ----------------------------- | ----------------- | ------------------------------------------------- |
| `.agents/skills/**/SKILL.md`  | Agent Skills      | Hybrid L1/L2/L4 when catalog present; L0 fallback |
| `_bmad-output/**/*.md`        | BMAD Output       | L3 folder/story conventions                       |
| `_bmad/_config/bmad-help.csv` | (not a wiki page) | Catalog input only                                |

Other tool integrations (OpenSpec, Kiro, Cursor rules/skills, GitHub Copilot instructions) use **L0 path-segment grouping only** — no tool-specific enrichers today. Their top-level category comes solely from `deriveCategory()` path prefixes.

### UI contract

- **Category level** (Epic 19): native `<details>` per category when `pageCount > 1`; active category open on article pages; count badges.
- **Subgroup level** (Epic 23): nested `<details>` via `nav-subgroup.mustache` (L1) and `nav-subgroup-nested.mustache` (L2 max — the nested partial does not recurse into its own `subgroups`; any tree deeper than two levels would silently drop the deepest pages from rendered HTML).
- **Breadcrumbs**: `Main Page › Category › Subgroup › … › Page title` via `resolveActiveSubgroupTrail()`.
- **Search** (current): groups by top-level category label only — subgroup metadata not yet in search index (S23.5 backlog).
- **Index portal** (current): flat `portalPages` per category — subgroup parity is S23.4 backlog.

### Data flow

```
discoverSpecs(projectRoot, patterns)
  └─ deriveCategory(relativePath) → category key
  └─ deriveTitle(relativePath) → page title
parseSpecFile() → ParsedSpec
buildWiki() → WikiPage[] (slug, title, category, sourcePath, …)
writeHtmlWiki()
  └─ loadNavGroupingContext(projectRoot)  [BMAD CSV + TOML]
  └─ for each article page:
       buildNavCategories(pages, …, { navGroupingContext })  [recomputed per page]
            └─ per category: buildCategoryNavSubgroups()
            └─ Mustache → HTML nav drawer + breadcrumbs
```

Slug generation (`pageSlug` in `wiki.ts`) is path-based (`/` → `-`, lowercased) and independent of grouping.

### Explicit non-goals

- No JSON/YAML/frontmatter nav configuration.
- No runtime grouping in the browser.
- No subgroup structure in markdown index, `llms.txt`, or `--json` generate output (flat category lists only).
- No flyout submenus, search-only wayfinding, or truncate-primary patterns (rejected in Epic 19 UX research).

## Consequences

### Positive

- Large wikis read as a workflow map (SDLC phases, epics, planning folders) without authors maintaining nav metadata.
- BMAD projects get rich Agent Skills and BMAD Output grouping out of the box when standard folder layouts and `bmad-help.csv` are present.
- Graceful degradation: missing CSV → L0 path grouping; missing TOML → CSV-only enrichment; singleton promotion keeps shallow trees readable.
- Subgroup tree-building is centralized in `nav-grouping.ts` with exhaustive unit tests; catalog classification inputs live in `nav-grouping-catalog.ts`; renderer stays a thin view-model boundary.
- Tool-specific categories (OpenSpec, Kiro, ADRs, etc.) appear automatically from path prefixes when files match discovery patterns.

### Negative

- **Hardcoded rules** — Adding a new tool category or grouping enricher requires code changes to `deriveCategory()`, `CATEGORY_LABELS`, `CATEGORY_PATH_PREFIXES`, and/or `nav-grouping.ts`.
- **HTML-only subgroups** — Markdown and JSON consumers see flat category lists; parity gaps remain for index portal (S23.4) and search (S23.5).
- **BMAD coupling** — Agent Skills hybrid grouping depends on BMAD-specific files (`bmad-help.csv`, `customize.toml` layout) even though Agent Skills is a general category name.
- **Two-level cap** — Deep folder trees beyond two segments are truncated; deeply nested docs may appear under misleadingly shallow subgroups.
- **Per-page nav recompute** — `buildNavCategories()` runs for every article HTML page during `writeHtmlWiki()`, not once per generate; cost scales with page count × total wiki size.
- **Known label collision (BMAD Output)** — Nested subdirectories under `implementation-artifacts/` can produce a second top-level subgroup also titled "Implementation Stories" alongside epic-grouped story files; tracked as [23-IMP-4](../../_bmad-output/implementation-artifacts/improvements/23-imp-4-bmad-output-implementation-stories-label-collision.md).
- **Silent catalog failures** — The outer `catch` in `loadNavGroupingContext()` returns `loaded: false` without logging, so genuine parsing bugs can hide behind the same fallback path used for a legitimately missing CSV.
- **Template depth limit** — `NavSubgroup` is typed for arbitrary nesting, but `nav-subgroup-nested.mustache` does not recurse; loosening the depth cap in code without updating templates would drop pages silently.

### Neutral

- Extending a category requires updating three maps in sync: `deriveCategory()` prefixes, `CATEGORY_LABELS`, and `CATEGORY_PATH_PREFIXES`.
- Depth capping (`slice(0, 2)`) is implemented independently in `resolveL0Segments()` and `insertIntoTree()`; there is no shared `MAX_DEPTH` constant, so the two call sites can drift.
- `subgroupOrderCounter` is module-level mutable state reset at the start of each `buildCategoryNavSubgroups()` call; safe today only because category builds are synchronous and sequential — parallelizing page rendering would corrupt subgroup ordering.
- `tests/output/html/nav-grouping.test.ts` serves as the living specification for edge cases; changes to grouping rules must update tests.
- Catalog reads use path confinement per ADR-0001; failures return `loaded: false` rather than aborting generation.

## References

- [Source: src/discover/specs.ts — `deriveCategory`, `deriveTitle`]
- [Source: src/config/patterns.ts — `DEFAULT_SPEC_PATTERNS`, `CATEGORY_LABELS`]
- [Source: src/output/html/nav-grouping.ts — subgroup algorithm, L0/L3 rules, hybrid grouping]
- [Source: src/output/html/nav-grouping-catalog.ts — BMAD CSV/TOML catalog load]
- [Source: src/output/html/renderer.ts — `buildNavCategories`]
- [Source: src/output/html/templates/partials/nav-subgroup-nested.mustache — L2 template (non-recursive)]
- [Source: src/output/wiki.ts — `writeHtmlWiki`, `loadNavGroupingContext` threading]
- [Source: tests/output/html/nav-grouping.test.ts — grouping specification]
- [Source: _bmad-output/planning-artifacts/ux/nav-drawer-hierarchy-brief.md — approved UX brief]
- [Source: _bmad-output/implementation-artifacts/epic-23-navigation-drawer-hierarchy.md — epic spec]
- Bug: [_bmad-output/implementation-artifacts/improvements/23-imp-4-bmad-output-implementation-stories-label-collision.md](../../_bmad-output/implementation-artifacts/improvements/23-imp-4-bmad-output-implementation-stories-label-collision.md)
- Related: ADR-0001 (path confinement for catalog reads)
- Related: ADR-0004 (static HTML output; no runtime nav API)
- Related: ADR-0007 (`--json` flat category shape)
