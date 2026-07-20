---
baseline_commit: 6f7fa62a305aaf111487a55874ccde22df6191be
---

# Story 28.4: Seed post + editorial conventions

Status: review

## Story

As Lucas (publisher),
I want one real post and a short editorial guide,
so that the blog launches with voice and template — not an empty index.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Read `docs/blog/EDITORIAL.md` → copy `_template.md` → seed post live at `/blog/` after deploy.

**Binds:** E28 S28.4 | **Depends:** S28.10 (done) | **Related:** S28.5 (README + launch-copy links)

## Acceptance Criteria

### Functional

1. **`docs/blog/EDITORIAL.md`** covers: content lanes, voice (developer-credible, no unsupported superlatives), cross-linking rules (blog → CHANGELOG/ADRs; never duplicate install docs), biweekly cadence, Lucas-only until 1.0, **Images** section (hero + `media/` + alt rules from S28.10).
2. **Seed post** in `site/blog/` — Field Note tone, workflow pain before product pitch; exercises inline `media/` image (default hero acceptable).
3. Post passes S28.1/S28.10 validation and appears on index under correct lane.
4. **`site/blog/_template.md`** links to `docs/blog/EDITORIAL.md`.

### Quality measures

5. Seed post `summary` suitable for OG/social preview.
6. Brand guardrails from `docs/marketing/launch-copy.md` respected in seed copy.
7. Tests guard editorial doc sections and seed post conventions.

## Tasks / Subtasks

- [x] RED: add `tests/docs/blog-editorial.test.ts` for AC 1, 2, 4–7 (AC: 1–7)
- [x] GREEN: author `docs/blog/EDITORIAL.md`; link from `_template.md`; confirm seed post meets conventions (AC: 1–6)
- [x] REFACTOR: cross-check epic gate + launch-copy guardrails in editorial prose (AC: 6)
- [x] Update `IMPLEMENTATION.md` + sprint-status; run full quality gate + §0.2.5 / §0.2.6

## Dev Notes

- Seed post `site/blog/2026-07-20-seed-post.md` already shipped in S28.1/S28.10 — this story formalizes editorial guide and validates conventions, not new pipeline work.
- Do not add README blog link here → **S28.5**.
- Do not add wiki footer blog link (publisher surface only).

## Dev Agent Record

### Implementation Plan

- Author maintainer-facing `docs/blog/EDITORIAL.md` aligned with epic S28.4 functional list and S28.10 image rules.
- Add contract tests for editorial sections + seed post frontmatter/copy guardrails.
- Link `_template.md` → editorial guide for discoverability.

### Completion Notes

- ✅ Added `docs/blog/EDITORIAL.md` with lanes, voice, cross-linking, cadence, authorship, images, frontmatter checklist, and pre-publish steps.
- ✅ Seed post already meets Field Notes tone, inline media, OG summary, and launch-copy guardrails — validated by tests.
- ✅ `_template.md` points authors at the editorial guide.

## File List

- `docs/blog/EDITORIAL.md` — new editorial guide
- `site/blog/_template.md` — link to editorial guide
- `tests/docs/blog-editorial.test.ts` — S28.4 contract tests
- `_bmad-output/implementation-artifacts/28-4-seed-post-editorial-conventions.md` — this story
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story → review
- `_bmad-output/implementation-artifacts/epic-28-specwiki-blog.md` — S28.4 status
- `IMPLEMENTATION.md` — S28.4 log entry

## Change Log

- 2026-07-20: Implemented editorial guide + contract tests; seed post conventions validated; status → review.

## QA Manual Validation

1. `cat docs/blog/EDITORIAL.md | head -40` — lanes, voice, and cross-linking sections present.
2. `npm test -- tests/docs/blog-editorial.test.ts` — all S28.4 editorial tests pass.
3. `npm run build:site && open dist/landing-site/blog/index.html` — seed post under Field Notes with hero + inline image.
4. Read seed post copy — no hype superlatives; workflow pain leads before product pitch.

## Senior Developer Review (AI)

**Review date:** 2026-07-20  
**Review outcome:** Approve (4 Patch items resolved)  
**Reviewer model:** Bugbot

### Review Findings

| Severity | Finding                                                             | Resolution                                                           |
| -------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Medium   | `related:` claimed build-validated but not implemented              | Fixed EDITORIAL cross-link table — noted human/editor use only in v1 |
| Low      | Persona reference pointed at launch-copy instead of market-research | Fixed audience section link                                          |
| Medium   | AC2 workflow-pain-before-pitch not tested                           | Added narrative-order test on seed body                              |
| Medium   | AC6 launch-copy guardrails under-tested                             | Added publisher voice + no install-duplication test                  |
