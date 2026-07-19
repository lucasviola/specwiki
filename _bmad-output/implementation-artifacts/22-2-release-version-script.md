---
baseline_commit: HEAD
---

# Story 22.2: Release version bump script

Status: done

## Story

As a maintainer cutting a release,
I want a script that bumps semver and syncs all version strings,
so that `package.json`, lockfile, CLI, and README badge never drift.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run release:version -- --patch` on a clean tree updates manifest, lockfile, and README badge; `npm run release:version -- --set 9.9.9` rejects invalid input.

**Binds:** E22 | **Depends:** S22.1

## Acceptance Criteria

1. **`scripts/release-version.mjs`** with exported helpers testable without side effects.
2. **Bump modes** (exactly one required):
   - `--patch`, `--minor`, `--major`
   - `--set X.Y.Z` for explicit semver
3. **Updates atomically:**
   - `package.json` and `package-lock.json` via `npm version <bump> --no-git-tag-version` (or equivalent validated writes)
   - README badge line: `version-([\d.]+)` → new version (static shields.io badge)
4. **Validation:**
   - Reject invalid semver input
   - Fail if post-bump drift detected between manifest, lockfile root version, and README badge
   - Print summary: `old → new`; remind maintainer to update `CHANGELOG.md` and run `release:check`
5. **npm script:** `"release:version": "node scripts/release-version.mjs"`
6. **Security:** Never log tokens, env values, or `.npmrc` contents; never publish or call `npm login`.
7. **Tests** in `tests/package/release-version.test.ts`:
   - Valid bump updates temp fixture files
   - Invalid semver rejected
   - Drift detection fails when README badge stale
8. **Scope boundary:** Does not create git tags or commit — documented in S22.5 `RELEASING.md`.
9. **Quality gate:** Full HARNESS §0.2 passes.

## Tasks / Subtasks

- [ ] Write failing tests for semver validation and README badge sync
- [ ] Implement `scripts/release-version.mjs`
- [ ] Wire `release:version` npm script in `package.json`
- [ ] Run quality gate

## Dev Notes

### README badge target

Current line (~L8):

```markdown
[![version](https://img.shields.io/badge/version-0.1.0-blue)](package.json)
```

After S22.6 publish, switch to npm badge — document in S22.5, implement badge swap in S22.6.

### Git tagging policy

Use `--no-git-tag-version` so maintainers control tag creation separately:

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

Document this single path in `docs/RELEASING.md` (S22.5).

## QA Manual Validation

1. `npm run release:version -- --set 1.0.0` — updates `package.json`, lockfile, README badge
2. `npm run release:version -- --invalid` — exits non-zero with clear error
3. `npm test -- tests/package/release-version.test.ts` — all pass
