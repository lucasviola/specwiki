---
baseline_commit: 7f784c685c6e4e6af2635828c939320f3af969da
---

# Story 8.4: README.md Discovery and Folder Index

Status: review

## Story

As a project maintainer,
I want `README.md` files discovered and used as folder index content on the wiki,
so that category sections reflect project-authored folder documentation instead of link-only lists.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `specwiki generate --project tests/fixtures/sample-project` — root or folder `README.md` appears in `list` output; `wiki/index.md` and `wiki/html/index.html` use README body as the introductory content for the matching category section; root `README.md` replaces the default index boilerplate.

**Binds:** FR-035 | **Depends:** S8.3 (README in extended patterns)

## Acceptance Criteria

### Functional

1. When `README.md` is discovered in a directory that also contains other spec files, its parsed body is rendered as the introductory content for that category section on `wiki/index.md` and `wiki/html/index.html` (above the page link list for that category)
2. Root `README.md` (`category: root`) replaces the auto-generated "Structured documentation generated from…" boilerplate on the main wiki index; category link lists still follow
3. `README.md` remains a normal wiki page (`wiki/{slug}.md` / `wiki/html/{slug}.html`) in addition to its index role — no silent omission from page output
4. Folders with `README.md` but no other discovered specs in that category: README still indexed as a standalone page; no empty category section
5. Fixture test covers at least one folder README driving category index content and one root README driving main index intro

### Logging & diagnostics (§0.8)

6. `parse.readme-index` when a README is bound to a category index section (verbose); `{ relativePath, category }`
7. `output.index` summary includes `readmeIndexCount` (verbose)

### Quality measures

8. Full §0.2 gate; `buildIndex` / HTML index renderer coverage on touched paths

## Tasks / Subtasks

- [x] README index binding module (AC: 1, 2, 4, 6)
  - [x] Write failing tests for binding rules, root intro, category-only-README skip
  - [x] Add `src/output/readme-index.ts` with `resolveReadmeIndexBindings`
  - [x] Wire binding into `buildWiki`; emit `parse.readme-index` when verbose
- [x] Markdown and HTML index output (AC: 1, 2, 3, 7)
  - [x] Update `buildIndex` for root intro and category intros
  - [x] Update HTML renderer + `index.mustache` for rendered intro content
  - [x] Emit `output.index` with `readmeIndexCount` when verbose
- [x] Fixture and integration tests (AC: 5, 8)
  - [x] Add `packages/nested/README.md` fixture with distinctive intro text
  - [x] Integration tests on `buildWiki` / `writeHtmlWiki` for root and folder README intros
  - [x] Run six-command HARNESS §0.2 quality gate
  - [x] Update `IMPLEMENTATION.md`, Dev Agent Record, File List

## Dev Notes

### Implementation Plan

- **Binding rules:** Root `README.md` → main index intro (always when present). Nested `README.md` → category section intro when its directory contains at least one other discovered spec file. Category sections omitted when category has no non-README specs.
- **Content source:** Use `ParsedSpec.rawContent` (parsed body after frontmatter strip) — not the full wiki page wrapper.
- **Same category, multiple folder READMEs:** Concatenate intros in `relativePath` localeCompare order, separated by blank line.
- **Module:** `src/output/readme-index.ts` (leaf); `buildWiki` calls resolver after pages built.
- **HTML intros:** Render markdown via existing `renderMarkdown`; inject as triple-mustache `{{{introHtml}}}` in category sections and root intro.
- **Do not** change discovery patterns or `deriveCategory` (S8.3 complete).

### References

- [Source: epics-and-stories.md#S8.4]
- [Source: prd.md#FR-035]
- [Source: 8-3-extended-default-patterns.md — README scope split]

## Dev Agent Record

### Agent Model Used

Composer (claude-sonnet-5-thinking-high)

### Debug Log References

- Bugbot: Windows backslash paths misclassified — fixed via `path.posix.basename` normalization in `isReadmeFile` and `isRootReadme` via `directoryKey`.
- Bugbot: article nav linked to removed category anchors — fixed by filtering nav/breadcrumbs when category has only README pages.

### Completion Notes List

- Added `src/output/readme-index.ts` resolver with root intro, folder category intro, and README-only category suppression.
- Extended `WikiOutput` with `indexMeta`; `buildIndex` and HTML index renderer consume bindings.
- Verbose logging: `parse.readme-index` (folder bindings), `output.index` `{ readmeIndexCount }`.
- Fixture extended with `packages/nested/README.md`; sample-project discover count 16.
- Quality gate: 272 tests pass; repo coverage 95.3%.

### File List

- `src/output/readme-index.ts`
- `src/output/wiki.ts`
- `src/output/html/renderer.ts`
- `src/output/html/templates/index.mustache`
- `src/types.ts`
- `tests/output/readme-index.test.ts`
- `tests/output/wiki.test.ts`
- `tests/output/html/renderer.test.ts`
- `tests/commands/generate.test.ts`
- `tests/discover/specs.test.ts`
- `tests/fixtures/sample-project/packages/nested/README.md`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/8-4-readme-discovery-and-folder-index.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Senior Developer Review (AI)

**Review date:** 2026-07-14  
**Review outcome:** Approve (after patches)  
**Reviewer model:** Bugbot (gpt-5.6-sol-medium)

### Action Items

None (both findings patched in-session).

### Review Findings

| Severity | Finding                                                  | Disposition                                                                    |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| High     | Windows backslash paths misclassified as root README     | Fixed — `isReadmeFile` uses posix basename; `isRootReadme` uses `directoryKey` |
| Medium   | Article nav/breadcrumb links to removed category anchors | Fixed — filter nav and breadcrumbs when category has only README pages         |

## QA Manual Validation

**QA model:** Composer (claude-sonnet-5-thinking-high)  
**Review date:** 2026-07-14

### AC coverage

| AC  | Status | Evidence                                                       |
| --- | ------ | -------------------------------------------------------------- |
| 1   | ✓      | `packages/nested/README.md` intro in Other section (md + html) |
| 2   | ✓      | Root README replaces boilerplate on fixture generate           |
| 3   | ✓      | `readme.md` / `packages-nested-readme.md` wiki pages written   |
| 4   | ✓      | Unit test for orphan README-only category                      |
| 5   | ✓      | `generate.test.ts` fixture integration                         |
| 6–7 | ✓      | Verbose generate shows `parse.readme-index` + `output.index`   |
| 8   | ✓      | Full §0.2 gate pass                                            |

### Regression risks

- Low: categories with only README pages no longer appear in index nav (intentional AC4).
- Low: root intro renders markdown headings from README (expected).

### Gaps

- None blocking review.

### Manual validation steps

1. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-s84-qa` — exit 0; 16 pages.
2. `grep -F "Root README for extended" /tmp/specwiki-s84-qa/index.md` — root intro present; boilerplate absent.
3. `grep -F "nested README drives the Other" /tmp/specwiki-s84-qa/index.md` — folder intro under `## Other`.
4. `npm run dev generate -- --verbose --project tests/fixtures/sample-project --output /tmp/specwiki-s84-qa 2>&1 | grep readme-index` — `packages/nested/README.md` binding logged.
5. `open /tmp/specwiki-s84-qa/html/index.html` — root and Other category intros visible in browser.

## Change Log

- 2026-07-14: Implemented FR-035 README folder index binding (S8.4).
