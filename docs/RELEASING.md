# Releasing specwiki to npm

Maintainers-only guide for publishing `@lucasviola/specwiki` to the npm registry. Contributors cannot publish; this document is for accounts with npm maintainer access.

**Prerequisites:** Node.js 20+, npm maintainer role on `@lucasviola/specwiki`, green CI on the release commit, and `npm login` on the publishing machine.

## Pre-publish security checklist

Complete every step in order before `npm run publish:package -- --confirm`. Do not skip steps because a prior release passed — registry hygiene and dependency trees change.

### 1. Account and repository hygiene

1. Confirm **npm two-factor authentication (2FA)** is enabled on the publisher account ([npm account settings](https://www.npmjs.com/settings)). Publishing without 2FA is not acceptable for this package.
2. Work from a **clean git tree** on the intended release commit. Review `git status` — do not publish with uncommitted changes or unintended staged files.
3. Confirm **no secrets** are staged or about to ship:
   - Run `node scripts/check-secrets.mjs` (same check as the `.githooks/pre-commit` hook), or rely on the hook if you commit normally.
   - Manually review diffs for `.env`, keys, tokens, or credential files before tagging.
4. Never store **registry tokens** in this repository. Use `npm login` interactively or a local credential helper — not committed `.npmrc` secrets.

### 2. Review what npm will ship

5. Inspect the **`files` allowlist** in `package.json` — only `dist/`, `README.md`, and `LICENSE` are published.
6. Confirm the package has **no consumer install hooks**: no `postinstall` or `prepare` scripts (contributor hook setup uses `npm run setup-hooks` instead).
7. Run **`npm pack --dry-run`** and review the pack listing. Verify there are no unintended paths (source, tests, `_bmad-output`, secrets). Compare against prior release if unsure.

### 3. Local verification gates

8. Run **`npm run verify-package`** — packs the tarball, clean-installs it in a temp prefix, and runs `specwiki --help`. This validates the consumer install surface.
9. Run **`npm run prepublishOnly`** — full HARNESS §0.2 quality gate (`test`, `lint`, `format`, `coverage`, `typecheck`, `build`) plus production dependency audit. This also runs automatically on `npm publish`.
10. Run **`npm run audit`** if you need the audit step alone (`npm audit --audit-level=high --omit=dev`). High and critical CVEs in **production** dependencies block publish per [S21.5](../_bmad-output/implementation-artifacts/21-5-release-dependency-audit-gate.md). DevDependencies are audited separately during development.

**Audit exceptions:** If a false positive blocks publish, open a GitHub issue with the advisory, rationale, and expiry date. See the README maintainer section for the time-bounded exception process. Do not bypass gates without maintainer consensus and a tracked issue.

### 4. Registry dry-run and publish

11. Run **`npm run publish:package -- --dry-run`** — runs `verify-package`, then `npm publish --dry-run`. Review registry output before the real publish.
12. When all checks pass, run **`npm run publish:package -- --confirm`** — runs `verify-package`, then `npm publish`.

`publish:package` refuses to run without `--dry-run` or `--confirm` so accidental publishes are harder.

## Existing guards (reference)

These protections are already in the repository; the checklist above exercises them:

| Guard                                        | Location                                                  |
| -------------------------------------------- | --------------------------------------------------------- |
| Tarball allowlist + clean-install smoke test | `npm run verify-package` → `scripts/verify-package.mjs`   |
| Pre-publish quality gate + audit             | `prepublishOnly` → `scripts/prepublish-check.mjs`         |
| Explicit publish wrapper (dry-run / confirm) | `npm run publish:package` → `scripts/publish-package.mjs` |
| Secret scan on staged files                  | `scripts/check-secrets.mjs` + `.githooks/pre-commit`      |
| No consumer `postinstall` / `prepare`        | `package.json` scripts                                    |
| Published `files` allowlist                  | `package.json` → `dist`, `README.md`, `LICENSE`           |

## After publish

1. Verify install: `npx @lucasviola/specwiki@<version> --version`
2. Update [CHANGELOG.md](../CHANGELOG.md) if not already done on the release branch.
3. Create a GitHub release tag if your release workflow uses one (see E22 release stories when available).

## Related documentation

- [README maintainer section](../README.md#for-maintainers-npm-publish-prep) — quick reference
- [SECURITY.md](../SECURITY.md) — vulnerability reporting
- [README § npm package surface](../README.md#npm-package-surface) — consumer-facing tarball, install hooks, and prepublish gate notes

## Out of scope

- Automating npm 2FA enrollment (manual maintainer ops).
- Storing registry tokens or CI publish secrets in this repo (see E22 for future automation).
