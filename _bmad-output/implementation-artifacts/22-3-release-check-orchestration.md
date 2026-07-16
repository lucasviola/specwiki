---
baseline_commit: HEAD
---

# Story 22.3: Release check orchestration

Status: ready-for-dev

## Story

As a maintainer before publishing,
I want one command that runs the full publish gate locally without touching npm,
so that I can verify a release candidate on a clean checkout with confidence.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run release:check` runs quality gate + `verify-package`; exits non-zero on first failure; never prompts for npm credentials.

**Binds:** E22 | **Depends:** E13 S13.1, S22.2

## Acceptance Criteria

1. **`npm run release:check`** npm script wired to `scripts/release-check.mjs` (or equivalent composition).
2. **Canonical order** (reuse existing scripts — do not fork gate logic):

   ```text
   test → lint → format → coverage → typecheck → build → verify-package
   ```

   Delegate to `scripts/prepublish-check.mjs` for the first six steps, then `scripts/verify-package.mjs`.

3. **Optional audit step:** If E21 S21.5 lands first, include `npm audit --audit-level=high` in the same orchestration; otherwise leave a TODO comment and document manual audit in RELEASING.md.
4. **Output:** Deterministic step messages when `--verbose`; never log tokens or absolute paths in verbose mode.
5. **Contract test:** Assert `release:check` script exists in `package.json` and orchestration calls `prepublish-check` + `verify-package` (mock or integration as appropriate).
6. **Scope boundary:** Does not run `npm publish`, `npm login`, or create git tags.
7. **Quality gate:** Full HARNESS §0.2 passes (meta: `release:check` itself must pass when run).

## Tasks / Subtasks

- [ ] Write failing contract test in `tests/package/release-check.test.ts`
- [ ] Implement `scripts/release-check.mjs` composing existing scripts
- [ ] Add `"release:check"` to `package.json` scripts
- [ ] Coordinate with S21.5 if audit step is ready
- [ ] Run quality gate + `npm run release:check`

## Dev Notes

### Reuse, don't duplicate

S13.1 already defines `QUALITY_GATE_STEPS` in `scripts/prepublish-check.mjs`. Import or spawn — do not copy the step array into a third file without a test asserting they stay in sync.

### Relationship to prepublishOnly

`prepublishOnly` runs automatically on `npm publish`. `release:check` is the explicit maintainer dry-run that also includes `verify-package` (which `prepublishOnly` does not).

## QA Manual Validation

1. `npm run release:check` — all steps pass on clean `main`
2. `npm run release:check -- --verbose` — prints step start/ok messages, no secrets
3. Break a test intentionally → `release:check` exits non-zero before verify-package
