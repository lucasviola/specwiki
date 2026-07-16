---
baseline_commit: a7fdf545c54ac8c1f62db5fa6228b704765068bb
---

# Story 20.2: Responsive, Accessible Landing-Page Implementation

Status: review

## Story

As a visitor,
I want the landing page to be readable and usable on desktop and mobile,
so that I can understand SpecWiki regardless of device or input method.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Open `site/index.html` at desktop and 320px widths → tab through skip link, header nav, and CTAs with visible focus → verify readable structure and no horizontal page overflow → toggle system light/dark appearance.

**Binds:** E20 S20.2 | **Depends:** S20.1 (`site/index.html`, `site/assets/landing.css`) | **NFR:** NFR-003, NFR-011–NFR-013

## Acceptance Criteria

### Functional

1. Semantic landmarks (`header`, `main`, `footer`), a single `h1`, descriptive links, visible keyboard `:focus-visible` styles, and text contrast that meets WCAG 2.1 AA.
2. Layout adapts without page-level horizontal overflow from 320px through desktop widths; wide tables and pre blocks scroll within their own containers.
3. Decorative wiki-mock chrome stays hidden from assistive technology; meaningful content (table caption, logo name) remains accessible.
4. Page loads without client-side JavaScript for the core value proposition, navigation, or primary CTA.
5. Core CLI package behavior and frozen generated-wiki output contracts remain unchanged; `site/` stays out of the npm tarball.

### Quality measures

6. Automated checks in `tests/site/landing.test.ts` cover skip-link wiring, focus styles, overflow containment, narrow-viewport rules, reduced-motion preference, and no external scripts.
7. Manual accessibility check verifies keyboard navigation, focus visibility, heading order, and light/dark logo contrast.

## Tasks / Subtasks

- [x] RED: extend `tests/site/landing.test.ts` with S20.2 responsive/a11y ACs (AC: 1–4, 6)
  - [x] Skip link → `#main-content`, `:focus-visible` outlines, coverage-table scroll wrapper
  - [x] Grid `minmax(min(100%, …))` guard for 320px, narrow `@media` rules, no page-level `overflow-x: hidden`
  - [x] Muted-text contrast bump, `prefers-reduced-motion: reduce`
- [x] GREEN: harden `site/index.html` and `site/assets/landing.css` (AC: 1–4)
- [x] REFACTOR: confirm no `src/` changes, `npm pack --dry-run` excludes `site/`
- [x] Update `IMPLEMENTATION.md`; run full quality gate, §0.2.5 code review, §0.2.6 QA analysis

## Dev Notes

### Prior art — S20.1 v2

- `site/index.html` already ships semantic sections, one `h1`, `aria-labelledby` on sections, visually-hidden table caption, and decorative `aria-hidden` on terminal chrome and wiki-mock bits.
- S20.1 explicitly deferred 320px layout audit, WCAG AA focus/contrast hardening, and real-browser validation to this story.
- Reuse the S20.1 test pattern: read HTML/CSS as text; do not add browser/e2e tests (HARNESS §0.2.1).

### Implementation plan

- Add a skip link targeting `main#main-content` — first focusable element in tab order when focused.
- Match generated-wiki focus treatment: `outline: 2px solid var(--color-primary); outline-offset: 2px` on `:focus-visible` for links and CTAs.
- Fix responsive overflow root cause: `auto-fit` grids used `minmax(20rem, 1fr)` which exceeds a 320px viewport; switch to `minmax(min(100%, …), 1fr)`.
- Wrap `.coverage-table` in `.coverage-table-wrap { overflow-x: auto }` so wide pattern cells scroll locally.
- Add `@media (max-width: 479px)` tweaks: tighter main padding, single-column hero panels, hide decorative wiki-mock search pill to keep the mock header from overflowing.
- Bump `--text-muted` opacity from `0.62` → `0.72` in both dark and light token sets for AA body-copy contrast on marketing prose.
- Add `@media (prefers-reduced-motion: reduce)` to disable transitions if any are added later (parity with wiki CSS).
- Do **not** use `overflow-x: hidden` on `body` as the primary overflow fix — contain at tables, pre, and shrinkable flex children (same rule as S19.2).

### Testing Requirements

- Extend `tests/site/landing.test.ts`; keep S20.1 describe blocks intact.
- Full §0.2 gate: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Project Structure Notes

- UPDATE: `site/index.html`, `site/assets/landing.css`, `tests/site/landing.test.ts`
- UPDATE: `IMPLEMENTATION.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
- No changes to `src/`, npm `files` allowlist, or generated-wiki contracts.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E20 S20.2]
- [Source: `_bmad-output/implementation-artifacts/20-1-landing-page-narrative-and-brand-treatment.md`]
- [Source: `_bmad-output/implementation-artifacts/19-2-responsive-layout-and-mobile-navigation-drawer.md` — overflow/focus patterns]
- [Source: `docs/brand/BRAND.md`]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]

## Dev Agent Record

### Agent Model Used

Composer 2.5 (Cursor), 2026-07-16.

### Debug Log References

- RED confirmed: 13 new S20.2 tests failed before CSS/HTML hardening (missing skip link, focus styles, scroll wrapper, min() grids, reduced-motion block).
- Bugbot §0.2.5 review flagged skip-link target not focusable; fixed with `tabindex="-1"` on `main#main-content` and `main:focus { outline: none }`.

### Completion Notes List

- Hardened the S20.1 landing page for responsive layout and accessibility without touching `src/`: skip link, focusable main landmark, `:focus-visible` outlines on links/CTAs, coverage-table scroll wrapper, `minmax(min(100%, …))` on all auto-fit grids, `@media (max-width: 479px)` compaction, decorative wiki-mock search hidden on narrow screens, `--text-muted` opacity 0.72 for AA contrast, `prefers-reduced-motion: reduce`.
- Added 13 automated guard tests (42 landing tests total, 415 suite-wide); full §0.2 gate green; `npm pack --dry-run` lists no `site/` entries.

### File List

- `site/index.html` (modified)
- `site/assets/landing.css` (modified)
- `tests/site/landing.test.ts` (modified)
- `_bmad-output/implementation-artifacts/20-2-responsive-accessible-landing-page-implementation.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `IMPLEMENTATION.md` (modified)

## Senior Developer Review (AI)

**Review date:** 2026-07-16
**Review outcome:** Changes Requested → resolved (1 Medium finding, triaged Patch)
**Reviewer model:** Bugbot subagent

### Action Items

- [x] [Medium][Patch] Skip link targets `main#main-content` but main was not focusable — add `tabindex="-1"` (fixed 2026-07-16)

### Review Findings

| Severity | Location          | Finding                                      | Triage |
| -------- | ----------------- | -------------------------------------------- | ------ |
| Medium   | `site/index.html` | Skip-link target main not keyboard-focusable | Patch  |

## QA Manual Validation

**QA model:** inline (Composer 2.5)
**Review date:** 2026-07-16

### AC coverage

ACs 1–6 covered by 13 new tests in `tests/site/landing.test.ts` (42 landing tests total). AC 7 (real-browser keyboard/contrast check) remains manual per HARNESS §0.2.1.

### Regression risks

- Low CLI/runtime risk: no `src/` or dependency changes.
- Muted-text opacity bump slightly lightens secondary copy in both themes — visual-only, intentional for AA.
- `tabindex="-1"` on main is standard skip-link pattern; does not add main to normal tab order.

### Gaps

- No automated 320px viewport measurement (layout rules tested via CSS assertions only).
- Skip-link focus transfer verified structurally (`tabindex="-1"`) but not in a real browser.

### Manual validation steps

1. `open site/index.html` — page loads; Tab once reveals skip link; Enter moves focus to main content
2. Resize browser to 320px width — no horizontal page scroll; coverage table scrolls inside its wrapper if needed
3. Tab through GitHub nav link and both CTAs — each shows a visible primary-color focus ring
4. Toggle macOS Appearance Light/Dark — muted body text remains readable in both themes
5. `npm test -- tests/site/landing.test.ts` — all 42 landing tests pass
6. `npm pack --dry-run` — tarball lists `dist/`, `README.md`, `LICENSE` only

## Change Log

- 2026-07-16: Story created and implemented — responsive/a11y hardening for S20.1 landing page; 13 new tests; Bugbot skip-link patch applied; status → review.
