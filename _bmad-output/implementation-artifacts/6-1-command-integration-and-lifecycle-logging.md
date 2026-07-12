---
baseline_commit: 141caaa59f00d452188976eb9ee90f64ec6e755d
---

# Story 6.1: Command integration and lifecycle logging

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex,
I want predictable flags and structured command events with `--verbose`,
so that I script against specwiki and debug CLI issues.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

### Functional

1. `listSpecs` / `generateWiki` unit tests cover flags, defaults, and stdout summaries (success path unchanged)
2. Runtime failures (simulated I/O, parse, or write error) propagate to CLI and exit non-zero
3. User-facing summaries remain on stdout via chalk; zero-match tip unchanged

### Logging & diagnostics (§0.8)

4. `cli.command` logs command name and resolved flags on stderr (verbose only) at command start
5. `cli.error` logs runtime failures with `message` (and safe context like `command`) — always, even without `--verbose`
6. No raw `console.log` for **verbose diagnostics** in `commands/generate.ts` — remove duplicate scan/file-list noise; pipeline stages already log via `discover.*`, `parse.*`, `output.*`
7. User summaries (`✓ Generated wiki…`, category headers, zero-match tip) **stay** on stdout via `console.log` + chalk — not Logger
8. Tests verify `cli.command` emission (verbose on/off) and `cli.error` emission (always on failure)

### Quality measures

9. Full §0.2 gate passes
10. `src/commands/generate.ts` coverage ≥ 90% on touched paths (including error handlers)

## Tasks / Subtasks

- [x] Task 1: Add command lifecycle logging (AC: #4, #5, #6, #7)
  - [x] Emit `cli.command` at start of `generateWiki` and `listSpecs` with `{ command, projectRoot, outputDir?, verbose }`
  - [x] Remove verbose-only `console.log` scan/file-list blocks in `generateWiki` (lines 21–40 today) — rely on existing `discover.*` / `parse.*` stderr events
  - [x] Keep stdout summaries: green checkmark, path lines, file counts, zero-match tip
  - [x] Add `cli.error` helper or inline `log.error("cli.error", { command, message })` before rethrowing/propagating failures
- [x] Task 2: Wire CLI error boundary and non-zero exit (AC: #2, #5)
  - [x] Wrap `generate` and `list` actions in `src/cli.ts` with try/catch
  - [x] On caught error: emit `cli.error` (if not already logged), `process.exit(1)` — **do not** implement exit code 2 yet (S6.2)
  - [x] Ensure `log.setVerbose(opts.verbose)` runs before command body so lifecycle logs respect flag
  - [x] Payload must not include stack traces or secrets — `message` string only
- [x] Task 3: Command integration tests (AC: #1, #8, #10)
  - [x] Unit test: verbose `generateWiki` emits `cli.command` on stderr with resolved paths
  - [x] Unit test: verbose `listSpecs` emits `cli.command` on stderr
  - [x] Unit test: non-verbose mode suppresses `cli.command` (info-gated)
  - [x] Unit test: simulated write/parse failure emits `cli.error` and throws (or exits via cli wrapper test)
  - [x] CLI e2e test: `generate --verbose` stderr includes `cli.command` before `discover.start`
  - [x] Assert no verbose diagnostic strings (`Scanning`, per-file dim list) on stdout during generate
- [x] Task 4: Run full §0.2 gate and update build log (AC: #9, #10)
  - [x] Run full quality gate
  - [x] Update `IMPLEMENTATION.md` build log row for S6.1

## Dev Notes

This story completes **HARNESS Phase 3.2–3.3** command-layer polish. Lower layers (discover, parse, output) already emit structured events. The remaining gap is **command lifecycle** (`cli.command`, `cli.error`) and removing ad-hoc verbose `console.log` diagnostics that duplicate pipeline logs.

**Scope boundary:** Exit code **2 for usage errors** is **S6.2** — this story only adds exit **1** on runtime failure. Do not change Commander invalid-option handling yet.

**Demo path:**

```bash
npm run dev generate -- --verbose --project tests/fixtures/sample-project --output /tmp/specwiki-cli
```

Expected stderr (verbose): `cli.command` → `discover.start` → `discover.match` × N → `discover.complete` → `parse.file` × N → `output.write` × M → `generate.summary`.  
Expected stdout: green summary with page/file counts — **no** dim "Scanning…" or per-file path spam.

```bash
npm run dev list -- --verbose --project tests/fixtures/sample-project
```

Expected stderr: `cli.command` → discover chain. Expected stdout: grouped categories unchanged.

### Current state — files to modify

#### `src/commands/generate.ts` (UPDATE — read fully before editing)

**Today:**

```17:63:src/commands/generate.ts
export async function generateWiki(options: GenerateOptions): Promise<void> {
  log.setVerbose(Boolean(options.verbose));
  const { projectRoot, outputDir, verbose } = options;

  if (verbose) {
    console.log(chalk.dim(`Scanning ${projectRoot} for AI specs...`));
  }
  // ... discover, parse, write ...
  if (verbose) {
    console.log(chalk.dim(`Found ${specFiles.length} spec file(s):`));
    for (const file of specFiles) {
      console.log(chalk.dim(`  ${file.relativePath}`));
    }
  }
  // ...
  log.info("generate.summary", { pageCount, markdownFiles, htmlFiles });
  console.log(chalk.green(`✓ Generated wiki with ${wiki.pages.length} page(s)`));
  // ... more stdout summaries ...
}
```

**Change:** Remove verbose `console.log` scan/file-list block. Add `log.info("cli.command", …)` at function entry. Wrap pipeline in try/catch; on failure call `log.error("cli.error", …)` then rethrow so `cli.ts` can exit 1.

**Preserve:** `printZeroSpecsMessage()` stdout behaviour; chalk success summaries; `log.setVerbose`; `generate.summary` event; `listSpecs` grouping output.

#### `src/cli.ts` (UPDATE — thin error boundary)

**Today:** Actions call `generateWiki` / `listSpecs` with no try/catch; unhandled rejections may exit Node with code 1 but no `cli.error`.

**Change:** Wrap each `.action` handler:

```typescript
try {
  log.setVerbose(Boolean(opts.verbose));
  await generateWiki({ ... });
} catch (err) {
  log.error("cli.error", {
    command: "generate",
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
}
```

Keep Commander option definitions unchanged (`-p`, `-o`, `-v` defaults). `src/cli.ts` is coverage-excluded — validate via `tests/cli.test.ts` subprocess tests.

#### `src/core/Logger.ts` (READ ONLY — do not modify)

Verbose-gated `log.info`; `log.error` always writes JSON lines to stderr. Module-level `verbose` flag set via `log.setVerbose`.

#### `tests/commands/generate.test.ts` (UPDATE)

Already has `parseStderrLines()` helper and verbose pipeline tests. Extend with:

- `cli.command` / `cli.error` assertions
- Failure simulation via `vi.spyOn` on `writeWiki`, `parseSpecFile`, or `discoverSpecs`
- Negative assertion: verbose generate does not stdout-print "Scanning"

#### `tests/cli.test.ts` (UPDATE)

Add subprocess test for `generate --verbose` verifying `cli.command` precedes `discover.start` on stderr.

### Architecture compliance

| Rule                    | Application                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| AD-1 Module direction   | `cli.ts` wires Commander + exit; `commands/generate.ts` orchestrates pipeline + lifecycle logs — no discovery/parse logic in CLI |
| AD-9 Structured logging | `cli.command` (verbose), `cli.error` (always); stderr for diagnostics, stdout for user text                                      |
| AD-10 Quality gate      | Full §0.2 after changes; TDD for new error paths                                                                                 |
| AD-11 Dependency freeze | No new runtime deps                                                                                                              |

### Technical requirements

- **Event payloads for `cli.command`:** `{ command: "generate" \| "list", projectRoot, outputDir?, verbose, patternCount?: number }` — use resolved absolute `projectRoot`; include `outputDir` for generate only
- **Event payloads for `cli.error`:** `{ command, message }` — never `stack`, never file bodies
- **Error propagation:** Lower layers (`parse.error`, `output.error`) already log before throw — `cli.error` is the command-boundary summary; avoid triple-logging identical messages unless the lower layer did not log
- **Commander ^13.1.0:** `.action(async (opts) => …)` pattern; defaults `process.cwd()` and `wiki` already wired

### File structure requirements

```
src/
  cli.ts              # UPDATE — try/catch + process.exit(1)
  commands/generate.ts # UPDATE — cli.command, remove verbose console.log diagnostics, error propagate
tests/
  commands/generate.test.ts  # UPDATE — lifecycle + error tests
  cli.test.ts                # UPDATE — generate --verbose e2e
```

Do **not** create new command files. Do **not** modify `discover/`, `parse/`, `output/` unless a test gap requires it (unlikely).

### Testing requirements

- Mirror existing patterns: `parseStderrLines()` from stderr spy; `logSpy` on `console.log` for stdout assertions
- Failure tests: mock/spy throw once, assert `cli.error` in stderr lines with `level: "error"`
- Coverage: `commands/generate.ts` must stay ≥ 90%; new catch/rethrow branches need explicit tests
- Run targeted tests during dev:
  - `npm test -- tests/commands/generate.test.ts`
  - `npm test -- tests/cli.test.ts`

### Previous story intelligence (E5 S5.2)

- Path guards in `writeWiki` / `writeHtmlWiki` throw `PathTraversalError` after `output.error` — good candidate for command-level failure test (mock or use malicious slug if wired through full pipeline)
- `assertPathConfined` pattern: log then throw — command layer should catch and `cli.error` + exit 1
- Review approved pattern: stderr JSON lines parsed in tests; quiet-mode error emission tested without verbose
- 122 tests passing at baseline; full gate green

### Git intelligence (recent commits)

| Commit                          | Relevance                                                      |
| ------------------------------- | -------------------------------------------------------------- |
| `141caaa` path traversal guards | Errors throw after `output.error` — wire cli.error boundary    |
| `e8fc546` slug collision        | `generate.summary` + collision logging already in command path |
| `8d8b25d` HTML write logging    | Pipeline stderr complete; command layer is last gap            |
| `d70f4b1` output logging        | `generate.summary` exists — do not duplicate                   |

### Latest tech information

No new libraries required. Commander 13.x async actions support top-level await in handlers; `process.exit(1)` after catch is standard for CLI tools on Node ≥ 20.

### Project context reference

- [Source: `_bmad-output/planning-artifacts/discovery/project-context.md` — Module boundaries, logging rules]
- [Source: `HARNESS.md` §0.8 — CLI event names: `cli.command`, `cli.complete`, `cli.error`]
- [Source: `HARNESS.md` Phase 3.2–3.3 — Wire logger through commands; command-level tests]
- [Source: `_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md` — AD-1, AD-9]
- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E6 S6.1]
- [Source: `_bmad-output/implementation-artifacts/5-2-path-traversal-guard-tests.md` — error-before-throw pattern]

### References

- [Source: epics-and-stories.md — S6.1]
- [Source: prd.md — FR-003, FR-016, FR-019–FR-021]
- [Source: src/commands/generate.ts]
- [Source: src/cli.ts]
- [Source: src/core/Logger.ts]
- [Source: tests/commands/generate.test.ts]
- [Source: tests/cli.test.ts]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Added `cli.command` lifecycle event at start of `generateWiki` and `listSpecs` (verbose-gated via `log.info`)
- Removed duplicate verbose `console.log` scan/file-list diagnostics from generate path
- Added `propagateCliError` with `cliErrorLogged` flag to avoid double `cli.error` at CLI boundary
- Wired `src/cli.ts` try/catch with `process.exit(1)` on runtime failures
- 8 new tests (130 total); `generate.ts` coverage 98.16%

### File List

- `src/commands/generate.ts` (modified)
- `src/cli.ts` (modified)
- `tests/commands/generate.test.ts` (modified)
- `tests/cli.test.ts` (modified)
- `IMPLEMENTATION.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:**  
**Review outcome:**  
**Reviewer model:**

### Action Items

### Review Findings

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:**  
**Review date:**

### AC coverage

### Regression risks

### Gaps

### Manual validation steps

1. `npm run dev generate -- --verbose --project tests/fixtures/sample-project --output /tmp/specwiki-qa` — stderr shows `cli.command` then discover/parse/output chain; stdout has green summary only (no "Scanning" spam)
2. `npm run dev list -- --verbose --project tests/fixtures/sample-project` — stderr shows `cli.command` + discover events; stdout grouped categories unchanged
3. `npm run dev generate -- --project /nonexistent-readonly-path --output /tmp/specwiki-qa 2>/tmp/specwiki-err.txt; echo $?` — non-zero exit; stderr contains `cli.error` JSON line
4. `npm test -- tests/commands/generate.test.ts tests/cli.test.ts` — all pass including new lifecycle tests
5. `npm test` — full suite green (122+ tests)

## Change Log

- 2026-07-12: Story file created for E6 S6.1 — ultimate context engine analysis completed
- 2026-07-12: Implemented cli.command/cli.error lifecycle logging, CLI error boundary, 8 new tests; status → review
