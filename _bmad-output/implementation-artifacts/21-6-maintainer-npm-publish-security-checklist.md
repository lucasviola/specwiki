# Story 21.6: Maintainer NPM Publish Security Checklist

Status: review

baseline_commit: cf713410b910b2d42534b052a39dfa37de2619ca

## Story

As a maintainer with npm publish access,
I want a documented pre-publish security checklist,
so that every release follows the same verify-package, dry-run, and account-hygiene steps without tribal knowledge.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `docs/RELEASING.md` (or `docs/hosting/npm-publish.md`) — numbered checklist; maintainer can follow it end-to-end before `npm run publish:package -- --confirm`.

**Binds:** E21, E13 S13.4 | **Findings:** SEC-6 + analysis recommendations 3–4

## Acceptance Criteria

### Functional

1. Documented checklist includes:
   - `npm run verify-package` (tarball allowlist + CLI smoke install)
   - `npm run prepublishOnly` (full quality gate)
   - `npm run publish:package -- --dry-run` before `--confirm`
   - npm account **2FA enabled** on publisher account
   - Confirm no secrets in staged files (`check-secrets` / manual review)
   - `npm audit` clean per S21.5 policy
2. Checklist references existing guards: no `postinstall`/`prepare`, `files` allowlist, `check-secrets` pre-commit.
3. README maintainer section links to releasing doc.
4. Explicit note: never publish from dirty tree with unintended files; review `npm pack` listing.

### Quality measures

5. Contract test or doc test that required commands exist in `package.json` scripts.
6. Owner review of checklist accuracy.

### Out of scope

- Automating npm 2FA (manual maintainer ops).
- Registry token storage in repo.

## Tasks / Subtasks

- [x] Create `docs/RELEASING.md` with numbered pre-publish security checklist (2FA, secrets, tarball review, verify-package, prepublishOnly, audit, dry-run, publish)
- [x] Reference existing guards: no `postinstall`/`prepare`, `files` allowlist, `check-secrets` pre-commit
- [x] Update README maintainer section to link to `docs/RELEASING.md`
- [x] Add contract tests in `tests/package/releasing-doc.test.ts` for required scripts and checklist content
- [x] Run full HARNESS §0.2 quality gate

## QA Manual Validation

1. `npm test -- tests/package/releasing-doc.test.ts` — all 8 contract tests pass
2. `test -f docs/RELEASING.md && head -30 docs/RELEASING.md` — numbered checklist with 2FA, verify-package, dry-run steps
3. `grep -n 'RELEASING.md' README.md` — maintainer section links to releasing doc
4. `npm run verify-package` — tarball allowlist smoke test still passes (optional full gate before publish)

## Dev Agent Record

### Completion Notes

- Added `docs/RELEASING.md` with 12-step numbered pre-publish checklist covering npm 2FA, clean git tree, check-secrets, tarball allowlist review, verify-package, prepublishOnly, audit, dry-run, and confirm publish.
- README maintainer section now links to RELEASING.md; kept quick-reference commands and audit exception policy inline.
- Contract tests assert required `package.json` scripts exist and RELEASING.md documents all checklist items.

### File List

- docs/RELEASING.md
- README.md
- tests/package/releasing-doc.test.ts
- _bmad-output/implementation-artifacts/21-6-maintainer-npm-publish-security-checklist.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- IMPLEMENTATION.md

## Change Log

- 2026-07-19 — S21.6: maintainer npm publish security checklist in docs/RELEASING.md; README link; contract tests.
