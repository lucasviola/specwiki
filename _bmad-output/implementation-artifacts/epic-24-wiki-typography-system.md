# Epic 24 — Wiki Typography System

## Goal

Complete the **type voice** of the generated HTML wiki so long-form reading and navigation chrome feel **Wikipedia-quality** — explicit article heading scale, serif page titles, tokenized chrome sizes, and brand-aligned font stacks — while preserving Epic 19's offline, `file://`-safe contracts and **14px body density**.

**Audience:** Alex (long-form reader), Sam (drawer/search navigator), Jordan (landing → wiki handoff).

**UX brief & artifacts:**

- [`wiki-typography-brief.md`](../planning-artifacts/ux/wiki-typography-brief.md)
- [Typography UX research canvas](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/typography-ux-research.canvas.tsx)
- [Side-by-side mockup](../../../docs/design/typography-mockup.html) — owner-approved 2026-07-18

**Builds on:** **E16 S16.1–S16.3** (renderer, Wikimedia tokens, `.mw-parser-output`), **E19 S19.3** (70ch measure), **E23** (nav subgroup labels — typography must not regress disclosure). Does **not** change landing page marketing typography (E20).

---

## Owner decisions (locked)

| Topic           | Decision                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| Body size       | **14px** (`0.875rem`) globally — keep Vector density                     |
| Wide body bump  | Optional follow-up inside 70ch at ≥1200px — **not in initial scope**     |
| Heading serif   | **h1–h2** → `--font-family-heading-main`; h3–h6 sans with explicit scale |
| Body sans       | `--font-family-system-sans` replaces Helvetica Neue stack                |
| Monospace       | `ui-monospace` first — match `docs/brand/BRAND.md`                       |
| Web fonts       | **Forbidden** — no `@font-face`, CDN, or network assets                  |
| Landing page    | Stays on separate editorial scale — document divergence in S24.3         |
| Token migration | `wikimedia-ui-base` → Codex — defer unless bundled (open item)           |

---

## Proposed CSS tokens

Define in `src/output/html/assets/specwiki.css` (after `wikimedia-ui-base` bundle):

| Token                 | Value     | px @16 | Primary surfaces                          |
| --------------------- | --------- | ------ | ----------------------------------------- |
| `--font-size-caption` | 0.6875rem | 11     | Nav counts, search badges                 |
| `--font-size-ui-sm`   | 0.75rem   | 12     | Nav page links, TOC links, search titles  |
| `--font-size-ui`      | 0.8125rem | 13     | Breadcrumbs, category headings, infobox   |
| `--font-size-body`    | 0.875rem  | 14     | Article body, default chrome inherit      |
| `--font-size-h6`      | 0.875rem  | 14     | Minor section labels                      |
| `--font-size-h5`      | 1rem      | 16     | Subsections                               |
| `--font-size-h4`      | 1.125rem  | 18     | Section breaks                            |
| `--font-size-h3`      | 1.375rem  | 22     | Major sections                            |
| `--font-size-h2`      | 1.625rem  | 26     | Article sections (+ optional bottom rule) |
| `--font-size-h1`      | 2rem      | 32     | Page title (serif)                        |

**Weight rhythm:** semi-bold (600) for chrome labels; bold (700) reserved for active nav page and TOC heading.

---

## Stories

| Story | Summary                              | Depends        | Status  |
| ----- | ------------------------------------ | -------------- | ------- |
| S24.1 | Article type scale and heading serif | E16, E19 S19.3 | backlog |
| S24.2 | Type tokens and chrome alignment     | S24.1          | backlog |
| S24.3 | Typography specification doc         | S24.1, S24.2   | backlog |

---

## Story outlines

### S24.1 — Article type scale and heading serif

**As** Alex reading a long spec,  
**I want** article headings with a clear size and weight hierarchy,  
**so that** I can scan sections without relying on browser defaults.

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-type24` → open a BMAD story — h1 is 32px serif; h2/h3 steps are visually distinct; TOC depth matches visual depth.

**Depends:** E16 S16.3 (`.mw-parser-output`), E19 S19.3 (70ch grid unchanged) | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013

**Functional (summary):**

- Scope rules to `.mw-parser-output` (and `.specwiki-portal h1` if needed): explicit `font-size`, `font-weight`, `margin-block` for h1–h6
- Apply `--font-family-heading-main` to h1–h2; h3–h6 use sans stack with weight 600
- Optional h2 section rule (1px divider) per approved mockup — subtle, token-colored
- Preserve heading permalink, scroll-margin, and wide-grid table/code escape hatch
- Generated CSS / renderer snapshot tests on fixture articles; no template or Markdown output changes

### S24.2 — Type tokens and chrome alignment

**As** Sam browsing a large wiki,  
**I want** consistent, legible nav and search typography aligned with the brand,  
**so that** chrome density stays scannable and matches the wordmark spec.

**Demo path:** Same generate — compare header wordmark mono to `docs/brand/BRAND.md` SVG; nav subgroup labels use tokens; body renders system sans.

**Depends:** S24.1 (heading tokens coexist in same `:root` block)

**Functional (summary):**

- Introduce `--font-size-*` tokens; refactor nav, search, breadcrumbs, TOC, infobox to consume them (replace magic rem)
- `body.specwiki`: `--font-family-base` → `--font-family-system-sans`; keep `font-size: var(--font-size-body)`
- Monospace: `.specwiki-logo`, `.mw-parser-output code/pre` → `ui-monospace`-first stack per BRAND
- Weight rhythm: 600 for subgroup/category labels; 700 for active page link and TOC heading only
- Tests assert token presence in bundled CSS and no regression to E19/E23 nav disclosure markup

### S24.3 — Typography specification doc

**As** a contributor implementing wiki UI,  
**I want** a documented type scale and surface map,  
**so that** landing and wiki typography do not drift apart unintentionally.

**Demo path:** Read `docs/brand/BRAND.md` (extended) — wiki scale table, chrome ladder, landing divergence note, link to mockup.

**Depends:** S24.1, S24.2 (documents shipped values)

**Functional (summary):**

- Extend `docs/brand/BRAND.md` (or companion section) with wiki reading scale, chrome tokens, and “landing vs wiki” intentional divergence
- Link UX brief, canvas, and `docs/design/typography-mockup.html`
- No runtime code changes unless doc discovers a spec gap — if so, file as improvement, not scope creep

---

## Requirements & constraints

- Preserve frozen output layout: Markdown unchanged; `wiki/html/` paths unchanged
- Preserve `file://` safety: system fonts only; no new network requests
- Preserve 70ch reading measure, sticky header offsets, infobox float, TOC rail geometry
- Do not regress E23 nested disclosure, subgroup labels, or S23.7 breadcrumb ancestry
- Semantic theme variables (E19 S19.1) — typography colors continue via existing tokens
- HARNESS §0.2 quality gate + 90% coverage on touched `src/output/html/` modules

---

## Cross-story dependencies

- **E16 S16.1** — `wikimedia-ui-base` bundle, `specwiki.css` pipeline
- **E16 S16.2** — chrome surfaces (nav, breadcrumb, infobox, TOC templates)
- **E16 S16.3** — `.mw-parser-output` content scope
- **E19 S19.3** — article grid; typography changes must not alter track geometry
- **E19 S19.5 / E23** — nav label sizes must remain legible after token refactor
- **E20** — landing CSS is reference only; not modified by this epic
- **`docs/brand/BRAND.md`** — monospace and color canonical values

---

## Epic gate

- [ ] S24.1 — Article h1–h6 explicit scale; h1–h2 serif; tests green
- [ ] S24.2 — `--font-size-*` tokens drive chrome; system sans body; BRAND mono stack
- [ ] S24.3 — Typography spec doc published with mockup link
- [ ] Owner sign-off against `docs/design/typography-mockup.html` proposed panel
- [ ] Full HARNESS §0.2 quality gate on epic completion

---

## Open items (non-blocking)

- **S24.4 candidate** — optional `--font-size-body-lg` inside 70ch at ≥1200px only
- **Codex design tokens** — replace deprecated `wikimedia-ui-base` when touching token bundle
- **Infobox title serif** — optional polish if owner wants parity with article h1
- **Index portal h1** — align with `--font-size-h1` in S24.1 or follow-up tweak

## Research provenance

| Artifact                               | Role                                          |
| -------------------------------------- | --------------------------------------------- |
| Sally UX research session (2026-07-18) | Personas, pain points, phased recommendations |
| `typography-ux-research.canvas.tsx`    | Full audit tables and success criteria        |
| `docs/design/typography-mockup.html`   | Owner-approved visual target                  |
