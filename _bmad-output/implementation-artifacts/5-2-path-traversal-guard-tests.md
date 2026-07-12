---
baseline_commit: e8fc5469c097d987b8d0779e7ab488fd2a1deefc
---

# Story 5.2: Path traversal guard tests

Status: review

## Story

As Alex,
I want writes confined to `--output`,
so that generate cannot escape the target directory.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. Tests cover `..` in slug-derived paths (markdown and HTML writes)
2. No files written outside resolved output directory
3. `output.error` when path guard rejects a write (always); payload includes attempted path, not file content
4. Full §0.2 gate passes

## Tasks / Subtasks

- [x] Task 1: Implement path confinement guard in `writeWiki` / `writeHtmlWiki` (AC: #1, #2, #3)
  - [x] Add `assertPathConfined` helper using `path.resolve` + `path.relative`
  - [x] Call before every write; log `output.error` with relativePath + message, then throw
  - [x] Ensure payloads never include page content
- [x] Task 2: Add malicious slug traversal tests (AC: #1, #2, #3)
  - [x] Test `..` segment slugs rejected in `writeWiki` — no files outside output dir
  - [x] Test `..` segment slugs rejected in `writeHtmlWiki` — no files outside output dir
  - [x] Test `output.error` emission on guard rejection (always, verbose off)
  - [x] Test temp-dir integration: only output dir contains written files after successful writes
- [x] Task 3: Run full §0.2 gate and update build log (AC: #4)
  - [x] Run full quality gate
  - [x] Update IMPLEMENTATION.md

## Dev Notes

Brownfield: S4.2 added basic confinement tests (written paths start with outputDir) but deferred explicit `..` traversal tests per review. AD-7 requires slug-derived filenames reject or normalize `..` segments. Guard at write time in `src/output/wiki.ts`.

**Demo path:**

```bash
npm test -- tests/output/wiki.test.ts -t "path traversal"
```

Expected: guard rejects malicious slugs; `output.error` logged; no files outside temp output dir.

### References

- [Source: epics-and-stories.md — S5.2]
- [Source: HARNESS.md §0.9 — path handling]
- [Source: ARCHITECTURE-SPINE.md — AD-7]
- [Source: 4-2-write-html-wiki-tree-with-path-confinement.md — deferred traversal test]

## Dev Agent Record

### Agent Model Used

Composer

### Implementation Plan

1. Add assertPathConfined helper; wire into writeWiki and writeHtmlWiki
2. Add failing tests for `..` slugs in markdown and HTML writes
3. Run full quality gate

### Completion Notes List

- Added `assertPathConfined` and `PathTraversalError` in `src/output/wiki.ts` — resolves paths and rejects when relative starts with `..` or is absolute
- Guard called before index and page writes in both `writeWiki` and `writeHtmlWiki`
- `output.error` emitted with relativePath + message (no page content) before throw
- Added 5 path traversal tests: markdown `../evil` and nested; HTML `../../evil` and nested (html subdir needs extra `..` to escape); quiet-mode error emission
- Full §0.2 gate passes; 122 tests; output/wiki.ts 100% lines, 93.15% branches

### File List

- `src/output/wiki.ts`
- `tests/output/wiki.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-2-path-traversal-guard-tests.md`

## Change Log

- 2026-07-12: Story file created for E5 S5.2
- 2026-07-12: Implemented path confinement guard and traversal tests

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Reviewer model:** Inline triage (Composer)  
**Outcome:** Approve

### Action Items

- [x] [Review][Pass] assertPathConfined uses path.resolve + path.relative — standard confinement check
- [x] [Review][Pass] output.error payload has relativePath only, no content leakage
- [x] [Review][Pass] HTML tests use slugs that escape outputDir (../../ from html subdir)
- [x] [Review][Pass] Guard runs before writeFile; rejection prevents escaped file creation

## QA Manual Validation

1. Run `npm test -- tests/output/wiki.test.ts -t "path traversal"`
2. Confirm guard rejects `..` slugs for markdown and HTML; output.error logged
3. Run `npm test -- tests/output/wiki.test.ts -t "confines writes"`
4. Confirm successful writes stay within output directory
5. Run `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa`
6. Confirm `find /tmp/specwiki-qa -type f` lists only files under output dir
7. Run `npm test` — all tests pass
