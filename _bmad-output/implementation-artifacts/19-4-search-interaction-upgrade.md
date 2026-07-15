---
baseline_commit: f1ea39fea2d87ca126b47742a4864dae4b8b70cc
---

# Story 19.4: Search Interaction Upgrade

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex, on a repeat visit asking “where is that rule about X?”,
I want keyboard-driven search with rich, accessible result cards and a helpful empty state,
so that search is the fastest path to any spec.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-search` — open `html/index.html`, press `/` or `Cmd/Ctrl+K`, type a query, navigate grouped result cards with Up/Down and Enter, then type gibberish and verify the explicit no-results guidance.

**Binds:** FR-040 (proposed) | **Depends:** E16 S16.4 client-side Lunr search; preserve S19.1 theme and S19.2 responsive header/drawer behavior | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **AD:** AD-4, AD-6–AD-11

## Acceptance Criteria

### Functional

1. Pressing `/` while focus is not in an editable control focuses the search input without inserting `/`; `Cmd+K` on macOS and `Ctrl+K` elsewhere provide the same shortcut and suppress the browser default.
2. Up/Down Arrow moves a visible active state through the current results while DOM focus remains in the search input; navigation wraps at the first and last result, and the input’s `aria-activedescendant` tracks the active option.
3. Enter opens the active result through its existing relative `{slug}.html` URL. Escape closes the results, clears active-result state, and leaves or returns focus to the search input; clicking outside also closes the results without breaking later searches.
4. Each result card shows an escaped title, human-readable category badge, and a bounded one-line excerpt with matched query text highlighted. Rendering uses safe DOM text APIs and never interpolates index values through `innerHTML`.
5. Results are grouped by category while preserving Lunr relevance order within each group, and at most 10 result cards are rendered.
6. A non-empty query with no matches opens an explicit no-results state with guidance to try fewer or different words; an empty query closes and clears the popup.
7. Search follows the WAI-ARIA editable combobox/listbox pattern: the input exposes `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, and accurate `aria-expanded`; the popup exposes `role="listbox"`; result cards expose stable option IDs and `role="option"` with an accurate active state.
8. Active, hovered, highlighted-match, category-badge, and no-results states are legible in light and dark themes, have visible keyboard focus/selection treatment, and remain usable in the compact 320px header without horizontal page overflow. Search and the mobile navigation drawer must not leave competing overlays active; opening search closes or otherwise yields a single accessible active overlay, and Escape closes the active surface without corrupting either control’s ARIA state.
9. With JavaScript disabled or search initialization unavailable, the search enhancement fails silently and the generated wiki remains readable and navigable through category navigation and All pages.
10. The stack remains Lunr 2.3.9 plus the inline bounded index and local relative assets, works over `file://`, performs no network request or `fetch()`, and adds no dependency. Pagefind and semantic search are out of scope.
11. Existing `--no-search` behavior still omits the search input, inline index, `search-index.json`, Lunr asset, and `search.js`; theme, drawer, relative links, escaping, Markdown output, and frozen HTML paths remain intact.

### Logging & diagnostics (§0.8)

12. Existing verbose `output.search-index` retains its document-count event, and existing `output.write` events continue to cover the same search assets without a new generated asset or event type.
13. Search index excerpts remain bounded by `BODY_EXCERPT_MAX`; client-side search emits no console output and logs no query, result text, page content, or other potentially sensitive values.

### Quality measures

14. RED tests fail first for shortcut handling hooks, combobox/listbox semantics, active-result wiring, grouped cards, safe match highlighting, no-results guidance, dark/responsive states, and unchanged `--no-search` output.
15. Search-index tests cover bounded excerpt fields and inline-script escaping, including user-controlled HTML-like text; renderer/generated-asset tests cover the accessible markup and client behavior without adding browser/e2e tests.
16. The complete HARNESS §0.2 quality gate passes and `src/output/html/search-index.ts` plus all touched renderer/output paths remain at least 90% covered.

## Tasks / Subtasks

- [x] Implement the accessible search interaction vertical slice (AC: 1–16)
  - [x] RED: add failing search-index, renderer, client-asset, and generated-output tests for keyboard shortcuts/navigation, ARIA state, grouped result cards, safe highlighting, no-results guidance, responsive/theme styling, and `--no-search` preservation.
  - [x] GREEN: extend the existing search markup in `layout.mustache` with combobox/listbox semantics and stable popup/status hooks.
  - [x] GREEN: upgrade `search.js` to manage shortcuts, grouped result rendering, active-option navigation, safe text highlighting, Enter/Escape/outside-click behavior, and explicit empty state.
  - [x] GREEN: extend `specwiki.css` with result-card, category, match, active, empty, dark-token, and narrow-header styles.
  - [x] GREEN: extend the bounded search-index schema only where needed for human-readable categories/excerpts; preserve inline `\u003c` escaping and the existing document-count log contract.
  - [x] REFACTOR: reuse the current Lunr index, one popup DOM tree, semantic theme tokens, relative links, and progressive-enhancement patterns; add no dependency, network access, console output, or S19.5+ behavior.
  - [x] Update `IMPLEMENTATION.md`, run the full quality gate, automated code review, and QA analysis.

## Dev Notes

### Implementation Plan

- Keep the current generate-time `buildSearchIndex()` → escaped inline JSON → local Lunr → `search.js` pipeline. Lunr 2.3.9 remains the latest stable npm release; do not replace or upgrade it.
- Follow the WAI-ARIA editable combobox with listbox-popup pattern. Keep DOM focus in the input and expose visual option focus with `aria-activedescendant`; synchronize `aria-expanded` whenever the popup opens or closes.
- Add document-level `/` and `Cmd/Ctrl+K` handlers, but ignore `/` when `event.target` is an input, textarea, select, button, or contenteditable element. Do not interfere with modified `/` keystrokes or normal text editing.
- Build cards with `document.createElement`, `textContent`, and text nodes. For match highlighting, split trusted plain strings into text and `<mark>` nodes; never assign user-derived title/category/excerpt values to `innerHTML`.
- Preserve Lunr relevance within each category by grouping the already-ranked results in first-seen category order. Keep the existing 10-result cap across all groups.
- Prefer the description for a concise excerpt, falling back to the already bounded plain-text body excerpt. Match highlighting is presentation-only and must not alter the query sent to Lunr.
- Keep generated links relative (`doc.slug + ".html"`). Do not move user data into inline JavaScript source; it remains in the escaped `application/json` element.
- The no-results message belongs to the listbox popup and must be announced accessibly without pretending to be a selectable option. Empty input restores the closed state.
- Coordinate with the existing mobile drawer rather than relying only on a higher `z-index`: search and navigation must expose one active overlay at a time, with accurate `aria-expanded`, `hidden`, `inert`, backdrop, and focus state.

### Current State and Preservation Rules

- `src/output/html/assets/search.js` is a plain local IIFE. It parses the inline index, builds a Lunr index in-browser, renders up to 10 title/description results, hides on Escape/outside click, and silently returns on missing/invalid prerequisites.
- `src/output/html/templates/layout.mustache` owns the optional search label/input/results shell and conditionally emits the escaped inline index plus local `lunr.min.js` and `search.js`.
- `src/output/html/assets/specwiki.css` positions a simple absolute dropdown and already supplies semantic light/dark tokens, focus colors, a 719px responsive breakpoint, and a shrinkable search flex item.
- `src/output/html/search-index.ts` stores `slug`, `title`, category key, description, and a markdown-stripped body capped at `BODY_EXCERPT_MAX = 2000`; serialization replaces `<` with `\u003c`.
- `src/output/html/renderer.ts` passes only `includeSearch` and `searchIndexJson` into the shared layout. Extend existing contexts instead of adding a renderer or template system.
- `writeHtmlWiki()` writes the same seven search-enabled paths and emits `output.search-index` with `documentCount`. Preserve that count/path contract unless an index-schema change genuinely requires a version bump.
- Preserve `#content`, the `[[specwiki]]` wordmark, theme initializer/toggle order, mobile drawer script, one search popup, Mustache escaping, and relative `file://` links.
- Do not reintroduce the parked S19.3 layout changes or implement S19.5 scroll-spy, S19.6 copy buttons, Pagefind, fuzzy semantic search, query persistence, analytics, or a modal command palette.

### Security, Accessibility, and Performance Guardrails

- Treat every search document and query as untrusted text. Never use `innerHTML`, `insertAdjacentHTML`, string-built markup, `eval`, or dynamic script creation for result content.
- Keep inline-index serialization’s `<` escaping and test script-shaped titles/descriptions/body excerpts. Mustache triple braces are allowed only for the pre-serialized protected JSON payload already used by the renderer.
- No query/content logging, storage, URL mutation, telemetry, network I/O, or console output.
- The WAI-ARIA APG keeps DOM focus on the textbox and communicates the visually active option through `aria-activedescendant`; Arrow keys move the active option, Enter activates it, and Escape closes the popup.
- Use native links inside options so pointer users retain normal link behavior. Keyboard active state must be visible independently of color and work in both theme token sets.
- Do not rebuild the Lunr index per keystroke. Build once at initialization, reuse maps, cap rendered cards at 10, and bound displayed excerpts to avoid layout/performance regressions.
- If JSON parsing, Lunr construction, or a query fails, fail closed and silently: clear popup/active state and leave the static wiki usable.

### Testing Requirements

- Extend `tests/output/html/search-index.test.ts` for any schema field, bounded fallback excerpt, and malicious `<script>`-like content serialization.
- Extend `tests/output/html/renderer.test.ts` for combobox/listbox markup, initial collapsed state, stable controls/IDs, no-results/status hook, and complete omission when `includeSearch` is false.
- Add focused behavior coverage for `src/output/html/assets/search.js` using the repository’s existing test stack or a minimal fake DOM/VM harness; do not add a browser/e2e suite or dependency solely for this story. Assert `/`, Cmd/Ctrl+K, Arrow wrap, `aria-activedescendant`, Enter, Escape, outside click, grouping/relevance, safe `<mark>` construction, and no-results behavior.
- Extend `tests/output/wiki.test.ts` for generated `search.js`/CSS interaction hooks, semantic theme styling, 320px containment, unchanged seven-path `output.write`, unchanged `output.search-index.documentCount`, and complete `noSearch` omission.
- Cover mobile drawer/search precedence: opening one active surface prevents competing overlays, and Escape updates only the active surface while preserving both controls’ ARIA and focus state.
- Preserve all existing search-index, renderer, CLI `--no-search`, theme, drawer, relative-link, escaping, output-write, and path-confinement tests.
- Do not add or run browser/e2e tests unless the owner separately opts in (HARNESS §0.2.1).
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.

### Previous Story Intelligence

- S19.2 established one shared header and one progressively enhanced mobile drawer. Search must remain a shrinkable flex item at 320px and must not add another drawer, backdrop, or page-level overflow.
- S19.2 review patches lock both `html` and `body` while the drawer is open and set the closed drawer `inert`; search shortcuts must not disturb drawer focus/state.
- S19.2 uses drawer/backdrop stacking levels 30/20 and a document-level Escape handler; explicitly test search/drawer precedence instead of allowing the search popup to render beneath the backdrop or both handlers to close unrelated UI.
- S19.1 established semantic light/dark variables and storage-safe, silent inline scripts. New search colors must consume those variables; do not add hard-coded light-only colors.
- Both stories preserve the seven generated-path logging contract and avoid new assets/dependencies. Follow the same local IIFE, `file://`, no-console, and progressive-enhancement conventions.
- S19.3 is parked because its implementation caused layout regressions and was removed. Keep this story scoped to search interaction and avoid header positioning or reading-width changes.

### Git Intelligence

- Recent relevant commits use focused feature messages: `feat(output): add responsive HTML navigation` and `feat(output): add flicker-free persistent dark mode`.
- The existing search implementation predates those changes; modify current template/CSS/script content in place so S19.1 and S19.2 behavior remains intact.
- Expected commit shape after owner approval: `feat(output): upgrade HTML search interactions`.

### Library and Standards Notes

- Existing `lunr@^2.3.9` is already the latest stable release and has no dependencies; retain the current API and bundled local asset.
- Current W3C WAI-ARIA APG guidance for an editable combobox with list autocomplete uses `aria-expanded`, `aria-controls`, `aria-autocomplete`, a listbox popup, and `aria-activedescendant` while DOM focus remains on the textbox.
- No framework, browser API polyfill, Pagefind package, or new runtime/dev dependency is required.

### Project Structure Notes

- UPDATE: `src/output/html/assets/search.js`
- UPDATE: `src/output/html/assets/specwiki.css`
- UPDATE: `src/output/html/templates/layout.mustache`
- UPDATE only if the result-card data contract needs it: `src/output/html/search-index.ts`
- UPDATE only if template context changes: `src/output/html/renderer.ts`
- UPDATE: `tests/output/html/search-index.test.ts`
- UPDATE: `tests/output/html/renderer.test.ts`
- UPDATE: `tests/output/wiki.test.ts`
- NEW only if needed for isolated asset behavior: `tests/output/html/search-client.test.ts`
- UPDATE: `IMPLEMENTATION.md`
- UPDATE: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- No CLI option, Markdown output, output directory, network behavior, renderer replacement, or dependency change.

### References

- [Source: historical `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E19 epic-wide principles and S19.4]
- [Source: `_bmad-output/implementation-artifacts/19-1-dark-mode-pre-paint-theme-toggle.md`]
- [Source: `_bmad-output/implementation-artifacts/19-2-responsive-layout-and-mobile-navigation-drawer.md`]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]
- [Source: `_bmad-output/planning-artifacts/discovery/project-context.md` — critical implementation, testing, and security rules]
- [Source: `_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md` — AD-4, AD-6–AD-11]
- [Source: `src/output/html/assets/search.js`, `specwiki.css`, `templates/layout.mustache`, `search-index.ts`, `renderer.ts`]
- [Source: W3C WAI-ARIA Authoring Practices — Combobox Pattern and Editable Combobox With List Autocomplete]
- [Source: npm registry — `lunr` 2.3.9 latest stable]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Sol

### Debug Log References

- RED run: 10 expected failures across search-index, renderer, client behavior, and generated-output tests before implementation.
- GREEN focused run: 98 search-related tests passed after implementation and refactor.
- Final quality gate: 333 tests passed; aggregate coverage 95.42% statements/lines, 90.22% branches, 96.15% functions; search-index.ts 100% and renderer.ts above 94% branch coverage.

### Completion Notes

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Story reconstructed from the historical E19 plan and validated against the current S16.4 search implementation plus S19.1/S19.2 preservation requirements.
- Added an accessible editable combobox/listbox search flow with global shortcuts, wrapped keyboard navigation, relative Enter activation, Escape/outside close behavior, and explicit no-results guidance.
- Rendered grouped, capped result cards with human-readable category badges, bounded excerpts, safe text-node/`mark` highlighting, semantic theme tokens, and narrow-header containment.
- Preserved the local Lunr 2.3.9/file:// pipeline, seven-path logging contract, inline `<` escaping, progressive failure behavior, and complete `--no-search` omission.
- Added a dependency-free VM/fake-DOM client behavior suite plus renderer, index-safety, CSS, generated-output, logging, and regression assertions.
- ✅ Resolved review finding [Medium]: search now closes explicitly before the mobile navigation drawer opens.
- ✅ Resolved review finding [Medium]: Arrow-key navigation scrolls the active option into the visible popup viewport.
- ✅ Resolved review finding [Medium]: raw categories sharing a human-readable label now render as one merged group while preserving Lunr order.

## File List

- IMPLEMENTATION.md
- _bmad-output/implementation-artifacts/19-4-search-interaction-upgrade.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/output/html/assets/search.js
- src/output/html/assets/specwiki.css
- src/output/html/search-index.ts
- src/output/html/templates/layout.mustache
- tests/output/html/renderer.test.ts
- tests/output/html/search-client.test.ts
- tests/output/html/search-index.test.ts
- tests/output/wiki.test.ts

## Change Log

- 2026-07-15: Story context created and added to sprint tracking.
- 2026-07-15: Implemented the accessible search interaction upgrade with grouped safe-DOM cards, keyboard navigation, responsive/theme states, and full test/gate coverage.
- 2026-07-15: Addressed code review findings — 3 items resolved; final automated review found no bugs.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-15  
**Review outcome:** Approve  
**Reviewer model:** Claude Opus 4.8 Thinking High

### Action Items

- [x] [Patch][Medium] Close an already-open search popup when the mobile navigation drawer opens so only one overlay remains active (`src/output/html/assets/search.js`).
- [x] [Patch][Medium] Scroll the active option into view during Arrow-key navigation so its visual selected state remains visible in an overflowing popup (`src/output/html/assets/search.js`).
- [x] [Patch][Medium] Merge raw categories that share the same human-readable label so search does not render duplicate “Specifications” group headings (`src/output/html/assets/search.js`).

### Review Findings

| Severity | Location                                   | Finding                                                                                         | Triage   |
| -------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------- |
| Medium   | `src/output/html/assets/search.js:331`     | Opening the drawer can leave the higher-z-index search popup open, creating competing overlays. | Resolved |
| Medium   | `src/output/html/assets/search.js:196-207` | Active Arrow-key options are not scrolled into the visible popup viewport.                      | Resolved |
| Medium   | `src/output/html/assets/search.js:240-255` | Raw `spec` and `specs` categories can render duplicate visible “Specifications” group headings. | Resolved |

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** Claude Opus 4.8 Thinking High  
**Review date:** 2026-07-15

### AC coverage

- AC 1–6, 9, 11–13, 15–16: covered by focused client/index/renderer/generated-output tests and the full quality gate.
- AC 7: required combobox/listbox/option semantics are present; strict grouped-listbox assistive-technology behavior remains a manual check.
- AC 2 and AC 8: active options now scroll into view and opening either search or the drawer explicitly closes the competing overlay.
- AC 5: raw categories now merge by human-readable label while preserving first-seen group order, Lunr relevance order within each merged group, and the ten-card cap.
- AC 10: local assets, no `fetch()`, relative links, and unchanged dependencies are statically covered; real `file://` operation remains manual.
- AC 14: the recorded RED run failed for the expected behavior gaps; final-tree inspection cannot independently prove chronology.

### Regression risks

- Separate search/drawer handlers can drift and leave incorrect focus/ARIA state.
- Group headings inside the listbox may be announced inconsistently by assistive technologies.
- Future raw categories intentionally sharing a human-readable label will also merge into one visible search group.
- Popup stacking and 320px containment require rendered-browser verification.
- Legacy index documents without `categoryLabel` safely fall back to raw categories but do not receive the merged-label behavior until regenerated.

### Gaps

- No browser-rendered contrast, overflow, stacking, or real `file://` network verification, per the owner opt-in browser/E2E policy.
- No screen-reader accessibility-tree validation.
- The standard sample fixture lacks a `spec/` directory, so the merged-label behavior uses focused client tests and a temporary-project manual step.
- No automated lockfile-diff assertion; dependency preservation is checked from the repository diff.
- All three owner-approved review findings are resolved; final Bugbot review found no bugs.

### Manual validation steps

1. `rm -rf /tmp/specwiki-search && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-search` — generation exits 0 and writes the local HTML wiki, Lunr/search assets, and bounded index.
2. `rg -n 'categoryLabel|role="combobox"|role="listbox"|aria-controls="specwiki-search-results"' /tmp/specwiki-search/html/index.html` — finds human-readable category data and the required combobox/listbox hooks.
3. `open "file:///tmp/specwiki-search/html/index.html"` — `/` and Cmd/Ctrl+K focus search; Arrow keys wrap with input focus retained and the active card visible; Enter follows a relative result; Escape/outside click closes; gibberish shows explicit guidance.
4. `open "file:///tmp/specwiki-search/html/index.html"` — at 320px width and in light/dark themes, verify no horizontal page scrollbar and legible match, badge, hover, active, and empty states.
5. `open "file:///tmp/specwiki-search/html/index.html"` — open search results and then the mobile drawer; search closes and only the drawer remains active; reopening search closes the drawer.
6. `tmp=$(mktemp -d) && cp -R tests/fixtures/sample-project/. "$tmp"/ && mkdir -p "$tmp/spec" && printf '# Legacy Spec\n\nspecification detail here\n' > "$tmp/spec/legacy.md" && rm -rf /tmp/specwiki-merge && npm run dev generate -- --project "$tmp" --output /tmp/specwiki-merge && rg -o '"category":"specs?"' /tmp/specwiki-merge/html/index.html | sort -u` — exits 0 and prints both raw `spec` and `specs` categories.
7. `open "file:///tmp/specwiki-merge/html/index.html"` — searching `specification` shows one “Specifications” heading containing results from both raw categories.
8. `rm -rf /tmp/specwiki-search-no-search && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-search-no-search --no-search && test ! -e /tmp/specwiki-search-no-search/html/search-index.json && test ! -e /tmp/specwiki-search-no-search/html/assets/lunr.min.js && test ! -e /tmp/specwiki-search-no-search/html/assets/search.js && ! rg 'specwiki-search-input|search-index|role="combobox"' /tmp/specwiki-search-no-search/html/index.html` — exits 0 only when all search files and markup are omitted.
9. `git diff --exit-code -- package.json package-lock.json` — exits 0 with no output, confirming no dependency or lockfile changes.
10. `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` — all six gates pass; 333 tests pass and touched search-index/renderer/output paths remain above 90% coverage.
