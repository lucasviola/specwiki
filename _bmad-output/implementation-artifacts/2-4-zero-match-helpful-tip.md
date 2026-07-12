---
baseline_commit: 9e5c1e1926e0fcc4c44982ee878dd144ff81e270
---

# Story 2.4: Zero-match helpful tip

Status: done

## Story

As Alex,
I want a helpful tip when no specs are found,
so that I know to check `--project` or patterns.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. Zero matches: `specwiki list` exits 0 with tip (consistent with generate)
2. Test asserts tip text and exit code
3. `discover.empty` event when zero matches (verbose only) with pattern hint
4. Tip remains on stdout (user-facing); diagnostics on stderr
5. Full §0.2 gate passes

## Tasks / Subtasks

- [x] Task 1: Add helpful tip to `listSpecs` zero-match path (AC: #1, #2, #4)
  - [x] Reuse same tip text as `generateWiki`
  - [x] Update command test to assert tip on stdout
  - [x] Add CLI e2e test for exit 0 on empty project
- [x] Task 2: Emit `discover.empty` in `discoverSpecs` (AC: #3, #4)
  - [x] Log `discover.empty` with projectRoot and patternCount when matchCount is 0
  - [x] Test verbose stderr emits discover.empty; default mode silent
- [x] Task 3: Run full §0.2 gate and update build log (AC: #5)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

`generateWiki` already prints a yellow "No spec files found." plus a dim tip. `listSpecs` only prints the yellow line — this story adds tip parity and `discover.empty` diagnostics.

**Demo path:**

```bash
npm run dev list -- --project /tmp/empty-dir
```

Expected stdout: yellow "No spec files found." + dim tip. Exit 0.

With `--verbose`, stderr includes `discover.start`, `discover.empty`, `discover.complete`.

### References

- [Source: epics-and-stories.md — S2.4]
- [Source: src/commands/generate.ts — generate zero-match tip]
- [Source: HARNESS.md §0.8 — discover.empty event]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Extract shared zero-match tip constant in commands/generate.ts
2. Add discover.empty to discoverSpecs when specs array is empty
3. Extend command and discover tests; add CLI e2e for empty list

### Completion Notes List

- Extracted `ZERO_SPECS_TIP` and `printZeroSpecsMessage()` shared by list and generate
- `listSpecs` now prints helpful tip on zero matches (parity with generate)
- `discoverSpecs` emits `discover.empty` with projectRoot and patternCount when verbose
- Added 4 tests: discover.empty verbose/quiet, list/generate tip assertions, CLI e2e (default + verbose empty)
- Full §0.2 gate passes; 64 tests

### File List

- `src/commands/generate.ts`
- `src/discover/specs.ts`
- `tests/commands/generate.test.ts`
- `tests/discover/specs.test.ts`
- `tests/cli.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-4-zero-match-helpful-tip.md`

## Change Log

- 2026-07-12: Story file created for E2 S2.4
- 2026-07-12: Addressed code review — CLI verbose empty e2e, generate tip assertion

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Review outcome:** Approve  
**Reviewer model:** claude-opus-4-8-thinking-high (attempted; inline triage after subagent API limit)

### Action Items

- [x] [Review][Patch] Add CLI e2e for `list --verbose` on empty project asserting `discover.empty` in stderr [`tests/cli.test.ts`]
- [x] [Review][Patch] Assert tip text in `generateWiki` zero-match test for shared-helper parity [`tests/commands/generate.test.ts:61-73`]
- [x] [Review][Defer] `discover.empty` could include sample pattern names beyond `patternCount` — deferred, AC satisfied by patternCount hint

### Review Findings

- [x] [Review][Patch] Add CLI e2e for `list --verbose` on empty project asserting `discover.empty` in stderr [`tests/cli.test.ts`]
- [x] [Review][Patch] Assert tip text in `generateWiki` zero-match test for shared-helper parity [`tests/commands/generate.test.ts:61-73`]
- [x] [Review][Defer] Richer discover.empty pattern hint payload — deferred, AC satisfied by patternCount hint
