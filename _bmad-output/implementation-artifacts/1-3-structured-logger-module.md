---
baseline_commit: 0ba9812a3812cafe0f1ca9a615846b89de3e7c31
---

# Story 1.3: Structured Logger module

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a shared verbose-gated logger,
so that every feature story emits consistent diagnostics.

## Acceptance Criteria

1. `src/core/Logger.ts` with `log.info` (verbose-gated) and `log.error` (always)
2. Dot-separated event names; JSON-serializable payload objects
3. No business logic in Logger module
4. Logger unit tests cover verbose gate and error-always behaviour
5. Logger writes to stderr; no stdout pollution
6. Full §0.2 gate passes
7. `Logger.ts` has unit tests; coverage on `src/core/` ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Create Logger module (AC: #1, #2, #3, #5)
  - [x] Add `src/core/Logger.ts` exporting `log` with `info`, `error`, and `setVerbose`
  - [x] `log.info` emits JSON-structured events to stderr only when verbose is enabled
  - [x] `log.error` always emits JSON-structured events to stderr
  - [x] Payload objects are JSON-serializable; event names use dot-separated convention
  - [x] No business logic — pure logging infrastructure only
- [x] Task 2: Add unit tests (AC: #4, #7)
  - [x] Test `log.info` suppressed when verbose is false
  - [x] Test `log.info` emits when verbose is true
  - [x] Test `log.error` emits regardless of verbose flag
  - [x] Test output goes to stderr, not stdout
  - [x] Test payload serialization and event name format
- [x] Task 3: Run full §0.2 gate and update build log (AC: #6)
  - [x] Run `test`, `lint`, `format`, `coverage`, `typecheck`, `build`
  - [x] Confirm `src/core/` coverage ≥ 90%
  - [x] Update IMPLEMENTATION.md build log row for S1.3

## Dev Notes

Foundation story — introduces `src/core/Logger.ts` only. **Do not wire Logger into `commands/generate.ts` or other modules** in this story; that is E6 S6.1.

### Logger API (HARNESS §0.8, AD-9)

```typescript
import { log } from "./core/Logger.js";

log.setVerbose(true); // called by CLI when --verbose set (future stories)
log.info("discover.start", { projectRoot, patternCount });
log.error("parse.error", { path, message });
```

### Output Contract

- Write structured JSON lines to **stderr** only
- Format: `{"event":"<dot.separated.name>","level":"info|error",...payload}`
- `log.info` is a no-op (no string formatting) when verbose is false
- `log.error` always emits regardless of verbose state

### Event Names (for reference — wired in later stories)

`discover.start`, `discover.match`, `parse.file`, `output.write`, `cli.command`, `cli.error`

### Test Layout

```
tests/
  core/Logger.test.ts   ↔ src/core/Logger.ts
```

Mirror `src/` under `tests/` per project-context.md.

### Coverage

- `src/core/` must reach ≥ 90% on lines/functions/branches/statements
- `src/cli.ts` remains excluded from coverage

### IMPLEMENTATION.md Updates

After gate passes:

- Update status header: current position → E1 complete or E2 S2.1
- Update test count
- Mark structured logger deliverable as complete
- Append build log row with full §0.2 gate result

### References

- [Source: HARNESS.md §0.8 — Structured logging]
- [Source: epics-and-stories.md — S1.3 acceptance criteria]
- [Source: ARCHITECTURE-SPINE.md — AD-9]
- [Source: project-context.md — Module boundaries, testing rules]
- [Source: prd/prd.md — NFR-006, NFR-007]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Implementation Plan

1. Create `src/core/Logger.ts` with verbose-gated `log.info` and always-on `log.error`
2. Write 7 unit tests covering verbose gate, error-always, stderr-only output
3. Run full §0.2 gate and update IMPLEMENTATION.md

### Completion Notes List

- Added `src/core/Logger.ts` — JSON-structured events to stderr; `log.info` no-op when verbose false
- Added `tests/core/Logger.test.ts` — 7 tests for verbose gate, error-always, stderr-only, payload format
- Full §0.2 gate passes; 24 tests total; `src/core/` at 100% coverage
- Logger not wired into commands yet — deferred to E6 S6.1 per story scope
- Code review fixes: canonical `event`/`level` cannot be overwritten by payload; safe fallback for non-serializable payloads; `verbose` state made module-private

### File List

- `src/core/Logger.ts` (new)
- `tests/core/Logger.test.ts` (new)
- `IMPLEMENTATION.md` (modified)
- `_bmad-output/implementation-artifacts/1-3-structured-logger-module.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-07-12: Story file created for E1 S1.3
- 2026-07-12: Implemented structured Logger module with 7 unit tests — ready for review
- 2026-07-12: Addressed code review — payload field precedence, serialization fallback, 2 additional tests (24 total)
