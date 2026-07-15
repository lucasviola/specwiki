---
baseline_commit: c73388698fe8ddc53034537d443287e96ab8f88b
---

# Story 19.3: Reading Measure and Sticky Header

Status: done

## Story

As Alex,
I want a comfortable article reading width with the header and search always reachable,
so that long specs remain readable without disrupting the established page layout.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-ux` — compare index and article pages at 1440px, 720px, and 375px; existing rails, infobox, portal cards, search, and mobile drawer retain their geometry while article prose uses one coherent reading column and the header remains visible while scrolling.

## Acceptance Criteria

### Functional

1. Direct children of article Markdown render in one coherent centered reading track capped at `70ch`; top-level tables and fenced code blocks may use the full article content column.
2. The reading track is implemented as article-scoped grid columns, not independent widths and auto margins on each child, so headings, paragraphs, lists, quotes, and thematic breaks retain a common left edge.
3. Index and portal pages, breadcrumb, infobox, category rail, TOC rail, search popup, and responsive layout retain their existing structure and geometry.
4. The header uses native sticky positioning in normal flow. A shared header-block-size property includes its border and drives desktop TOC and hash-target offsets without JavaScript measurement.
5. Article headings plus index category and All Pages targets scroll below the sticky header.
6. At the 719px breakpoint and below, the existing single-column layout, in-flow TOC, closed drawer state, and horizontal overflow containment remain unchanged with no document-level horizontal overflow.
7. The generated wiki remains offline-safe with no new script, asset, dependency, renderer API, CLI flag, or output path.

### Logging & diagnostics (§0.8)

8. Existing verbose `output.write` events cover the modified generated CSS asset; no new event type or console output is introduced.

### Quality measures

9. Generated-asset tests assert the coherent article grid, table/code escape hatch, sticky header, desktop TOC offset, article/index hash offsets, and rejection of the prior per-child width/auto-margin implementation.
10. Existing theme, search, responsive drawer, renderer, escaping, relative-link, and seven-write logging tests remain green.
11. Desktop and mobile browser geometry is compared against the pre-change baseline; index and article pages have no unexpected horizontal overflow or rail/infobox displacement.
12. The complete HARNESS §0.2 quality gate passes and `src/output/html/` coverage remains at least 90%.

## Tasks / Subtasks

- [x] Implement the regression-safe reading-measure and sticky-header slice (AC: 1–12)
  - [x] RED: add failing generated-asset tests for the coherent grid measure, escape hatch, sticky header, TOC offset, and hash offsets.
  - [x] GREEN: add article-scoped grid tracks and full-column table/code placement without per-child width or auto margins.
  - [x] GREEN: add native sticky-header positioning and one exact shared offset for the TOC and hash targets.
  - [x] REFACTOR: preserve S19.1 theme, S19.2 responsive/drawer, S19.4 search, portal, infobox, and generated-asset contracts.
  - [x] Validate pre/post browser geometry at desktop, breakpoint, and mobile widths.
  - [x] Update project records and run the full quality gate, automated review, and QA analysis.

## Dev Notes

### Implementation Plan

- Keep the feature CSS-only and preserve all templates.
- Replace the failed approach of assigning `width` and `margin-inline: auto` to every direct Markdown child with a three-track grid on the article `.mw-parser-output`: flexible gutter, `minmax(0, 70ch)` reading track, flexible gutter.
- Place normal direct children in the reading track and only top-level `table`/`pre` across all tracks. At narrow widths, the track shrinks to the available width.
- Define `--specwiki-header-block-size` as `calc(var(--size-tool) + 1px)` because the measured header is the 42px tool row plus its 1px border.
- Keep the header stacking context below the drawer backdrop (`20`) and drawer (`30`). S19.4 closes search before opening the drawer.

### Regression Context

- The first S19.3 attempt was removed because independent centered widths on every Markdown child visibly fragmented the article and regressed layout.
- The current baseline includes S19.1 dark mode, S19.2 responsive navigation, and uncommitted S19.4 search work. Do not overwrite or weaken those changes.
- Browser baseline was captured before implementation at 1440px and 375px. At 375px the document width equals the viewport, the drawer is translated fully off-canvas, and `.specwiki-center` remains 375px wide.
- Do not add S19.5 scroll-spy or any later E19 behavior.

### Testing Requirements

- Extend `tests/output/wiki.test.ts` following the existing generated-CSS tests.
- Run the focused test in RED and GREEN.
- Run browser geometry checks on generated `index.html` and an article at 1440×900, 720×900, and 375×812.
- Run all six HARNESS quality-gate commands.

## Dev Agent Record

### Agent Model Used

GPT-5.6 Sol

### Implementation Plan

- Recovered the parked story and reproduced the removed CSS in-browser to identify the prior regression.
- Captured pre-change desktop/mobile geometry before implementation.

### Debug Log References

- Prior regression reproduction: direct-child `width` plus auto margins fragmented the article into independently centered blocks.
- RED: the generated-asset test failed on the absent shared header-size contract.
- GREEN: the focused test passed with the coherent article grid and sticky offsets.
- BROWSER REGRESSION: the first grid prototype squeezed article content to 60px at 720px because it established a formatting context beside the floated infobox.
- SECOND RED/GREEN: a test required the 1200px activation guard; the focused test passed after moving the grid rules into that media query.
- BROWSER FINAL: portal geometry at 1440px matched the baseline exactly; article geometry at 720px and 375px matched the baseline except for the intentional sticky header; no horizontal overflow was present.

### Completion Notes

- Wide-screen Markdown content now uses one coherent 70ch grid track, with top-level tables and code blocks spanning the available article column.
- The reading grid activates only at 1200px and above, preventing the floated infobox from squeezing content at tablet widths.
- The 43px sticky header offset is shared by the desktop TOC, article headings, index categories, and All Pages target.
- Browser validation confirmed exact baseline portal geometry at 1440px and exact article/nav/infobox geometry at 720px and 375px, with document width equal to viewport width.
- Full §0.2 gate passes: 334 tests; 95.42% statements/lines, 90.22% branches, 96.15% functions; `src/output/html` 99.25%.

## File List

- `_bmad-output/implementation-artifacts/19-3-reading-measure-and-sticky-header.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `IMPLEMENTATION.md`
- `src/output/html/assets/specwiki.css`
- `tests/output/wiki.test.ts`

## Change Log

- 2026-07-15: Story unparked with explicit layout-regression criteria and a coherent grid-based implementation plan.
- 2026-07-15: Added the viewport-guarded article grid, sticky header offsets, generated-asset regression test, and pre/post browser geometry validation.

## Senior Developer Review (AI)

**Review date:** 2026-07-15  
**Review outcome:** Approve  
**Reviewer model:** claude-opus-4-8-thinking-high

### Action Items

- None. Bugbot found no S19.3 bugs or layout regressions.

## QA Manual Validation

**QA model:** claude-opus-4-8-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC 1–2: the 1200px media query uses a three-track grid with one 70ch content track; top-level table/pre span all tracks and no per-child width/auto-margin rule exists.
- AC 3, 6, 11: portal dimensions at 1440px matched the baseline exactly. At 720px and 375px, article, infobox, rail/drawer, and center dimensions matched the baseline; document width equaled viewport width.
- AC 4–5: the native sticky header is 43px. Category hash navigation landed at 54.98px with a computed 55px scroll margin.
- AC 7–10: the change is CSS-only; existing offline, output-write, theme, search, drawer, renderer, escaping, and link tests remain green.
- AC 12: all 334 tests and six quality commands pass; `src/output/html` coverage is 99.25%.

### Regression risks

- A future header control that exceeds the 42px tool row would require updating the shared block-size contract.
- A future ancestor `overflow` rule could disable native sticky positioning.
- The deliberate 1200px activation boundary leaves the baseline layout unchanged from 720px through 1199px.

### Gaps

- Browser geometry is manually validated rather than enforced in CI.
- The negative test rejects the removed selector shape but cannot prevent every possible future per-child width/auto-margin variant.
- Bundled Wikimedia token values are not asserted numerically.

### Manual validation steps

1. `npm test` — all 334 tests pass.
2. `npm test -- tests/output/wiki.test.ts -t "coherent article measure and sticky header"` — the focused generated-CSS test passes.
3. `rm -rf /tmp/specwiki-qa && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa` — generation exits 0 and writes the offline HTML wiki.
4. `rg -n -- "--specwiki-header-block-size|@media \\(min-width: 1200px\\)|grid-template-columns" /tmp/specwiki-qa/html/assets/specwiki.css` — the 43px shared offset contract and wide-screen grid are present.
5. `open "file:///tmp/specwiki-qa/html/index.html"` — at 1440px the portal layout is unchanged, the header stays visible, and category/All Pages targets clear it.
6. `open "file:///tmp/specwiki-qa/html/docs-specs-architecture.html"` — at 1440px article blocks share one reading-column edge; at 720px and 375px the baseline responsive layout remains intact with no horizontal page overflow.
