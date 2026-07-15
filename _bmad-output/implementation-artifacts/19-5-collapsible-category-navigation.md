---
baseline_commit: uncommitted
---

# Story 19.5: Collapsible Category Navigation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex, browsing a large spec wiki with many files per category,
I want category groups in the navigation drawer to collapse and expand,
so that I can scan all categories without scrolling past hundreds of page links.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project . --output /tmp/specwiki-nav` — open any article under **Agent Skills**; the drawer shows four category headings at a glance with **Agent Skills** expanded and the other three collapsed; expand **BMAD Output** to reach its pages without scrolling past 176 links.

**Binds:** FR-041 (proposed) | **Depends:** E16 S16.2 category navigation; preserve S19.1 theme, S19.2 drawer/responsive behavior, and S19.4 search overlay precedence | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **AD:** AD-11

## Acceptance Criteria

### Functional

1. Each category group with more than one page renders as a collapsible section in the shared `.category-nav` tree on index and article pages.
2. Default collapsed state: on index pages, all multi-page category groups start collapsed; on article pages, the active category group starts expanded and all other multi-page groups start collapsed.
3. Single-page category groups remain always visible (no collapse control) because collapsing provides no scroll benefit.
4. Collapsed group headers remain scannable: show the existing category label, optional link to `index.html#{{anchor}}`, and a page-count badge for multi-page groups (e.g. `Agent Skills · 176`).
5. Expanding or collapsing a group does not navigate away from the current article; the category heading link still navigates to the index category anchor when activated directly.
6. Progressive enhancement: with JavaScript disabled, native `<details>`/`<summary>` (or equivalent no-JS disclosure markup) provides the same expand/collapse behavior and default open/closed states without inline script.
7. With JavaScript enabled, optional enhancement may synchronize `aria-expanded` on a dedicated toggle control and rotate a chevron indicator; enhancement must fail silently and leave native disclosure behavior intact if initialization does not run.
8. Desktop sidebar and mobile drawer share the same category-nav DOM and collapse behavior; opening the mobile drawer shows the same compact category list with the active group expanded.
9. Collapsing/expanding groups does not break S19.2 drawer open/close, focus return, `inert` closed-drawer behavior, body scroll lock, or S19.4 search overlay precedence.
10. The generated wiki continues to work over `file://` with no network request, CDN asset, server, new runtime dependency, storage access, or `fetch()`.
11. Existing desktop layout, relative links, Mustache escaping, search behavior, theme behavior, syntax highlighting, markdown output, and frozen HTML output paths remain intact.

### Logging & diagnostics (§0.8)

12. Existing verbose `output.write` events cover the modified generated CSS asset; no new event type or generated asset is introduced.
13. Default client-side collapse enhancement emits no console output and logs no page content.

### Quality measures

14. Renderer tests assert collapsible markup, default open/closed states for index vs active article, page-count badges, single-page group exemption, category anchor links, and no-JS disclosure structure.
15. Generated-asset tests assert chevron/collapsed styling, badge styling in light and dark themes, and unchanged drawer/search responsive rules from S19.2/S19.4.
16. The complete HARNESS §0.2 quality gate passes and `src/output/html/` coverage remains at least 90%.

## Tasks / Subtasks

- [x] Implement collapsible category navigation vertical slice (AC: 1–16)
  - [x] RED: add failing renderer and generated-asset tests for disclosure markup, default states, badges, single-page exemption, and preserved drawer/search behavior.
  - [x] GREEN: update `index.mustache` and `article.mustache` to wrap multi-page groups in native disclosure elements with server-rendered `open` state.
  - [x] GREEN: add optional progressive enhancement in `layout.mustache` only if needed for chevron/`aria-expanded` polish; prefer CSS-only disclosure when sufficient.
  - [x] GREEN: add collapsed/expanded styles, chevron rotation, and page-count badges to `specwiki.css` using existing semantic tokens.
  - [x] REFACTOR: keep one category-nav DOM tree, preserve S19.2 drawer shell and S19.4 overlay rules, and avoid new assets or dependencies.
  - [x] Update `IMPLEMENTATION.md`, run the full quality gate, automated code review, and QA analysis.

## Dev Notes

### UX Design Decision (Sally — 2026-07-15)

**Problem validated:** On the specwiki self-repo dogfood wiki, the flat category nav renders **245 page links** across four groups — **176** under Agent Skills alone. Users must scroll the entire first group to reach BMAD Output, Cursor Rules, or Other. This affects both the desktop sidebar (`overflow-y: auto`, `height: 100%`) and the mobile drawer (`overflow-y: auto` on the fixed panel).

**Options considered:**

| Option                                                      | Pros                                                                                                            | Cons                                                                                    | Verdict               |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------- |
| **A. Collapsible category sections (accordion/disclosure)** | Industry standard for doc sidebars; collapses 245 links to ~4 headings; works with native `<details>` for no-JS | Users may need one extra click to reach a page in a collapsed group                     | **Recommended**       |
| B. Truncate with “Show N more”                              | Simple CSS                                                                                                      | Still long when multiple groups expanded; awkward at 176 items                          | Reject                |
| C. Two-level flyout (categories only → submenu)             | Very compact                                                                                                    | Extra interaction cost; harder no-JS fallback; new overlay conflicts with search/drawer | Reject                |
| D. Search-only wayfinding                                   | Already shipped in S19.4                                                                                        | Does not help users who browse by category                                              | Complement only       |
| E. Sticky category headers while scrolling                  | Better orientation                                                                                              | Does not reduce list length                                                             | Reject as primary fix |

**Chosen pattern — route-aware collapsible disclosure:**

- Multi-page groups use native `<details>`/`<summary>` for zero-dependency progressive enhancement.
- **Index default:** all multi-page groups collapsed → user sees category headings + counts immediately.
- **Article default:** active group expanded, others collapsed → current context visible, other categories one click away.
- **Single-page groups:** always expanded, no toggle — avoids pointless chrome on “Cursor Rules (1)”.
- **Category heading link** to `index.html#{{anchor}}` stays inside the summary row; clicking the link navigates, clicking the disclosure affordance toggles.
- **Page-count badge** on collapsed headers communicates density without opening the group.
- **Multi-open allowed** — users may expand several groups to compare; do not force single-open accordion behavior.
- **No localStorage/sessionStorage** for open state (consistent with S19.2 drawer constraints); defaults derive from page type + active category only.

**Visual intent:**

- Chevron rotates on `[open]` via CSS (`prefers-reduced-motion: reduce` respected).
- Badge uses `--background-color-interactive-subtle` / subtle text token; active category heading keeps existing bold treatment.
- Collapsed nav target height: ~4–6 category rows visible without scrolling on a typical laptop viewport.

### Implementation Plan

- Extend Mustache context if needed so templates know `pages.length`, `active`, and whether a group is collapsible (`pages.length > 1`).
- Prefer server-rendered `open` attribute on `<details class="category-nav-group">` rather than client-side state bootstrapping.
- Keep `#specwiki-nav-drawer` and `.category-nav` structure from S19.2; only change inner group markup and CSS.
- Ensure summary row layout works at 12rem desktop width and `min(18rem, calc(100vw - 3rem))` drawer width.
- Do not implement S19.6 scroll-spy TOC, copy buttons, Pagefind, or category reorder/filter controls.

### Current State and Preservation Rules

- `index.mustache` and `article.mustache` render flat `.category-nav-group` blocks with heading link + full page list.
- `article.mustache` already marks active groups via `category-nav-active`.
- `specwiki.css` styles flat groups; `.category-nav` scrolls independently on desktop.
- Preserve `#content`, `.infobox`, `.toc`, `.breadcrumb`, search combobox, theme script ordering, escaped Mustache fields, and relative `file://` links.
- Preserve the seven-path verbose `output.write` contract — keep any enhancement inline and add no asset file.

### Security, Accessibility, and Performance Guardrails

- Use native disclosure or `<button type="button">` toggles with accurate `aria-expanded` when enhanced.
- Category labels and counts remain in escaped Mustache positions; never interpolate into script strings.
- Category heading links must remain keyboard reachable when collapsed.
- Do not nest disclosures inside disclosures.
- Avoid layout shift on desktop when groups collapse; drawer width unchanged.

### Testing Requirements

- Extend `tests/output/html/renderer.test.ts` for `<details>`/`<summary>` structure, `open` on active article group, closed inactive groups, omitted disclosure for single-page groups, and page-count badges.
- Extend `tests/output/wiki.test.ts` for CSS rules targeting `[open]`, chevron rotation, badge tokens, and unchanged S19.2 drawer breakpoints.
- Add a fixture or assertion path that simulates a multi-page category list (inline test data or existing sample project with multiple pages per category).
- Preserve existing layout, escaping, relative-link, theme, search, drawer, highlight, and seven-path logging tests.
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.

### Project Structure Notes

- UPDATE: `src/output/html/templates/index.mustache`
- UPDATE: `src/output/html/templates/article.mustache`
- UPDATE: `src/output/html/templates/layout.mustache` (only if minimal enhancement script is required)
- UPDATE: `src/output/html/assets/specwiki.css`
- UPDATE: `src/output/html/renderer.ts` or view-model builder if template context needs `pageCount` / `collapsible` flags
- UPDATE: `tests/output/html/renderer.test.ts`
- UPDATE: `tests/output/wiki.test.ts`
- UPDATE: `IMPLEMENTATION.md`
- UPDATE: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- No renderer API surface change, runtime dependency, CLI flag, output directory, or network behavior change.

### References

- [Source: `_bmad-output/implementation-artifacts/19-2-responsive-layout-and-mobile-navigation-drawer.md` — drawer shell, inert, no storage]
- [Source: `_bmad-output/implementation-artifacts/19-4-search-interaction-upgrade.md` — overlay precedence with drawer]
- [Source: `src/output/html/templates/index.mustache`, `article.mustache`, `assets/specwiki.css`]
- [UX: uxpatterns.dev sidebar pattern — collapsible sections for deep hierarchies]
- [UX: LogRocket accordion accessibility — `aria-expanded`, no nested accordions]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Terra

### Debug Log References

- RED: `npm run test -- tests/output/html/renderer.test.ts tests/output/wiki.test.ts` failed as expected before implementation.
- GREEN: focused renderer and generated-asset tests passed.
- Final gate: `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` passed; 337 tests, 95.53% lines / 90.07% branches globally, `src/output/html/` 100% lines.

### Completion Notes List

- Added native `<details>` navigation for multi-page categories. Index pages begin collapsed; article pages begin with the active category open.
- Kept singleton categories as always-visible groups, retained escaped index-anchor links, and added tokenized page-count badges and CSS-only chevrons with reduced-motion support.
- Preserved the existing drawer, search, `file://`, asset, and `output.write` contracts without new dependencies or client-side collapse script.

### File List

- `src/output/html/renderer.ts`
- `src/output/html/templates/index.mustache`
- `src/output/html/templates/article.mustache`
- `src/output/html/assets/specwiki.css`
- `tests/output/html/renderer.test.ts`
- `tests/output/wiki.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/19-5-collapsible-category-navigation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-07-15: Implemented collapsible category navigation and completed quality, automated-review, and QA checks.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-15  
**Review outcome:** Approve  
**Reviewer model:** claude-sonnet-5-thinking-high

### Action Items

None.

### Review Findings

Bugbot found no bugs.

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** claude-sonnet-5-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC 1–6, 8, 14: renderer tests verify native disclosure markup, route-aware defaults, singleton exemption, anchor links, counts, and no-JS structure.
- AC 7, 10–13: CSS-only enhancement adds no script, storage, network, dependency, asset, console output, or logging event; existing `output.write` still covers the modified CSS asset.
- AC 9, 11, 15–16: generated-asset assertions preserve drawer/search selectors; full quality gate passed and `src/output/html/` reached 100% line coverage.

### Regression risks

- Nested anchor within native summary requires manual browser verification that direct link activation navigates rather than toggles.
- CSS assertions verify selector contracts rather than computed visual layout.

### Gaps

- No browser-level click or JavaScript-disabled test was added; native disclosure markup is covered by renderer tests and requires manual validation.
- Optional JavaScript `aria-expanded` synchronization was deliberately omitted because native `<details>` semantics and CSS chevrons satisfy the required behavior.

### Manual validation steps

1. `npm run dev generate -- --project . --output /tmp/specwiki-nav` — generation exits 0 with no errors.
2. `open "file:///tmp/specwiki-nav/html/index.html"` — multi-page groups are collapsed with a chevron and page-count badge; singleton groups stay visible without a toggle.
3. Click a category heading link in the index navigation — it navigates to `index.html#category-<name>` rather than toggling the group.
4. Open an article under **Agent Skills** — that group is open by default; other multi-page groups are collapsed and can expand independently.
5. Resize below 720px and open the hamburger drawer — the same disclosure behavior appears; Escape, backdrop, close button, and `/` or `Cmd/Ctrl+K` search all keep working without overlay conflicts.
6. Disable JavaScript and reload — native disclosures still expand/collapse and category links remain reachable.
7. `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` — all six commands pass; HTML renderer coverage stays at or above 90%.
