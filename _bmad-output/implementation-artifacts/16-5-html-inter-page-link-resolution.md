---
baseline_commit: 255779dc916f4e821987238e7c03fec380aa29f2
---

# Story 16.5: HTML inter-page link resolution

Status: review

## Story

As Alex,
I want markdown links inside wiki article bodies to open the correct HTML pages,
so that cross-references work when browsing via `file://` without a server.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

**Depends on:** S16.2, S16.3

## Acceptance Criteria

### Functional

1. `buildWikiLinkIndex(pages)` maps each discovered spec's `sourcePath` → output `slug` (collision-aware, same slugs as `assignUniqueSlugs`)
2. Relative markdown hrefs resolve from the **source file's directory** (not from flat `html/` output) and rewrite known targets to `{slug}.html`, preserving `#fragment`
3. HTML-only integration: article bodies in `writeHtmlWiki`, index `rootIntroHtml`, and category `introHtml` in `HtmlRenderer.renderIndex` — **markdown `wiki/*.md` output unchanged**
4. Pass through unchanged: `#anchors`, `http(s):`, `mailto:`, and relative targets not in the discovered corpus
5. Dangerous schemes (`javascript:`, `data:`, `vbscript:`) are never rewritten to executable targets; no absolute `file://` hrefs emitted
6. Verbose `output.link-unresolved` when a relative spec-like href (`.md`, `.mdc`, `.txt`) cannot be mapped

### Logging & diagnostics (§0.8)

7. `output.link-unresolved` logs `{ sourcePath, href }` (verbose only)
8. `render.error` on markdown failure unchanged (always)

### Quality measures

9. Full §0.2 gate passes
10. Unit tests cover resolver matrix (see Dev Notes)
11. Integration test: generated HTML for pages with cross-links contains `{slug}.html` hrefs, not raw `.md` paths, for discovered targets
12. `src/output/html/wiki-link-resolver.ts` coverage ≥ 90%

## Tasks / Subtasks

- [x] Task 1: Add `wiki-link-resolver` module (AC: #1, #4, #5)
  - [x] Create `src/output/html/wiki-link-resolver.ts` with `buildWikiLinkIndex`, `createHtmlLinkResolver`
  - [x] Index keys: normalized POSIX relative paths (forward slashes, lowercase) for `.md`, `.mdc`, `.txt`
  - [x] Lookup uses slugs from existing `assignUniqueSlugs` / `WikiPage.slug` — do not re-derive collision logic
  - [x] Resolver: allowed schemes pass through; block dangerous schemes; resolve relative paths under `projectRoot`
  - [x] Path escape (`..` leaving project root) → leave href unchanged, do not rewrite
- [x] Task 2: Extend `renderMarkdown` with optional link context (AC: #2, #3, #8)
  - [x] Add `RenderMarkdownOptions` with optional `linkResolver: (href: string) => string`
  - [x] Custom `marked` `link` renderer applies resolver; preserve `title` attribute; marked escapes href
  - [x] Default call sites without options behave exactly as today (markdown wiki unaffected)
- [x] Task 3: Wire resolver into HTML generation (AC: #3, #6, #7)
  - [x] `writeHtmlWiki`: build index once; pass resolver + `page.sourcePath` per article
  - [x] `HtmlRenderer.renderIndex`: pass resolver for `rootIntroHtml` using `indexMeta.rootIntroSource`
- Category intros: render each `intro.segments[]` entry with its own `sourcePath` link base (multi-README merge safe)
  - [x] Thread `projectRoot` from existing `WriteHtmlWikiOptions` (already available when nav grouping loads)
- [x] Task 4: Tests and quality gate (AC: #9, #10, #11, #12)
  - [x] Unit tests in `tests/output/html/wiki-link-resolver.test.ts`
  - [x] Extend `tests/parse/markdown.test.ts` for link renderer hook
  - [x] Integration tests in `tests/output/wiki.test.ts` with inline fixture pages containing cross-links
  - [x] Assert dogfood cases: `docs/adr/index.md` links, `README.md` → `CHANGELOG.md`
  - [x] Run full §0.2 gate; update `IMPLEMENTATION.md`

## Dev Notes

**Root cause:** S16.2 AC #4 ("Inter-page links use relative `{slug}.html` paths") was implemented for nav chrome, breadcrumbs, and index metadata — but **not** for inline markdown body links. `renderMarkdown()` in `src/parse/markdown.ts` passes hrefs through unchanged. Browsers resolve them relative to `html/`, producing broken targets like `file:///…/wiki/html/CHANGELOG.md`.

**Confirmed broken examples (dogfood generate):**

| Source                 | Markdown href                                  | Broken HTML href   | Expected                                                                         |
| ---------------------- | ---------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `docs/adr/index.md:42` | `./template.md`                                | `./template.md`    | `docs-adr-template.html`                                                         |
| `docs/adr/index.md:46` | `../../_bmad-output/.../ARCHITECTURE-SPINE.md` | literal `.md` path | `_bmad-output-planning-artifacts-discovery-architecture-architecture-spine.html` |
| `README.md:225`        | `CHANGELOG.md`                                 | `CHANGELOG.md`     | `changelog.html`                                                                 |

**Demo path:**

```bash
npm run dev generate -- --project . --output wiki
open wiki/html/docs-adr-index.html
# Click template + ARCHITECTURE-SPINE links — must navigate to .html pages
open wiki/html/readme.html
# Click CHANGELOG.md link — must open changelog.html
```

### Architecture: WikiLinkIndex + HtmlLinkResolver

```typescript
// src/output/html/wiki-link-resolver.ts

export interface WikiLinkIndex {
  lookup(resolvedRelativePath: string): string | undefined;
}

export function buildWikiLinkIndex(pages: WikiPage[]): WikiLinkIndex;

export function createHtmlLinkResolver(options: {
  index: WikiLinkIndex;
  sourcePath: string;
  projectRoot: string;
}): (href: string) => string;
```

**Resolution algorithm:**

1. Split `href` into path + `#fragment`
2. If scheme present and not relative → pass through if allowed (`http`, `https`, `mailto`); reject rewrite for `javascript:`, `data:`, `vbscript:`
3. If `#only` anchor → pass through
4. Resolve path: `path.posix.normalize(path.posix.join(dirname(sourcePath), hrefPath))`
5. Reject if resolved path escapes `projectRoot` (reuse `assertConfinedUnder` pattern from `src/core/paths.ts`)
6. Lookup in index (try with extension, without extension, lowercase normalization)
7. If found → `{slug}.html` + fragment; else log `output.link-unresolved` (verbose) and return original href

**Do not** regex-replace `.md` globally in HTML output — use index lookup only.

### Integration call sites (3)

```470:478:src/output/wiki.ts
      html = renderer.renderArticle(
        page,
        wiki.pages,
        renderMarkdown(page.content),
        htmlRenderOptions,
      );
```

Change to:

```typescript
renderMarkdown(page.content, { linkResolver: createHtmlLinkResolver({ ... }) })
```

```139:153:src/output/html/renderer.ts
          introHtml: intro ? renderMarkdown(intro.content) : "",
          ...
        rootIntroHtml: hasRootIntro ? renderMarkdown(indexMeta.rootIntro!) : "",
```

`renderIndex` needs `linkIndex` + `projectRoot` passed via `HtmlRenderOptions` (extend interface). Use:

- `indexMeta.rootIntroSource` for root intro
- `intro.sourcePaths[0]` for category README intros

**Alternative considered:** post-process HTML with regex — rejected (fragile, security risk).

### Test matrix (unit)

| Case              | sourcePath                                                                                  | href                                                                                 | Expected                            |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| Same-dir relative | `docs/adr/index.md`                                                                         | `./template.md`                                                                      | `docs-adr-template.html`            |
| Bare filename     | `README.md`                                                                                 | `CHANGELOG.md`                                                                       | `changelog.html`                    |
| Parent traversal  | `_bmad-output/implementation-artifacts/improvements/23-imp-3-breadcrumb-subgroup-parity.md` | `../23-7-breadcrumb-subgroup-parity.md`                                              | disambiguated slug `.html`          |
| Cross-tree        | `docs/adr/index.md`                                                                         | `../../_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md` | spine slug `.html`                  |
| Fragment          | `README.md`                                                                                 | `./HARNESS.md#section`                                                               | `harness.html#section`              |
| External          | any                                                                                         | `https://github.com/...`                                                             | unchanged                           |
| Anchor-only       | any                                                                                         | `#requirements`                                                                      | unchanged                           |
| Undiscovered      | any                                                                                         | `./missing.md`                                                                       | unchanged + verbose log             |
| Path escape       | any                                                                                         | `../../../../etc/passwd`                                                             | unchanged                           |
| Dangerous         | any                                                                                         | `javascript:alert(1)`                                                                | unchanged (not rewritten to slug)   |
| `.mdc` target     | any                                                                                         | `./rule.mdc`                                                                         | matching slug `.html` if discovered |

### Security (§0.9, AD-7)

- Resolve relative paths under `projectRoot` only — reuse confinement helpers
- Never emit `file://` absolute paths
- Do not follow symlinks at render time — lookup is against discovered corpus only (no filesystem I/O per link)
- marked escapes attribute values in custom link renderer
- AD-6 unchanged: body HTML from trusted local specs

### What NOT to do in S16.5

- No change to `writeWiki` markdown output or `buildPageContent`
- No bundled HTTP server
- No `specwiki check-links` command (future story)
- No CSS `.specwiki-link-unresolved` styling (optional follow-up)
- No Obsidian wikilink syntax (E14)
- No DOMPurify unless owner requests (AD-6)

### Previous story intelligence

- **S16.2:** Nav/breadcrumb links already use `{slug}.html`; AC #4 gap is body content only. See dev note in `16-2-wikipedia-layout-chrome-and-navigation.md` — index intros also call `renderMarkdown` without HTML link rewrite.
- **S16.3:** `renderMarkdown` already has custom `marked` renderer hooks for headings and code — add `link` hook in same `marked.use` block.
- **S5.1:** Slug collision disambiguation via `assignUniqueSlugs` — index must use final slugs from `WikiPage[]`, not recomputed `pageSlug()`.
- **S8.4:** README intros rendered on index — root/category intros need link resolver with correct `sourcePath`.

### File structure

| File                                           | Action                                                 |
| ---------------------------------------------- | ------------------------------------------------------ |
| `src/output/html/wiki-link-resolver.ts`        | **NEW**                                                |
| `src/parse/markdown.ts`                        | UPDATE — `RenderMarkdownOptions`, link renderer        |
| `src/output/wiki.ts`                           | UPDATE — build index, pass resolver to articles        |
| `src/output/html/renderer.ts`                  | UPDATE — extend `HtmlRenderOptions`, wire index intros |
| `tests/output/html/wiki-link-resolver.test.ts` | **NEW**                                                |
| `tests/parse/markdown.test.ts`                 | UPDATE — link hook tests                               |
| `tests/output/wiki.test.ts`                    | UPDATE — integration assertions                        |
| `IMPLEMENTATION.md`                            | UPDATE                                                 |

### References

- [Source: epics-and-stories.md — S16.5]
- [Source: 16-2-wikipedia-layout-chrome-and-navigation.md — AC #4, index link fix dev note]
- [Source: 16-3-rich-html-content-rendering.md — marked renderer pattern]
- [Source: ARCHITECTURE-SPINE.md — AD-4, AD-6, AD-7]
- [Source: src/parse/markdown.ts — renderMarkdown, marked.use]
- [Source: src/output/wiki.ts — assignUniqueSlugs, writeHtmlWiki]
- [Source: src/output/html/renderer.ts — renderIndex introHtml]
- [Source: src/core/paths.ts — assertConfinedUnder]
- [Source: HARNESS.md §0.8 — logging events]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Added `wiki-link-resolver.ts` with O(1) index lookup from `WikiPage.slug` and `createHtmlLinkResolver` resolving relative hrefs from source markdown directory with project-root confinement.
- Extended `renderMarkdown` with optional `linkResolver` and custom marked `link` renderer (href/title escaped).
- Wired resolver in `writeHtmlWiki` (articles) and `HtmlRenderer.renderIndex` (root + category intros).
- Review patch: `CategoryReadmeIntro.segments` — category intros render per-README segment with correct link base when multiple folder READMEs merge.
- 28 new tests total; full §0.2 gate passes; `wiki-link-resolver.ts` at 95.87% coverage.

### File List

- `src/output/html/wiki-link-resolver.ts` (new)
- `src/parse/markdown.ts`
- `src/output/wiki.ts`
- `src/output/html/renderer.ts`
- `src/output/readme-index.ts`
- `src/types.ts`
- `tests/output/html/wiki-link-resolver.test.ts` (new)
- `tests/parse/markdown.test.ts`
- `tests/output/wiki.test.ts`
- `tests/output/readme-index.test.ts`
- `tests/output/html/renderer.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-07-19: S16.5 — HTML inter-page link resolution for markdown body links in generated HTML wiki.
- 2026-07-19: Review patch — per-segment category intro link resolution for merged folder READMEs.

## Senior Developer Review (AI)

**Review date:** 2026-07-19  
**Review outcome:** Approve (after review patch)  
**Reviewer model:** Bugbot (claude-sonnet-5)

### Action Items

- [x] [High] Category intro link base — render each merged README segment with its own `sourcePath` (fixed via `CategoryReadmeIntro.segments` + `renderCategoryIntroHtml`)

### Review Findings

- Initial review: merged category intros used `sourcePaths[0]` for all links — wrong when multiple folder READMEs share a category.
- Re-review after patch: no bugs found.

## QA Manual Validation

### Manual validation steps

1. `npm test -- tests/output/html/wiki-link-resolver.test.ts` — resolver unit tests pass
2. `npm test -- tests/parse/markdown.test.ts -t "link"` — marked link hook tests pass
3. `npm test -- tests/output/wiki.test.ts -t "inter-page|link"` — integration tests pass
4. `rm -rf wiki && npm run dev generate -- --project . --output wiki` — generate succeeds
5. `rg 'href="[^"]*\.md"' wiki/html/docs-adr-index.html wiki/html/readme.html` — no raw `.md` hrefs for discovered targets (CHANGELOG, template, spine)
6. `open wiki/html/docs-adr-index.html` — click template + ARCHITECTURE-SPINE links; browser navigates to correct `.html` pages
7. `open wiki/html/readme.html` — click CHANGELOG link; lands on `changelog.html`
8. `npm test` — full suite passes
