---
baseline_commit: HEAD
---

# Story 22.1: Single-source CLI version

Status: done

## Story

As an npm user or maintainer,
I want `specwiki --version` to always reflect the semver in `package.json`,
so that published and development builds never drift from the package manifest.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** After `npm run build`, `node dist/cli.js --version` and `npm run dev -- --version` both print the same semver as `package.json`.

**Binds:** E22 | **Depends:** E13 S13.1 (publish contract stable)

## Acceptance Criteria

1. **`package.json` is the sole authority** — no hardcoded semver strings in application source.
2. **`src/version.ts`** exports `readPackageVersion()` that reads `../package.json` relative to the module file (works from `src/` via `tsx` and `dist/cli.js` in the published tarball).
3. **`src/cli.ts`** passes `readPackageVersion()` to Commander `.version()` — not a literal string.
4. **Invalid manifest** — missing or empty `version` field throws a clear error at CLI startup (not a silent fallback).
5. **Tests:**
   - Unit: `readPackageVersion()` equals `package.json` version
   - Integration: spawn built CLI with `--version`; output matches manifest
6. **Scope boundary:** No version bump, no README badge change, no release scripts — S22.2 owns bump tooling.
7. **Quality gate:** Full HARNESS §0.2 passes.

## Tasks / Subtasks

- [ ] Write failing tests in `tests/core/version.test.ts` and `tests/cli.test.ts` (or `tests/package/version-contract.test.ts`)
- [ ] Implement or finalize `src/version.ts` and wire `src/cli.ts`
- [ ] Confirm tarball path: `readPackageVersion` from installed `dist/cli.js` resolves packaged `package.json`
- [ ] Run quality gate

## Dev Notes

### Current state (2026-07-16)

Partial work may exist in the working tree:

| Location          | State                                           |
| ----------------- | ----------------------------------------------- |
| `src/version.ts`  | May exist with `readPackageVersion()`           |
| `src/cli.ts`      | Should call `readPackageVersion()` at line ~134 |
| `package.json`    | `1.0.0`                                         |
| `README.md` badge | Still `0.1.0` — fix in S22.2/S22.6, not here    |

Use `import.meta.url` + `path.join(dirname, '..', 'package.json')` — do not add `package.json` to the TypeScript compile graph.

### References

- [Source: `_bmad-output/implementation-artifacts/epic-22-semver-and-release-process.md`]
- [Source: `_bmad-output/implementation-artifacts/13-4-version-1-0-0-release-and-maintainer-docs.md` — CLI design section]

## QA Manual Validation

1. `npm run build && node dist/cli.js --version` — prints semver matching `node -p "require('./package.json').version"`
2. `npm run dev -- --version` — same output as step 1
3. `npm test -- tests/core/version.test.ts` — all pass
