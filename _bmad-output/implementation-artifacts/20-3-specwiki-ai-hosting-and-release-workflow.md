---
baseline_commit: d5f5f12b1a4ede4aeaae74fecb027dd86981c6b5
---

# Story 20.3: specwiki.ai Hosting and Release Workflow

Status: review

## Story

As a prospective user,
I want `specwiki.ai` to load the official landing page securely,
so that I can trust the product's public entry point.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Visit `https://specwiki.ai` → HTTPS loads the production landing page → navigate the GitHub CTA and confirm it reaches `https://github.com/lucasviola/specwiki`.

**Binds:** E20 S20.3 | **Depends:** S20.2 (`site/`), GitHub Pages (owner-selected provider) | **Domain:** `specwiki.ai`

## Acceptance Criteria

### Functional

1. GitHub Pages publishes the landing-page build at `https://specwiki.ai` with HTTPS (custom domain via `CNAME` in the build artifact; DNS documented for owner setup).
2. `docs/hosting/specwiki-ai.md` documents the build command, deployment workflow, DNS records, environment variables (none required), and rollback process; no secrets are committed.
3. `.github/workflows/deploy-site.yml` deploys PR previews before production merges and production on push to `main`.
4. Production releases are reproducible from the repository via `npm run build:site` — no local-only assets or undocumented manual steps.

### Quality measures

5. Automated tests in `tests/site/deploy-workflow.test.ts` and `tests/scripts/build-landing-site.test.ts` guard the workflow triggers, Pages permissions, build output layout, and absence of committed secrets.
6. Deployment verification checklist in hosting docs confirms `https://specwiki.ai` serves the current page with a valid certificate (manual until DNS is live).
7. Release documentation is sufficient for another maintainer to deploy and roll back safely.

## Tasks / Subtasks

- [x] RED: add `tests/scripts/build-landing-site.test.ts` and `tests/site/deploy-workflow.test.ts` (AC: 3–5)
- [x] GREEN: add `scripts/build-landing-site.mjs`, `npm run build:site`, `.github/workflows/deploy-site.yml` (AC: 1, 3–4)
- [x] GREEN: add `docs/hosting/specwiki-ai.md` with DNS, rollback, and verification steps (AC: 2, 6–7)
- [x] REFACTOR: confirm no `src/` changes, `npm pack --dry-run` excludes `site/` and `dist/`
- [x] Update `IMPLEMENTATION.md`; run full quality gate, §0.2.5 code review, §0.2.6 QA analysis

## Dev Notes

### Prior art — S20.1 and S20.2

- Static landing page lives in `site/index.html` and `site/assets/landing.css`; 42 automated guard tests in `tests/site/landing.test.ts`.
- `site/` stays out of the npm tarball (`files` allowlist: `dist`, `README.md`, `LICENSE`).
- Wordmark home link uses `href="index.html"` (not `/`) — compatible with GitHub Pages subdirectory and custom-domain root hosting.

### Provider selection — GitHub Pages

Epic leaves the provider open; **GitHub Pages** is selected because the repo already uses GitHub Actions CI (S13.2), requires no registry or third-party API tokens, and supports custom domains with HTTPS plus PR preview deployments via `actions/deploy-pages`.

### Implementation plan

- **`scripts/build-landing-site.mjs`:** copy `site/` → `dist/landing-site/`, write `CNAME` (`specwiki.ai`) and `.nojekyll` (skip Jekyll processing).
- **`npm run build:site`:** single reproducible build entry point documented in hosting guide.
- **`.github/workflows/deploy-site.yml`:** on `pull_request` and `push` to `main` — run landing tests, `build:site`, upload Pages artifact, deploy via `actions/deploy-pages@v4`. PRs get preview URLs in the PR checks panel.
- **`docs/hosting/specwiki-ai.md`:** one-time GitHub Pages + DNS setup, build/deploy/rollback, verification checklist. DNS section covers apex `A` records to GitHub Pages IPs and optional `www` CNAME.
- No secrets in repo; workflow uses `GITHUB_TOKEN` with `pages: write` and `id-token: write`.

### Testing Requirements

- Follow `tests/package/ci-workflow.test.ts` pattern: read workflow YAML as text, assert triggers, permissions, and absence of `secrets.*`.
- Build script test: run `build-landing-site.mjs` in a temp dir or assert output structure after running in test.
- Full §0.2 gate: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Project Structure Notes

- NEW: `scripts/build-landing-site.mjs`, `.github/workflows/deploy-site.yml`, `docs/hosting/specwiki-ai.md`
- NEW: `tests/scripts/build-landing-site.test.ts`, `tests/site/deploy-workflow.test.ts`
- UPDATE: `package.json` (`build:site` script), `IMPLEMENTATION.md`, `sprint-status.yaml`
- No changes to `src/`, npm `files` allowlist, or generated-wiki contracts.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E20 S20.3]
- [Source: `_bmad-output/implementation-artifacts/20-2-responsive-accessible-landing-page-implementation.md`]
- [Source: `.github/workflows/ci.yml` — CI workflow pattern]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]

## Dev Agent Record

### Agent Model Used

Composer 2.5 (Cursor), 2026-07-16.

### Debug Log References

- RED confirmed: 14 new S20.3 tests failed before implementation (missing script, workflow, docs, package script).
- Bugbot §0.2.5 flagged unguarded deploy job — fixed with split `deploy-production` / `deploy-preview` jobs and `--skip-cname` on PR builds.

### Completion Notes List

- Selected **GitHub Pages** as the static-site provider; reproducible build via `npm run build:site` → `dist/landing-site/` with `CNAME` + `.nojekyll`.
- Added `deploy-site.yml`: landing tests, build, upload artifact; production deploy on `push`/`workflow_dispatch` only; PR preview deploy omits `CNAME`.
- Documented DNS (apex A records), rollback, and verification in `docs/hosting/specwiki-ai.md`; no secrets committed.
- 17 new automated guard tests (432 suite-wide); full §0.2 gate green; `npm pack --dry-run` lists no `site/` entries.

### File List

- `scripts/build-landing-site.mjs` (new)
- `.github/workflows/deploy-site.yml` (new)
- `docs/hosting/specwiki-ai.md` (new)
- `tests/scripts/build-landing-site.test.ts` (new)
- `tests/site/deploy-workflow.test.ts` (new)
- `package.json` (modified — `build:site` script)
- `_bmad-output/implementation-artifacts/20-3-specwiki-ai-hosting-and-release-workflow.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `IMPLEMENTATION.md` (modified)

## Senior Developer Review (AI)

**Review date:** 2026-07-16
**Review outcome:** Changes Requested → resolved (1 High finding, triaged Patch)
**Reviewer model:** Bugbot subagent

### Action Items

- [x] [High][Patch] Unguarded deploy job could publish non-main artifacts with CNAME to production — split production/preview jobs; `--skip-cname` on PR builds (fixed 2026-07-16)

### Review Findings

| Severity | Location                            | Finding                                                                 | Triage |
| -------- | ----------------------------------- | ----------------------------------------------------------------------- | ------ |
| High     | `.github/workflows/deploy-site.yml` | Deploy job lacked production guards; PR builds carried production CNAME | Patch  |

## QA Manual Validation

**QA model:** inline (Composer 2.5)
**Review date:** 2026-07-16

### AC coverage

ACs 1–5 covered by 17 new tests in `tests/scripts/build-landing-site.test.ts` and `tests/site/deploy-workflow.test.ts`. ACs 6–7 (live HTTPS at specwiki.ai) remain manual until DNS and GitHub Pages one-time setup are complete.

### Regression risks

- Low CLI/runtime risk: no `src/` or dependency changes.
- First deploy requires owner to enable Pages from Actions and configure DNS — documented, not automatable in-repo.
- PR preview URLs depend on GitHub Pages preview feature; production guarded to `push`/`workflow_dispatch` only.

### Gaps

- No automated HTTPS probe against `https://specwiki.ai` (domain not yet wired in CI).
- GitHub Pages one-time settings (custom domain, Enforce HTTPS) are manual per hosting doc.

### Manual validation steps

1. `npm run build:site` — creates `dist/landing-site/index.html`, `assets/landing.css`, `CNAME`, `.nojekyll`
2. `open dist/landing-site/index.html` — landing page loads locally from build output
3. `npm test -- tests/site/deploy-workflow.test.ts tests/scripts/build-landing-site.test.ts` — all 17 S20.3 tests pass
4. `npm pack --dry-run` — tarball lists `dist/`, `README.md`, `LICENSE` only; no `site/` entries
5. After merge: enable **Settings → Pages → GitHub Actions**, configure DNS per `docs/hosting/specwiki-ai.md`, verify `https://specwiki.ai` serves the hero and GitHub CTA

## Change Log

- 2026-07-16: Story created — GitHub Pages hosting and release workflow for specwiki.ai.
- 2026-07-16: Implemented build script, deploy workflow, hosting docs, 17 tests; Bugbot production-guard patch applied; status → review.
