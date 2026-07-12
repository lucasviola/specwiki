---
baseline_commit: f98015b845154af815b89272a4f97f8d60ab98fa
---

# Story 16.3: Rich HTML content rendering

Status: done

## Story

As Alex,
I want code blocks highlighted and headings linkable,
so that long spec pages are as readable as Wikipedia articles.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

**Depends on:** S16.2

## Acceptance Criteria

### Functional

1. `marked` configured for GFM (tables, strikethrough, task lists where supported)
2. Heading IDs generated for `h2`–`h6` matching parsed section anchors (permalink ¶ links optional)
3. **`highlight.js`** applied to fenced code blocks; theme CSS bundled under `html/assets/`
4. Article body wrapped in `.mw-parser-output` (or equivalent) for content typography scoped to main column
5. Malicious markdown in titles/content still escaped at template boundary; no script injection via skin

### Logging & diagnostics (§0.8)

6. `render.error` on markdown/highlighter failure (always) — extends existing event
7. Highlighter language unknown falls back silently (no error spam)

### Quality measures

8. Full §0.2 gate passes
9. Parse/render tests for code fence + heading anchor output
10. HTML escaping tests unchanged or extended for new template fields

## Tasks / Subtasks

- [x] Task 1: Add `highlight.js` dependency (AC: #3)
  - [x] Add `highlight.js@^11.11.1` to `package.json` (owner-approved per E16 decision)
  - [x] Bundle highlight theme CSS to `src/output/html/assets/highlight.css` (e.g. `github` or `stackoverflow-light` theme)
- [x] Task 2: Enhance `renderMarkdown` for GFM + highlighting (AC: #1, #2, #3, #6, #7)
  - [x] Configure `marked` with `gfm: true` and custom renderer or extension hooks
  - [x] Register `highlight.js` on fenced code blocks; unknown language → plain `<pre><code>` (no error)
  - [x] Generate `id` attributes on `h2`–`h6` using same `slugify` logic as `extractSections` in `parse/markdown.ts`
  - [x] Optional: permalink `¶` link after headings (Wikipedia-style)
- [x] Task 3: Scope content typography (AC: #4)
  - [x] Wrap rendered body in `<div class="mw-parser-output">` in article template
  - [x] CSS rules for tables, strikethrough, task lists, code blocks scoped under `.mw-parser-output`
  - [x] Link `assets/highlight.css` in `layout.mustache`
- [x] Task 4: Security verification (AC: #5, #10)
  - [x] Confirm template boundary still escapes user fields; body HTML from marked is trusted local content
  - [x] Test malicious title in template fields does not break skin
  - [x] No `<script>` tags injected by highlighter or marked extensions
- [x] Task 5: Tests and quality gate (AC: #8, #9, #10)
  - [x] Unit test: fenced ` ```typescript ` block produces `<span class="hljs-...">` classes
  - [x] Unit test: `## My Section` → `<h2 id="my-section">`
  - [x] Unit test: heading IDs match `SpecSection.anchor` from parser
  - [x] Extend `render.error` test for highlighter failure path
  - [x] Run full §0.2 gate; update `IMPLEMENTATION.md`

## Dev Notes

Brownfield: `renderMarkdown` in `src/parse/markdown.ts:89-98` calls `marked.parse` with defaults. Section anchors are computed at parse time via `slugify` — HTML heading IDs must use the **same** algorithm so TOC links from S16.2 work.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-rich
open /tmp/specwiki-rich/html/specs-feature.html
```

Expected: syntax-highlighted code blocks, clickable heading anchors, GFM tables render correctly.

### Anchor consistency (critical)

Parser slugify (`parse/markdown.ts:7-14`):

```typescript
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    ...
}
```

Export or share this function — `HtmlRenderer` TOC (S16.2) links to `#anchor` values from `SpecSection.anchor`. Heading IDs in rendered HTML **must match** or TOC navigation breaks.

### marked GFM configuration

marked v15 supports GFM via options. Configure once at module load:

- `gfm: true`
- Custom `renderer.heading` or marked extension for `id` attributes
- Custom `renderer.code` for highlight.js integration

Keep `async: false` — existing `renderMarkdown` contract.

### highlight.js integration

Use modular imports to limit bundle size:

```typescript
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
// register common languages found in fixtures: typescript, javascript, bash, json, markdown
```

Copy minified highlight CSS to `html/assets/highlight.css` at generate time (alongside `specwiki.css`).

### Fixture gap

Sample fixture specs are minimal (few code fences). Add a test fixture or inline test markdown with:

```markdown
## API Example

\`\`\`typescript
const x: number = 1;
\`\`\`

| Column | Value |
| ------ | ----- |
| foo    | bar   |
```

Do not require changing `tests/fixtures/sample-project/` unless dogfood value warrants it — unit tests can use inline markdown strings.

### `.mw-parser-output` scope

Wikipedia uses this class to scope content styles away from chrome. Apply to article body only — not index portal or infobox.

### Security (§0.9)

- AD-6: body from trusted local specs — marked output not re-sanitized
- Template fields (title, paths) still `escapeHtml` at Mustache boundary
- highlight.js must not execute code — only static HTML/CSS output
- No user-controlled language tag execution — treat language as string attribute only

### What NOT to do in S16.3

- No search index or lunr (S16.4)
- No changes to markdown `wiki/*.md` output
- Do not add DOMPurify or full HTML sanitizer unless owner requests (out of scope per AD-6)

### Previous story intelligence

- S16.2: TOC rail links to `#anchor` from `page.sections` — heading IDs are the integration point
- S16.1: asset copy pipeline — add `highlight.css` to copied assets
- S4.1: `render.error` on marked failure — extend, don't replace

### References

- [Source: epics-and-stories.md — S16.3]
- [Source: prd/prd.md — FR-034 (content rendering)]
- [Source: ARCHITECTURE-SPINE.md — AD-6, AD-8]
- [Source: src/parse/markdown.ts — renderMarkdown, slugify, extractSections]
- [Source: 16-2-wikipedia-layout-chrome-and-navigation.md — TOC anchor contract]
- [Source: 4-1-html-title-escaping-and-page-structure.md — render.error pattern]
- [Source: HARNESS.md Phase 2.4 — HTML safety tests]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Heading IDs derived from raw markdown title (not marked `text` field) to match parser `extractSections` anchors
- highlight.js failure on registered language logs `render.error` and falls back to plain `<pre><code>`

### Completion Notes List

- Added `highlight.js@^11.11.1`; github.min.css bundled to `src/output/html/assets/highlight.css` via build script
- Enhanced `renderMarkdown` with GFM, heading IDs (h2–h6), permalink links, and highlight.js for fenced code
- Exported `slugify` for anchor consistency with TOC rail from S16.2
- Wrapped article body in `.mw-parser-output`; scoped typography CSS; linked highlight.css in layout
- 174 tests pass; `markdown.ts` at 100% line coverage

### File List

- package.json
- package-lock.json
- scripts/copy-html-assets.mjs
- src/parse/markdown.ts
- src/output/html/renderer.ts
- src/output/html/templates/layout.mustache
- src/output/html/templates/article.mustache
- src/output/html/assets/specwiki.css
- src/output/html/assets/highlight.css
- src/output/wiki.ts
- tests/parse/markdown.test.ts
- tests/output/html/renderer.test.ts
- tests/output/wiki.test.ts
- IMPLEMENTATION.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/deferred-work.md

### Change Log

- 2026-07-12: S16.3 — Rich HTML content rendering implemented

## Senior Developer Review (AI)

**Review date:**  
**Review outcome:**  
**Reviewer model:**

### Action Items

### Review Findings

## QA Manual Validation

### Manual validation steps

1. `npm test -- tests/parse/markdown.test.ts -t "renderMarkdown|highlight|heading"` — GFM and anchor tests pass
2. `npm test -- tests/output/html/` — code fence highlighting assertions pass
3. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-rich` — succeeds
4. `ls /tmp/specwiki-rich/html/assets/` — includes `highlight.css`
5. `open /tmp/specwiki-rich/html/specs-feature.html` — code blocks highlighted, headings have `id` attributes
6. Click TOC link in right rail (from S16.2) → scrolls to matching heading ID
7. `npm test -- tests/output/wiki.test.ts -t "escapeHtml"` — escaping regression tests pass
8. `npm test` — full suite passes
