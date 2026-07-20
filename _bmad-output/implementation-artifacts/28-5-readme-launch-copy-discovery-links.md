---
baseline_commit: 3ff7705fb4de3540f6dfcb14ce086ae7115e47ce
---

# Story 28.5: README and launch-copy discovery links

Status: review

## Story

As a prospective user reading the repo or marketing copy,
I want a clear link to the blog,
so that I find updates without searching specwiki.ai.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** README → blog URL → `specwiki.ai/blog/` loads.

**Binds:** E28 S28.5 | **Depends:** S28.3 (done) | **Related:** S28.6 (launch trilogy)

## Acceptance Criteria

### Functional

1. **README:** one line under Install pointing to `https://specwiki.ai/blog/`.
2. **`docs/marketing/launch-copy.md`:** blog URL placeholder in Reddit, LinkedIn, and Hacker News variants.
3. **Do not** add blog link to generated wiki footer or `src/output/` templates.

### Quality measures

4. Link uses `https://specwiki.ai/blog/` (stable public URL).
5. Contract tests guard README link, launch-copy placeholders, and wiki template exclusion.

## Tasks / Subtasks

- [x] RED: add `tests/docs/blog-discovery-links.test.ts` for AC 1–5 (AC: 1–5)
- [x] GREEN: README blog line + launch-copy placeholders (AC: 1–2, 4)
- [x] REFACTOR: confirm wiki templates unchanged; no footer blog link (AC: 3)
- [x] Update `IMPLEMENTATION.md` + sprint-status; run full quality gate + §0.2.5 / §0.2.6

## Dev Notes

- S28.4 explicitly deferred README blog link to this story.
- Publisher surface only — wiki chrome stays user-project scoped.
- Launch trilogy content is S28.6; this story is discovery links only.

## Dev Agent Record

### Implementation Plan

- Add README one-liner after Install section with stable blog URL.
- Add blog URL placeholders to Reddit, LinkedIn, and HN sections in launch-copy.
- Contract tests for README, launch-copy, and negative check on wiki templates.

### Completion Notes

- ✅ README blog line placed between Install and Usage with `https://specwiki.ai/blog/`.
- ✅ Launch-copy Reddit, LinkedIn, and HN CTAs include blog URL placeholders; checklist updated.
- ✅ Contract tests guard placement, channel coverage, and wiki template exclusion.

## File List

- `README.md` — blog discovery line after Install
- `docs/marketing/launch-copy.md` — blog URL placeholders in Reddit, LinkedIn, HN
- `tests/docs/blog-discovery-links.test.ts` — S28.5 contract tests
- `_bmad-output/implementation-artifacts/28-5-readme-launch-copy-discovery-links.md` — this story
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story → review
- `_bmad-output/implementation-artifacts/epic-28-specwiki-blog.md` — S28.5 status
- `IMPLEMENTATION.md` — S28.5 log entry

## Change Log

- 2026-07-20: README + launch-copy blog discovery links; contract tests; status → review.

## QA Manual Validation

1. `grep -n 'specwiki.ai/blog' README.md` — one line under Install with full HTTPS URL.
2. `grep -n 'specwiki.ai/blog' docs/marketing/launch-copy.md` — placeholders in Reddit, LinkedIn, and HN sections.
3. `npm test -- tests/docs/blog-discovery-links.test.ts` — all S28.5 tests pass.
4. `grep -r 'specwiki.ai/blog' src/output/` — no matches (wiki output unchanged).
