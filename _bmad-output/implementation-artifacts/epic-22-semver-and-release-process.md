# Epic 22 — SemVer & Release Process

## Goal

Establish a repeatable, documented semver and npm release process for `@lucasviola/specwiki` so any maintainer can cut a release from `main` without tribal knowledge — from version bump through verify, tag, publish, and post-publish checks.

**Audience:** npm maintainers, trusted contributors, and future release automation.

**Supersedes:** **E13 S13.4** — that monolithic story is decomposed into S22.1–S22.6 below. Do not implement S13.4 separately; use this epic instead.

**Dependency:**

- **E13 S13.1** — `prepublishOnly`, `verify-package`, `publish:package` (in progress)
- **E13 S13.2** — CI quality gate on push/PR (review)
- **E21** — security hardening before first publish (S21.3, S21.5, S21.6 recommended; owner may waive)
- **E13 S13.3** — README/marketing ready before 1.0.0 announce (review)

**Threat model / scope:** Release scripts are maintainer-only tooling. They must never log npm tokens, read `.npmrc` secrets, or publish without explicit `--confirm`. Publishing remains a manual maintainer action until **S22.7** (optional automation).

---

## SemVer policy (epic invariant)

| Bump  | When                                                                     |
| ----- | ------------------------------------------------------------------------ |
| PATCH | Bug fixes, docs in tarball, refactors with no CLI/output contract change |
| MINOR | Backward-compatible features (new flags, patterns, output options)       |
| MAJOR | Breaking CLI surface, default discovery, or incompatible wiki layout     |

**Rules:**

- `package.json` is the sole semver authority; CLI `--version` reads it at runtime.
- No version bumps in feature PRs — only in a dedicated release commit on `main`.
- Git tags use `vX.Y.Z` and must match the npm version exactly.
- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/); every user-facing PR adds under `[Unreleased]`.

---

## Stories

| Story | Summary                                     | Depends               | Status        |
| ----- | ------------------------------------------- | --------------------- | ------------- |
| S22.1 | Single-source CLI version                   | S13.1                 | ready-for-dev |
| S22.2 | Release version bump script                 | S22.1                 | ready-for-dev |
| S22.3 | `release:check` orchestration               | S13.1, S22.2          | ready-for-dev |
| S22.4 | CHANGELOG and SemVer policy                 | —                     | ready-for-dev |
| S22.5 | Maintainer and contributor docs             | S22.3, S22.4          | ready-for-dev |
| S22.6 | Version 1.0.0 first public release          | S22.1–S22.5, E21 gate | ready-for-dev |
| S22.7 | GitHub tag-triggered npm publish (optional) | S22.6                 | backlog       |

---

## Release workflow (target state)

```text
Decide bump → update CHANGELOG → npm run release:version -- --minor
→ commit → npm run release:check → git tag vX.Y.Z
→ npm run publish:package -- --dry-run → npm run publish:package -- --confirm
→ verify npx @lucasviola/specwiki@latest --version → GitHub Release
```

---

## Epic gate (ready for ongoing releases)

- [ ] S22.1 — CLI `--version` equals `package.json` from both `dist/` and `tsx` dev paths
- [ ] S22.2 — `npm run release:version` bumps manifest, lockfile, and README badge atomically
- [ ] S22.3 — `npm run release:check` runs full gate + `verify-package` without publishing
- [ ] S22.4 — `CHANGELOG.md` and SemVer policy documented
- [ ] S22.5 — `docs/RELEASING.md` and `docs/CONTRIBUTING.md` complete with contributor/maintainer boundary
- [ ] S22.6 — `1.0.0` published to npm; tag `v1.0.0`; post-publish verification recorded
- [ ] S22.7 — (optional) tag-triggered CI publish with provenance

---

## Cross-epic dependencies

- **E21 S21.5** — dependency audit integrates into `release:check` / `prepublishOnly`; coordinate with S22.3
- **E21 S21.6** — publish security checklist extends `docs/RELEASING.md`; coordinate with S22.5
- **E20 S20.3** — landing page CTA switches to npm after S22.6
- **E13 S13.4** — superseded; close or mark cancelled when E22 starts
