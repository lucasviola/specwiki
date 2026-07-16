# Story 21.6: Maintainer NPM Publish Security Checklist

Status: backlog

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
