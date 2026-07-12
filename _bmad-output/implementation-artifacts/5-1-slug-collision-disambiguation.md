---
baseline_commit: 8d8b25de58456463a3646538eb97f2c0c9111938
---

# Story 5.1: Slug collision disambiguation

Status: done

## Story

As Alex,
I want colliding paths to get unique filenames,
so that I never lose a spec silently.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. Duplicate slugs disambiguated; index links match written filenames
2. Non-colliding paths preserve existing `pageSlug` algorithm (NFR-013)
3. `output.slug-collision` logs original and disambiguated slug (verbose only)
4. Test verifies log emission when collision occurs
5. Full §0.2 gate passes; collision path coverage in `output/wiki.ts`

## Tasks / Subtasks

- [x] Task 1: Implement slug disambiguation in `buildWiki` (AC: #1, #2)
  - [x] Add `assignUniqueSlugs` helper using hash suffix for colliding paths
  - [x] First path (by sorted relativePath) keeps base slug; others get `-{hash}` suffix
  - [x] Wire disambiguation into `buildWiki` before index generation
- [x] Task 2: Add `output.slug-collision` logging (AC: #3, #4)
  - [x] Emit verbose-only event with originalSlug, disambiguatedSlug, sourcePath
  - [x] Test verbose emission and quiet suppression
- [x] Task 3: Collision fixture and tests (AC: #1, #4, #5)
  - [x] Add `tests/fixtures/collision-project/` with colliding paths
  - [x] Unit tests for disambiguation, index link correctness, non-collision preservation
  - [x] Integration test: generate on collision fixture produces distinct files
- [x] Task 4: Run full §0.2 gate and update build log (AC: #5)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield: `pageSlug` in `src/output/wiki.ts` maps paths to slugs but last-write-wins on collision (HARNESS §11 #1). Fix in `buildWiki` so index links and write paths stay consistent.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/collision-project --output /tmp/specwiki-collision --verbose
```

Expected: distinct `.md` and `html/*.html` files; stderr includes `output.slug-collision` when `--verbose`.

### References

- [Source: epics-and-stories.md — S5.1]
- [Source: HARNESS.md §11 #1 — slug collision]
- [Source: ARCHITECTURE-SPINE.md — AD-5]
- [Source: src/output/wiki.ts — pageSlug, buildWiki]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Add assignUniqueSlugs helper with deterministic SHA-256 hash suffix (8 hex chars)
2. Wire into buildWiki; log output.slug-collision on disambiguation
3. Add collision-project fixture with discoverable colliding specs paths
4. Run full quality gate

### Completion Notes List

- Added `assignUniqueSlugs` in `buildWiki`: first path by sorted relativePath keeps base slug; colliding paths get `-{hash}` suffix
- Exported `pageSlug` for direct unit testing of non-collision preservation
- Added `output.slug-collision` verbose event with originalSlug, disambiguatedSlug, sourcePath
- Created `tests/fixtures/collision-project/` with `specs/foo-bar.md` + `specs/foo/bar.md` collision pair
- Added 8 unit tests + 1 generate integration test; 117 tests total
- Full §0.2 gate passes; output/wiki.ts 100% lines, 92.53% branches
- Review patch: explicit three-way collision tests for assignUniqueSlugs and logging

### File List

- `src/output/wiki.ts`
- `tests/output/wiki.test.ts`
- `tests/commands/generate.test.ts`
- `tests/fixtures/collision-project/SPEC.md`
- `tests/fixtures/collision-project/specs/foo-bar.md`
- `tests/fixtures/collision-project/specs/foo/bar.md`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-1-slug-collision-disambiguation.md`

## Change Log

- 2026-07-12: Story file created for E5 S5.1
- 2026-07-12: Implemented slug collision disambiguation, fixture, and tests
- 2026-07-12: Review patch — explicit three-way collision unit tests

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Reviewer model:** Inline triage (Composer)  
**Outcome:** Approve

### Action Items

- [x] [Review][Pass] Deterministic disambiguation preserves first path's slug
- [x] [Review][Pass] Index links match disambiguated filenames
- [x] [Review][Pass] Non-colliding paths unchanged (NFR-013)
- [x] [Review][Pass] Logging payload safe (paths only)
- [x] [Review][Low] Explicit three-way collision test — added in review patch

## QA Manual Validation

1. Run `npm test -- tests/output/wiki.test.ts -t "slug collision"`
2. Confirm disambiguation, index links, and logging tests pass
3. Run `npm run dev generate -- --project tests/fixtures/collision-project --output /tmp/specwiki-collision --verbose 2>&1 | grep slug-collision`
4. Confirm stderr shows `output.slug-collision` events
5. Run `ls /tmp/specwiki-collision/*.md` — confirm distinct filenames for colliding specs
6. Open `/tmp/specwiki-collision/index.md` — verify links match filenames
7. Run `npm test` — all tests pass
