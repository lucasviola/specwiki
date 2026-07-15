# Epic 19 Context:

## Goal

Improve the generated static HTML wiki’s day-to-day readability and navigation while preserving the established offline, `file://`-safe output. Epic 19 builds on E16’s Vector-inspired HTML skin and navigation chrome: users should be able to read long articles comfortably, browse large category sets, use search quickly, and use the wiki on narrow screens without changing the frozen Markdown or `wiki/html/` output-path contracts.

The governing product requirements remain FR-032 (Mustache renderer, shared assets, and Wikimedia tokens), FR-033 (sidebar, infobox, TOC, and breadcrumbs), and FR-034 (rich rendered content and optional local search). The Epic 19 story artifacts additionally identify proposed FR-039 through FR-041 for theme/responsiveness, search interaction, and collapsible navigation. These are presentation and interaction enhancements, not changes to discovery, parsing, category derivation, or generated page locations.

## Stories

1. **S19.1 — Dark Mode with Pre-Paint Theme and Toggle.** Use semantic CSS custom properties so generated pages follow `prefers-color-scheme` without JavaScript and allow a storage-safe light/dark override before first paint. The header toggle must be keyboard-operable, silent, and preserve local `file://` operation.
2. **S19.2 — Responsive Layout and Mobile Navigation Drawer.** At 719px and below, collapse index and article layouts to one content column; progressively enhance the existing category navigation into an accessible mobile drawer while preserving a no-JavaScript in-flow fallback. Wide tables and code scroll inside their own containers, never by forcing document-level horizontal overflow.
3. **S19.3 — Reading Measure and Sticky Header.** At wide desktop widths, render article Markdown in one centered 70ch grid track, with top-level tables and code blocks spanning the full article column. Keep the header natively sticky and use a shared header-block-size value for TOC and hash-target offsets. Do not reintroduce the removed per-child width/auto-margin approach, which fragmented article layout.
4. **S19.4 — Search Interaction Upgrade.** Retain local Lunr, the inline bounded index, and relative article links; add keyboard shortcuts, an editable combobox/listbox flow, grouped capped result cards, safe text-node match highlighting, and an explicit no-results state. Search and the mobile drawer must expose only one active overlay.
5. **S19.5 — Collapsible Category Navigation.** Use native disclosure markup for category groups with more than one page. Index pages start multi-page groups closed; article pages start the active group open. Single-page categories remain visible. Keep the same navigation DOM on desktop and mobile, with no storage, dependency, or extra asset.

## Requirements & Constraints

- Preserve the frozen output layout: `wiki/index.md`, per-page Markdown, `wiki/html/index.html`, and `wiki/html/{slug}.html`; Markdown output remains unchanged.
- Preserve relative inter-page links and direct `file://` browsing. No server, CDN, `fetch()`, telemetry, or new output path is permitted.
- Keep user-controlled titles, labels, paths, descriptions, and search data in escaped Mustache or safe DOM-text positions. Do not interpolate them into JavaScript or unsafe HTML.
- Keep static client enhancements silent: no console output and no logging of themes, queries, page content, or other sensitive values. Existing `output.write`, `output.render`, and `output.search-index` contracts continue to cover generated output.
- Reuse the shared Mustache renderer, HTML assets, and semantic Wikimedia-token CSS. Do not add a framework, duplicate the renderer, or add runtime dependencies without explicit justification.
- Maintain WCAG-oriented keyboard access, visible focus, correct native/control semantics, and readable no-JavaScript behavior.
- Follow the repository’s TypeScript/ESM, TDD, 90% coverage, and six-command quality-gate rules. Browser/E2E tests are not required unless specifically requested.

## Technical Decisions

- `src/output/html/renderer.ts` remains the view-model and template-rendering boundary; shared chrome belongs in `templates/layout.mustache`, article/category markup in the existing body templates, and static behavior/style stays in local assets.
- CSS uses semantic custom properties after `wikimedia-ui-base`, including explicit system-dark and saved-theme selectors. The theme initializer must tolerate unavailable or malformed storage and accept only `light`/`dark`.
- Responsive behavior uses a deterministic `max-width: 719px` boundary. The drawer is one progressively enhanced navigation tree, not a duplicate mobile navigation implementation; closed enhanced drawers must not remain in keyboard order.
- The wide-screen article measure is a three-column grid on `.specwiki-article-body .mw-parser-output`, activated at 1200px to avoid conflict with the floated infobox at tablet widths. Normal direct children occupy the middle `minmax(0, 70ch)` track; top-level `table` and `pre` span all tracks.
- The sticky header uses native `position: sticky`; `--specwiki-header-block-size` includes its border and is reused for TOC and target offsets. The header remains below the drawer backdrop and drawer stacking levels.
- Search retains Lunr 2.3.9, one local client script, an inline escaped JSON payload, and bounded excerpts. It builds its index once, caps results at ten, and uses native relative links.
- Category collapse state is server-rendered from page type and active category using native `<details>/<summary>`; do not persist it in local/session storage or force single-open accordion behavior.

## UX & Interaction Patterns

The HTML wiki is a three-region article layout: category navigation, central article content with breadcrumb and infobox, and a TOC rail. On narrow screens it becomes a readable single column, with the TOC in flow and navigation reachable through the enhanced drawer or no-JavaScript document order. Breadcrumbs continue to be `Main Page › {Category} › {Title}`. Large category sets remain scannable through route-aware disclosures: page counts communicate density, the active article’s group remains open, and category heading links still reach the index anchor. Search is an optional fast path, not a replacement for navigation.

## Cross-Story Dependencies

E16 S16.1 provides the Mustache renderer, local CSS asset pipeline, and token-based skin. E16 S16.2 provides the article template, category rail, infobox, TOC, and breadcrumb semantics; S19.2 and S19.5 must retain that shared navigation structure. E16 S16.4 provides the local Lunr pipeline consumed by S19.4. S19.1’s semantic theme variables apply to all later visual states. S19.2’s responsive drawer, focus, inert, scroll-lock, and overlay rules constrain S19.4 and S19.5. S19.3 must retain S19.1, S19.2, S19.4, and existing portal/rail geometry while changing only the wide article reading measure and sticky offsets.
