---
baseline_commit: ed4add9
---

# Story 24.2: Type Tokens and Chrome Alignment

Status: review

## Story

As Sam browsing a large wiki,
I want consistent, legible nav and search typography aligned with the brand,
so that chrome density stays scannable and matches the wordmark spec.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-type24` → compare header wordmark mono to `docs/brand/BRAND.md` SVG; nav subgroup labels use tokens; body renders system sans.

**Binds:** FR-032, FR-033 (presentation only) | **Depends:** S24.1 (heading tokens in same `:root` block) | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **Epic:** E24

## Acceptance Criteria

### Functional

1. `:root` defines chrome type tokens alongside S24.1 heading tokens:
   - `--font-size-caption: 0.6875rem` (11px)
   - `--font-size-ui-sm: 0.75rem` (12px)
   - `--font-size-ui: 0.8125rem` (13px)
   - `--font-size-body: 0.875rem` (14px)
2. `body.specwiki` uses `font-family: var(--font-family-system-sans)` and `font-size: var(--font-size-body)` (from bundled `wikimedia-ui-base`).
3. Nav, search, breadcrumbs, TOC, and infobox chrome consume `--font-size-*` tokens — no magic rem literals for those surfaces.
4. Article sans headings (`h3`–`h6`) use `--font-family-system-sans` instead of `--font-family-base`.
5. Monospace alignment per `docs/brand/BRAND.md`: `.specwiki-logo`, `.mw-parser-output code`, and `.mw-parser-output pre` use `ui-monospace`-first stack.
6. Weight rhythm: `--font-weight-semi-bold` (600) for category headings, subgroup labels, and search group headings; `--font-weight-bold` (700) reserved for active category heading (`.category-nav-active`) and `.toc-heading` only.
7. **Preserve unchanged:** E19 70ch grid, sticky header offsets, infobox float, TOC rail geometry, E23 nav disclosure markup/templates, breadcrumb subgroup semantics (S23.7), S24.1 article heading scale.
8. **Out of scope:** landing page CSS, `docs/brand/BRAND.md` doc extension (S24.3), Markdown output, templates, renderer API, new dependencies, web fonts.

### Quality measures

9. Generated-asset tests assert chrome token definitions, body system-sans, tokenized chrome selectors, BRAND monospace stack, and weight rhythm; existing theme/responsive/disclosure/nav/breadcrumb tests remain green.
10. Full HARNESS §0.2 quality gate passes; `src/output/html/` coverage remains ≥ 90%.

## Tasks / Subtasks

- [x] RED: add failing generated-CSS tests for chrome type tokens (AC: 9)
  - [x] Assert `:root` defines `--font-size-caption`, `--font-size-ui-sm`, `--font-size-ui`, `--font-size-body`
  - [x] Assert `body.specwiki` uses `--font-family-system-sans` and `--font-size-body`
  - [x] Assert nav/search/breadcrumb/TOC/infobox selectors reference `--font-size-*` tokens
  - [x] Assert `.specwiki-logo` and `.mw-parser-output code`/`pre` use `ui-monospace`
  - [x] Assert subgroup labels use `--font-weight-semi-bold`; TOC heading uses `--font-weight-bold`
  - [x] Update S24.1 test: h3–h6 reference `--font-family-system-sans`
- [x] GREEN: implement chrome typography in `specwiki.css` (AC: 1–6, 8)
  - [x] Add chrome `--font-size-*` tokens and `--font-family-monospace-brand` to `:root`
  - [x] Refactor chrome surfaces to consume tokens; switch body and h3–h6 to system sans
  - [x] Apply BRAND monospace stack to logo and code/pre
  - [x] Adjust chrome label weights per weight rhythm
- [x] REFACTOR: verify no regression to E19/E23 layout contracts (AC: 7, 9)
- [x] Run full §0.2 quality gate; update `IMPLEMENTATION.md` (AC: 10)

## Dev Notes

**Primary file:** `src/output/html/assets/specwiki.css`  
**Tests:** `tests/output/wiki.test.ts`  
**Reference:** `docs/design/typography-mockup.html`, `docs/brand/BRAND.md`

S24.1 already landed `--font-size-h1`–`h6` and article heading rules. S24.2 adds chrome ladder tokens and refactors magic rem values (~209, ~261, ~273, ~455, ~475, ~492, ~541, ~589, ~610, ~640, ~657, ~674).

`--font-family-system-sans` ships in bundled `wikimedia-ui-base` — use it directly; do not duplicate in `:root`.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Added chrome type ladder tokens (`--font-size-caption` through `--font-size-body`) and `--font-family-monospace-brand` in `:root`.
- Switched `body.specwiki` to `--font-family-system-sans` / `--font-size-body`; refactored nav, search, breadcrumb, TOC, and infobox to consume tokens.
- Aligned `.specwiki-logo`, `.mw-parser-output code`, and `.mw-parser-output pre` with BRAND monospace stack via shared token.
- Applied weight rhythm: semi-bold category/subgroup/search group labels; bold reserved for active category heading and TOC heading.
- Updated S24.1 generated-CSS test for h3–h6 `--font-family-system-sans`; added `writes chrome type tokens with system sans body and BRAND monospace` test.

### File List

- `src/output/html/assets/specwiki.css`
- `tests/output/wiki.test.ts`
- `IMPLEMENTATION.md`

## QA Manual Validation

### Manual validation steps

1. `npm test -- tests/output/wiki.test.ts -t "chrome type tokens"` — focused generated-CSS test passes.
2. `npm test` — full suite green.
3. `rm -rf /tmp/specwiki-type24 && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-type24` — generation exits 0.
4. `rg -n "font-size-caption|font-family-system-sans|ui-monospace" /tmp/specwiki-type24/html/assets/specwiki.css` — chrome tokens and stacks present.
5. `open "file:///tmp/specwiki-type24/html/index.html"` — wordmark mono matches BRAND; nav subgroup labels legible; body text uses system sans.
6. Open a story article at 1280px — article h1–h6 unchanged from S24.1; TOC/nav/breadcrumb sizes token-driven; 70ch grid unchanged.
