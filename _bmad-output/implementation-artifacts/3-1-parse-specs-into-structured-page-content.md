---
baseline_commit: 58c138835aa00dfe393b888b4b28cd3b3766229d
---

# Story 3.1: Parse specs into structured page content

Status: done

## Story

As Alex,
I want each spec parsed with frontmatter, TOC, and description,
so that wiki pages are navigable.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `extractSections` / `extractDescription` / `parseSpecFile` behaviour verified with tests
2. Frontmatter `title` overrides derived title; raw body preserved in `rawContent`
3. No eval, dynamic import, or network I/O in parse module
4. `parse.file` logs relative path per parsed spec (verbose only)
5. `parse.error` logs path + message on read/parse failure (always)
6. No full file contents in log payloads
7. Tests verify verbose vs quiet parse logging
8. Full §0.2 gate passes; `parse/markdown.ts` coverage ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Wire structured parse logging in `parseSpecFile` (AC: #1, #4, #5, #6)
  - [x] Import `log` from `src/core/Logger.js`
  - [x] Emit `parse.file` with relativePath on success (verbose only)
  - [x] Emit `parse.error` with path + message on failure (always), then rethrow
- [x] Task 2: Expand parse unit tests (AC: #1, #2, #7)
  - [x] Test description truncation (300 chars) and heading skip
  - [x] Test section extraction edge cases (no headings, multiple levels)
  - [x] Test rawContent preserves body after frontmatter strip
  - [x] Test parse.file verbose vs quiet; parse.error on missing file
- [x] Task 3: Integration test in generate command (AC: #4, #7)
  - [x] Assert `parse.file` events on stderr when generate --verbose
- [x] Task 4: Run full §0.2 gate and update build log (AC: #8)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield: `parseSpecFile`, `extractSections`, `extractDescription` already exist in `src/parse/markdown.ts`. This story hardens behaviour with tests and adds §0.8 parse logging matching `discoverSpecs` patterns.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --verbose
```

Expected stderr: `discover.*` events followed by one `parse.file` per discovered spec.

### References

- [Source: epics-and-stories.md — S3.1]
- [Source: HARNESS.md §0.8 — parse.file, parse.error]
- [Source: src/discover/specs.ts — logging pattern]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Add try/catch + log calls to parseSpecFile
2. Expand tests/parse/markdown.test.ts for behaviour + logging
3. Add generate verbose parse.file integration test
4. Run full quality gate

### Completion Notes List

- Added `parse.file` (verbose) and `parse.error` (always) to `parseSpecFile` with path-only payloads
- Expanded parse tests: rawContent, description truncation, heading skip, section levels, logging quiet/verbose/error
- Added generate integration test asserting one `parse.file` per discovered spec when verbose
- Addressed code review: invalid frontmatter parse.error, non-string title fallback, non-Error catch branch
- Full §0.2 gate passes; 76 tests; parse/markdown.ts 100% line coverage

### File List

- `src/parse/markdown.ts`
- `tests/parse/markdown.test.ts`
- `tests/commands/generate.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-1-parse-specs-into-structured-page-content.md`

## Change Log

- 2026-07-12: Story file created for E3 S3.1
- 2026-07-12: Addressed code review patches — frontmatter error, title fallback, non-Error catch tests

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Review outcome:** Approve  
**Reviewer model:** Inline triage (alternate LLM subagents unavailable — API limit)

### Action Items

- [x] [Review][Patch] Add test for invalid YAML frontmatter triggering `parse.error` [`tests/parse/markdown.test.ts`]
- [x] [Review][Patch] Add test for non-string `frontmatter.title` falling back to `file.title` [`tests/parse/markdown.test.ts`]
- [x] [Review][Patch] Cover non-`Error` throw branch in catch (`String(err)` path) [`src/parse/markdown.ts:83`]
- [x] [Review][Defer] CLI e2e for `generate --verbose` asserting `parse.file` on stderr — integration test in `generate.test.ts` satisfies AC; CLI parity optional [`tests/cli.test.ts`]

### Review Findings

- [x] [Review][Patch] Add test for invalid YAML frontmatter triggering `parse.error` — `matter()` failures share catch with read errors but only ENOENT is tested
- [x] [Review][Patch] Add test for non-string `frontmatter.title` (e.g. numeric) falling back to discovered title — branch at `markdown.ts:60-62` untested
- [x] [Review][Patch] Cover non-`Error` throw branch in catch block — coverage report shows line 83 uncovered
- [x] [Review][Defer] CLI e2e for generate verbose parse.file — deferred; command-layer test asserts one parse.file per discover.match

### AC Verification

| AC                          | Status | Evidence                              |
| --------------------------- | ------ | ------------------------------------- |
| #1 Parse behaviour tested   | PASS   | 14 parse tests + generate integration |
| #2 Frontmatter + rawContent | PASS   | Dedicated tests                       |
| #3 No eval/import/network   | PASS   | Only fs read + gray-matter            |
| #4 parse.file verbose       | PASS   | Unit + integration tests              |
| #5 parse.error always       | PASS   | Missing-file + frontmatter tests      |
| #6 No file contents in logs | PASS   | Assertions on payloads                |
| #7 Verbose vs quiet         | PASS   | Both paths tested                     |
| #8 Quality gate + coverage  | PASS   | 76 tests; markdown.ts 100% lines      |
