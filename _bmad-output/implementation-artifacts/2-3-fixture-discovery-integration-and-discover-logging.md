---
baseline_commit: d5563be074dbda2b5576e1f1193bdb038ed3fe6c
---

# Story 2.3: Fixture discovery integration and discover logging

Status: done

## Story

As Alex,
I want `specwiki list` to find all specs and show discover diagnostics with `--verbose`,
so that I trust discovery and can debug pattern misses.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `discoverSpecs` returns expected count on fixture (≥ 5; actual 10)
2. Sorted by category then `relativePath`; ignores node_modules/dist/wiki/.specwiki
3. Default patterns cover Cursor, OpenSpec/Kiro, Copilot, root agents
4. `discover.start` logs project root and pattern count (verbose only)
5. `discover.match` logs each relative path (verbose only)
6. `discover.error` on glob/read failures (always via `log.error`)
7. Payloads: paths and counts only — no file bodies (NFR-007)
8. Tests verify verbose vs non-verbose stderr behaviour
9. Full §0.2 gate passes
10. `discoverSpecs` coverage ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Wire structured logging into `discoverSpecs` (AC: #4, #5, #6, #7)
  - [x] Import `log` from `src/core/Logger.js`
  - [x] Emit `discover.start` with projectRoot and patternCount
  - [x] Emit `discover.match` for each matched relativePath
  - [x] Wrap glob in try/catch; emit `discover.error` on failure
- [x] Task 2: Add `--verbose` to `specwiki list` CLI (AC: #8)
  - [x] Add `-v, --verbose` option to list command
  - [x] Call `log.setVerbose` before discover in list and generate commands
- [x] Task 3: Fixture discovery integration tests (AC: #1, #2, #3, #8)
  - [x] Assert fixture discovers ≥ 5 specs (actual 10)
  - [x] Test verbose stderr emits discover.start + discover.match events
  - [x] Test default mode emits no discover info logs on stderr
  - [x] Test discover.error on glob failure
- [x] Task 4: Run full §0.2 gate and update build log (AC: #9, #10)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield baseline already discovers and categorizes specs in `discoverSpecs`. This story **adds structured logging** deferred from S2.1/S2.2.

**Demo path:**

```bash
npm run dev list -- --verbose --project tests/fixtures/sample-project
```

Expected stderr (verbose): `discover.start` then one `discover.match` per file. Default mode: quiet stderr for info events.

### References

- [Source: epics-and-stories.md — S2.3]
- [Source: HARNESS.md §0.8 Structured logging]
- [Source: src/core/Logger.ts]
- [Source: S2.1 — "Do not wire Logger into discover yet — that is S2.3"]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Add discover.start/match/error events to discoverSpecs
2. Wire log.setVerbose via CLI for list and generate commands
3. Add stderr behaviour tests and fixture count assertion

### Completion Notes List

- Wired `discover.start`, `discover.match`, `discover.complete`, and `discover.error` into `discoverSpecs`
- Added `--verbose` to `specwiki list`; `listSpecs` and `generateWiki` call `log.setVerbose` from options
- Added 8 tests including CLI e2e, non-Error glob failure, and verbose command wiring
- Full §0.2 gate passes; 60 tests; `discover/specs.ts` at 100% lines / 100% branches

### File List

- `src/discover/specs.ts`
- `src/cli.ts`
- `tests/discover/specs.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `tests/cli.test.ts`
- `_bmad-output/implementation-artifacts/2-3-fixture-discovery-integration-and-discover-logging.md`

## Change Log

- 2026-07-12: Story file created for E2 S2.3
- 2026-07-12: Addressed code review — discover.complete, verbose wiring, CLI e2e test
