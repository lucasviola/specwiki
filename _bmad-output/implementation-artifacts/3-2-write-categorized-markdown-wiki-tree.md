---
baseline_commit: f8aac39b49d400e838f3a04459f12f9b6e7d08a9
---

# Story 3.2: Write categorized markdown wiki tree

Status: done

## Story

As Alex,
I want `wiki/index.md` and `{slug}.md` files,
so that I browse specs in my editor.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `pageSlug`, `buildPageContent`, `buildIndex`, `writeWiki` match frozen layout
2. Writes confined to resolved output directory
3. `output.write` logs target relative path per markdown file (verbose only)
4. `output.error` on mkdir/write failures (always)
5. `generate.summary` log with page count (verbose only) in command layer
6. No full file contents in log payloads
7. Tests verify verbose vs quiet output logging
8. Full §0.2 gate passes; `output/wiki.ts` coverage ≥ 90% on touched functions

## Tasks / Subtasks

- [x] Task 1: Wire structured output logging in `writeWiki` (AC: #3, #4, #6)
  - [x] Import `log` from `src/core/Logger.js`
  - [x] Emit `output.write` with relativePath per markdown file (verbose only)
  - [x] Emit `output.error` with path + message on mkdir/write failure (always), then rethrow
- [x] Task 2: Expand output unit tests (AC: #1, #2, #7)
  - [x] Test pageSlug edge cases (nested paths, untitled fallback)
  - [x] Test buildIndex category grouping and unknown-category label fallback
  - [x] Test buildPageContent without sections/description
  - [x] Test output.write verbose vs quiet; output.error on write failure
  - [x] Test writeWiki confines files to output directory
- [x] Task 3: Integration test in generate command (AC: #5, #7)
  - [x] Assert `output.write` events on stderr when generate --verbose
  - [x] Assert `generate.summary` with pageCount when verbose
- [x] Task 4: Run full §0.2 gate and update build log (AC: #8)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield: `pageSlug`, `buildPageContent`, `buildIndex`, `writeWiki` already exist in `src/output/wiki.ts`. This story hardens behaviour with tests and adds §0.8 output logging matching `parseSpecFile` patterns. HTML write logging deferred to E4 S4.2.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --verbose
```

Expected stderr: `discover.*` → `parse.file` → `output.write` per markdown file → `generate.summary`.

### References

- [Source: epics-and-stories.md — S3.2]
- [Source: HARNESS.md §0.8 — output.write, output.error]
- [Source: src/parse/markdown.ts — logging pattern]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Add try/catch + log calls to writeWiki
2. Add generate.summary to generateWiki command
3. Expand tests/output/wiki.test.ts for behaviour + logging
4. Add generate integration test for output.write and generate.summary
5. Run full quality gate

### Completion Notes List

- Added `output.write` (verbose) and `output.error` (always) to `writeWiki` with path-only payloads
- Added `generate.summary` verbose event in `generateWiki` with pageCount and file counts
- Expanded wiki tests: slug edge cases, index grouping, content layout, path confinement, logging quiet/verbose/error branches
- Added generate integration test asserting output.write and generate.summary when verbose
- Full §0.2 gate passes; 90 tests; output/wiki.ts 95% branch coverage

### File List

- `src/output/wiki.ts`
- `src/commands/generate.ts`
- `tests/output/wiki.test.ts`
- `tests/commands/generate.test.ts`
- `IMPLEMENTATION.md`
- `HARNESS.md` (prettier format only)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-2-write-categorized-markdown-wiki-tree.md`

## Change Log

- 2026-07-12: Story file created for E3 S3.2
- 2026-07-12: Addressed code review patch — output.error uses relativePath instead of absolute path

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Review outcome:** Approve  
**Reviewer model:** Inline triage (implementer model — recommend re-review on different LLM before commit)

### Action Items

- [x] [Review][Patch] Use relativePath in output.error payloads instead of absolute path — matches output.write and parse.error conventions [`src/output/wiki.ts`]
- [ ] [Review][Defer] CLI e2e for `generate --verbose` asserting `output.write` on stderr — integration test in `generate.test.ts` satisfies AC; CLI parity optional [`tests/cli.test.ts`]

### Review Findings

- [x] [Review][Pass] output.write emits relativePath only, no file contents in payload
- [x] [Review][Pass] output.error on mkdir, index write, and page write failures with rethrow
- [x] [Review][Pass] output.error uses relativePath (not absolute path) for log consistency
- [x] [Review][Pass] generate.summary includes pageCount and markdownFiles
- [ ] [Review][Defer] CLI e2e for generate verbose output.write — deferred; command-layer test covers AC

### AC Verification

| AC                          | Status | Evidence                              |
| --------------------------- | ------ | ------------------------------------- |
| #1 Frozen layout            | PASS   | 8 buildWiki tests + write integration |
| #2 Path confinement         | PASS   | writeWiki confines test               |
| #3 output.write verbose     | PASS   | Unit + integration tests              |
| #4 output.error always      | PASS   | mkdir/index/page failure tests        |
| #5 generate.summary         | PASS   | generate integration test             |
| #6 No file contents in logs | PASS   | Payload assertions                    |
| #7 Verbose vs quiet         | PASS   | Both paths tested                     |
| #8 Quality gate + coverage  | PASS   | 90 tests; wiki.ts 95% branches        |

## QA Manual Validation

1. Run `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa --verbose`
2. Confirm stderr JSON events: `discover.start` → `discover.match` (×N) → `parse.file` (×N) → `output.write` (index + pages) → `generate.summary`
3. Confirm `/tmp/specwiki-qa/index.md` exists with categorized links
4. Confirm `/tmp/specwiki-qa/*.md` page files exist and contain source path blockquote
5. Run same command without `--verbose` — no `output.write` or `generate.summary` on stderr
6. Run `npm test` — 90 tests pass
