# Epic 24 Context:

## Goal

Finish the **typography system** for the generated static HTML wiki: explicit article heading scale, serif page titles, tokenized chrome font sizes, system sans body, and BRAND-aligned monospace — without changing discovery, Markdown output, layout geometry, or the offline `file://` contract.

Epic 16 established Vector-inspired **structure** and bundled `wikimedia-ui-base` color/spacing tokens. Epic 19 established reading measure (70ch), responsive navigation, and semantic theme variables. Epic 23 added dense nav subgroup labels. Typography remains the main gap between “layout complete” and “feels like Wikipedia.”

The governing requirements remain FR-032 (Wikimedia tokens in `specwiki.css`) and FR-033 (navigation chrome). Epic 24 extends presentation tokens for **type scale** only — not new navigation behavior.

## Stories

1. **S24.1 — Article Type Scale and Heading Serif.** Define h1–h6 sizes, weights, and vertical rhythm under `.mw-parser-output`. Apply `--font-family-heading-main` to h1–h2. Keep 14px body, 70ch grid, scroll-margin, and heading permalinks unchanged.
2. **S24.2 — Type Tokens and Chrome Alignment.** Introduce `--font-size-*` custom properties; refactor nav, search, breadcrumbs, TOC, and infobox to consume them. Switch body to `--font-family-system-sans`. Align monospace with `docs/brand/BRAND.md` (`ui-monospace` first).
3. **S24.3 — Typography Specification Doc.** Document the shipped wiki scale, chrome ladder, and intentional landing-vs-wiki divergence in brand/planning docs; link the approved HTML mockup.

## Requirements & Constraints

- Preserve frozen output: `wiki/index.md`, per-page Markdown, `wiki/html/` tree unchanged.
- System fonts only — no `@font-face`, CDN, or network font loading.
- Keep global body at **14px**; optional wide-column body bump is out of initial scope.
- Do not alter 70ch three-track grid, sticky header block size, infobox float, or E23 nav/breadcrumb semantics.
- Reuse semantic CSS custom properties for colors; typography changes are size/family/weight only.
- Generated CSS tests in `tests/output/wiki.test.ts` (or renderer tests) assert bundled token names and heading rules.
- Full HARNESS §0.2 quality gate; 90% coverage on touched `src/output/html/` modules.

## Technical Decisions

- All wiki typography lives in `src/output/html/assets/specwiki.css`, bundled after `wikimedia-ui-base` in `HtmlRenderer.bundleCss`.
- Article content scope: `.mw-parser-output` and `.specwiki-portal h1` where portal title needs parity.
- Heading scale (proposed): h1 2rem serif, h2 1.625rem serif, h3 1.375rem sans 600, h4 1.125rem, h5 1rem, h6 0.875rem.
- Chrome ladder maps to `--font-size-caption` (11px), `--font-size-ui-sm` (12px), `--font-size-ui` (13px), `--font-size-body` (14px).
- Landing page (`site/assets/landing.css`) is **not** modified; S24.3 documents intentional divergence.
- Reference mockup: `docs/design/typography-mockup.html` (owner-approved proposed panel).

## UX & Interaction Patterns

**Content voice:** serif h1–h2 signal “article title / major section”; sans h3–h6 and body keep technical readability.

**Chrome density:** nav subgroup uppercase labels stay at caption size with tracking; active page uses bold weight, not larger size.

**Brand continuity:** wordmark and inline code share one monospace stack across wiki header and content.

## Cross-Story Dependencies

- **S24.2 depends on S24.1** — heading tokens should land first so chrome refactor shares one `:root` scale.
- **E19 S19.3** — typography must not reintroduce per-child width/auto-margin or alter grid tracks.
- **E23** — token refactor must preserve nested disclosure templates and breadcrumb subgroup labels from S23.7.
- **E20** — landing typography is documented contrast, not a merge target.

## Artifacts

- UX brief: `_bmad-output/planning-artifacts/ux/wiki-typography-brief.md`
- Canvas: `~/.cursor/projects/Users-lucas-Projects-specwiki/canvases/typography-ux-research.canvas.tsx`
- Mockup: `docs/design/typography-mockup.html`
