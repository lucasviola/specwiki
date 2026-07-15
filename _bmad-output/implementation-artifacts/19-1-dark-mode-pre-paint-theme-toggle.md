---
baseline_commit: 880693d9ba4da39cd89dce61c2b09e93e31dc9fe
---

# Story 19.1: Dark Mode with Pre-Paint Theme and Toggle

Status: review

## Story

As Alex, a terminal-dwelling developer,
I want the generated HTML wiki to respect my dark system theme and let me override it,
so that opening the wiki at night is comfortable and the interface feels credible.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-ux` — open `/tmp/specwiki-ux/html/index.html` with the OS dark theme enabled; dark mode appears before first paint, the header toggle switches themes, and the choice persists across pages and reloads.

**Binds:** FR-039 (proposed) | **Depends:** E16 S16.1 token-based CSS and Mustache renderer | **NFR:** NFR-003, NFR-011, NFR-012, NFR-013 | **AD:** AD-11

## Acceptance Criteria

### Functional

1. All colors used by `specwiki.css` and generated `highlight.css` resolve through CSS custom properties with complete light and dark values.
2. With no saved override, generated pages follow `prefers-color-scheme`.
3. A visible, keyboard-operable header toggle overrides the system preference and persists `light` or `dark` in `localStorage` for navigation and reloads.
4. An inline script in `<head>`, before stylesheet links, applies a valid saved theme before paint; storage access failures and invalid values safely fall back to system preference.
5. With JavaScript disabled, `prefers-color-scheme` still provides dark styling and the toggle is hidden or inert.
6. The generated wiki continues to work from `file://` with no network request, CDN asset, server, or `fetch()`.
7. Light and dark palettes meet WCAG 2.2 AA contrast for body/subtle text, links, code blocks, search results, infoboxes, borders, and visible focus states.
8. The existing `html/` output layout, relative links, Mustache escaping, search behavior, and syntax highlighting remain intact.
9. Owner approval for this presentation change is recorded by the instruction to start S19.1.

### Logging & diagnostics (§0.8)

10. Existing verbose `output.write` events cover every changed generated asset; no new event type is introduced.
11. Default client-side operation emits no console output and logs no stored theme value or page content.

### Quality measures

12. Renderer tests assert pre-paint script ordering, accessible toggle markup, and progressive-enhancement fallback.
13. Asset tests assert light/dark custom properties and dark-aware highlight rules; existing escaping and output-write tests remain green.
14. The complete HARNESS §0.2 quality gate passes and `src/output/html/` coverage remains at least 90%.

## Tasks / Subtasks

- [x] Implement the dark theme vertical slice (AC: 1–14)
  - [x] RED: add failing renderer and generated-asset tests for script ordering, toggle semantics, persistence hooks, CSS variables, dark fallback, highlight theming, and unchanged asset logging.
  - [x] GREEN: add pre-paint initialization and an accessible theme toggle to `layout.mustache`.
  - [x] GREEN: define complete semantic light/dark tokens and progressive-enhancement behavior in `specwiki.css`.
  - [x] GREEN: make generated highlight CSS consume the same semantic theme variables without adding a dependency or network access.
  - [x] REFACTOR: keep client script small, storage-safe, silent, `file://` compatible, and preserve existing search/template behavior.
  - [x] Update `IMPLEMENTATION.md`, run the full quality gate, automated code review, and QA analysis.

## Dev Notes

### Implementation Plan

- Extend the current Mustache layout and CSS assets; do not replace `HtmlRenderer`, add a framework, or alter the output tree.
- Put a minimal inline initializer immediately after `<meta name="generator">` and before `<title>`/stylesheet links. It may only accept saved values `light` and `dark`, set `document.documentElement.dataset.theme`, and swallow unavailable-storage errors.
- Use `@media (prefers-color-scheme: dark)` for the no-JavaScript/system default. A `data-theme="light"` or `data-theme="dark"` attribute must win over that media query.
- Render a native `<button type="button">` in the header with an accessible name, visible focus treatment, and state conveyed without relying on color. Hide it by default in CSS and reveal it only after the enhancement script initializes.
- Reuse the existing inline-script pattern and plain ES5-compatible style used by `src/output/html/assets/search.js`; no module loading, `fetch`, or external assets.
- Override semantic Wikimedia variables (`--background-color-*`, `--color-*`, `--border-color-*`) in custom CSS after `wikimedia-ui-base`; avoid component-specific hard-coded light colors.
- `highlight.js/styles/github.min.css` currently hard-codes a light palette. `HtmlRenderer.readHighlightCss()` should emit variable-based rules or append local overrides so article code is legible in both themes.
- Existing `writeHtmlWiki()` already writes and logs `specwiki.css` and `highlight.css`; preserve its path-confinement and seven-file verbose logging contract.

### Current State and Preservation Rules

- `src/output/html/templates/layout.mustache` owns shared `<head>`, header, optional search chrome, and scripts for every HTML page.
- `src/output/html/assets/specwiki.css` styles the Vector-inspired header, search, category nav, infobox, TOC, and rendered Markdown using Wikimedia variables.
- `src/output/html/renderer.ts` concatenates `wikimedia-ui-base.css` before custom CSS and reads the Highlight.js GitHub light stylesheet.
- Preserve the current `[[specwiki]]` wordmark, `includeSearch` conditionals, inline escaped search index, relative asset links, and title/metadata escaping tests.
- The working tree already contains owner changes in the layout, CSS, renderer tests, and adjacent output files. Modify the current content in place; do not discard or rewrite unrelated changes.

### Security, Accessibility, and Performance Guardrails

- Treat `localStorage` as unavailable or malformed: wrap reads/writes in `try/catch`, allow only `light`/`dark`, and never interpolate stored data into HTML.
- Theme code must not inspect spec content, log values, execute discovered code, or issue network requests.
- Pre-paint execution must not wait for `DOMContentLoaded`; post-head toggle binding may run near the end of `<body>`.
- Keep the no-JavaScript page readable and system-themed. The button must not present a broken control before script initialization.
- Contrast targets: normal text ≥ 4.5:1; large text/UI graphics ≥ 3:1. Tests verify token presence/structure; manual validation covers rendered contrast and flash behavior per NFR-003.

### Testing Requirements

- Add focused assertions in `tests/output/html/renderer.test.ts` for pre-paint script position, `data-theme` behavior hooks, toggle button semantics, no external theme asset, and disabled-JS fallback classes/styles.
- Extend `tests/output/wiki.test.ts` to inspect generated `specwiki.css` and `highlight.css` for semantic light/dark variables while preserving `output.write` event count and paths.
- Do not add browser/e2e tests unless the owner separately opts in (HARNESS §0.2.1).
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.

### Project Structure Notes

- UPDATE: `src/output/html/templates/layout.mustache`
- UPDATE: `src/output/html/assets/specwiki.css`
- UPDATE only if required for highlight output: `src/output/html/renderer.ts`
- UPDATE: `tests/output/html/renderer.test.ts`
- UPDATE: `tests/output/wiki.test.ts`
- UPDATE: `IMPLEMENTATION.md`
- No new runtime dependency, CLI flag, output directory, template engine, or network behavior.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E19 principles and S19.1]
- [Source: `_bmad-output/planning-artifacts/discovery/research/ux-analysis.md` — §§4.3, 5, 6]
- [Source: `_bmad-output/planning-artifacts/discovery/research/ui-ux-alternatives.md` — Strategy A]
- [Source: `_bmad-output/planning-artifacts/discovery/prd/prd.md` — FR-032–FR-034, NFR-003, NFR-011–NFR-013]
- [Source: `_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md` — AD-4, AD-6–AD-11]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]
- [Source: `src/output/html/renderer.ts`, `src/output/html/templates/layout.mustache`, `src/output/html/assets/specwiki.css`]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Sol

### Implementation Plan

- Story context created from E19 requirements, UX research, current renderer/assets, project architecture, and harness constraints.
- Added a synchronous storage-safe initializer before stylesheet loading, plus a progressively enhanced header button that updates `aria-pressed`, persists valid overrides, and follows system changes when no override exists.
- Mapped the complete UI and Highlight.js palettes to semantic custom properties with explicit system-dark and saved-theme selectors.
- Replaced the build-time GitHub-light overwrite with the repository's local variable-based highlight asset.

### Debug Log References

- RED: focused renderer/output tests failed on the missing initializer, toggle, system-dark tokens, and variable-based highlight rules (4 expected failures).
- RED: the build-script regression test failed because `copy-html-assets.mjs` overwrote the local highlight asset with GitHub light CSS.
- GREEN: 81 focused tests passed across renderer, output, and build-asset coverage.

### Completion Notes

- Comprehensive developer context created; owner request records presentation-change approval.
- 5 new tests; 318 tests pass across 15 files.
- Full §0.2 gate passes; repository coverage is 95.42% statements/lines, 90.30% branches, and 96.15% functions; `src/output/html` is 99.25%.
- Body, subtle text, and link contrast ratios are at least 5.37:1 in light mode and 5.69:1 in dark mode; sampled dark syntax colors are at least 6.24:1.
- Existing seven-path verbose `output.write` coverage remains unchanged and includes both generated CSS assets.

## File List

- `_bmad-output/implementation-artifacts/19-1-dark-mode-pre-paint-theme-toggle.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `IMPLEMENTATION.md`
- `scripts/copy-html-assets.mjs`
- `src/output/html/assets/highlight.css`
- `src/output/html/assets/specwiki.css`
- `src/output/html/renderer.ts`
- `src/output/html/templates/layout.mustache`
- `tests/output/html/renderer.test.ts`
- `tests/output/wiki.test.ts`
- `tests/scripts/copy-html-assets.test.ts`

## Change Log

- 2026-07-15: Story context created and dark mode vertical slice implemented; full quality gate passed.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-15  
**Review outcome:** Approve — no bugs found  
**Reviewer model:** claude-opus-4-8-thinking-high

### Action Items

- None.

### Review Findings

- Bugbot reviewed the uncommitted change set and found no bugs.

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** claude-opus-4-8-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC 1–6: Generated CSS and renderer tests cover semantic palettes, `prefers-color-scheme`, valid persisted overrides, pre-paint ordering, hidden no-JS toggle fallback, and local relative assets with no `fetch()`.
- AC 7: Calculated UI contrast minima are 5.37:1 light and 5.69:1 dark; sampled dark syntax colors are at least 6.24:1. Visual confirmation remains manual per NFR-003.
- AC 8–9: Existing layout, relative-link, escaping, search, highlighting, and navigation tests remain green; the owner's start instruction records presentation approval.
- AC 10–11: Existing seven-path `output.write` test includes both CSS assets; theme scripts contain no console output or content logging.
- AC 12–14: Five new renderer/asset/build tests pass; full quality gate is green with 318 tests and `src/output/html` coverage at 99.25%.

### Regression risks

- The Highlight.js theme now depends on the local asset being copied into `dist`; unit, copy-script, and production-build checks cover the path, but no packaged npm install test exists.
- Theme behavior is source/structure-tested rather than executed in a browser, so pre-paint timing and storage behavior require manual validation.
- Future CSS reorganization could disturb system-versus-explicit selector precedence or reintroduce hard-coded light colors.

### Gaps

- No browser/e2e execution, JavaScript-disabled automation, cross-page storage test, or automated flash measurement per HARNESS §0.2.1.
- Contrast is calculated and manually verified rather than enforced by an automated ratio test.
- The toggle exposes active state through `aria-pressed` and its tooltip; the visible `Theme` label/icon remains constant.

### Manual validation steps

1. `rm -rf /tmp/specwiki-ux && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-ux` — generation succeeds and writes the HTML wiki plus local CSS/JS assets.
2. `test -f /tmp/specwiki-ux/html/index.html && test -f /tmp/specwiki-ux/html/assets/specwiki.css && test -f /tmp/specwiki-ux/html/assets/highlight.css && echo "assets OK"` — prints `assets OK`.
3. `rg -n 'data-specwiki-theme-init|assets/specwiki.css|assets/highlight.css|https?://|fetch\(' /tmp/specwiki-ux/html/{index,spec}.html` — initializer and relative styles appear; no HTTP URL or `fetch(` appears.
4. `rg -n 'prefers-color-scheme: dark|data-theme="light"|data-theme="dark"|--specwiki-syntax-' /tmp/specwiki-ux/html/assets/specwiki.css && ! rg '#[0-9a-fA-F]{3,8}\b' /tmp/specwiki-ux/html/assets/highlight.css` — theme selectors/tokens exist and highlight CSS has no hard-coded hex colors.
5. `open "file:///tmp/specwiki-ux/html/index.html"` — with macOS Dark appearance and no saved override, the first frame is dark with no light flash and only local resources load.
6. `localStorage.removeItem("specwiki-theme"); document.documentElement.removeAttribute("data-theme"); location.reload()` — in DevTools Console, then switching macOS appearance updates the unsaved page theme without a flash.
7. `document.getElementById("specwiki-theme-toggle").click(); location.href="spec.html"` — in DevTools Console, the article keeps the selected override; Cmd-R preserves it and storage contains `light` or `dark`.
8. `document.getElementById("specwiki-theme-toggle").focus()` — in DevTools Console, a visible outline appears; Space/Enter changes theme and flips `aria-pressed`.
9. `open "file:///tmp/specwiki-ux/html/index.html"` — after disabling JavaScript in browser settings, the page follows system appearance, remains readable, and keeps the Theme button hidden.
10. `npm run test -- tests/output/html/renderer.test.ts tests/output/wiki.test.ts tests/scripts/copy-html-assets.test.ts && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` — focused tests and all gates pass; coverage remains ≥90% and the dist highlight asset exists.
