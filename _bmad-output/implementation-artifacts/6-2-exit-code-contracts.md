---
baseline_commit: 8bd0ad0f937e6c3814e559a0e20e4fbd7be313de
---

# Story 6.2: Exit code contracts

Status: review

## Story

As Alex,
I want exit code 2 for usage errors and 1 for runtime failures,
so that scripts distinguish failure modes.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

### Functional

1. Usage errors (unknown option, unknown command, missing option value) exit **2**
2. Runtime failures (I/O, parse, write) exit **1** (unchanged from S6.1)
3. Success paths exit **0** (unchanged)
4. Exit code contract documented in `IMPLEMENTATION.md`

### Logging & diagnostics (§0.8)

5. `cli.error` logs usage errors on stderr before exit 2
6. `cli.error` logs runtime errors on stderr before exit 1 (already wired in S6.1)

### Quality measures

7. Full §0.2 gate passes
8. Tests cover usage exit code 2 and runtime exit code 1

## Tasks / Subtasks

- [x] Task 1: Wire Commander usage-error exit code 2 (AC: #1, #5)
  - [x] Add `program.exitOverride()` and catch `CommanderError` at parse boundary
  - [x] Map usage error codes (`unknownOption`, `unknownCommand`, `missingArgument`, etc.) to `cli.error` + `process.exit(2)`
  - [x] Preserve runtime action handlers exiting 1 on caught errors
- [x] Task 2: CLI exit code tests (AC: #2, #3, #8)
  - [x] Subprocess test: invalid flag → exit 2 + `cli.error` on stderr
  - [x] Subprocess test: unknown command → exit 2 + `cli.error`
  - [x] Subprocess test: missing `--project` value → exit 2
  - [x] Assert existing runtime failure test still exits 1
  - [x] Assert success paths still exit 0 (list empty project, generate success)
- [x] Task 3: Document and gate (AC: #4, #7)
  - [x] Add exit code table to `IMPLEMENTATION.md`
  - [x] Run full §0.2 quality gate
  - [x] Update build log row for S6.2

## Dev Notes

**Scope:** S6.1 wired runtime exit 1 and deferred usage exit 2. Commander defaults all errors to exit 1 — this story adds explicit **2 for usage/validation** per FR-022 and AD-10.

**Demo path:**

```bash
node --import tsx/esm src/cli.ts generate --bogus-flag; echo $?
# Expected: exit 2; stderr has human-readable error + cli.error JSON line

node --import tsx/esm src/cli.ts generate --project tests/fixtures/sample-project --output AGENTS.md; echo $?
# Expected: exit 1; cli.error for write failure
```

### Current state — `src/cli.ts`

**Today:** Action handlers catch runtime errors and `process.exit(1)`. Commander usage errors call `process.exit(1)` directly — no `cli.error`.

**Change:** Wrap `program.parse()` with `exitOverride()` (throw mode). On `CommanderError` with usage codes → `log.error("cli.error", …)` + `process.exit(2)`. Non-usage Commander errors use `err.exitCode`. Runtime catch blocks unchanged at exit 1.

**Usage error codes to map (Commander 13):**

- `commander.unknownOption`
- `commander.unknownCommand`
- `commander.missingArgument`
- `commander.optionMissingArgument`
- `commander.missingMandatoryOptionValue`
- `commander.conflictingOption`
- `commander.excessArguments`
- `commander.invalidArgument`

**Do not** change zero-match exit 0 behaviour (FR-004).

### References

- [Source: epics-and-stories.md — S6.2]
- [Source: prd.md — FR-022]
- [Source: architecture/ARCHITECTURE-SPINE.md — AD-10, exit codes]
- [Source: 6-1-command-integration-and-lifecycle-logging.md — scope boundary deferring exit 2]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

Commander subcommands copy `_exitCallback` at creation time — `exitOverride()` must be called **before** `.command()` registration.

### Completion Notes List

- Added `program.exitOverride()` before subcommand registration; catch `CommanderError` at parse boundary
- Usage errors map to `cli.error` + exit 2; runtime handlers unchanged at exit 1
- 4 new CLI subprocess tests (134 total); exit code table added to IMPLEMENTATION.md
- Full §0.2 gate green; repo coverage 99.67%

### File List

- `src/cli.ts` (modified)
- `tests/cli.test.ts` (modified)
- `IMPLEMENTATION.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/6-2-exit-code-contracts.md` (added)

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. -->

**Review date:** 2026-07-12  
**Review outcome:** Approve  
**Reviewer model:** Inline triage (Composer)

### Action Items

### Review Findings

- [x] [Review][Defer] Bare `specwiki` (no subcommand) still exits 1 via `commander.help` — not in AC demo path; acceptable for MVP

## QA Manual Validation

**QA model:** Inline analysis (Composer)  
**Review date:** 2026-07-12

### AC coverage

| AC | Status | Evidence |
| -- | ------ | -------- |
| #1 Usage → 2 | ✓ | CLI tests: unknown option, unknown command, missing --project value |
| #2 Runtime → 1 | ✓ | Existing write-failure test unchanged |
| #3 Success → 0 | ✓ | Empty list + successful generate tests |
| #4 Documented | ✓ | IMPLEMENTATION.md exit code table |
| #5 cli.error usage | ✓ | All usage-error tests assert cli.error JSON |
| #6 cli.error runtime | ✓ | S6.1 boundary preserved |
| #7 Quality gate | ✓ | Full §0.2 green |
| #8 Tests | ✓ | 4 new exit code tests |

### Regression risks

- Subcommands added without parent `exitOverride` first would revert to exit 1 for usage errors — document in code comment if needed
- Commander version bump could add new usage error codes not in `USAGE_ERROR_CODES` set

### Gaps

- No test for `commander.invalidArgument` (no custom argument validators yet)

### Manual validation steps

1. `npm run dev generate -- --bogus-flag; echo $?` — exit 2; stderr includes `cli.error` JSON
2. `npm run dev generate -- --project tests/fixtures/sample-project --output AGENTS.md; echo $?` — exit 1; `cli.error` present
3. `npm run dev list -- --project tests/fixtures/sample-project; echo $?` — exit 0
4. `npm test -- tests/cli.test.ts` — 9 tests pass including exit code suite
5. `npm test` — 134 tests pass

## Change Log

- 2026-07-12: Story file created for E6 S6.2
- 2026-07-12: Implemented exit code contracts; 4 new tests; status → review
