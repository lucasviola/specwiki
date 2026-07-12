---
baseline_commit: 424975e4f8dfe3bef053d653ec33e890b24ea9fd
---

# Story 16.4: Client-side wiki search

Status: review

## Story

As Alex,
I want a search box on the wiki header,
so that I can find specs by title or content without scrolling the index.

INVEST: I✓ N✓ V✓ E✓ S✓ T✓

**Depends on:** S16.2

## Acceptance Criteria

### Functional

1. `writeHtmlWiki` emits `html/search-index.json` built at generate time from page titles, descriptions, and plain-text body excerpts
2. Header search UI powered by **lunr** (client-side only; no network fetch beyond static files)
3. Search works when opening HTML via `file://` (relative asset paths)
4. Optional `--no-search` flag skips index + JS for minimal output (default: search enabled)
5. Index page includes "All pages" link listing every slug

### Logging & diagnostics (§0.8)

6. `output.write` for `html/search-index.json` (verbose only)
7. `output.search-index` logs document count (verbose only)
8. `output.error` if search index build fails (always)

### Quality measures

9. Full §0.2 gate passes
10. Unit test: search index JSON schema and document count matches page count
11. No new network I/O in `generate` beyond existing filesystem writes (NFR-012)

## Tasks / Subtasks

- [x] Task 1: Add `lunr` and build search index at generate time (AC: #1, #6, #7, #8)
  - [x] Add `lunr@^2.3.9` as runtime dep (owner-approved); copy `lunr.min.js` to `html/assets/` for browser use
  - [x] New `src/output/html/search-index.ts` — build JSON from `WikiPage[]` fields
  - [x] Index fields: `slug`, `title`, `category`, `description`, `body` (plain-text excerpt from content, capped ~2000 chars)
  - [x] Write `html/search-index.json` in `writeHtmlWiki`; log `output.search-index` with `{ documentCount }`
- [x] Task 2: Header search UI (AC: #2, #3)
  - [x] Add search input + results dropdown to `layout.mustache` header bar
  - [x] `src/output/html/assets/search.js` — load lunr index from relative `search-index.json`, render result links to `{slug}.html`
  - [x] All asset paths relative for `file://` compatibility
  - [x] Graceful degradation: if `--no-search`, omit search UI and scripts
- [x] Task 3: `--no-search` CLI flag (AC: #4)
  - [x] Add `--no-search` to `generate` command in `src/cli.ts`
  - [x] Thread through `GenerateOptions` in `src/types.ts` → `generateWiki` → `writeHtmlWiki`
  - [x] When set: skip `search-index.json`, `search.js`, lunr asset copy
  - [x] CLI test: `--no-search` produces HTML without `search-index.json`
- [x] Task 4: "All pages" index link (AC: #5)
  - [x] Add collapsible or dedicated section on index page listing all slugs alphabetically
  - [x] Links use relative `{slug}.html` paths
- [x] Task 5: Tests and quality gate (AC: #9, #10, #11)
  - [x] Unit test: `buildSearchIndex(wiki)` returns N documents for N pages
  - [x] Unit test: JSON schema has required fields per document
  - [x] Integration test: default generate writes `html/search-index.json`; `--no-search` omits it
  - [x] Run full §0.2 gate; update `IMPLEMENTATION.md`

## Dev Notes

Brownfield: S16.2 provides header bar and `WikiPage` metadata (title, description, sections). This story adds generate-time index serialization and client-side lunr search — no server, no network I/O during `generate` beyond filesystem writes (NFR-012, AD-8).

**Demo path:**

```bash
npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-search
open /tmp/specwiki-search/html/index.html
```

Type a query in header search → results link to matching `{slug}.html` pages.

### Search index schema (proposed)

```json
{
  "version": 1,
  "documents": [
    {
      "slug": "agents",
      "title": "Agents",
      "category": "root",
      "description": "...",
      "body": "plain text excerpt..."
    }
  ]
}
```

Build index in Node at generate time. Browser-side `search.js` constructs lunr index from loaded JSON — do not pre-serialize lunr's internal index format (simpler, debuggable).

### Plain-text body extraction

Strip markdown syntax from `page.content` for search body (simple regex pass or reuse a lightweight stripper). Cap excerpt length to keep JSON small. Do not include raw frontmatter or full multi-KB specs.

### lunr in browser

lunr v2 works in browsers. Options:

1. Copy `node_modules/lunr/lunr.js` (or minified) to `html/assets/lunr.min.js`
2. `search.js` fetches `search-index.json` via relative path — works with `file://` if using synchronous embed or inline JSON

**file:// caveat:** `fetch('search-index.json')` may fail under `file://` in some browsers. Mitigations (pick one):

- Inline search index as `<script type="application/json" id="search-index">` in `layout.mustache` (most reliable for file://)
- Or embed index in `search.js` at generate time as `const SEARCH_INDEX = {...}`

Prefer inline JSON in layout for `file://` reliability — document choice in completion notes.

### CLI integration

```typescript
// src/types.ts
export interface GenerateOptions {
  ...
  noSearch?: boolean;
}
```

```typescript
// src/cli.ts
.option("--no-search", "Skip client-side search index and JS")
```

Default: search **enabled**. Pass `noSearch: opts.noSearch` to `writeHtmlWiki`.

### Logging events

| Event                 | Level   | Payload                                               |
| --------------------- | ------- | ----------------------------------------------------- |
| `output.write`        | verbose | `{ relativePath: "html/search-index.json" }`          |
| `output.search-index` | verbose | `{ documentCount: N }`                                |
| `output.error`        | always  | `{ relativePath: "html/search-index.json", message }` |

### "All pages" section

Add to `index.mustache` — alphabetical list of all pages with `{slug}.html` links. Complements category-grouped Main Page portal.

### E16 epic gate

After S16.4, the full E16 gate is met: Wikipedia-like layout, navigation, highlighted code, working client-side search; markdown unchanged; frozen `wiki/html/` contract preserved.

### What NOT to do in S16.4

- No server-side search or `specwiki serve` integration (E11)
- No fuzzy external API calls
- Do not change markdown output

### Previous story intelligence

- S16.2: header bar in `layout.mustache` — add search input there
- S16.1: asset copy pipeline — extend for `lunr.min.js`, `search.js`
- S16.3: `.mw-parser-output` and highlight assets — search UI lives in chrome, not content

### References

- [Source: epics-and-stories.md — S16.4, E16 gate]
- [Source: prd/prd.md — FR-034 (search)]
- [Source: decisions.md — 2026-07-12 E16 lunr approval]
- [Source: ARCHITECTURE-SPINE.md — AD-8 (no network I/O)]
- [Source: src/cli.ts — generate command options]
- [Source: src/commands/generate.ts — generateWiki pipeline]
- [Source: src/output/wiki.ts — writeHtmlWiki]
- [Source: 16-2-wikipedia-layout-chrome-and-navigation.md — header bar, WikiPage metadata]
- [Source: HARNESS.md §0.8 — output.write, output.error]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Commander `--no-search` maps to `opts.search === false` (negated boolean option)
- Inline JSON in layout chosen over fetch for file:// reliability

### Completion Notes List

- Added `lunr@^2.3.9` runtime dependency; copies `lunr.min.js` and `search.js` to `html/assets/` at generate time
- `buildSearchIndex` strips markdown and caps body excerpts at 2000 chars; writes `html/search-index.json` plus inline embed in every HTML page
- Header search UI with lunr-powered dropdown; `--no-search` skips index, assets, and chrome
- Index page "All pages" section lists all slugs alphabetically with relative links
- 194 tests passing; repo coverage 95.79%

### File List

- package.json
- package-lock.json
- eslint.config.js
- src/types.ts
- src/cli.ts
- src/commands/generate.ts
- src/output/wiki.ts
- src/output/html/search-index.ts
- src/output/html/renderer.ts
- src/output/html/assets/search.js
- src/output/html/assets/specwiki.css
- src/output/html/templates/layout.mustache
- src/output/html/templates/index.mustache
- tests/output/html/search-index.test.ts
- tests/output/html/renderer.test.ts
- tests/output/wiki.test.ts
- tests/cli.test.ts
- IMPLEMENTATION.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/16-4-client-side-wiki-search.md

## Senior Developer Review (AI)

**Review date:** 2026-07-12
**Review outcome:** Approve with minor patch applied
**Reviewer model:** Bugbot subagent

### Action Items

- [x] Fix `WikiPage` import path in `search-index.test.ts` (medium)

### Review Findings

| Severity | Finding                                                      | Resolution                       |
| -------- | ------------------------------------------------------------ | -------------------------------- |
| Medium   | Wrong relative import for `WikiPage` in search-index.test.ts | Fixed to `../../../src/types.js` |

## QA Manual Validation

### Manual validation steps

1. `npm test -- tests/output/html/search-index.test.ts` — schema and document count tests pass
2. `npm test -- tests/cli.test.ts -t "no-search"` — flag omits search index
3. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-search --verbose 2>&1 | grep -E "search-index|search-index.json"` — index build logged
4. `test -f /tmp/specwiki-search/html/search-index.json` — file exists (default generate)
5. `open /tmp/specwiki-search/html/index.html` — search box visible in header; type "agent" → results include Agents page
6. Click search result → navigates to correct `{slug}.html` via relative link
7. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nosearch --no-search`
8. `test ! -f /tmp/specwiki-nosearch/html/search-index.json` — index omitted
9. Index page shows "All pages" section with links to every slug
10. `npm test` — full suite passes

## Change Log

- 2026-07-12 — Implemented client-side lunr search: generate-time index, header UI, `--no-search`, All pages section; 14 new tests
