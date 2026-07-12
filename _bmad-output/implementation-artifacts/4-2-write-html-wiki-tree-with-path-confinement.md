---
baseline_commit: 38dbf572e371ae509caf1e4953d20a56f97024e1
---

# Story 4.2: Write HTML wiki tree with path confinement

Status: review

## Story

As Alex,
I want browsable `wiki/html/`,
so that I open index in a browser without a server.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `writeHtmlWiki` creates `html/index.html` and `html/{slug}.html`
2. Path traversal guards; temp-dir integration tests confine writes to output directory
3. `output.write` logs each HTML path (verbose only) with `html/` relative prefix
4. `output.error` on mkdir/write failures (always), then rethrow
5. Tests verify verbose emission for HTML writes; quiet mode emits none
6. Full §0.2 gate passes; `writeHtmlWiki` coverage ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Wire structured output logging in `writeHtmlWiki` (AC: #3, #4)
  - [x] Import existing `log` pattern from `writeWiki`
  - [x] Emit `output.write` with `html/...` relativePath per HTML file (verbose only)
  - [x] Emit `output.error` with relativePath + message on mkdir/write failure (always), then rethrow
- [x] Task 2: Expand `writeHtmlWiki` unit/integration tests (AC: #1, #2, #5)
  - [x] Test writes `html/index.html` and `html/{slug}.html`
  - [x] Test path confinement to resolved output directory
  - [x] Test output.write verbose vs quiet; output.error on mkdir/write/page failures
- [x] Task 3: Update generate integration test for HTML output.write (AC: #3, #5)
  - [x] Assert `output.write` events include `html/index.html` when generate --verbose
  - [x] Assert generate.summary htmlFiles count matches HTML writes
- [x] Task 4: Run full §0.2 gate and update build log (AC: #6)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield: `writeHtmlWiki` already creates `html/index.html` and `html/{slug}.html` but lacks §0.8 logging and error handling. Mirror `writeWiki` patterns from S3.2. HTML safety (escapeHtml) completed in S4.1.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --verbose
```

Expected stderr: `discover.*` → `parse.file` → `output.write` per `.md` and `.html` → `generate.summary`.

### References

- [Source: epics-and-stories.md — S4.2]
- [Source: HARNESS.md §0.8 — output.write, output.error]
- [Source: src/output/wiki.ts — writeWiki logging pattern]
- [Source: 3-2-write-categorized-markdown-wiki-tree.md — prior output logging story]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Add try/catch + log calls to writeHtmlWiki mirroring writeWiki
2. Expand tests/output/wiki.test.ts for HTML logging and confinement
3. Update generate integration test for HTML output.write events
4. Run full quality gate

### Completion Notes List

- Added `output.write` (verbose) and `output.error` (always) to `writeHtmlWiki` with `html/` relative paths
- Added 8 writeHtmlWiki tests: file creation, path confinement, verbose/quiet logging, mkdir/index/page error branches
- Updated generate integration test to separate md vs html output.write events and assert htmlFiles in generate.summary
- Full §0.2 gate passes; 108 tests; output/wiki.ts 100% lines, 92.59% branches
- Review patches: all Pass items confirmed; `..` traversal test deferred to E5 S5.2 per review

### File List

- `src/output/wiki.ts`
- `tests/output/wiki.test.ts`
- `tests/commands/generate.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-2-write-html-wiki-tree-with-path-confinement.md`

## Change Log

- 2026-07-12: Story file created for E4 S4.2
- 2026-07-12: Implemented HTML write logging, confinement tests, generate integration update

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Reviewer model:** Inline triage (subagent unavailable — API limit)  
**Outcome:** Approve with minor deferrals

### Action Items

- [x] [Review][Pass] writeHtmlWiki mirrors writeWiki logging pattern consistently
- [x] [Review][Pass] output.write uses html/ relative paths; no content leakage in payloads
- [x] [Review][Pass] Error branches covered for mkdir, index write, page write including non-Error rejections
- [ ] [Review][Defer] Explicit `..` segment path traversal test — deferred to E5 S5.2 per epic plan

## QA Manual Validation

1. Run `npm test -- tests/output/wiki.test.ts -t "writeHtmlWiki"`
2. Confirm HTML write, confinement, and logging tests pass
3. Run `npm test -- tests/commands/generate.test.ts -t "output.write"`
4. Confirm generate verbose emits `html/index.html` in output.write events
5. Run `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa --verbose 2>&1 | grep output.write`
6. Confirm stderr shows both `.md` and `html/*.html` paths
7. Open `/tmp/specwiki-qa/html/index.html` in browser — verify browsable index with nav links
8. Run `npm test` — all tests pass
