---
title: "Fix article layout shift triggered by long breadcrumbs"
type: "bugfix"
created: "2026-07-15"
status: "in-review"
review_loop_iteration: 0
baseline_commit: "822e4ced502c053b97b2a108e2daf48cd3acc82d"
context:
  - "{project-root}/_bmad-output/implementation-artifacts/epic-19-context.md"
  - "{project-root}/HARNESS.md"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On article pages at tablet widths, a wrapped breadcrumb such as `Main Page › Project Root › IMPLEMENTATION` can make the article content appear shifted right. The infobox remains floated while the desktop navigation and TOC rails still constrain the center column, so the breadcrumb’s height changes where later content flows around that float.

**Approach:** Stack the infobox above article content throughout the tablet range, preserving the wide desktop floating presentation and the existing mobile layout. Add regression coverage that locks down the responsive boundary and verifies the generated article markup supports a long breadcrumb.

## Boundaries & Constraints

**Always:** Preserve the 1200px-and-up reading-measure grid, desktop category and TOC rails, the 719px-and-below mobile drawer and overflow containment, generated output paths, `file://` behavior, Mustache escaping, and existing `output.write` logging. Follow Red → Green → Refactor and run all six HARNESS quality-gate commands.

**Ask First:** Any change to template structure, renderer API/view-model shape, breakpoints other than the infobox stacking boundary, navigation rail geometry, client-side JavaScript, assets, dependencies, or output contracts.

**Never:** Reintroduce per-child reading widths/auto margins, add JavaScript to measure or compensate for the breadcrumb, alter Markdown output, change title escaping, or add network/storage behavior.

## I/O & Edge-Case Matrix

| Scenario             | Input / State                                    | Expected Output / Behavior                                                                                                       | Error Handling |
| -------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Tablet article       | Article with a wrapping breadcrumb at 720–1199px | Infobox is in normal flow above `#content`; breadcrumb height does not change the article content’s horizontal starting position | N/A            |
| Wide desktop article | Article at 1200px or wider                       | Existing right-floated infobox and coherent 70ch reading measure remain active                                                   | N/A            |
| Mobile article       | Article at 719px or narrower                     | Existing normal-flow infobox, single-column layout, drawer, and horizontal-overflow containment remain unchanged                 | N/A            |

</frozen-after-approval>

## Code Map

- `src/output/html/assets/specwiki.css` — owns the article grid, infobox float, desktop/tablet/mobile responsive rules, and reading-measure boundary.
- `src/output/html/templates/article.mustache` — renders the breadcrumb immediately before the infobox and article content; preserve its escaped breadcrumb positions.
- `tests/output/wiki.test.ts` — generated-asset contracts for infobox responsive behavior and the Story 19.3 article grid.
- `tests/output/html/renderer.test.ts` — article renderer coverage for breadcrumb and infobox markup.
- `IMPLEMENTATION.md` — append the bugfix build-log entry and refresh project status after verification.

## Tasks & Acceptance

**Execution:**

- [x] `tests/output/wiki.test.ts` and `tests/output/html/renderer.test.ts` — add failing focused regression tests for the tablet infobox stacking rule, preserved 1200px desktop float, preserved 719px mobile rule, and a long escaped final breadcrumb label — establish the reported regression’s generated-output contract.
- [x] `src/output/html/assets/specwiki.css` — move the existing normal-flow infobox behavior to a tablet-and-below responsive rule that ends before the 1200px wide-article layout — stop float-dependent horizontal displacement without changing desktop geometry.
- [x] `IMPLEMENTATION.md` — record this one bugfix task, its quality result, and its uncommitted status before the owner review checkpoint.

**Acceptance Criteria:**

- Given an article rendered with a long third breadcrumb label, when it is viewed from 720px through 1199px, then the infobox is stacked in normal flow and `#content` starts consistently below it rather than alongside a float.
- Given an article at 1200px or wider, when its HTML is rendered, then the infobox remains right-floated and the Story 19.3 three-track 70ch article grid remains unchanged.
- Given an article at 719px or narrower, when its HTML is rendered, then the established single-column infobox rule and responsive drawer selectors remain unchanged.
- Given a user-derived breadcrumb label containing HTML-significant characters, when the article is rendered, then the label remains escaped.
- Given the generated HTML asset changes, when verbose generation runs, then the existing `output.write` coverage remains the only required diagnostic behavior and no sensitive content is logged.

## Design Notes

The appropriate responsive boundary is the existing wide-reading-layout activation at 1200px: only that layout has enough center-column room for the 16rem infobox to float beside content. At 720–1199px the navigation and TOC rails remain visible, so the infobox must use the same normal-flow arrangement already proven on mobile. This keeps the desktop contract intact while making breadcrumb height irrelevant to content flow.

## Verification

**Commands:**

- `npm test -- tests/output/wiki.test.ts tests/output/html/renderer.test.ts` -- expected: new regression tests first fail, then pass after the CSS correction.
- `npm run test` -- expected: all tests pass.
- `npm run lint` -- expected: zero errors and warnings.
- `npm run format` -- expected: formatting check passes.
- `npm run coverage` -- expected: all global thresholds remain at least 90%.
- `npm run typecheck` -- expected: strict TypeScript check exits 0.
- `npm run build` -- expected: TypeScript compilation exits 0.
- `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-breadcrumb-qa` -- expected: offline HTML wiki generates successfully with existing output-write behavior.

**Manual checks:**

- Open an article with a long breadcrumb at 720px, 1199px, and 1200px; expect stable tablet content alignment through 1199px and the existing wide desktop float at 1200px.

## Senior Developer Review (AI)

**Review date:** 2026-07-15  
**Review outcome:** Approve  
**Reviewer model:** claude-sonnet-5-thinking-high

### Action Items

- [x] Format `IMPLEMENTATION.md` after its build-log update; re-ran the full quality gate and review.
- No open Patch or Defer items. Bugbot found no bugs in the final uncommitted diff.

## QA Manual Validation

**QA model:** claude-sonnet-5-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC 1: `@media (max-width: 1199px)` stacks `.infobox` in normal flow; generated-CSS test locks the breakpoint contract.
- AC 2: the right-float base rule and the existing 1200px 70ch grid test remain intact.
- AC 3: the 1199px rule subsumes mobile while existing drawer selectors remain covered.
- AC 4: renderer test verifies a long script-shaped final breadcrumb label is escaped.
- AC 5: CSS-only change retains the existing `output.write` asset-write event without logging content.

### Regression risks

- Future reordering of the 1199px and 1200px media rules could change the intended breakpoint behavior.
- CSS-string tests do not replace visual browser geometry verification at 719px, 720px, 1199px, and 1200px.

### Gaps

- No automated browser/computed-style test; manual viewport checks remain required by design.

### Manual validation steps

1. `npm test -- tests/output/wiki.test.ts tests/output/html/renderer.test.ts` — expect the two new regression tests and all focused tests to pass.
2. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-breadcrumb-qa --verbose` — expect generation to succeed and existing `output.write` events to include the CSS asset without content payloads.
3. `open "file:///tmp/specwiki-breadcrumb-qa/html/docs-specs-architecture.html"` — at 719px, 720px, and 1199px, expect the infobox above the article content with no shift when the breadcrumb wraps; at 1200px, expect the existing float and reading grid.
4. `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` — expect all six commands to pass.

## Suggested Review Order

**Responsive layout correction**

- Stack the infobox before content until the wide reading layout can safely accommodate its float.
  [`specwiki.css:744`](../../src/output/html/assets/specwiki.css#L744)

**Regression coverage**

- Assert tablet stacking while retaining the desktop grid and mobile drawer contracts.
  [`wiki.test.ts:812`](../../tests/output/wiki.test.ts#L812)

- Verify a long, HTML-significant breadcrumb title stays escaped.
  [`renderer.test.ts:349`](../../tests/output/html/renderer.test.ts#L349)

**Project record**

- Review the scoped build-log and diagnostics record for this uncommitted bugfix.
  [`IMPLEMENTATION.md:1`](../../IMPLEMENTATION.md#L1)
