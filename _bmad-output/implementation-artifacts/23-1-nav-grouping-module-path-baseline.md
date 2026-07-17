---
baseline_commit: d0089896c87e71b23f6e148a11da380590c06e66
---

# Story 23.1: Nav Grouping Module + Path-Segment Baseline

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex browsing a wiki with nested folder structure,
I want pages grouped by path segments inside each category,
so that BMAD Output, Cursor Skills, specs, and rules are scannable without reading 79+ flat links.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23` — under **BMAD Output** and nested **Cursor Skills** folders, the nav view model (and any interim heading markup) shows subgroup structure; single-page subgroups appear as direct links without a wrapper heading.

**Binds:** FR-033 (proposed extension) | **Depends:** E19 S19.5 | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **AD:** AD-4, AD-6, AD-11

## Acceptance Criteria

### Functional

1. New module `src/output/html/nav-grouping.ts` owns all intra-category grouping logic. Exported surface includes at least:
   - `buildCategoryNavSubgroups(pages, options)` — returns subgroup tree for one category’s pages
   - `loadNavGroupingContext(projectRoot)` — returns a context object (S23.1: empty/stub sufficient for L0; S23.2 fills CSV/TOML)
   - Path-prefix map (category root → strip prefix), folder label map (segment → human label), 2-level depth cap, singleton flattening helpers as needed
2. **L0 path baseline** applies to **all** wiki categories: strip the category root prefix from `WikiPage.sourcePath`, take the next 1–2 path segments as subgroup keys, humanize via folder label map, cap nesting at **2 levels** inside the category.
3. **BMAD Output L3 conventions** (still inference-only, no discovery changes):
   - Paths under `planning-artifacts/` (or fixture alias `planning/`) → **Planning** → child folder label (Discovery, Research, etc.)
   - Paths under `implementation-artifacts/` with story filenames `NN-M-…` → **Implementation Stories** → **Epic N**
   - `epic-*.md` at `implementation-artifacts/` root → **Epic Context**
   - Other `_bmad-output/` paths → L0 fallback / **Other**
4. **Singleton promotion:** any subgroup (at either level) that would wrap exactly one page is omitted — that page is promoted to a direct link on the parent (no “Misc (1)” wrappers). Merge single-child chains only when each level has ≤1 page.
5. `buildNavCategories` in `renderer.ts` **consumes** the subgroup tree:
   - Categories with meaningful subgroups expose `subgroups` (and related flags: e.g. `hasSubgroups`, per-subgroup `open`/`pageCount`/`collapsible`) on the nav view model
   - Categories that remain flat after grouping keep the existing flat `pages[]` list (backward compatible with S19.5 templates)
   - Category-level `open` / `collapsible` / `pageCount` / `active` behavior from S19.5 is preserved
6. **Active-page open state (view model only):** when building for an article, the subgroup (and parent subgroup if depth-2) containing the active page have `open: true`; other subgroups `open: false`. Index builds leave multi-page subgroups `open: false`. Nested `<details>` templates/CSS are **out of scope** (S23.3) — S23.1 may render optional **static** subgroup headings for demo, but must not introduce nested disclosure chrome or new client assets.
7. `writeHtmlWiki` loads grouping context once per HTML generation (`loadNavGroupingContext(projectRoot)`) and threads it into the renderer. `generateWiki` / `WriteHtmlWikiOptions` pass `projectRoot` as needed. No CLI flag changes.
8. **No change** to Markdown wiki output, discovery (`deriveCategory`), slug generation, page output paths, or top-level `CATEGORY_LABELS`. Infer only — no skill frontmatter or project file edits required for grouping to work.
9. Generated wiki continues to work over `file://` with no network request, CDN, server, new runtime dependency, nav state in `localStorage`/`sessionStorage`, or `fetch()`.
10. Mustache-escape all user-derived subgroup labels and titles (NFR-011). Do not put labels into unescaped script strings.

### Logging & diagnostics (§0.8)

11. Reuse existing verbose `output.write` coverage for HTML generation; do not introduce a new log event type for grouping unless a failure mode truly needs it.
12. Do not log full file contents, secrets, or entire page bodies (NFR-007). Default client assets emit no new console spam.

### Quality measures

13. Unit tests in `tests/output/html/nav-grouping.test.ts` cover: path-segment grouping, BMAD Output L3 conventions, singleton promotion / single-child merge, depth cap at 2, folder label humanization, and active-page subgroup `open` flags.
14. Renderer (or integration) tests assert `buildNavCategories` exposes subgroups where expected and preserves flat lists / S19.5 category disclosure when subgroups are absent or all promoted away.
15. Sample fixture under `tests/fixtures/sample-project` is enriched enough that the demo path produces at least one multi-page BMAD Output subgroup tree and one nested Cursor Skills subgroup (thin fixture today: only `_bmad-output/planning/artifact.md` and `.cursor/skills/my-skill/`).
16. Complete HARNESS §0.2 quality gate passes; `src/output/html/` coverage remains ≥ 90% on touched paths.

## Tasks / Subtasks

- [x] Implement nav grouping vertical slice (AC: 1–16)
  - [x] RED: add `tests/output/html/nav-grouping.test.ts` for L0 path grouping, BMAD L3 rules, singleton promotion, depth cap, active open flags.
  - [x] RED: extend `tests/output/html/renderer.test.ts` for subgroup fields on `buildNavCategories` / rendered context where observable.
  - [x] GREEN: create `src/output/html/nav-grouping.ts` (`buildCategoryNavSubgroups`, path prefix map, folder label map, depth/singleton rules, stub `loadNavGroupingContext`).
  - [x] GREEN: wire `buildNavCategories` + `writeHtmlWiki` / `generateWiki` (`projectRoot` → context).
  - [x] GREEN: enrich `tests/fixtures/sample-project` with nested BMAD Output + Cursor Skills pages for the demo path.
  - [x] GREEN (optional interim UI): static subgroup headings in Mustache **without** nested `<details>` — only if needed for a visible demo; otherwise leave templates flat until S23.3 and prove via unit/renderer assertions.
  - [x] REFACTOR: keep grouping logic out of Mustache; do not change discovery/slugs/Markdown; no new runtime deps.
  - [x] Update `IMPLEMENTATION.md`, run full quality gate, automated code review, QA analysis.

## Dev Notes

### UX / product intent (Epic 23)

Epic 19 S19.5 collapsed **categories**. Inside large categories, pages are still a flat filesystem dump (Agent Skills ~176, BMAD Output ~79). S23.1 ships the **data model + L0/L3 inference** so later stories can render nested disclosure (S23.3), portal parity (S23.4), and search grouping (S23.5).

**Owner decisions locked (2026-07-17):**

| Topic                                  | Decision                                |
| -------------------------------------- | --------------------------------------- |
| Scope                                  | All wiki categories                     |
| Metadata                               | Infer only                              |
| Nesting                                | 2 levels max inside a category          |
| Singletons                             | Hide wrappers — promote to direct links |
| Agent vs Cursor                        | Keep separate top-level categories      |
| Agent Skills hybrid (Your team + SDLC) | **S23.2** — not this story              |

### Inference model (S23.1 scope)

| Layer | Signal                                        | S23.1        |
| ----- | --------------------------------------------- | ------------ |
| L0    | Path segments relative to category root       | **In scope** |
| L1    | `bmad-help.csv`                               | Defer S23.2  |
| L2    | `customize.toml` `[agent]` / `[workflow]`     | Defer S23.2  |
| L3    | BMAD planning/implementation/epic conventions | **In scope** |
| L4    | CSV/TOML display labels                       | Defer S23.2  |

**Fallback:** L3 when path matches BMAD conventions → else L0. Agent Skills without L1/L2 stay largely flat (expected).

### L0 algorithm

1. Normalize `sourcePath` to `/` separators.
2. Strip category root prefix (see map below).
3. Split remaining directories (ignore filename) into segments.
4. Use up to **2** segments as subgroup key path; humanize each via folder label map (title-case / known aliases).
5. Cap depth at 2; apply singleton promotion and single-child merge.
6. Preserve discovery order of pages within a leaf group (do not re-sort by title unless tests require epic/story numeric sort for Implementation Stories).

**Category root prefixes** (align with `deriveCategory` in `src/discover/specs.ts`):

| Category key    | Strip prefix                                                                   |
| --------------- | ------------------------------------------------------------------------------ |
| `cursor-rules`  | `.cursor/rules/`                                                               |
| `cursor-skills` | `.cursor/skills/`                                                              |
| `agent-skills`  | `.agents/skills/`                                                              |
| `bmad-output`   | `_bmad-output/`                                                                |
| `specs`         | `specs/`                                                                       |
| `spec`          | `spec/`                                                                        |
| `openspec`      | `openspec/`                                                                    |
| `kiro`          | `.kiro/specs/`                                                                 |
| `docs-specs`    | `docs/specs/`                                                                  |
| `plans`         | `docs/plans/`                                                                  |
| `requirements`  | `requirements/`                                                                |
| `github`        | `.github/`                                                                     |
| `root`          | _(empty — files at repo root; optional bucket “Project docs” for loose files)_ |
| `other`         | first segment kept as L0 key                                                   |

### BMAD Output L3 (examples)

| Path                                                          | Subgroups                             |
| ------------------------------------------------------------- | ------------------------------------- |
| `_bmad-output/planning-artifacts/discovery/prd/prd.md`        | Planning → Discovery                  |
| `_bmad-output/planning/artifact.md` (fixture)                 | Planning → _(or L0 under `planning`)_ |
| `_bmad-output/implementation-artifacts/19-5-collapsible-….md` | Implementation Stories → Epic 19      |
| `_bmad-output/implementation-artifacts/epic-23-….md`          | Epic Context                          |
| odd path under `_bmad-output/`                                | Other / L0                            |

**Implementation Stories sort:** by epic number then story number when deriving from `NN-M-` prefix.

### Suggested view-model shape (guide — adjust names if clearer)

```ts
interface NavSubgroup {
  key: string;           // stable slug fragment, e.g. "planning" or "epic-19"
  label: string;         // human label, escaped by Mustache
  pageCount: number;
  collapsible: boolean;  // true when >1 page after promotion
  open: boolean;         // route-aware; used by S23.3
  pages: NavPage[];      // direct pages at this level
  subgroups?: NavSubgroup[]; // depth-2 only; omit or empty when flat
}

// NavCategory gains:
subgroups?: NavSubgroup[];
hasSubgroups?: boolean;
// Keep pages[] as today for flat categories and for “promoted” direct links at category root
```

Export grouping helpers for unit tests; keep `NavPage` / `NavCategory` private to renderer unless exporting improves testability without widening public API unnecessarily.

### Current state and preservation rules

**Today (`renderer.ts` ~201–234):** `buildNavCategories` buckets by `page.category`, sorts category keys by label, filters README-only categories, maps flat `pages[]`, sets S19.5 `collapsible`/`open`/`active`.

**Templates:** `index.mustache` / `article.mustache` iterate flat `{{#pages}}` inside S19.5 `<details class="category-nav-group">`. **No** `templates/partials/` yet.

**`writeHtmlWiki`:** does not receive `projectRoot` today — add it for `loadNavGroupingContext`.

**S19.5 note:** Dev Notes said “Do not nest disclosures inside disclosures.” Epic 23 **supersedes** that for S23.3 subgroup nesting. S23.1 must not nest disclosures yet; only prepare VM flags.

**Preserve:**

- Frozen paths: `wiki/html/index.html`, `wiki/html/{slug}.html`
- Relative `{slug}.html` links; `file://`
- Single shared `.category-nav` DOM (S19.2)
- Theme `localStorage` OK; **nav open-state storage forbidden**
- S19.2 drawer (`inert`, Escape, scroll lock) and S19.4 search overlay
- `categoryVisibleInIndex` / README-only filtering
- Escaped Mustache for titles/labels

### Out of scope (explicit)

| Defer to          | Work                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------- |
| S23.2             | CSV/TOML load; Your team + SDLC hybrid; Uncatalogued; real `loadNavGroupingContext` data |
| S23.3             | Nested `<details>` partials, CSS tokens, subgroup count badges, progressive enhancement  |
| S23.4             | Index portal subgroup parity + anchors                                                   |
| S23.5             | Search `subgroupLabel` / `searchGroupLabel`                                              |
| Never (this epic) | Unify Agent + Cursor Skills; flyouts; truncate-primary; Markdown/discovery/slug changes  |

### Security, accessibility, performance

- Escape subgroup labels (NFR-011).
- No new runtime dependencies (AD-11).
- No network I/O in default generate (NFR-012 / AD-8).
- Keyboard/a11y for nested disclosure is S23.3; S23.1 static headings (if any) must remain readable and not break existing category disclosure.

### Testing requirements

- Primary: `tests/output/html/nav-grouping.test.ts` with synthetic `WikiPage[]` (do not require full generate for unit cases).
- Secondary: renderer assertions for VM fields; fixture generate for demo smoke.
- Keep existing S19.5 disclosure tests green.
- Quality gate: `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build`.

### Project structure notes

| Action                    | Path                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| CREATE                    | `src/output/html/nav-grouping.ts`                                                 |
| CREATE                    | `tests/output/html/nav-grouping.test.ts`                                          |
| UPDATE                    | `src/output/html/renderer.ts` (`buildNavCategories`, types)                       |
| UPDATE                    | `src/output/wiki.ts` (`writeHtmlWiki` + options)                                  |
| UPDATE                    | `src/types.ts` (`WriteHtmlWikiOptions` if needed)                                 |
| UPDATE                    | `src/commands/generate.ts` (pass `projectRoot`)                                   |
| UPDATE                    | `tests/output/html/renderer.test.ts`                                              |
| UPDATE                    | `tests/fixtures/sample-project/...` (nested BMAD + Cursor Skills)                 |
| UPDATE                    | `IMPLEMENTATION.md`                                                               |
| UPDATE                    | `_bmad-output/implementation-artifacts/sprint-status.yaml`                        |
| OPTIONAL                  | `index.mustache` / `article.mustache` — static subgroup headings only             |
| DO NOT TOUCH (this story) | `search-index.ts`, `search.js`, discovery, Markdown writer, nested disclosure CSS |

### Git / prior-story intelligence

- Last epic touching nav: **S19.5** — native `<details>`, CSS-only chevron, no nav storage, shared drawer DOM.
- Recent commits are versioning/site (E22) — no nav-grouping code landed yet.
- Fixture thinness is a known demo risk; enrich sample-project as part of this story.

### References

- [Source: `_bmad-output/implementation-artifacts/epic-23-navigation-drawer-hierarchy.md` — S23.1 outline, L0/L3, owner decisions]
- [Source: `_bmad-output/implementation-artifacts/epic-23-context.md` — technical decisions, cross-story deps]
- [Source: `_bmad-output/planning-artifacts/ux/nav-drawer-hierarchy-brief.md`]
- [Source: canvas `nav-drawer-hierarchy.canvas.tsx` — L0 examples]
- [Source: `_bmad-output/implementation-artifacts/19-5-collapsible-category-navigation.md` — category disclosure contracts]
- [Source: `src/output/html/renderer.ts` — `buildNavCategories`]
- [Source: `src/discover/specs.ts` — `deriveCategory` prefixes]
- [Source: `src/config/patterns.ts` — `CATEGORY_LABELS`]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Added `nav-grouping.ts` with L0 path-segment grouping (all categories), BMAD Output L3 conventions, 2-level depth cap, singleton promotion, and stub `loadNavGroupingContext`.
- Wired `buildNavCategories` to expose `hasSubgroups` / `subgroups` on the nav view model; S19.5 category disclosure preserved.
- `writeHtmlWiki` loads grouping context once when `projectRoot` is provided; `generate` passes it through.
- Static subgroup headings in nav templates (no nested `<details>`); index portal keeps flat `portalPages` until S23.4 subgroup parity.
- Enriched sample-project fixture with nested BMAD Output + Cursor Skills pages; 485 tests pass; `src/output/html/` at 96.77% coverage.
- Code review found index portal regression — fixed with `portalPages` flat list for Main Page sections.

### File List

- `src/output/html/nav-grouping.ts` (created)
- `src/output/html/renderer.ts` (modified)
- `src/output/wiki.ts` (modified)
- `src/types.ts` (modified)
- `src/commands/generate.ts` (modified)
- `src/output/html/templates/index.mustache` (modified)
- `src/output/html/templates/article.mustache` (modified)
- `src/output/html/assets/specwiki.css` (modified)
- `tests/output/html/nav-grouping.test.ts` (created)
- `tests/output/html/renderer.test.ts` (modified)
- `tests/output/wiki.test.ts` (modified)
- `tests/commands/generate.test.ts` (modified)
- `tests/discover/specs.test.ts` (modified)
- `tests/fixtures/sample-project/_bmad-output/planning-artifacts/discovery/prd-a.md` (created)
- `tests/fixtures/sample-project/_bmad-output/planning-artifacts/discovery/prd-b.md` (created)
- `tests/fixtures/sample-project/_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md` (created)
- `tests/fixtures/sample-project/_bmad-output/implementation-artifacts/23-2-bmad-catalog-enrichment.md` (created)
- `tests/fixtures/sample-project/.cursor/skills/team-a/skill-one/SKILL.md` (created)
- `tests/fixtures/sample-project/.cursor/skills/team-a/skill-two/SKILL.md` (created)
- `IMPLEMENTATION.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/23-1-nav-grouping-module-path-baseline.md` (modified)

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-17  
**Review outcome:** Changes Requested (1 medium — fixed in-session)  
**Reviewer model:** Bugbot

### Action Items

- [x] [Med] Index portal omits subgroup pages when `hasSubgroups` — fixed via `portalPages` flat list in `renderIndex` (portal section only; S23.4 will add subgroup anchors)

### Review Findings

| Severity | Finding                                                                                  | Status |
| -------- | ---------------------------------------------------------------------------------------- | ------ |
| Med      | Main Page portal sections used nav `pages[]` only; grouped categories showed empty lists | Fixed  |

## QA Manual Validation

<!-- Copy-paste steps for owner after implementation; refine in HARNESS §0.2.6. -->

**QA model:** Composer  
**Review date:** 2026-07-17

### AC coverage

| AC    | Status | Notes                                                                                               |
| ----- | ------ | --------------------------------------------------------------------------------------------------- |
| 1–10  | Pass   | Module, L0/L3, singleton promotion, VM wiring, projectRoot threading, no discovery/Markdown changes |
| 11–12 | Pass   | No new log events; labels via Mustache escaping                                                     |
| 13–16 | Pass   | 26 nav-grouping + renderer/generate integration tests; quality gate green; html/ coverage 96.77%    |

### Regression risks

- S19.5 category `<details>` open/closed defaults — covered by renderer tests
- Flat nav for categories without nested path segments — covered
- README-only category filtering — unchanged
- Index portal flat page list — `portalPages` preserves visibility until S23.4

### Gaps

- Index portal subgroup structure/anchors deferred to S23.4 (intentional)
- Nested `<details>` disclosure deferred to S23.3
- CSV/TOML enrichment deferred to S23.2

### Manual validation steps

1. `npm test -- tests/output/html/nav-grouping.test.ts` — all grouping unit tests pass
2. `npm test -- tests/output/html/renderer.test.ts -t "nav"` — renderer nav assertions pass (including S19.5 regressions)
3. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23` — completes without error; HTML written under `/tmp/specwiki-nav23/wiki/html/`
4. Inspect nav view model or generated HTML for BMAD Output / Cursor Skills — multi-page subgroups present; singleton wrappers absent
5. `npm run dev open -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23` — open an article; category-level S19.5 disclosure still works; no console errors; works via `file://`
6. Confirm Markdown wiki under the same output is unchanged in structure (still `wiki/*.md` pages + index)
