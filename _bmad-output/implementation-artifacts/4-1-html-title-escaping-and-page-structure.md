---
baseline_commit: d70f4b183a2a90eda26928cb445d3874ea7ce49b
---

# Story 4.1: HTML title escaping and page structure

Status: done

## Story

As Alex,
I want HTML pages safe from title injection,
so that malicious spec titles cannot break my browser.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `escapeHtml` / `wrapHtml` / `renderMarkdown` safety verified with malicious title strings
2. Tests verify HTML page structure intent (DOCTYPE, charset, nav, escaped title)
3. `render.error` on markdown parse failure (always), then rethrow
4. No logging of unsanitized user title strings at info level
5. Full §0.2 gate passes; HTML-related functions coverage ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Export and harden `escapeHtml` / `wrapHtml` (AC: #1, #2)
  - [x] Export `escapeHtml` and `wrapHtml` for direct unit testing
  - [x] Escape all HTML-significant characters in titles (`&`, `<`, `>`, `"`, `'`)
  - [x] Unit tests for malicious title strings and structure intent
- [x] Task 2: Add `render.error` to `renderMarkdown` (AC: #3, #4)
  - [x] Wrap `marked.parse` in try/catch; emit `render.error` with message only (no title)
  - [x] Rethrow after logging
  - [x] Tests: render.error always emitted; quiet and verbose both log errors
- [x] Task 3: Integration tests for HTML safety via `writeHtmlWiki` (AC: #1, #2)
  - [x] Malicious title variants produce safe `<title>` in written HTML
  - [x] Index page structure verified
- [x] Task 4: Run full §0.2 gate and update build log (AC: #5)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield: `escapeHtml`, `wrapHtml`, `renderMarkdown` already exist. `wrapHtml` already escapes titles; one basic integration test exists. This story exports helpers for direct testing, hardens escaping, adds `render.error` logging, and expands malicious-title + structure tests. HTML write logging (`output.write`) deferred to E4 S4.2.

**Demo path:**

```bash
npm run test -- tests/output/wiki.test.ts -t "escapes HTML"
```

Expected: malicious title `Title <script>alert("x")</script>` escaped in `<title>`.

### References

- [Source: epics-and-stories.md — S4.1]
- [Source: HARNESS.md §0.8 — render.error]
- [Source: HARNESS.md Phase 2.4 — HTML safety tests]
- [Source: project-context.md — HTML escaping frozen contract]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Export escapeHtml/wrapHtml; add apostrophe escaping
2. Add unit tests for escapeHtml, wrapHtml structure, malicious titles
3. Add render.error to renderMarkdown with tests
4. Expand writeHtmlWiki integration tests
5. Run full quality gate

### Completion Notes List

- Exported `escapeHtml` and `wrapHtml`; added `&#39;` apostrophe escaping
- Added 5 escapeHtml/wrapHtml unit tests covering malicious payloads and page structure
- Added `render.error` to `renderMarkdown` with message-only payload (no title leakage)
- Added 3 renderMarkdown error/logging tests
- Added writeHtmlWiki index structure test and ampersand/apostrophe title integration test
- Full §0.2 gate passes; 100 tests; output/wiki.ts and parse/markdown.ts 100% line coverage

### File List

- `src/output/wiki.ts`
- `src/parse/markdown.ts`
- `tests/output/wiki.test.ts`
- `tests/parse/markdown.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-1-html-title-escaping-and-page-structure.md`

## Change Log

- 2026-07-12: Story file created for E4 S4.1
- 2026-07-12: Implemented HTML escaping hardening, render.error logging, expanded tests

## QA Manual Validation

1. Run `npm test -- tests/output/wiki.test.ts -t "escapeHtml|wrapHtml|escapes HTML"`
2. Confirm malicious title tests pass — `<script>` and `&` escaped in `<title>`
3. Run `npm test -- tests/parse/markdown.test.ts -t "render.error"`
4. Confirm render.error emitted on mocked parse failure regardless of verbose
5. Run `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa`
6. Open `/tmp/specwiki-qa/html/index.html` in browser — verify nav link and page structure
7. Run `npm test` — 100 tests pass
