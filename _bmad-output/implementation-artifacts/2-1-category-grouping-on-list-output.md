---
baseline_commit: 921c2f8a8f0e8b3c4d5e6f7a8b9c0d1e2f3a4b5c
---

# Story 2.1: Category grouping on list output

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex,
I want specs grouped by category when I run `specwiki list`,
so that I see Cursor rules, OpenSpec, and root agent files separately.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `deriveCategory` covers all known path prefixes; prefix order tested
2. `specwiki list` groups by category on fixture
3. Category keys unchanged without owner approval (NFR-013)
4. No raw `console.log` added in `discover/specs.ts`
5. Full §0.2 gate passes
6. `discover/specs.ts` coverage ≥ 90% on touched functions (target: branch coverage ≥ 90%)

## Tasks / Subtasks

- [x] Task 1: Unit-test `deriveCategory` prefix coverage (AC: #1, #3, #4)
  - [x] Export `deriveCategory` for direct unit tests
  - [x] Test every known category prefix from `deriveCategory`
  - [x] Test prefix order (`.cursor/rules/` before generic nested paths)
  - [x] Test Windows path normalization (`\` → `/`)
  - [x] Test `other` fallback for unmatched nested paths
- [x] Task 2: Verify list output grouping (AC: #2)
  - [x] Assert `listSpecs` prints category headers with files grouped beneath each
  - [x] Assert fixture categories appear (root, cursor-rules, openspec, etc.)
- [x] Task 3: Run full §0.2 gate and update build log (AC: #5, #6)
  - [x] Run `test`, `lint`, `format`, `coverage`, `typecheck`, `build`
  - [x] Confirm `discover/specs.ts` branch coverage ≥ 90% (95.34%)
  - [x] Update IMPLEMENTATION.md build log row for S2.1

## Dev Notes

Brownfield baseline already groups list output in `listSpecs` (`src/commands/generate.ts`). This story **hardens** category derivation with exhaustive `deriveCategory` tests and explicit list-grouping assertions.

**Do not** wire Logger into discover yet — that is S2.3.

### Category keys (frozen — NFR-013)

`root`, `cursor-rules`, `cursor-skills`, `specs`, `spec`, `openspec`, `kiro`, `docs-specs`, `plans`, `requirements`, `github`, `other`

### Demo path

```bash
npm run dev list -- --project tests/fixtures/sample-project
```

### Test layout

```
tests/discover/specs.test.ts   ↔ deriveCategory + discoverSpecs
tests/commands/generate.test.ts ↔ listSpecs grouping
```

### References

- [Source: epics-and-stories.md — S2.1]
- [Source: HARNESS.md §9 Phase 1.1]
- [Source: src/discover/specs.ts — deriveCategory]
- [Source: src/config/patterns.ts — CATEGORY_LABELS]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Implementation Plan

1. Export `deriveCategory` and add exhaustive prefix-order unit tests
2. Strengthen `listSpecs` grouping assertions on fixture
3. Run full §0.2 gate; confirm discover branch coverage ≥ 90%

### Completion Notes List

- Exported `deriveCategory` from `src/discover/specs.ts` for direct unit testing
- Added 16 parameterized + prefix-order tests covering all category keys and `other` fallback
- Strengthened `listSpecs` test to assert category headers precede grouped file paths
- Full §0.2 gate passes; 40 tests total; `discover/specs.ts` at 100% lines / 95.34% branches
- No Logger wiring or console.log changes in discover module (deferred to S2.3)

### File List

- `src/discover/specs.ts` (modified — export deriveCategory)
- `tests/discover/specs.test.ts` (modified — deriveCategory tests)
- `tests/commands/generate.test.ts` (modified — list grouping assertions)
- `IMPLEMENTATION.md` (modified)
- `_bmad-output/implementation-artifacts/2-1-category-grouping-on-list-output.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-07-12: Story file created for E2 S2.1
- 2026-07-12: Implemented deriveCategory test hardening and list grouping verification — ready for review
