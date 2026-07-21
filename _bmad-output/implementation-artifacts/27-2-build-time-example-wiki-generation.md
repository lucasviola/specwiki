---
baseline_commit: edb45d7d025d8dc8a1be9e9a71c5441116e5dba2
---

# Story 27.2: Build-time hero wiki generation

Status: review

## Story

As a deploy pipeline,
I want to generate the hero example wiki on each site deploy,
so that specwiki.ai serves output from the current CLI.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run build:examples -- --hero-only` → one tree under `dist/landing-site/examples/agent-harness-parcel/` with browsable `html/index.html`.

**Binds:** E27 S27.2 | **Depends:** S27.1 | **Blocks:** S27.4, S27.5

## Acceptance Criteria

### Functional

1. `scripts/build-examples.mjs` reads manifest; v1 default generates hero slug only; `--all` flag for future gallery work.
2. `npm run build:examples` wired in `package.json`.
3. `.github/workflows/deploy-site.yml`: `npm run build` before site build; hero generation step before `build:site`.
4. Generated wikis remain under `dist/` — not committed.

### Quality measures

5. Assert zero absolute-root `href="/` or `src="/` in hero generated HTML.
6. Generation failure fails deploy with actionable stderr.

## Tasks / Subtasks

- [x] RED: add `tests/examples/build-examples.test.ts` for AC 1, 5–6 (AC: 1, 5–6)
- [x] GREEN: `scripts/build-examples.mjs` + `scripts/lib/assert-no-root-absolute-urls.mjs` (AC: 1–2)
- [x] Wire deploy workflow + deploy-workflow contract tests (AC: 3–4, 6)
- [x] Update `IMPLEMENTATION.md` + sprint-status; run full quality gate + §0.2.5 / §0.2.6

## Dev Notes

- Output confined to project root (S21.1) — generate to gitignored `examples/<slug>/wiki/`, copy to `dist/landing-site/examples/<slug>/`, remove staging dir.
- `--hero-only` is explicit in deploy workflow; default when no flag is also hero-only.
- S27.4 will link landing §04 to the generated hero path; S27.5 adds broader site verification.

## Dev Agent Record

### Implementation Plan

- Build script loads manifest, runs compiled CLI against hero project, copies wiki tree to dist, validates relative URLs.
- Deploy workflow: test → build CLI → build:examples → build:site.
- Shared URL guard module for S27.5 reuse.

### Completion Notes

- Added `scripts/build-examples.mjs` with `--hero-only` (default) and `--all` flags.
- Hero wiki lands at `dist/landing-site/examples/agent-harness-parcel/html/index.html`.
- Deploy workflow builds CLI and generates hero before `build:site`.
- 9 contract tests covering args, URL guard, hero output, staging cleanup, missing CLI error.
- Code review patch: guard `main()` so importing the module in tests does not run CLI generation.

## File List

- `scripts/build-examples.mjs` — hero/all example wiki generation
- `scripts/lib/assert-no-root-absolute-urls.mjs` — subpath-safe HTML guard
- `tests/examples/build-examples.test.ts` — S27.2 contract tests
- `package.json` — `build:examples` script
- `.github/workflows/deploy-site.yml` — build + hero generation steps
- `tests/site/deploy-workflow.test.ts` — workflow contract updates
- `_bmad-output/implementation-artifacts/27-2-build-time-example-wiki-generation.md` — this story
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story → review
- `IMPLEMENTATION.md` — S27.2 log entry

## Change Log

- 2026-07-21: S27.2 build:examples + deploy integration; status → review.

## QA Manual Validation

1. `npm run build && npm run build:examples -- --hero-only` — creates `dist/landing-site/examples/agent-harness-parcel/html/index.html`.
2. `rg 'href="/|src="/' dist/landing-site/examples/agent-harness-parcel` — no matches.
3. `npm test -- tests/examples/build-examples.test.ts tests/site/deploy-workflow.test.ts` — all pass.
4. Confirm `examples/agent-harness-parcel/wiki/` does not remain after build:examples.
