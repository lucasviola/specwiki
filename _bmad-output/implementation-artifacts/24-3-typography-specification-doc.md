---
baseline_commit: 50581c2
---

# Story 24.3: Typography Specification Doc

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a contributor implementing wiki UI,
I want a documented type scale and surface map,
so that landing and wiki typography do not drift apart unintentionally.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Read `docs/brand/BRAND.md` (extended) — wiki scale table, chrome surface ladder, landing-vs-wiki divergence note, and links to the approved mockup and UX brief.

**Binds:** FR-032, FR-033 (documentation of shipped presentation) | **Depends:** S24.1, S24.2 (documents shipped CSS values) | **NFR:** NFR-003, NFR-007 | **Epic:** E24 (final story — closes epic gate doc item)

## Acceptance Criteria

### Functional

1. `docs/brand/BRAND.md` gains a **Wiki typography** section (or clearly linked companion subsection) that documents the **shipped** token ladder from `src/output/html/assets/specwiki.css` `:root`:

   | Token                 | Value     | px @16 | Role                                                 |
   | --------------------- | --------- | ------ | ---------------------------------------------------- |
   | `--font-size-caption` | 0.6875rem | 11     | Nav counts, search badges                            |
   | `--font-size-ui-sm`   | 0.75rem   | 12     | Nav links, TOC links, search                         |
   | `--font-size-ui`      | 0.8125rem | 13     | Breadcrumbs, category headings, infobox, TOC heading |
   | `--font-size-body`    | 0.875rem  | 14     | Article body, default inherit                        |
   | `--font-size-h6`      | 0.875rem  | 14     | Minor section labels                                 |
   | `--font-size-h5`      | 1rem      | 16     | Subsections                                          |
   | `--font-size-h4`      | 1.125rem  | 18     | Section breaks                                       |
   | `--font-size-h3`      | 1.375rem  | 22     | Major sections                                       |
   | `--font-size-h2`      | 1.625rem  | 26     | Article sections (+ h2 rule)                         |
   | `--font-size-h1`      | 2rem      | 32     | Page title (serif)                                   |

2. Document **font stacks** as implemented (not aspirational):

   | Surface             | Stack / token                                                  | Weight notes                |
   | ------------------- | -------------------------------------------------------------- | --------------------------- |
   | Wiki body           | `--font-family-system-sans` via `body.specwiki`                | 14px body density           |
   | Article h1–h2       | `--font-family-heading-main` (Linux Libertine / Georgia serif) | 400                         |
   | Article h3–h6       | `--font-family-system-sans`                                    | 600                         |
   | Portal Main Page h1 | `--font-family-heading-main` + `--font-size-h1`                | 400                         |
   | Wordmark, code, pre | `--font-family-monospace-brand` (`ui-monospace` first)         | wordmark 700; code inherits |

3. Include a **chrome surface map** table mapping CSS selectors to tokens (minimum rows):

   | Selector / surface                                 | Token(s) used                      |
   | -------------------------------------------------- | ---------------------------------- |
   | `.specwiki-search-group-heading`                   | `--font-size-ui-sm`, semi-bold     |
   | `.specwiki-search-category`                        | `--font-size-caption`              |
   | `.specwiki-search-snippet`                         | `--font-size-ui`                   |
   | `.category-nav-heading`                            | `--font-size-ui`, semi-bold        |
   | `.category-nav-count`                              | `--font-size-caption`              |
   | `.category-nav-pages a`                            | `--font-size-ui-sm`                |
   | `.category-nav-subgroup-label`                     | `--font-size-caption`, semi-bold   |
   | `.category-nav-active .category-nav-heading`       | bold (700), not larger size        |
   | `.breadcrumb`                                      | `--font-size-ui`                   |
   | `.infobox`                                         | `--font-size-ui`                   |
   | `.toc-heading`                                     | `--font-size-ui`, bold             |
   | `.toc-list a`                                      | `--font-size-ui-sm`                |
   | `.specwiki-article-body .mw-parser-output h1`–`h6` | respective `--font-size-h*` tokens |

4. Document **weight rhythm**: semi-bold (600) for category headings, subgroup labels, and search group headings; bold (700) reserved for active category heading (`.category-nav-active`) and `.toc-heading` only.

5. Add an explicit **Landing vs wiki** subsection describing **intentional divergence** — do not merge scales:

   | Aspect            | Landing (`site/assets/landing.css`)     | Wiki (`specwiki.css`)                |
   | ----------------- | --------------------------------------- | ------------------------------------ |
   | Body base         | ~16px / `1rem`, system sans stack       | 14px `--font-size-body`, system sans |
   | Hero h1           | `clamp(2.25rem, 6vw, 3.5rem)` marketing | 32px serif article title             |
   | Design intent     | Editorial / marketing handoff           | Vector-density reading + nav chrome  |
   | Modification rule | E20 scope — do not import into wiki     | E24 scope — document, do not unify   |

6. Link canonical research artifacts (relative paths from repo root):

   - `_bmad-output/planning-artifacts/ux/wiki-typography-brief.md`
   - `docs/design/typography-mockup.html` (owner-approved 2026-07-18)
   - `_bmad-output/implementation-artifacts/epic-24-wiki-typography-system.md`

7. Note **known non-token exceptions** so future contributors do not “fix” them accidentally:

   - `.specwiki-logo` uses `font-size: 1rem` (16px) — matches wordmark SVG in existing Typography section; not driven by `--font-size-*` chrome ladder
   - `.infobox-title` uses `font-size: 1rem` — optional serif polish deferred (epic open item)

8. **Out of scope:** CSS changes in `specwiki.css`, landing CSS, templates, renderer, tests (unless doc review discovers a spec/CSS mismatch — then file a follow-up story, do not expand S24.3 scope).

### Logging & diagnostics (§0.8)

9. N/A — documentation-only story; no runtime log events.

### Quality measures

10. All token values and selector mappings in the doc match generated CSS at `baseline_commit` (verify with `rg` against `src/output/html/assets/specwiki.css`).
11. Relative links resolve from repo root (spot-check mockup and UX brief paths).
12. `IMPLEMENTATION.md` build log updated with S24.3 doc row.
13. Doc-only quality gate: `npm run typecheck` and `npm run build` pass (no test changes expected).

## Tasks / Subtasks

- [x] Read shipped CSS and S24.1/S24.2 story completion notes before writing (AC: 10)
  - [x] Extract `:root` token block and chrome/article selector map from `specwiki.css`
  - [x] Note exceptions (logo 16px, infobox title 1rem)
- [x] Extend `docs/brand/BRAND.md` with Wiki typography section (AC: 1–5, 7)
  - [x] Token ladder table (article + chrome)
  - [x] Font stack table
  - [x] Chrome surface map
  - [x] Weight rhythm paragraph
  - [x] Landing vs wiki divergence table
  - [x] Artifact links
- [x] Cross-check doc against CSS — no aspirational values (AC: 10)
  - [x] `rg` token names and key selectors match doc tables
- [x] Update `IMPLEMENTATION.md` build log (AC: 12)
- [x] Run doc-only quality gate: `npm run typecheck`, `npm run build` (AC: 13)

## Dev Notes

**Primary file:** `docs/brand/BRAND.md`  
**Verify against:** `src/output/html/assets/specwiki.css`  
**Do not edit:** `src/output/html/assets/specwiki.css`, `site/assets/landing.css`, `tests/`

This is a **documentation-only** story — the implementation work shipped in S24.1 and S24.2. S24.3 captures those decisions for contributors so future UI work references one canonical spec instead of re-reading CSS.

### Current BRAND.md state (read before editing)

Today `docs/brand/BRAND.md` covers:

- Wordmark SVG variants (light/dark)
- Color tokens aligned with wiki CSS
- **Typography section** — wordmark monospace only (`ui-monospace` stack, 16px, weight 700)
- HTML wiki header reference (`.specwiki-logo` spans)

**Missing (S24.3 scope):** wiki reading scale, chrome token ladder, surface-to-token map, landing divergence, links to Epic 24 research artifacts.

Keep the existing wordmark Typography subsection intact — **extend** with a new `## Wiki typography` (or `### Wiki typography`) section rather than replacing wordmark docs.

### Shipped values to document (S24.1 + S24.2 @ `50581c2`)

From `:root` in `specwiki.css`:

```css
--font-size-h1: 2rem;
--font-size-h2: 1.625rem;
--font-size-h3: 1.375rem;
--font-size-h4: 1.125rem;
--font-size-h5: 1rem;
--font-size-h6: 0.875rem;
--font-size-caption: 0.6875rem;
--font-size-ui-sm: 0.75rem;
--font-size-ui: 0.8125rem;
--font-size-body: 0.875rem;
--font-family-monospace-brand:
  ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
  monospace;
```

Body rule:

```css
body.specwiki {
  font-family: var(--font-family-system-sans);
  font-size: var(--font-size-body);
}
```

Article headings scoped to `.specwiki-article-body .mw-parser-output` (not bare `.mw-parser-output`) — document this scope so portal/category intros are not confused with article titles.

Bundled `wikimedia-ui-base` supplies `--font-family-heading-main`, `--font-family-system-sans`, and weight tokens — **do not duplicate** those definitions in BRAND.md; reference them by name.

### Landing divergence reference

Landing page (`site/assets/landing.css`) uses a separate editorial scale:

- `body`: system sans, no fixed 14px root — effectively ~16px reading
- `.hero h1`: `clamp(2.25rem, 6vw, 3.5rem)` — marketing hero, not wiki article title
- Section headings mix `0.75rem`–`1.3rem` literals — **not tokenized**, E20 scope

Owner decision (Epic 24): landing stays separate; S24.3 documents the handoff so “14px wiki feels smaller than landing” is intentional, not a bug.

### Scope boundary (critical)

- **Do not** change CSS to match the doc — doc reflects shipped CSS
- **Do not** tokenize landing page or unify scales
- **Do not** add generated-CSS tests — S24.1/S24.2 already assert tokens
- If doc review finds CSS ≠ epic spec mismatch, note in story completion and file follow-up — do not fix in S24.3 unless owner explicitly expands scope

### Previous story intelligence

**S24.1** landed article heading scale:

- `--font-size-h1`–`h6` in `:root`
- Serif h1–h2, sans h3–h6 under `.specwiki-article-body .mw-parser-output`
- h2 bottom border rule; `.specwiki-portal h1` parity
- Scoped article rules away from portal/category intros (code-review fix)

**S24.2** landed chrome alignment:

- Chrome ladder tokens (`caption` through `body`)
- `--font-family-monospace-brand` shared by logo, code, pre
- Body → `--font-family-system-sans`
- Weight rhythm: semi-bold labels; bold active nav + TOC heading only
- Tests: `writes chrome type tokens with system sans body and BRAND monospace`

Document these outcomes; do not re-describe implementation steps.

### Suggested BRAND.md section outline

```markdown
## Wiki typography

System fonts only — no `@font-face`, CDN, or network assets (`file://` contract).

### Type scale (wiki)

[token table — AC #1]

### Font stacks

[stack table — AC #2]

### Chrome surface map

[selector → token table — AC #3]

### Weight rhythm

[short paragraph — AC #4]

### Landing vs wiki

[divergence table — AC #5]

### Research & mockup

[artifact links — AC #6]

### Known exceptions

[logo 16px, infobox title — AC #7]
```

Adjust heading levels to fit existing BRAND.md structure — avoid duplicate top-level `## Typography`; nest under or rename for clarity.

### Verification commands

```bash
rg -n "font-size-(caption|ui-sm|ui|body|h[1-6])" src/output/html/assets/specwiki.css
rg -n "font-family-(system-sans|heading-main|monospace-brand)" src/output/html/assets/specwiki.css
rg -n "category-nav-subgroup-label|toc-heading|breadcrumb" src/output/html/assets/specwiki.css
```

### Project structure notes

```
docs/brand/BRAND.md                    # PRIMARY — extend with wiki typography
IMPLEMENTATION.md                      # Build log row after completion
```

No changes to: `src/`, `tests/`, `site/assets/landing.css`.

### References

- [Source: _bmad-output/implementation-artifacts/epic-24-wiki-typography-system.md#S24.3]
- [Source: _bmad-output/implementation-artifacts/epic-24-context.md]
- [Source: _bmad-output/planning-artifacts/ux/wiki-typography-brief.md]
- [Source: docs/design/typography-mockup.html — owner-approved proposed panel]
- [Source: _bmad-output/implementation-artifacts/24-1-article-type-scale-and-heading-serif.md]
- [Source: _bmad-output/implementation-artifacts/24-2-type-tokens-and-chrome-alignment.md]
- [Source: src/output/html/assets/specwiki.css — shipped token + selector values]
- [Source: site/assets/landing.css — landing divergence reference]

### Git intelligence

Recent typography commits:

- `50581c2` — S24.2 chrome tokens and BRAND monospace alignment
- `bc2bbf2` — S24.1 article heading type scale and serif h1–h2

Doc should reflect post-`50581c2` CSS. No further code changes expected in this story.

### Open items (document only — do not implement)

- `--font-size-body-lg` wide-column bump — deferred S24.4 candidate
- Infobox title serif — optional polish
- Codex / `wikimedia-ui-base` migration — defer unless bundled

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

### Completion Notes List

- Extended `docs/brand/BRAND.md` with **Wiki typography** section: type scale, font stacks, chrome surface map, weight rhythm, landing-vs-wiki divergence, research links, and known exceptions (logo 16px, infobox title).
- Cross-checked all token values against `specwiki.css` at baseline `50581c2` via `rg`.
- Updated `IMPLEMENTATION.md` build log; §0.8 N/A (doc-only).

### File List

- `docs/brand/BRAND.md`
- `IMPLEMENTATION.md`

## QA Manual Validation

### Manual validation steps

1. Open `docs/brand/BRAND.md` — confirm **Wiki typography** section exists with token ladder, font stacks, chrome surface map, weight rhythm, and landing-vs-wiki table.
2. `rg -n "font-size-caption|font-size-h1|font-family-monospace-brand" docs/brand/BRAND.md` — documented tokens match shipped names.
3. Compare doc token px values against `src/output/html/assets/specwiki.css` `:root` block — no drift.
4. Click or open linked paths: `docs/design/typography-mockup.html`, `_bmad-output/planning-artifacts/ux/wiki-typography-brief.md` — files exist.
5. Confirm doc states landing (`site/assets/landing.css`) is intentionally separate from wiki scale.
6. `npm run typecheck && npm run build` — pass (doc-only gate).
