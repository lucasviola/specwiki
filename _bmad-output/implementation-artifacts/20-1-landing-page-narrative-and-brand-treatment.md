---
baseline_commit: 7ee60fb4e121f3fd48241bc71a3b77646566128f
---

# Story 20.1: Landing-Page Narrative and Brand Treatment

Status: review

## Story

As a prospective user,
I want a concise explanation of how SpecWiki makes AI knowledge useful to humans,
so that I can decide whether it solves my team's documentation-discovery problem.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Open `site/index.html` in a browser → hero states "Make AI knowledge useful to humans." → scroll through the problem/approach/outcome explanation → primary CTA links to the GitHub repository.

**Binds:** E20 S20.1 | **Depends:** Canonical brand kit in `docs/brand/BRAND.md` | **CTA destination:** confirmed by owner 2026-07-16 — `https://github.com/lucasviola/specwiki` (npm package not yet published; swap to npm page after 1.0.0 release ships)

## Acceptance Criteria

### Functional

1. Hero uses the exact value proposition: **"Make AI knowledge useful to humans."**
2. Page explains the problem (AI-era knowledge is difficult for people to find and understand), the product approach (generate a navigable wiki from project knowledge), and the human outcome (shared, usable understanding).
3. Copy includes a primary call to action linking to `https://github.com/lucasviola/specwiki` (owner-confirmed destination while the npm package is unpublished).
4. Canonical `[[specwiki]]` wordmark is visible in the header and follows all variant, color, typography, casing, and clear-space rules in `docs/brand/BRAND.md` (lowercase `[[specwiki]]`, monospace 700, brackets in primary accent, ≥ `1em` clear space, light/dark token pairs).
5. Logo has meaningful accessible text; decorative duplicates are hidden from assistive technology.

### Logging & diagnostics (§0.8)

6. The landing page is a static marketing asset outside the CLI runtime — no `src/` code paths change, so no new structured log events are required; existing CLI logging remains untouched.

### Quality measures

7. Content review (automated tests) verifies the value proposition is present verbatim and the CTA destination is the confirmed GitHub URL.
8. Brand review (automated tests) verifies only canonical colors, casing, and typography from `docs/brand/BRAND.md` are used, and that "Spec Wiki" title case never appears in product chrome.
9. The complete HARNESS §0.2 quality gate passes; CLI package behavior and frozen generated-wiki contracts remain unchanged.

## Tasks / Subtasks

- [x] Implement the landing-page narrative and brand treatment vertical slice (AC: 1–9)
  - [x] RED: add failing tests in `tests/site/landing.test.ts` asserting hero value proposition, problem/approach/outcome narrative, GitHub CTA, wordmark casing/markup, accessible logo text, and canonical brand tokens in the landing CSS.
  - [x] GREEN: create `site/index.html` with semantic structure — header wordmark, hero, narrative sections, primary CTA.
  - [x] GREEN: create `site/assets/landing.css` using only canonical brand tokens (light + dark pairs) and the documented monospace stack for the wordmark.
  - [x] REFACTOR: keep markup lean; confirm no `src/` or generated-wiki contract changes.
  - [x] Update `IMPLEMENTATION.md`, run the full quality gate, automated code review, and QA analysis.

## Dev Notes

### Implementation Plan

- New top-level `site/` directory holds the landing-page source; it is a distinct product-marketing surface, not generated wiki output (per E20 epic notes). It must not enter the npm package (`files` allowlist already limits to `dist`, `README.md`, `LICENSE`).
- Render the wordmark as styled text spans (BRAND.md "HTML wiki header" reference pattern): `[[` and `]]` in `--color-primary`, name in `--color-base`, monospace 700, lowercase. Give the logo link an accessible name (`aria-label="specwiki home"` or visually hidden text) and mark bracket spans `aria-hidden="true"` so AT reads "specwiki" once.
- Colors come only from BRAND.md tokens: light `#202122`/`#3366cc`/`#ffffff`, dark `#eaecf0`/`#6b8fe8`/`#16181c`, switched via `prefers-color-scheme`. No web fonts, no CDN assets.
- Narrative structure: hero `h1` = exact value proposition; sections for problem ("AI-era knowledge is hard for people to find and understand"), approach ("one command generates a navigable wiki from the AI specs already in your repo"), outcome ("shared, usable understanding for the whole team").
- Primary CTA: "View source on GitHub" → `https://github.com/lucasviola/specwiki`. Include the install-from-source hint only as secondary copy; do not reference an npm install path until the package is published.
- Responsive/accessibility hardening (WCAG audit, 320px layout, keyboard focus treatment) is S20.2 scope; still write semantic HTML with a single `h1` and landmarks now so S20.2 builds on a sound base.
- Hosting/deployment is S20.3 scope — do not add provider config in this story.

### Testing Requirements

- `tests/site/landing.test.ts` reads `site/index.html` and `site/assets/landing.css` as text (same pattern as `tests/harness/deliverables.test.ts` static checks) and asserts content/brand ACs.
- Vitest coverage `include` is limited to `src/**`, so static site files do not affect coverage thresholds.
- Run the full §0.2 gate: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Project Structure Notes

- ADD: `site/index.html`
- ADD: `site/assets/landing.css`
- ADD: `tests/site/landing.test.ts`
- UPDATE: `IMPLEMENTATION.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
- No changes to `src/`, `dist` contract, default patterns, or generated-wiki output layout.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E20 and S20.1]
- [Source: `docs/brand/BRAND.md` — wordmark, color tokens, typography, usage notes]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]

## Dev Agent Record

### Agent Model Used

Fable 5 (Claude)

### Implementation Plan

- Story created directly from E20 S20.1 epic definition; CTA destination confirmed with owner (GitHub) because `specwiki` is not yet on the npm registry.

### Debug Log

- RED confirmed: `tests/site/landing.test.ts` failed with ENOENT on `site/index.html` before implementation.
- One GREEN iteration: the narrative-phrase test needed whitespace normalization because Prettier wraps HTML text across lines; content was present.
- `npm run format` initially failed on the new `site/index.html` (fixed with `prettier --write`) and on pre-existing untracked `scripts/publish-package.mjs` from the S13 work (whitespace-only reformat applied to keep the gate green — flagged to owner).

### Completion Notes

- Static landing page at `site/index.html` + `site/assets/landing.css`: exact hero value proposition, problem/approach/outcome narrative sections, primary CTA to the GitHub repository (owner-confirmed destination while npm package is unpublished), footer GitHub/MIT links.
- Canonical `[[specwiki]]` wordmark in the header: monospace 700, brackets in `--color-primary`, `1em` clear space, `aria-label="specwiki home"` with `aria-hidden` bracket spans; light/dark tokens from BRAND.md via `prefers-color-scheme`.
- No `src/` changes; npm `files` allowlist keeps `site/` out of the package; Vitest coverage scope unaffected.
- Full §0.2 gate green: 385 tests, lint, format, coverage (≥90%), typecheck, build.

## File List

- site/index.html (added)
- site/assets/landing.css (added)
- tests/site/landing.test.ts (added)
- IMPLEMENTATION.md (modified)
- _bmad-output/implementation-artifacts/20-1-landing-page-narrative-and-brand-treatment.md (added)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)
- scripts/publish-package.mjs (untracked S13 file — Prettier whitespace reformat only, to keep §0.2 format gate green)

## Change Log

- 2026-07-16: Story created; CTA destination confirmed as GitHub repository.
- 2026-07-16: Landing page, stylesheet, and 12 content/brand tests implemented; full quality gate green; status → review.

## Senior Developer Review (AI)

- **Review date:** 2026-07-16
- **Outcome:** Changes Requested (1 Patch item pending owner decision)
- **Reviewer model:** gpt-5.6-sol-medium (Bugbot)

### Action Items

- [ ] [Medium] `site/index.html:15` — wordmark home link uses `href="/"`, which resolves to the host/filesystem root when opened via `file://` or served from a subdirectory; use `index.html` instead. (Patch)

## QA Manual Validation

QA model: gpt-5.6-sol-medium (generalPurpose subagent)

1. `npm test -- tests/site/landing.test.ts` — all 12 landing-page tests pass.
2. `grep -F '<h1>Make AI knowledge useful to humans.</h1>' site/index.html` — prints the exact hero heading.
3. `grep -F 'https://github.com/lucasviola/specwiki' site/index.html` — prints the CTA and footer links.
4. `open site/index.html` — page opens locally; verify narrative, CTA, light/dark theme (toggle OS appearance), and the `[[specwiki]]` header wordmark.
5. `npm run format` — Prettier reports all matched files formatted.
6. `npm pack --dry-run` — tarball listing excludes `site/`, tests, and story artifacts.
7. `git diff --exit-code -- src/` — exits 0: no CLI or frozen-output changes.
