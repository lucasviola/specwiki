---
baseline_commit: e8b2995b867291f38e3a2d421b911d42c7df34f3
---

# Story 19.2: Responsive Layout and Mobile Navigation Drawer

Status: done

## Story

As Alex,
I want the generated HTML wiki to remain readable on a narrow window or phone,
so that the desktop navigation rails do not collapse the article into an unusable fixed grid.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-ux` — open an article below 720px and at 320px; the page is a readable single column, the hamburger opens the category drawer, the TOC remains available, and wide content does not create horizontal page scroll.

**Binds:** FR-039 (proposed) | **Depends:** E16 S16.2 three-column chrome and current S19.1 header/theme work | **NFR:** NFR-003, NFR-011–NFR-013 | **AD:** AD-11

## Acceptance Criteria

### Functional

1. Below 720px, index and article layouts collapse to one readable content column while the desktop category and TOC rails no longer consume fixed grid columns.
2. On narrow viewports, a native hamburger button opens and closes the existing category navigation as a drawer; it is keyboard operable, has an accessible name and `aria-controls`, and keeps `aria-expanded` accurate.
3. The drawer closes from its close button, backdrop click, and Escape key, then returns focus to the hamburger when appropriate.
4. At 320px, the logo, optional search input, hamburger, and theme toggle remain usable without causing horizontal page overflow.
5. Wide Markdown tables and code blocks scroll within their own containers; the page itself does not scroll horizontally.
6. With JavaScript disabled, the hamburger remains hidden and the same category navigation remains reachable in normal document flow below the main content; the article TOC remains reachable in flow on narrow screens.
7. The generated wiki continues to work over `file://` with no network request, CDN asset, server, new runtime dependency, or `fetch()`.
8. Existing desktop layout, relative links, Mustache escaping, search behavior, theme behavior, syntax highlighting, markdown output, and frozen HTML output paths remain intact.

### Logging & diagnostics (§0.8)

9. Existing verbose `output.write` events cover the modified generated CSS asset; no new event type or generated asset is introduced.
10. Default client-side drawer operation emits no console output and logs no page content.

### Quality measures

11. Renderer/template tests assert drawer markup, native button semantics, `aria-controls`, initial and updated `aria-expanded` wiring, close paths, and progressive-enhancement fallback.
12. Generated-asset tests assert the narrow breakpoint, single-column layout, in-flow no-JavaScript fallback, header compaction, and table/code overflow containment.
13. The complete HARNESS §0.2 quality gate passes and `src/output/html/` coverage remains at least 90%.

## Tasks / Subtasks

- [x] Implement the responsive wiki vertical slice (AC: 1–13)
  - [x] RED: add failing renderer and generated-asset tests for drawer semantics, interaction wiring, responsive layout, no-JavaScript fallback, compact header, and overflow containment.
  - [x] GREEN: wrap category navigation in a shared drawer shell on index and article pages.
  - [x] GREEN: add progressively enhanced drawer controls and silent keyboard/click behavior to `layout.mustache`.
  - [x] GREEN: add the mobile breakpoint, single-column flow, compact header, drawer states, stacked infobox, and overflow containment to `specwiki.css`.
  - [x] REFACTOR: keep one category-nav DOM tree, preserve desktop behavior and adjacent S19.1/S16.4 scripts, and avoid new assets or dependencies.
  - [x] Update `IMPLEMENTATION.md`, run the full quality gate, automated code review, and QA analysis.

## Dev Notes

### Implementation Plan

- Use `@media (max-width: 719px)` so the epic demo requirement “below 720px” has a deterministic boundary; preserve the existing desktop grid at 720px and above.
- Keep a single category navigation tree in each body template. Wrap it in `.specwiki-nav-drawer` with a stable `id` referenced by the shared header toggle.
- Render the nav drawer in normal grid flow by default. The inline script adds `.specwiki-nav-enhanced` only after controls are found; mobile CSS may then position the same wrapper off-canvas until opened.
- Keep the TOC in normal flow below the article content on narrow screens. Do not introduce S19.5 scroll-spy behavior or a second drawer.
- Add a backdrop and an in-drawer close button. The hamburger is `hidden` until enhancement initializes; the close button/backdrop are hidden without JS.
- Synchronize `aria-expanded`, open/closed root classes, body scroll lock, Escape, backdrop, and close-button behavior. Return focus to the hamburger for explicit close actions without implementing an out-of-scope focus trap.
- On narrow screens, shrink the search flex item with `min-width: 0`, hide only nonessential visible labels, stack the infobox, and make rendered tables block-level horizontal scrollers.

### Current State and Preservation Rules

- `layout.mustache` owns the shared header, optional search, theme controls, and inline client scripts.
- `index.mustache` uses a two-column `.specwiki-layout`; `article.mustache` uses `.specwiki-layout-article` with 12rem category navigation and 11rem sticky TOC rails.
- `specwiki.css` has no responsive layout media query. `pre` already scrolls horizontally; rendered tables do not.
- Preserve `#content`, `.category-nav`, `.infobox`, `.toc`, `.breadcrumb`, the `[[specwiki]]` wordmark, search conditionals, theme script ordering, escaped Mustache fields, and relative `file://` links.
- Preserve the seven-path verbose `output.write` contract by keeping drawer JavaScript inline and adding no asset file.
- Do not add the S19.3 sticky header or reading measure, S19.4 search redesign, or S19.5 scroll-spy.

### Security, Accessibility, and Performance Guardrails

- Use native `<button type="button">` controls with accessible labels, visible `:focus-visible` styles, `aria-controls`, and accurate `aria-expanded`.
- The drawer script must not inspect or interpolate spec content, issue network requests, access storage, or emit console output.
- Keep user-derived category/page labels in escaped Mustache positions. Do not move them into script strings or raw HTML.
- Avoid layout shift on desktop and before JavaScript enhancement; the no-JavaScript mobile layout must be readable and complete.
- Do not use `overflow-x: hidden` as the primary fix for wide content; contain overflow at tables, code blocks, and shrinkable flex/grid children.

### Testing Requirements

- Extend `tests/output/html/renderer.test.ts` with focused index/article assertions for the shared drawer shell, hamburger and close buttons, `aria-controls`, `aria-expanded`, enhancement hook, Escape/backdrop/close wiring, and no console/fetch behavior.
- Extend `tests/output/wiki.test.ts` to inspect generated CSS for the 719px breakpoint, single-column grids, no-JavaScript in-flow order, enhanced off-canvas state, compact header, stacked infobox, and table/pre overflow.
- Preserve existing layout-region, escaping, relative-link, theme, search, highlight, and seven-path logging tests.
- Do not add or run browser/e2e tests unless the owner separately opts in (HARNESS §0.2.1).
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.

### Project Structure Notes

- UPDATE: `src/output/html/templates/layout.mustache`
- UPDATE: `src/output/html/templates/article.mustache`
- UPDATE: `src/output/html/templates/index.mustache`
- UPDATE: `src/output/html/assets/specwiki.css`
- UPDATE: `tests/output/html/renderer.test.ts`
- UPDATE: `tests/output/wiki.test.ts`
- UPDATE: `IMPLEMENTATION.md`
- UPDATE: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- No renderer API, runtime dependency, CLI flag, output directory, or network behavior change.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E19 principles and S19.2]
- [Source: `_bmad-output/planning-artifacts/discovery/research/ux-analysis.md` — §§2, 5, 6]
- [Source: `_bmad-output/planning-artifacts/discovery/research/ui-ux-alternatives.md` — Strategy A]
- [Source: `_bmad-output/implementation-artifacts/19-1-dark-mode-pre-paint-theme-toggle.md`]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]
- [Source: `src/output/html/templates/layout.mustache`, `article.mustache`, `index.mustache`, `assets/specwiki.css`]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Sol

### Implementation Plan

- Story context created from E19 requirements, current templates/CSS/tests, S19.1 conventions, project context, and harness constraints.
- Wrapped the existing category nav once per page in a shared drawer shell and added native header/close controls plus a silent inline enhancement script.
- Added a deterministic 719px breakpoint that reflows center, TOC, and nav; enhanced pages move the same nav off-canvas while no-JavaScript pages keep it in flow.
- Compacted 320px header controls, stacked the infobox, and confined rendered table/code overflow without changing renderer APIs or generated assets.

### Debug Log References

- RED: 3 focused tests failed on missing drawer markup, script wiring, and responsive generated CSS while 80 existing focused tests remained green.
- GREEN: 83 focused renderer/output tests passed after the template and CSS implementation.
- QUALITY: initial gate reached Prettier with 321 tests and lint passing, then reported two test-format warnings; formatting was corrected and the complete six-command gate passed.

### Completion Notes

- Comprehensive developer context created and responsive vertical slice completed from baseline `e8b2995`.
- 3 new tests; 321 tests pass across 15 files.
- Full §0.2 gate passes; repository coverage is 95.42% statements/lines, 90.30% branches, and 96.15% functions; `src/output/html` is 99.25%.
- Existing seven-path verbose `output.write` coverage remains unchanged; no new client asset, runtime dependency, network request, console output, or renderer API was added.
- ✅ Resolved review finding [Medium]: lock both `html` and `body` while the mobile drawer is open for robust mobile Safari background-scroll prevention.
- ✅ Resolved review finding [Medium]: apply native `inert` to the closed enhanced drawer so its controls and links leave the keyboard focus order.

## File List

- `_bmad-output/implementation-artifacts/19-2-responsive-layout-and-mobile-navigation-drawer.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `IMPLEMENTATION.md`
- `src/output/html/assets/specwiki.css`
- `src/output/html/templates/article.mustache`
- `src/output/html/templates/index.mustache`
- `src/output/html/templates/layout.mustache`
- `tests/output/html/renderer.test.ts`
- `tests/output/wiki.test.ts`

## Change Log

- 2026-07-15: Story context created and implementation started.
- 2026-07-15: Responsive layout and progressively enhanced mobile navigation completed; full quality gate passed.
- 2026-07-15: Addressed 2 owner-approved code-review findings with focused regression assertions.

## Senior Developer Review (AI)

**Review date:** 2026-07-15  
**Review outcome:** Approve — owner-approved patches implemented; re-review found no bugs  
**Reviewer model:** claude-opus-4-8-thinking-high

### Action Items

- [x] [Patch][Medium] Lock both the document element and body while the mobile drawer is open so iOS Safari cannot scroll the page behind the backdrop. [`src/output/html/assets/specwiki.css`]
- [x] [Patch][Medium] Remove the closed enhanced drawer and its links from the tab order instead of relying on `aria-hidden` plus an off-canvas transform. [`src/output/html/templates/layout.mustache`, `src/output/html/assets/specwiki.css`]

### Review Findings

- Resolved: the open state now locks both the document element and body.
- Resolved: the drawer now uses native `inert` while closed on narrow enhanced pages and clears it on open or desktop layouts.
- Bugbot re-reviewed the updated uncommitted change set and found no bugs.

## QA Manual Validation

**QA model:** claude-opus-4-8-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC 1, 5–6, 12: Generated CSS tests cover the 719px single-column grid, in-flow TOC/nav areas, enhanced off-canvas state, compact search sizing, stacked infobox, and table/code overflow containment.
- AC 2–3, 10–11: Renderer tests cover native drawer controls, accessible labels, `aria-controls`, initial/update wiring for `aria-expanded`, close/backdrop/Escape handlers, focus-return hook, and silent/no-fetch client code.
- AC 4: Compact header rules are present; actual 320px fit remains a manual visual check.
- AC 7–9: Existing relative-link, escaping, search, theme, highlight, markdown, path-confinement, and seven-path `output.write` tests remain green; no dependency or generated asset was added.
- AC 13: Full six-command quality gate passes with 321 tests and `src/output/html` coverage at 99.25%.

### Regression risks

- Mobile scroll locking now covers both `html` and `body`; iOS behavior remains a manual device/simulator check.
- Native `inert` removes the closed drawer from keyboard focus order on supported target browsers; manual assistive-technology validation remains useful.
- Drawer interaction behavior is structure-tested rather than executed in a browser; 320px fit, focus return, and no-JavaScript rendering require manual validation.

### Gaps

- No browser/e2e, iOS, JavaScript-disabled, viewport-overflow, or runtime keyboard automation per HARNESS §0.2.1.
- No focus trap while the drawer is open; this was explicitly kept out of the story scope.

### Manual validation steps

1. `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` — all six gates pass; 321 tests pass and coverage remains at least 90%.
2. `rm -rf /tmp/specwiki-qa && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa` — generation exits 0 and writes the local HTML wiki and assets.
3. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa --verbose 2>&1 | rg '"event":"output.write"'` — seven write events appear, including `html/assets/specwiki.css`, with no page content in payloads.
4. `! rg 'fetch\(|console\.' /tmp/specwiki-qa/html/index.html && rg 'max-width: 719px|translateX\(-100%\)|overflow-x: auto' /tmp/specwiki-qa/html/assets/specwiki.css` — no network/console client code is found and responsive/overflow rules match.
5. `open "file:///tmp/specwiki-qa/html/spec.html"` — at 719px or narrower, the article is one column, TOC is in flow, hamburger opens the drawer, and close button/backdrop/Escape close it with accurate `aria-expanded`.
6. `open "file:///tmp/specwiki-qa/html/index.html"` — at 320px, logo/search/hamburger/theme controls fit without page-level horizontal scrolling; wide article tables/code scroll internally.
7. `open "file:///tmp/specwiki-qa/html/spec.html"` — with JavaScript disabled and viewport at 719px or narrower, the hamburger is hidden and TOC/category navigation remain reachable in normal flow.
8. `open "file:///tmp/specwiki-qa/html/spec.html"` — on iOS Safari or its simulator, verify an open drawer prevents background scrolling and Tab with a closed drawer skips its inert controls and links.
