---
baseline_commit: a419379
---

# Story 24.1: Article Type Scale and Heading Serif

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Alex reading a long spec,
I want article headings with a clear size and weight hierarchy,
so that I can scan sections without relying on browser defaults.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-type24` → open a BMAD story article — h1 is 32px serif; h2/h3 steps are visually distinct; TOC depth matches visual heading depth.

**Binds:** FR-032, FR-033 (presentation only) | **Depends:** E16 S16.3 (`.mw-parser-output`), E19 S19.3 (70ch grid) | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **Epic:** E24 (first story — chrome token refactor is S24.2)

## Acceptance Criteria

### Functional

1. Under `.mw-parser-output`, article headings `h1`–`h6` use explicit `font-size`, `font-weight`, and `margin-block` values — no reliance on browser `em`-relative defaults on the 14px root.
2. `h1` and `h2` use `font-family: var(--font-family-heading-main)` (Linux Libertine / Georgia serif stack from bundled `wikimedia-ui-base`); `h3`–`h6` use the sans stack with `font-weight: 600`.
3. Heading sizes match the owner-approved mockup scale (px @ 16px root):

   | Level | Token (define in `:root`) | Size     | Weight | Notes                           |
   | ----- | ------------------------- | -------- | ------ | ------------------------------- |
   | h1    | `--font-size-h1`          | 2rem     | 400    | Page title                      |
   | h2    | `--font-size-h2`          | 1.625rem | 400    | Optional 1px bottom border rule |
   | h3    | `--font-size-h3`          | 1.375rem | 600    | Major sections                  |
   | h4    | `--font-size-h4`          | 1.125rem | 600    | Section breaks                  |
   | h5    | `--font-size-h5`          | 1rem     | 600    | Subsections                     |
   | h6    | `--font-size-h6`          | 0.875rem | 600    | Minor section labels            |

4. `h2` may include a subtle section divider: `border-bottom: 1px solid var(--border-color-divider)` with modest `padding-bottom` per approved mockup — must not alter grid track geometry.
5. `.specwiki-portal h1` (index Main Page title) receives the same `--font-size-h1` and `--font-family-heading-main` treatment for portal title parity.
6. **Preserve unchanged:** heading permalink (`.heading-permalink` opacity/hover on h2–h6), `scroll-margin-top` on article headings and portal/category targets, S19.3 three-track 70ch grid (`@media (min-width: 1200px)`), top-level `table`/`pre` full-column escape hatch, infobox float, TOC rail, nav disclosure markup from E23.
7. **Out of scope for S24.1** (defer to S24.2/S24.3): `body.specwiki` font-family switch to `--font-family-system-sans`, chrome nav/search/breadcrumb/TOC/infobox font-size token refactor, monospace stack alignment, landing page CSS, Markdown output, templates, renderer API, CLI flags, new dependencies, web fonts (`@font-face`/CDN).
8. Generated wiki remains offline-safe over `file://` — system fonts only via existing bundled tokens; no new network requests.

### Logging & diagnostics (§0.8)

9. Reuse existing verbose `output.write` coverage for the modified CSS asset; no new log event type.

### Quality measures

10. Generated-asset tests in `tests/output/wiki.test.ts` assert heading token definitions and `.mw-parser-output` rules for serif h1–h2, sans h3–h6, explicit sizes, and h2 border rule; negative test confirms headings no longer rely on unqualified browser-default sizing only.
11. Existing theme, responsive drawer, search, nav disclosure, breadcrumb, reading-measure grid, renderer, escaping, and output-write tests remain green.
12. Full HARNESS §0.2 quality gate passes; `src/output/html/` coverage remains ≥ 90%.

## Tasks / Subtasks

- [x] RED: add failing generated-CSS tests for heading tokens and `.mw-parser-output h1`–`h6` rules (AC: 10)
  - [x] Assert `:root` defines `--font-size-h1` through `--font-size-h6` with expected rem values
  - [x] Assert `.mw-parser-output h1` / `h2` reference `--font-family-heading-main`
  - [x] Assert `.mw-parser-output h3`–`h6` use `font-weight: 600` and explicit `font-size` via tokens
  - [x] Assert `.mw-parser-output h2` includes `border-bottom` using `--border-color-divider`
  - [x] Assert `.specwiki-portal h1` uses `--font-size-h1` and heading-main family
- [x] GREEN: implement article heading typography in `specwiki.css` (AC: 1–5, 8)
  - [x] Add `--font-size-h1`–`h6` custom properties to `:root` block (after existing semantic tokens)
  - [x] Replace/extend lines ~691–717: explicit rules for `.mw-parser-output h1`–`h6` and `.specwiki-portal h1`
  - [x] Keep existing `line-height: var(--line-height-heading)`, `position: relative` on h2–h6, and scroll-margin selectors intact
- [x] REFACTOR: verify no regression to E19/E23 layout contracts (AC: 6, 11)
  - [x] Do not touch `@media (min-width: 1200px)` grid rules, infobox float, nav disclosure CSS, or breadcrumb styles
  - [x] Do not change `body.specwiki` `font-family` or chrome `font-size` literals (S24.2 scope)
- [x] Run full §0.2 quality gate; update `IMPLEMENTATION.md` (AC: 12)

## Dev Notes

### Current state (read before editing)

`src/output/html/assets/specwiki.css` bundles after `wikimedia-ui-base` in `HtmlRenderer.bundleCss()`. Wikimedia tokens already available in output CSS:

```css
--font-family-heading-main: var(--font-family-serif);
--font-family-serif:
  "Linux Libertine", "Georgia", "Times", "Source Serif Pro", serif;
--font-family-base: var(
  --font-family-sans
); /* Helvetica — S24.2 switches body */
--line-height-heading: /* from wikimedia bundle */;
```

**Today (lines ~691–717):** headings only set `line-height`; h2–h6 get `position: relative` for permalinks; scroll-margin applies to article headings + portal/category anchors. **No explicit font-size or font-family** — browser defaults produce ~1.75em/1.5em/1.17em on 14px root (see mockup “Current” panel).

`body.specwiki` (line ~119): `font-size: 0.875rem` (14px) — **do not change in S24.1**.

### Target CSS (approved mockup)

Reference: `docs/design/typography-mockup.html` proposed panel (owner-approved 2026-07-18).

```css
/* :root additions */
--font-size-h1: 2rem;
--font-size-h2: 1.625rem;
--font-size-h3: 1.375rem;
--font-size-h4: 1.125rem;
--font-size-h5: 1rem;
--font-size-h6: 0.875rem;

/* Article headings — scope to .mw-parser-output */
.mw-parser-output h1,
.mw-parser-output h2 {
  font-family: var(--font-family-heading-main);
  font-weight: 400;
  line-height: var(--line-height-heading);
}
.mw-parser-output h3,
.mw-parser-output h4,
.mw-parser-output h5,
.mw-parser-output h6 {
  font-family: var(
    --font-family-base
  ); /* sans via wikimedia; S24.2 switches to system-sans */
  font-weight: 600;
  line-height: var(--line-height-heading);
}
.mw-parser-output h1 {
  font-size: var(--font-size-h1);
  margin: 0 0 0.75rem;
}
.mw-parser-output h2 {
  font-size: var(--font-size-h2);
  margin: 1.5rem 0 0.5rem;
  padding-bottom: 0.15rem;
  border-bottom: 1px solid var(--border-color-divider);
}
.mw-parser-output h3 {
  font-size: var(--font-size-h3);
  margin: 1.25rem 0 0.35rem;
}
.mw-parser-output h4 {
  font-size: var(--font-size-h4);
  margin: 1rem 0 0.35rem;
}
.mw-parser-output h5 {
  font-size: var(--font-size-h5);
  margin: 0.85rem 0 0.25rem;
}
.mw-parser-output h6 {
  font-size: var(--font-size-h6);
  margin: 0.75rem 0 0.25rem;
}

.specwiki-portal h1 {
  font-family: var(--font-family-heading-main);
  font-size: var(--font-size-h1);
  font-weight: 400;
}
```

Adjust h4–h6 margins if needed for vertical rhythm; mockup only shows h1–h3 — use sensible defaults consistent with h3 spacing.

### What must be preserved

| Contract             | Location                                               | Do not break                                 |
| -------------------- | ------------------------------------------------------ | -------------------------------------------- |
| 70ch reading grid    | `@media (min-width: 1200px)` ~835–847                  | Grid tracks, table/pre `grid-column: 1 / -1` |
| Sticky header offset | `--specwiki-header-block-size`, scroll-margin ~706–716 | 43px shared offset                           |
| Heading permalinks   | `.heading-permalink` ~719–732                          | Opacity 0 default; hover reveal h2–h6        |
| Nav disclosure       | `.category-nav-*` ~480–575                             | Subgroup labels, nested `<details>`          |
| Breadcrumb subgroup  | E23 S23.7 templates                                    | No template changes                          |
| Infobox float        | `.infobox` ~597–605                                    | 16rem float right at ≥1200px                 |
| TOC sticky           | `.toc` ~638–647                                        | `top: var(--specwiki-header-block-size)`     |

### Scope boundary (critical)

S24.1 is **article heading typography only**. Do **not** preempt S24.2:

- Do not refactor nav (`0.6875rem` subgroup labels), breadcrumb (`0.8125rem`), TOC links (`0.75rem`), or infobox body sizes to `--font-size-caption/ui-sm/ui` — that is S24.2.
- Do not change `.specwiki-logo` or `code`/`pre` monospace stacks — S24.2 aligns with `docs/brand/BRAND.md`.
- Do not extend `docs/brand/BRAND.md` — S24.3.

Defining `--font-size-h1`–`h6` in `:root` **is** in S24.1 scope so S24.2 can add chrome tokens alongside without rework.

### Implementation approach

1. **CSS-only slice** — no template, parser, or renderer changes.
2. **TDD:** extend `tests/output/wiki.test.ts` following existing generated-CSS test patterns (e.g. theme tokens ~792, responsive ~813, disclosure nav ~894).
3. **Test pattern:** generate fixture wiki to temp dir, read `html/assets/specwiki.css`, assert regex/content matches.
4. **Optional:** add one renderer test in `tests/output/html/renderer.test.ts` if bundled CSS smoke test helps — prefer wiki.test.ts for consistency.

### Testing requirements

- RED/GREEN on focused test: `npm test -- tests/output/wiki.test.ts -t "article heading type scale"`
- Full gate: `npm test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, `npm run build`
- Visual check against mockup proposed panel (qualitative — not pixel CI)

### Project structure notes

```
src/output/html/assets/specwiki.css   # PRIMARY — heading rules + :root tokens
tests/output/wiki.test.ts             # Generated CSS assertions
IMPLEMENTATION.md                     # Build log entry after completion
```

No changes to: `src/parse/markdown.ts`, `src/output/html/templates/*`, `src/output/html/renderer.ts`, `site/assets/landing.css`.

### References

- [Source: _bmad-output/implementation-artifacts/epic-24-wiki-typography-system.md#S24.1]
- [Source: _bmad-output/planning-artifacts/ux/wiki-typography-brief.md]
- [Source: docs/design/typography-mockup.html — proposed panel]
- [Source: src/output/html/assets/specwiki.css#L691-L717 — current heading baseline]
- [Source: node_modules/wikimedia-ui-base/wikimedia-ui-base.css — `--font-family-heading-main`]
- [Source: _bmad-output/implementation-artifacts/19-3-reading-measure-and-sticky-header.md — grid/scroll-margin contracts]
- [Source: _bmad-output/implementation-artifacts/16-3-rich-html-content-rendering.md — `.mw-parser-output` scope, permalink pattern]

### Git intelligence

Recent commits are E23 breadcrumb/nav work — no typography changes yet. Latest: `a419379 chore(release): bump version to 1.1.0`, `4c9b64b feat(output): breadcrumb subgroup parity`. CSS edits should stay isolated to heading blocks; avoid touching nav/breadcrumb templates or grouping modules.

### Open items (non-blocking — do not implement unless trivial)

- Infobox title serif (mockup shows proposed — optional polish; not required for S24.1 AC)
- h4–h6 mockup margins — infer from scale; owner validates visually
- `--font-size-body-lg` wide-column bump — deferred S24.4 candidate

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Added `:root` heading scale tokens (`--font-size-h1`–`h6`) and article typography under `.specwiki-article-body .mw-parser-output` (serif h1–h2, sans h3–h6, h2 divider rule); `.specwiki-portal h1` parity for Main Page title.
- Scoped article heading rules to `.specwiki-article-body` so portal/category README intros (also `.mw-parser-output`) do not inherit 2rem serif h1 styling — addresses code-review finding on duplicate Main Page titles.
- Generated-CSS test `writes article heading type scale with serif h1-h2 and sans h3-h6` covers tokens, families, weights, sizes, h2 border, portal h1, and negative baseline guard.

### File List

- `src/output/html/assets/specwiki.css`
- `tests/output/wiki.test.ts`
- `IMPLEMENTATION.md`

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-18  
**Review outcome:** Changes Requested (1 medium — addressed in-session)  
**Reviewer model:** Bugbot

### Action Items

- [x] [Medium] Scope article heading typography to `.specwiki-article-body .mw-parser-output` so portal/category intros do not inherit article h1 scale (applied)

### Review Findings

| Severity | Finding                                                                                    | Resolution                                                                               |
| -------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Medium   | Bare `.mw-parser-output` selectors styled portal intro h1s alongside `.specwiki-portal h1` | Scoped typography to `.specwiki-article-body .mw-parser-output`; added negative CSS test |

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:**  
**Review date:**

### AC coverage

### Regression risks

### Gaps

### Manual validation steps

1. `npm test -- tests/output/wiki.test.ts -t "article heading type scale"` — focused generated-CSS test passes.
2. `npm test` — full suite green; no regressions in theme, responsive, nav disclosure, or renderer tests.
3. `rm -rf /tmp/specwiki-type24 && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-type24` — generation exits 0.
4. `rg -n "font-size-h1|font-family-heading-main|border-bottom" /tmp/specwiki-type24/html/assets/specwiki.css` — heading tokens and h2 rule present in bundled CSS.
5. `open "file:///tmp/specwiki-type24/html/index.html"` — Main Page h1 renders serif at ~32px; nav chrome unchanged from pre-change baseline.
6. `open "file:///tmp/specwiki-type24/html/<any-story-with-h2-h3>.html"` — at 1280px: h1 serif 32px, h2 serif 26px with subtle bottom rule, h3 sans 22px semibold; TOC visual depth matches heading hierarchy; scroll-to-hash clears sticky header; 70ch reading column unchanged.
