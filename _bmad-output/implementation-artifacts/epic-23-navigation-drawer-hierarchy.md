# Epic 23 — Navigation Drawer Hierarchy

## Goal

Add a **human-readable second level of grouping** inside every navigation drawer category so large wikis (Agent Skills ~176 links, BMAD Output ~79 links) read like a **project map** rather than a filesystem dump — while preserving Epic 19's offline, `file://`-safe, no-storage navigation contracts.

**Audience:** Alex and other users browsing the generated HTML wiki by category, on desktop sidebar and mobile drawer.

**UX brief & canvas:** [`nav-drawer-hierarchy-brief.md`](../planning-artifacts/ux/nav-drawer-hierarchy-brief.md) · [Interactive canvas](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/nav-drawer-hierarchy.canvas.tsx)

**Builds on:** **E19 S19.5** (collapsible category navigation). Does not replace category-level disclosure — adds **intra-category** subgroups.

---

## Owner decisions (locked)

| Topic                  | Decision                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| Scope                  | All wiki categories                                                             |
| Metadata               | Infer only — no skill file edits                                                |
| Agent Skills           | **Hybrid:** Your team pinned first, then SDLC phase groups from `bmad-help.csv` |
| Nesting depth          | **2 levels** max inside a category                                              |
| Singleton subgroups    | Hide — promote single-page wrappers to direct links                             |
| Agent vs Cursor skills | Keep separate top-level categories                                              |

---

## Inference model

| Layer | Signal                                                      | Scope                         |
| ----- | ----------------------------------------------------------- | ----------------------------- |
| L0    | Path segments relative to category root                     | All categories                |
| L1    | `_bmad/_config/bmad-help.csv` (phase, module, display-name) | Agent Skills when CSV present |
| L2    | `customize.toml` `[agent]` vs `[workflow]`                  | Agent Skills                  |
| L3    | Planning vs implementation folders; epic filename prefixes  | BMAD Output                   |
| L4    | CSV display names; agent name/title/icon from TOML          | Display labels only           |

**Fallback:** L1/L2/L3 when available → else L0. Uncatalogued Agent Skills → **Uncatalogued** bucket.

### Agent Skills subgroup order

1. Your team (agents from `[agent]` blocks)
2. Analysis (`1-analysis`)
3. Planning (`2-planning`)
4. Solutioning (`3-solutioning`)
5. Implementation (`4-implementation`)
6. Core utilities (`module: Core` or `phase: anytime`)
7. Deprecated (CSV description contains DEPRECATED)
8. Uncatalogued (skill folder missing from CSV)

### BMAD Output subgroup shape (2 levels)

- **Planning** → Discovery, Research, PRD, etc. (folder under `planning-artifacts/`)
- **Implementation Stories** → Epic N (from `NN-M-` filename prefix)
- **Epic Context** → `epic-*.md` at implementation-artifacts root
- **Other** → non-standard paths via L0 fallback

---

## Stories

| Story | Summary                                                    | Depends      | Status  |
| ----- | ---------------------------------------------------------- | ------------ | ------- |
| S23.1 | Nav grouping module + universal path-segment baseline      | E19 S19.5    | review  |
| S23.2 | BMad catalog enrichment (CSV + customize.toml)             | S23.1        | review  |
| S23.3 | Nested disclosure UI (templates + CSS + route-aware state) | S23.1        | review  |
| S23.4 | Index portal parity + subgroup anchors                     | S23.3        | backlog |
| S23.5 | Search grouped by category › subgroup                      | S23.1, S19.4 | backlog |
| S23.6 | Agent Skills phase group dedup (skill-folder L2)           | S23.2        | review  |
| S23.7 | Breadcrumb subgroup parity                                 | S23.1        | review  |

---

## Story outlines

### S23.1 — Nav grouping module + path-segment baseline

**As** Alex browsing a wiki with nested folder structure,  
**I want** pages grouped by path segments inside each category,  
**so that** BMAD Output, Cursor Skills, specs, and rules are scannable without reading 79+ flat links.

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23` — drawer shows subgroup headings under BMAD Output and nested Cursor Skills folders; single-page subgroups appear as direct links.

**Binds:** FR-033 (proposed extension) | **Depends:** E19 S19.5 | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013

**Functional (summary):**

- New `src/output/html/nav-grouping.ts` with `buildCategoryNavSubgroups`, path prefix map, folder label map, 2-level depth cap, singleton flattening
- `buildNavCategories` in renderer consumes subgroups; categories without grouping keep flat page lists
- Unit tests for path grouping, BMAD Output conventions, singleton promotion, active-page open state
- No change to Markdown output, discovery, or slug paths

### S23.2 — BMad catalog enrichment

**As** a BMad Method user,  
**I want** Agent Skills grouped by team personas and SDLC phase with human labels,  
**so that** the drawer reflects how I think about the workflow, not folder names.

**Demo path:** `npm run dev generate -- --project . --output /tmp/specwiki-nav23-bmad` — Agent Skills shows **Your team** (persona titles with icons) and phase groups with CSV display names.

**Depends:** S23.1 | **Graceful degradation:** no CSV → L0 only

**Functional (summary):**

- Load `_bmad/_config/bmad-help.csv` and per-skill `customize.toml` at HTML generation time when present
- Hybrid grouping: Your team first, then phase/module buckets per owner decision
- Labels: CSV `display-name`; agents: `{icon} {name} — {title}` from TOML
- Sort: phase order → title within group

### S23.3 — Nested disclosure UI

**As** Alex on mobile or desktop,  
**I want** subgroups to collapse like categories do today,  
**so that** I can scan group headings before expanding to page links.

**Demo path:** Open any article under Agent Skills → Implementation subgroup expanded; other subgroups collapsed.

**Depends:** S23.1 (S23.2 optional for demo on BMad projects)

**Functional (summary):**

- Mustache partials for nested `<details>` inside category groups (shared DOM desktop/mobile)
- Route-aware defaults: expand category + subgroup containing active page
- Count badges at subgroup level; CSS using existing semantic tokens
- Preserve S19.2 drawer, S19.4 search overlay precedence, no-JS native disclosure

### S23.4 — Index portal parity

**As** a user starting from the Main Page,  
**I want** the index category sections to mirror drawer subgroups,  
**so that** browsing and navigation tell the same story.

**Depends:** S23.3

**Functional (summary):**

- Index portal uses same subgroup tree as drawer
- Subgroup anchors on index (e.g. `#category-agent-skills-your-team`)
- Renderer tests assert parity

### S23.5 — Search grouped by subgroup

**As** Alex using search,  
**I want** results grouped by category and subgroup,  
**so that** search matches the mental model of the drawer.

**Depends:** S23.1, E19 S19.4

**Functional (summary):**

- Search index documents include `subgroupLabel` and `searchGroupLabel` (`Category › Subgroup`)
- `search.js` groups capped results by `searchGroupLabel`
- Tests in `search-index.test.ts` and search client tests updated

---

## Requirements & constraints

- Preserve frozen output layout: `wiki/html/index.html`, `wiki/html/{slug}.html`; Markdown unchanged.
- Preserve relative links and `file://` operation — no `fetch()`, CDN, new runtime deps, or nav state in localStorage.
- Infer grouping only — no required edits to skill `SKILL.md` frontmatter.
- Reuse single `.category-nav` DOM tree on desktop and mobile (E19 S19.2).
- Mustache-escape all user-derived titles and labels.
- Follow HARNESS §0.2 gate; `src/output/html/` coverage ≥ 90% on touched paths.

## Technical decisions

- **`nav-grouping.ts`** owns all grouping logic; renderer stays a thin view-model boundary.
- **`loadNavGroupingContext(projectRoot)`** loads BMad CSV/TOML once per HTML generation pass.
- **Max depth 2** inside category; merge single-child chains only when each level has ≤1 page.
- **Singleton promotion** at any level — avoid "Misc (1)" wrappers.
- **Rejected UI:** flyout submenus, search-only navigation, truncate-primary patterns (S19.5 UX record).

## Cross-story dependencies

- **E16 S16.2** — category nav chrome and breadcrumbs
- **E19 S19.2** — drawer shell, inert, scroll lock
- **E19 S19.4** — search overlay precedence (S23.5)
- **E19 S19.5** — category-level `<details>`; S23.3 nests inside expanded categories

## Epic gate

- [ ] S23.1 — Path baseline grouping works for all categories; tests green
- [ ] S23.2 — BMad hybrid grouping on self-repo dogfood wiki
- [x] S23.3 — Nested disclosure in drawer; active route expands correct subgroup
- [ ] S23.4 — Index portal matches drawer structure
- [ ] S23.5 — Search groups by category › subgroup
- [x] S23.7 — Article breadcrumbs include subgroup ancestry matching drawer labels
- [ ] Full HARNESS §0.2 quality gate on epic completion

---

## Open items (non-blocking)

- **Phase C polish** (description subtitles on nav links, menu-code badges) — defer to follow-up story or E12 if desired
- **Unified Skills category** (merge Agent + Cursor) — explicitly out of scope per owner decision

## Owner review improvements (2026-07-17)

Logged after S23.2 dogfood — reports under [`improvements/`](./improvements/):

| ID                                                                                        | Summary                                                                                                                | Disposition                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [23-IMP-1](./improvements/23-imp-1-agent-skills-phase-group-dedup.md)                     | Agent Skills phase groups show duplicate identical titles; want BMAD Output–like hierarchy / one clear entry per skill | **S23.6** (`23-6-agent-skills-phase-group-dedup`) — review       |
| [23-IMP-2](./improvements/23-imp-2-collapsible-nav-subgroups.md)                          | Collapse/expand subgroups in the drawer                                                                                | **Maps to existing S23.3** (`23-3-nested-disclosure-ui`, review) |
| [23-IMP-3](./improvements/23-imp-3-breadcrumb-subgroup-parity.md)                         | Article breadcrumbs omit drawer subgroup path                                                                          | **S23.7** (`23-7-breadcrumb-subgroup-parity`) — review           |
| [23-IMP-4](./improvements/23-imp-4-bmad-output-implementation-stories-label-collision.md) | BMAD Output shows two "Implementation Stories" subgroups when nested subdirs coexist with epic story files             | **Open bug** — from ADR-0010 review; not scheduled               |
