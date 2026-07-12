---
baseline_commit: 1d1ca3d843f61e08f67dc6df6e453cd093e20cb7
---

# Story 7.1: Dogfood wiki on fixture

Status: done

## Story

As a maintainer,
I want end-to-end generate on a real layout,
so that MVP synthesis is proven.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

### Functional

1. `specwiki generate --verbose --project tests/fixtures/sample-project` completes in < 60s
2. Fixture produces ≥ 5 wiki pages plus categorized `index.md` and `html/index.html`
3. Specwiki repo root limited discovery documented as POST-MVP FR-006 (paths outside `DEFAULT_SPEC_PATTERNS`)
4. Dogfood result recorded in `IMPLEMENTATION.md` build log

### Logging & diagnostics (§0.8)

5. Verbose dogfood run shows full pipeline chain: `cli.command` → `discover.*` → `parse.file` → `output.write` → `generate.summary`
6. No missing pipeline stage logs vs E2–E6 requirements

### Quality measures

7. Full §0.2 gate passes before sign-off
8. Dogfood assertions covered by automated CLI integration test

## Tasks / Subtasks

- [x] Task 1: Dogfood CLI integration test (AC: #1, #2, #5, #6, #8)
  - [x] Subprocess test: generate --verbose on sample-project fixture
  - [x] Assert elapsed < 60s and `generate.summary.pageCount` ≥ 5
  - [x] Assert `index.md` has category sections and `html/index.html` exists
  - [x] Assert full stderr event chain in correct order
- [x] Task 2: Document dogfood and FR-006 scope (AC: #3, #4)
  - [x] Add dogfood result row to `IMPLEMENTATION.md` build log
  - [x] Document repo-root limited yield (`.agents/skills/`, `HARNESS.md`, `_bmad-output/` POST-MVP)
  - [x] Mark S7.1 complete in epic checklist
- [x] Task 3: Quality gate (AC: #7)
  - [x] Run full §0.2 quality gate
  - [x] Update sprint-status to review

## Dev Notes

**Scope:** Validation story — prove E2–E6 pipeline end-to-end on `tests/fixtures/sample-project`. No new runtime features unless dogfood reveals a gap.

**Demo path:**

```bash
npm run dev generate -- --verbose --project tests/fixtures/sample-project --output /tmp/specwiki-qa
open /tmp/specwiki-qa/html/index.html
```

**Fixture baseline (2026-07-12):** 10 spec files, 8 categories, ~0.4s generate time.

**FR-006 POST-MVP note:** Specwiki repo root with default patterns finds only `.cursor/rules/specwiki-checkpoint.mdc`. Paths like `HARNESS.md`, `_bmad-output/`, `.agents/skills/` are intentionally outside `DEFAULT_SPEC_PATTERNS` until E8.

**Expected verbose stderr chain:**

`cli.command` → `discover.start` → `discover.match` × N → `discover.complete` → `parse.file` × N → `output.write` × M → `generate.summary`

### References

- [Source: epics-and-stories.md — S7.1]
- [Source: prd.md — FR-031]
- [Source: readiness-report.md — FR-031 dogfood scope patch]
- [Source: 6-2-exit-code-contracts.md — prior pipeline logging baseline]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

Manual dogfood run: 10 pages, ~377ms wall time. Repo root `list --project .` yields 1 match.

### Completion Notes List

- Added CLI dogfood integration test asserting timing, page count, categorized index, HTML output, and full verbose pipeline event chain
- Documented FR-031 dogfood metrics and FR-006 repo-root limited yield in IMPLEMENTATION.md
- Full §0.2 gate green; 135 tests; repo coverage 99.67%

### File List

- `tests/cli.test.ts` (modified)
- `IMPLEMENTATION.md` (modified)
- `_bmad-output/implementation-artifacts/7-1-dogfood-wiki-on-fixture.md` (added)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/6-2-exit-code-contracts.md` (modified — Prettier only)

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. -->

**Review date:** 2026-07-12  
**Review outcome:** Approve  
**Reviewer model:** Inline triage (Composer)

### Action Items

### Review Findings

- [x] [Review][Pass] Dogfood test covers all pipeline stages with ordering assertions
- [x] [Review][Pass] FR-006 scope documented without overstating self-repo expectations

## QA Manual Validation

**QA model:** Inline analysis (Composer)  
**Review date:** 2026-07-12

### AC coverage

| AC  | Status | Evidence                                     |
| --- | ------ | -------------------------------------------- |
| #1  | ✓      | Dogfood test elapsed < 60s; manual run ~0.4s |
| #2  | ✓      | 10 pages; index categories; html/index.html  |
| #3  | ✓      | IMPLEMENTATION.md FR-006 section             |
| #4  | ✓      | Build log row E7 S7.1                        |
| #5  | ✓      | Test asserts full event chain                |
| #6  | ✓      | discover/parse/output/cli stages present     |
| #7  | ✓      | Full §0.2 green                              |
| #8  | ✓      | `dogfood — sample-project fixture` CLI test  |

### Regression risks

- Fixture file count changes would break pageCount assertions — acceptable for dogfood contract test
- Category label changes in CATEGORY_LABELS could affect index header regex

### Gaps

- No automated test for repo-root limited yield (documented only per AC #3)

### Manual validation steps

1. `npm run dev generate -- --verbose --project tests/fixtures/sample-project --output /tmp/specwiki-qa` — exit 0; stderr shows full pipeline chain; stdout "Generated wiki with 10 page(s)"
2. `open /tmp/specwiki-qa/html/index.html` — browser shows categorized Spec Wiki with 10 entries
3. `npm run dev list -- --project .` — finds 1 spec (checkpoint rule); confirms FR-006 limited yield
4. `npm test -- tests/cli.test.ts -t "dogfood"` — 1 test passes
5. `npm test` — 135 tests pass

## Change Log

- 2026-07-12: Story file created for E7 S7.1
- 2026-07-12: Implemented dogfood validation test and IMPLEMENTATION.md documentation; status → review
