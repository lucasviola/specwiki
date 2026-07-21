---
baseline_commit: edb45d7d025d8dc8a1be9e9a71c5441116e5dba2
---

# Story 27.4: Landing page §04 → live hero wiki

Status: review

## Story

As a landing-page visitor,
I want the example section to open a **real** generated wiki,
so that I trust the product before installing.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Scroll to §04 on specwiki.ai → click **Explore live wiki** → live hero wiki loads with CSS/search working → install CTA still visible on return.

**Binds:** E27 S27.4 | **Depends:** S27.2 | **Blocks:** S27.5

## Acceptance Criteria

### Functional

1. Replace static wiki mock in `site/index.html` with prominent link to `examples/agent-harness-parcel/html/index.html`.
2. Primary CTA in §04 opens the live wiki (not iframe).
3. Secondary link: GitHub source for `examples/agent-harness-parcel`; honest note that other examples are on GitHub only until S27.3.
4. Remove stale “two more demos” copy; do not claim five live wikis.
5. `build:site` injects §04 title and intro prose from `examples/manifest.yaml` hero `landing` fields.
6. Update `tests/site/landing.test.ts`.

### Quality measures

7. No regression on S20.1 narrative / brand / accessibility.
8. Core landing page usable without JavaScript.

## Tasks / Subtasks

- [x] RED: extend landing + build-landing-site + manifest tests for AC 1–6 (AC: 1–6)
- [x] GREEN: refresh §04 HTML/CSS; add manifest injection in build-landing-site (AC: 1–5)
- [x] Update manifest comments + IMPLEMENTATION.md + sprint-status; run full quality gate + §0.2.5 / §0.2.6

## Dev Notes

- Hero wiki href is relative: `examples/<slug>/html/index.html` (subpath-safe; no leading `/`).
- Catalog has three examples today — copy says two more on GitHub, not four/five live.
- Reuse `scripts/lib/examples-manifest.mjs` for injection; export inject helper for tests.
- S27.5 adds deploy verification and `tests/site/examples.test.ts`.

## Dev Agent Record

### Implementation Plan

- Replace wiki-mock panel with live-wiki CTA card + primary button above example grid.
- `scripts/inject-landing-example.mjs` patches built `index.html` from manifest hero landing fields.
- Retarget S27.1 manifest prose sync test to built output instead of source HTML.

### Completion Notes

- §04 primary **Explore live wiki** CTA and after-panel links use relative hero wiki href.
- Removed wiki-mock HTML/CSS; added example-live panel styles.
- `build-landing-site.mjs` injects hero landing title/prose and normalizes live-link hrefs.
- 3 net new tests (640 total); S20.1 live-example tests updated for live CTA contract.

## File List

- `site/index.html` — §04 live wiki CTAs + honest GitHub-only copy
- `site/assets/landing.css` — example-live styles; removed wiki-mock rules
- `scripts/inject-landing-example.mjs` — manifest → landing §04 injection
- `scripts/build-landing-site.mjs` — call injection after site copy
- `examples/manifest.yaml` — updated sync comment
- `examples/README.md` — build-time injection note
- `tests/site/landing.test.ts` — S27.4 + updated S20.1 live example tests
- `tests/scripts/build-landing-site.test.ts` — built index injection test
- `tests/examples/manifest.test.ts` — prose sync via build output
- `_bmad-output/implementation-artifacts/27-4-landing-page-section-04-refresh.md` — this story
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story → review
- `IMPLEMENTATION.md` — S27.4 log entry

## Change Log

- 2026-07-21: S27.4 landing §04 live hero wiki + manifest injection; status → review.

## QA Manual Validation

1. `npm run build && npm run build:examples -- --hero-only && npm run build:site` — `dist/landing-site/index.html` links to `examples/agent-harness-parcel/html/index.html`.
2. Open `dist/landing-site/index.html` in a browser — §04 **Explore live wiki** opens the generated hero wiki with working CSS.
3. Confirm §04 does not contain `wiki-mock` or `<iframe`.
4. `npm test -- tests/site/landing.test.ts tests/scripts/build-landing-site.test.ts tests/examples/manifest.test.ts` — all pass.
