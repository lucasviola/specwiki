---
baseline_commit: ddd644dcf6f0d1d0ec44b880830038946ed51777
---

# Story 23.6: Agent Skills Phase Group Dedup

Status: review

**Source:** [23-IMP-1](./improvements/23-imp-1-agent-skills-phase-group-dedup.md)  
**Epic:** E23 — Navigation Drawer Hierarchy  
**Depends:** S23.2

## Story

As a BMad Method user,
I want Agent Skills phase groups to nest pages under each skill (like BMAD Output under Epic N),
so that the drawer shows one clear entry per skill instead of repeated identical titles.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project . --output .tmp-nav23-dedup` — under **Agent Skills → Analysis**, multi-file skills appear as a skill-named subgroup with distinct page titles (not multiple identical "Brainstorm Project" links).

## Acceptance Criteria

### Functional

1. When hybrid Agent Skills grouping is active (`context.loaded`), each phase/bucket group may contain **skill-level L2 subgroups** keyed by skill id (first path segment after `.agents/skills/`).
2. **Multi-page skills** (≥2 discovered wiki pages under the same skill id in the same phase): create an L2 subgroup whose **label** is the existing L4 display name (CSV `display-name` or agent `icon name — title`); leaf `NavPage.title` values keep the **wiki page titles** so siblings are distinct.
3. **Single-page skills**: do **not** wrap in an L2 subgroup; place the page directly on the phase group with the L4 display title (preserves singleton promotion and scannable labels).
4. **Orphan pages** (hybrid mode but path outside `.agents/skills/`): remain direct pages on **Uncatalogued** (no synthetic skill subgroup).
5. Hybrid top-level order, membership rules, multi-row CSV collapse, graceful degradation, and BMAD Output L3 behavior are **unchanged**.
6. Reuse S23.1 finalization: singleton promotion, depth cap 2, `collapsible` / `open` / `pageCount`, index vs article open defaults.
7. Sort: skill L2 subgroups by label (case-insensitive); pages within a skill (and direct phase pages) by title (case-insensitive).
8. Infer only — no required SKILL.md / project file edits. No change to Markdown wiki, discovery, slug generation, S23.3 disclosure UI, S23.4 portal, or S23.5 search.

### Quality

9. Unit tests cover multi-page skill nesting, single-page L4-on-phase, orphan Uncatalogued, singleton promotion, and BMAD Output unchanged.
10. Renderer test updated for nested skill labels under hybrid Agent Skills.
11. HARNESS §0.2 quality gate passes.

## Tasks / Subtasks

- [x] Implement skill-folder L2 under hybrid phase groups (AC: 1–11)
  - [x] RED: update hybrid tests that assert duplicate L4 titles; add nesting / distinct leaf titles cases
  - [x] GREEN: rewrite `buildHybridAgentSkillsGrouping` to nest multi-page skills; keep L4 on single-page phase leaves
  - [x] UPDATE: renderer hybrid assertion; improvement report + epic disposition; IMPLEMENTATION.md; quality gate

## Dev Notes

**Chosen approach (23-IMP-1 #1):** Skill-folder L2 under phase — mirrors Implementation Stories → Epic N. Rejected: drop extras (#2), disambiguate flat labels only (#3), multi-row CSV children (#4 — catalog already merges rows; CSV actions ≠ wiki files).

**Key file:** `src/output/html/nav-grouping.ts` → `buildHybridAgentSkillsGrouping`. Templates already render nested `.category-nav-subgroup-nested`.

## QA Manual Validation

1. `npm test -- tests/output/html/nav-grouping.test.ts -t "hybrid"` — pass
2. `rm -rf .tmp-nav23-dedup && npm run dev generate -- --project . --output .tmp-nav23-dedup` — exit 0
3. Open an Agent Skills article HTML; under a phase with a multi-file skill, confirm a skill-named subgroup and distinct page link titles (no repeated identical L4 names as sibling links)
4. Confirm BMAD Output still nests Implementation Stories → Epic N
5. `rm -rf .tmp-nav23-dedup` — cleanup

## Dev Agent Record

### Implementation Plan

- Nest only when a skill contributes ≥2 pages; stamp L4 on single-page leaves so finalize singleton promotion keeps human labels.
- Orphan paths (no skill id) stay as direct Uncatalogued leaves with wiki titles.

### Debug Log

- Dogfood: Analysis shows `Brainstorm Project` once as nested label; leaf links are distinct (`Bmad Brainstorming`, `Catalog Analysis`, …) with no duplicate titles.

### Completion Notes

- Rewrote `buildHybridAgentSkillsGrouping` to bucket by phase → skill id, nest multi-page skills with L4 subgroup labels and wiki leaf titles, keep single-page skills as L4 phase leaves.
- Uncatalogued multi-page skills use humanized skill-id L2 labels (review Med patch).
- Added tests for L2 label sort, uncatalogued nest + orphan mix; updated hybrid/renderer assertions.
- Scheduled from 23-IMP-1; sprint-status + epic disposition updated.

### File List

- `src/output/html/nav-grouping.ts`
- `tests/output/html/nav-grouping.test.ts`
- `tests/output/html/renderer.test.ts`
- `_bmad-output/implementation-artifacts/23-6-agent-skills-phase-group-dedup.md`
- `_bmad-output/implementation-artifacts/improvements/23-imp-1-agent-skills-phase-group-dedup.md`
- `_bmad-output/implementation-artifacts/epic-23-navigation-drawer-hierarchy.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `IMPLEMENTATION.md`

### Change Log

- 2026-07-17: Implemented skill-folder L2 under hybrid Agent Skills phase groups (23-IMP-1 → S23.6) — ready for review.
- 2026-07-17: Applied review Med patch — humanized skill-id labels for uncatalogued multi-page skills; added L2 sort + mixed Uncatalogued tests.
