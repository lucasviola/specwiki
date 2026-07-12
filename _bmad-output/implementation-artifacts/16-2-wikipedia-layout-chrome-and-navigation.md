---
baseline_commit: e2debdf222d40cdc45230294d95f7ec7dc95c056
---

# Story 16.2: Wikipedia layout chrome and navigation

Status: ready-for-dev

## Story

As Alex,
I want category sidebar, infobox, and section TOC on every article page,
so that I can browse the spec landscape like Wikipedia without running a server.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

**Depends on:** S16.1

## Acceptance Criteria

### Functional

1. Index page styled as wiki **Main Page** portal with category sections (reuses `CATEGORY_LABELS`)
2. Article pages: header bar (site title + link home), **left category nav**, main content, **right TOC rail** from parsed `sections`, **infobox** (title, category, source path, description)
3. Breadcrumb trail: `Main Page › {Category} › {Title}` on article pages
4. Inter-page links use relative `{slug}.html` paths; `file://` navigation works without a server
5. Markdown wiki output (`wiki/*.md`) unchanged

### Logging & diagnostics (§0.8)

6. `output.render` logs page kind (`index` | `article`) and slug (verbose only)
7. `output.error` if template context missing required fields (always)

### Quality measures

8. Full §0.2 gate passes
9. Integration test asserts semantic regions: `#content`, `.infobox`, `.toc`, `.category-nav`
10. HTML renderer coverage ≥ 90%

## Tasks / Subtasks

- [ ] Task 1: Extend `WikiPage` with navigation metadata (AC: #2, #5)
  - [ ] Add `description: string` and `sections: SpecSection[]` to `WikiPage` in `src/types.ts`
  - [ ] Populate in `buildWiki()` from `ParsedSpec` — do not change markdown `buildPageContent` format
  - [ ] Add/update unit tests for `buildWiki` metadata fields
- [ ] Task 2: Build navigation context in `HtmlRenderer` (AC: #1, #2, #3, #4)
  - [ ] Index context: categories with label (`CATEGORY_LABELS`), pages per category, relative `slug.html` links
  - [ ] Article context: infobox fields, breadcrumb segments, TOC entries from `page.sections` with `#anchor` hrefs
  - [ ] Left nav: all categories with links to index category anchors or filtered article lists
  - [ ] Header bar: site title "Spec Wiki" linking to `index.html`
- [ ] Task 3: Update Mustache templates and CSS (AC: #1, #2, #9)
  - [ ] `layout.mustache` — three-column wiki chrome (nav | content | TOC)
  - [ ] `index.mustache` — Main Page portal with per-category sections
  - [ ] `article.mustache` — infobox aside, breadcrumb, `#content` main region
  - [ ] `specwiki.css` — layout grid, infobox box, TOC rail, category nav styles (Wikimedia tokens)
- [ ] Task 4: Logging and validation (AC: #6, #7)
  - [ ] Emit `output.render` with `{ kind, slug }` before each page write (verbose only)
  - [ ] Validate required template fields; `output.error` + throw on missing title/category/sourcePath
- [ ] Task 5: Tests and quality gate (AC: #8, #9, #10)
  - [ ] Integration test: generated article HTML contains `#content`, `.infobox`, `.toc`, `.category-nav`
  - [ ] Test breadcrumb text and relative inter-page links
  - [ ] Test `file://`-safe relative paths (no leading `/`, no `http://`)
  - [ ] Run full §0.2 gate; update `IMPLEMENTATION.md`

## Dev Notes

Brownfield: S16.1 replaces `wrapHtml` with `HtmlRenderer` and Wikimedia base CSS. This story adds Wikipedia-style chrome using data already parsed in `parseSpecFile` but not yet exposed on `WikiPage`.

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav
open /tmp/specwiki-nav/html/index.html
```

Click a category link in left nav → open an article → infobox shows source path and category; right-rail TOC jumps to `#section`.

### WikiPage gap to close

Current `WikiPage` (`src/types.ts:24-30`) lacks `description` and `sections`. `ParsedSpec` already has both from `parseSpecFile`. Extend `buildWiki`:

```167:173:src/output/wiki.ts
  const pages: WikiPage[] = specs.map((spec) => ({
    slug: slugByPath.get(spec.file.relativePath) ?? pageSlug(spec),
    title: spec.title,
    category: spec.file.category,
    content: buildPageContent(spec),
    sourcePath: spec.file.relativePath,
  }));
```

Add `description: spec.description` and `sections: spec.sections`. Markdown output unchanged — `buildPageContent` stays as-is.

### Index page link fix

Current markdown index links to `{slug}.md` (correct for markdown). HTML index must link to `{slug}.html`. Build a separate index body in `HtmlRenderer.renderIndex` using `WikiPage[]` metadata — do not rely on `renderMarkdown(wiki.indexContent)` alone (that produces `.md` links).

### Category labels

Reuse `CATEGORY_LABELS` from `src/config/patterns.ts` — same sort order as `buildIndex` (label localeCompare).

### Layout regions (required for AC #9)

| Region       | Selector        | Content                                         |
| ------------ | --------------- | ----------------------------------------------- |
| Main content | `#content`      | Rendered article body                           |
| Infobox      | `.infobox`      | Title, category label, source path, description |
| TOC rail     | `.toc`          | `h2`–`h6` section links from `page.sections`    |
| Category nav | `.category-nav` | Category list with page links                   |

### Breadcrumbs

Format: `Main Page › {Category Label} › {Title}` — all segments escaped; first two segments link to `index.html` and category anchor respectively.

### file:// navigation

- All hrefs relative: `index.html`, `agents.html`, `#anchor`
- CSS/JS assets: `assets/specwiki.css` (from S16.1)
- No `fetch` to external URLs in this story

### What NOT to do in S16.2

- No syntax highlighting or GFM extensions (S16.3)
- No search box or `search-index.json` (S16.4)
- Do not modify markdown wiki files or `writeWiki` logic

### Previous story intelligence (S16.1)

- `HtmlRenderer` module and Mustache templates established — extend, do not duplicate
- Asset copy pipeline in `writeHtmlWiki` — reuse for any new static assets
- `escapeHtml` on all user-controlled template fields — extend to breadcrumb, infobox, nav labels

### References

- [Source: epics-and-stories.md — S16.2]
- [Source: prd/prd.md — FR-033]
- [Source: ARCHITECTURE-SPINE.md — AD-4]
- [Source: src/config/patterns.ts — CATEGORY_LABELS]
- [Source: src/types.ts — WikiPage, SpecSection]
- [Source: src/parse/markdown.ts — extractSections, slugify anchors]
- [Source: 16-1-mustache-html-renderer-and-wikimedia-assets.md — HtmlRenderer foundation]
- [Source: HARNESS.md §0.8 — output.render (new event for this story)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Senior Developer Review (AI)

**Review date:**  
**Review outcome:**  
**Reviewer model:**

### Action Items

### Review Findings

## QA Manual Validation

### Manual validation steps

1. `npm test -- tests/output/wiki.test.ts -t "buildWiki"` — WikiPage includes description and sections
2. `npm test -- tests/output/html/` — integration test finds `#content`, `.infobox`, `.toc`, `.category-nav`
3. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav --verbose 2>&1 | grep output.render` — index and article render events logged
4. `open /tmp/specwiki-nav/html/index.html` — Main Page portal with category sections
5. Click left nav category link → lands on correct section or article list
6. Open `/tmp/specwiki-nav/html/agents.html` — breadcrumb, infobox with source path, right TOC rail present
7. Click TOC link → jumps to in-page `#anchor` without server
8. Confirm `/tmp/specwiki-nav/*.md` unchanged from pre-S16.2 generate (markdown contract preserved)
9. `npm test` — full suite passes
