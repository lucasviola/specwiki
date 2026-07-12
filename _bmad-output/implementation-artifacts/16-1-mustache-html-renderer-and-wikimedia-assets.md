---
baseline_commit: e2debdf222d40cdc45230294d95f7ec7dc95c056
---

# Story 16.1: Mustache HTML renderer and Wikimedia assets

Status: review

## Story

As Alex,
I want generated HTML to use a proper wiki skin with shared CSS,
so that opening `wiki/html/index.html` feels like a real wiki instead of a blog post.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

**Depends on:** E4 S4.1, S4.2 (done)

## Acceptance Criteria

### Functional

1. `wrapHtml()` replaced by `HtmlRenderer` using **mustache** templates (`layout`, `article`, `index` partials under `src/output/html/templates/`)
2. **`wikimedia-ui-base`** design tokens drive colors, spacing, and typography in `assets/specwiki.css` (MIT — no GPL Vector bundle in v1)
3. `writeHtmlWiki` copies static assets to `{output}/html/assets/` with relative URLs (works via `file://` and static hosting)
4. Frozen output contract preserved: `html/index.html`, `html/{slug}.html` paths unchanged (NFR-013 extend-only)
5. `escapeHtml` applied to all user-controlled template fields (titles, source paths, descriptions)
6. Owner approval recorded for HTML presentation change (NFR-013) — see `decisions.md` 2026-07-12 E16 entry

### Logging & diagnostics (§0.8)

7. `output.write` logs each HTML path and `html/assets/*` copies (verbose only)
8. `output.error` on template render failure or asset copy failure (always)
9. No logging of raw spec body at info level

### Quality measures

10. Full §0.2 gate passes
11. `src/output/html/` renderer module coverage ≥ 90%
12. Existing HTML escaping and path confinement tests still pass

## Tasks / Subtasks

- [x] Task 1: Add approved runtime dependencies (AC: #2, #6)
  - [x] Add `mustache@^4.2.0` and `wikimedia-ui-base@^0.22.0` to `package.json` (AD-11 exception — owner-approved per `decisions.md`)
  - [x] Document new deps in story completion + `IMPLEMENTATION.md`
- [x] Task 2: Create `HtmlRenderer` module (AC: #1, #5)
  - [x] New `src/output/html/renderer.ts` — load templates, render `layout` + page partial
  - [x] Templates: `layout.mustache`, `article.mustache`, `index.mustache` under `src/output/html/templates/`
  - [x] `src/output/html/assets/specwiki.css` — Wikimedia design tokens (colors, spacing, typography); Vector-inspired header and article column baseline
  - [x] All template interpolations for user fields pass through `escapeHtml` (reuse from `wiki.ts` or shared `escape.ts`)
- [x] Task 3: Wire `writeHtmlWiki` to `HtmlRenderer` (AC: #3, #4, #7, #8)
  - [x] Replace `wrapHtml(title, renderMarkdown(...))` calls with `HtmlRenderer.renderIndex` / `renderArticle`
  - [x] Copy `src/output/html/assets/*` → `{output}/html/assets/` on each generate (idempotent)
  - [x] Asset URLs in HTML use relative `assets/specwiki.css` paths (no absolute `/` paths)
  - [x] Preserve `assertPathConfined`, `output.write`, `output.error` patterns from S4.2
- [x] Task 4: Deprecate inline `wrapHtml` skin (AC: #1, #12)
  - [x] Keep `wrapHtml` exported only if tests still need it; otherwise remove inline `<style>` block
  - [x] Update `wrapHtml` tests to assert new renderer output or migrate tests to `HtmlRenderer`
- [x] Task 5: Tests and quality gate (AC: #10, #11, #12)
  - [x] Unit tests: template render, escapeHtml on malicious titles, asset path resolution
  - [x] Integration: `writeHtmlWiki` writes `html/assets/specwiki.css`; pages link stylesheet
  - [x] Run full §0.2 gate; update `IMPLEMENTATION.md`

## Dev Notes

Brownfield: MVP ships inline CSS in `wrapHtml()` at `src/output/wiki.ts:284-308`. This story introduces a dedicated HTML renderer module without changing markdown output or frozen `html/*.html` paths.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-skin
open /tmp/specwiki-skin/html/index.html
```

Expected: Vector-inspired header, Wikimedia typography, linked `assets/specwiki.css` — no inline blog-style `<style>` block.

### Current code to replace

```284:308:src/output/wiki.ts
export function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
...
</html>`;
}
```

`writeHtmlWiki` (lines 231–281) calls `wrapHtml` for index and each article page.

### Proposed module layout

```
src/output/html/
├── renderer.ts          # HtmlRenderer class
├── templates/
│   ├── layout.mustache  # Shared shell: <head>, header bar stub, {{> body}}
│   ├── index.mustache   # Main page body partial
│   └── article.mustache # Article body partial (minimal in S16.1; chrome in S16.2)
└── assets/
    └── specwiki.css     # Wikimedia tokens + base layout
```

`HtmlRenderer` should resolve template and asset paths relative to its module (`import.meta.url` pattern — match existing ESM conventions).

### Wikimedia design tokens

Import CSS custom properties from `wikimedia-ui-base` (MIT). Do **not** vendor GPL Vector skin CSS. Map tokens to:

- Background, content surface, link color
- Font stack (system + Wikimedia fallbacks)
- Spacing scale for header, content padding
- Border colors for future infobox/TOC (S16.2)

### Security (§0.9)

- `escapeHtml` on: `title`, `sourcePath`, `category`, `description`, breadcrumb segments
- Body HTML from `renderMarkdown` is trusted local content (AD-6) — do not double-escape rendered markdown
- Template render failure → `output.error` + rethrow (mirror `writeHtmlWiki` error pattern)

### AD-11 dependency exception

MVP froze runtime deps to commander, fast-glob, gray-matter, marked, chalk. E16 owner decision (2026-07-12) approves `mustache` + `wikimedia-ui-base` for S16.1; `highlight.js` and `lunr` come in S16.3/S16.4.

### What NOT to do in S16.1

- No category sidebar, infobox, or TOC rail (S16.2)
- No syntax highlighting or heading anchors (S16.3)
- No search index or `--no-search` flag (S16.4)
- Do not change `wiki/*.md` output or `buildWiki` / `buildIndex` logic

### Project Structure Notes

- New code under `src/output/html/` — mirrors `discover/`, `parse/`, `output/` module pattern
- Tests: `tests/output/html/renderer.test.ts` (new) + extend `tests/output/wiki.test.ts`
- Fixture HTML under `tests/fixtures/sample-project/wiki/html/` will need regeneration after implementation

### References

- [Source: epics-and-stories.md — S16.1]
- [Source: prd/prd.md — FR-032]
- [Source: decisions.md — 2026-07-12 E16]
- [Source: ARCHITECTURE-SPINE.md — AD-4, AD-6, AD-11]
- [Source: 4-1-html-title-escaping-and-page-structure.md — escapeHtml contract]
- [Source: 4-2-write-html-wiki-tree-with-path-confinement.md — writeHtmlWiki logging pattern]
- [Source: src/output/wiki.ts — wrapHtml, writeHtmlWiki]
- [Source: HARNESS.md §0.8 — output.write, output.error]

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- Replaced inline `wrapHtml` with `HtmlRenderer` (mustache templates + bundled Wikimedia CSS)
- Added `mustache@^4.2.0` and `wikimedia-ui-base@^0.22.0` per AD-11 E16 owner decision
- CSS assets written before HTML pages (code review patch)
- `renderer.ts` at 100% coverage; 155 tests passing

### File List

- package.json
- package-lock.json
- scripts/copy-html-assets.mjs
- src/output/html/renderer.ts
- src/output/html/templates/layout.mustache
- src/output/html/templates/index.mustache
- src/output/html/templates/article.mustache
- src/output/html/assets/specwiki.css
- src/output/wiki.ts
- tests/output/html/renderer.test.ts
- tests/output/wiki.test.ts
- tests/fixtures/sample-project/wiki/html/** (regenerated)
- IMPLEMENTATION.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Senior Developer Review (AI)

**Review date:** 2026-07-12  
**Review outcome:** Changes Requested (1 patch applied)  
**Reviewer model:** Bugbot

### Action Items

- [x] [Med] Write CSS assets before HTML pages to avoid broken stylesheet references on partial failure (`src/output/wiki.ts`)

### Review Findings

| Severity | Finding                                                               | Resolution                                 |
| -------- | --------------------------------------------------------------------- | ------------------------------------------ |
| Med      | HTML written before CSS asset — partial failure leaves unstyled pages | Fixed: asset copy moved before page writes |

## QA Manual Validation

### Manual validation steps

1. `npm test -- tests/output/html/renderer.test.ts` — renderer and escaping tests pass
2. `npm test -- tests/output/wiki.test.ts -t "writeHtmlWiki|wrapHtml|escapeHtml"` — regression tests pass
3. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-skin --verbose 2>&1 | grep output.write` — stderr shows `html/index.html`, `html/*.html`, and `html/assets/specwiki.css`
4. `ls /tmp/specwiki-skin/html/assets/` — `specwiki.css` present
5. `open /tmp/specwiki-skin/html/index.html` — Vector-inspired header, external stylesheet linked, no inline blog CSS
6. `npm test` — full suite passes
