---
baseline_commit: 0ea6501d1c8e1bc58270868259816bec51b36b4b
---

# Story 27.1: Example metadata manifest (hero-first)

Status: review

## Story

As a maintainer,
I want a manifest with a designated hero example,
so that build and landing copy stay in sync without hardcoding paths.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Edit `examples/manifest.yaml` → `hero: agent-harness-parcel` → validation test passes.

**Binds:** E27 S27.1 | **Depends:** — | **Blocks:** S27.2, S27.3

## Acceptance Criteria

### Functional

1. `examples/manifest.yaml` exists with schema documented in a header comment.
2. Top-level `hero: agent-harness-parcel`.
3. Catalog entries for all mock projects under `examples/` (`slug`, `title`, `tagline`, `framework`); hero entry includes `commands.generate` / `commands.open`.
4. Hero entry documents landing §04 copy (`landing.section_title`, `landing.section_prose`) as the single manual sync point until S27.4 wires build-time injection.

### Quality measures

5. Unit test: manifest validates; hero slug matches an existing `examples/` folder.
6. No duplicate hero copy in three places — manifest is source of truth; landing §04 verified against hero `landing` fields in tests.

## Tasks / Subtasks

- [x] RED: add `tests/examples/manifest.test.ts` for AC 5–6 (AC: 5–6)
- [x] GREEN: `examples/manifest.yaml` + `scripts/lib/examples-manifest.mjs` (AC: 1–4)
- [x] REFACTOR: point `examples/README.md` at manifest as catalog source of truth (AC: 3)
- [x] Update `IMPLEMENTATION.md` + sprint-status; run full quality gate + §0.2.5 / §0.2.6

## Dev Notes

- Epic mentions five mock projects for future S27.3 gallery; **three** exist on disk today — catalog lists all current folders only.
- `scripts/lib/examples-manifest.mjs` is shared with S27.2 `build:examples`.
- `yaml` added as devDependency for manifest parsing in build scripts and tests.

## Dev Agent Record

### Implementation Plan

- YAML manifest with header schema comment, hero slug, three catalog entries, hero commands + landing sync fields.
- Pure validation module exported for S27.2 and contract tests.
- README table references manifest; hero row marked.

### Completion Notes

- Added `examples/manifest.yaml` with documented schema, hero `agent-harness-parcel`, and three catalog entries.
- `scripts/lib/examples-manifest.mjs` validates hero commands + landing, bidirectional catalog↔folder coverage (excluding generated `examples/wiki/`).
- 10 contract tests including normalized landing §04 prose sync against `site/index.html`.
- Code review patches: require hero landing fields, full prose comparison, catalog covers all mock-project dirs.

## File List

- `examples/manifest.yaml` — hero-first catalog
- `scripts/lib/examples-manifest.mjs` — load/validate helpers
- `tests/examples/manifest.test.ts` — S27.1 contract tests
- `examples/README.md` — manifest source-of-truth note
- `package.json` / `package-lock.json` — `yaml` devDependency
- `_bmad-output/implementation-artifacts/27-1-example-metadata-manifest.md` — this story
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story → review
- `IMPLEMENTATION.md` — S27.1 log entry

## Change Log

- 2026-07-21: S27.1 manifest + loader + tests; status → review.

## QA Manual Validation

1. `cat examples/manifest.yaml | head -25` — schema comment, `hero: agent-harness-parcel`, three catalog entries.
2. `npm test -- tests/examples/manifest.test.ts` — all S27.1 tests pass.
3. `node -e "import('./scripts/lib/examples-manifest.mjs').then(m => m.loadExamplesManifest(process.cwd()).then(console.log))"` — prints manifest with hero and three slugs.

## Senior Developer Review (AI)

**Reviewer model:** Bugbot subagent  
**Review date:** 2026-07-21  
**Outcome:** Approve (after patches applied)

### Action Items

- [x] [Medium] Require hero `landing` fields in `parseExamplesManifest`
- [x] [Medium] Assert full landing §04 prose sync in tests (not substring only)
- [x] [Medium] Bidirectional catalog↔folder check for all mock projects
