---
baseline_commit: 921c2f8a8f0e8b3c4d5e6f7a8b9c0d1e2f3a4b5c
---

# Story 2.2: Human-readable titles on list output

Status: review

## Story

As Alex,
I want readable titles for SKILL and agent files,
so that I recognize specs without reading paths.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `deriveTitle` handles SKILL, AGENTS, SPEC, CLAUDE, GEMINI and generic basenames
2. No regressions on fixture expectations
3. No new diagnostic noise in default (non-verbose) list mode
4. Full §0.2 gate passes
5. `deriveTitle` coverage ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Unit-test `deriveTitle` (AC: #1, #2)
  - [x] Export `deriveTitle` for direct unit tests
  - [x] Test SKILL, AGENTS, SPEC, CLAUDE, GEMINI special cases
  - [x] Test generic basename title-casing with hyphens and underscores
- [x] Task 2: Show titles in list output (AC: #2, #3)
  - [x] Format list lines as `{title} — {relativePath}`
  - [x] Assert fixture titles appear in `listSpecs` output
- [x] Task 3: Run full §0.2 gate and update build log (AC: #4, #5)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Agent Record

### Completion Notes List

- Exported `deriveTitle` with module doc comment (paired with `deriveCategory`)
- Added 11 parameterized deriveTitle unit tests plus multi-word SKILL case
- `listSpecs` now prints `{title} — {path}` per spec
- Full §0.2 gate passes

### File List

- `src/discover/specs.ts`
- `src/commands/generate.ts`
- `tests/discover/specs.test.ts`
- `tests/commands/generate.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-2-human-readable-titles-on-list-output.md`

## Change Log

- 2026-07-12: Implemented S2.2 — deriveTitle tests and titled list output
