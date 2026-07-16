---
baseline_commit: 7ee60fb
---

# Story 13.4: Version 1.0.0 release and maintainer docs

Status: ready-for-dev

## Story

As an open-source maintainer or trusted contributor,
I want a single-source version bump to 1.0.0, maintainer release scripts, and documented publishing steps,
so that anyone with release permissions can safely cut a semver release and publish to npm without tribal knowledge.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Run `npm run release:check` (or equivalent) on a clean checkout — it passes the quality gate and package verification; `specwiki --version` prints `1.0.0`; `docs/RELEASING.md` walks a maintainer through bump → verify → tag → publish; a contributor reading `docs/CONTRIBUTING.md` knows they cannot publish without npm maintainer access and where to find the release guide.

1. **Dependency gate:** S13.1 is complete — `prepublishOnly`, `npm run verify-package`, and pack/clean-install verification exist and pass. If S13.1 Tasks 2–4 are still open when this story starts, finish them first (do not duplicate gate logic; reuse `scripts/prepublish-check.mjs` and `verify-package`).
2. **Single version source:** `package.json` is the sole semver authority. `src/cli.ts` reads the version at runtime from the adjacent `package.json` (works from both `src/` via `tsx` and `dist/cli.js` in the published tarball). Remove the hardcoded `.version("0.1.0")` string.
3. **Version bump to 1.0.0:** Bump `package.json` and `package-lock.json` to `1.0.0`. Update the README static version badge to `1.0.0`. After publish (owner action), the README may switch to the npm registry badge — document both states in `docs/RELEASING.md`.
4. **Release scripts:** Add maintainer npm scripts (names may vary; behavior is fixed):
   - `release:check` — runs the full publish gate locally without publishing (quality gate + `verify-package`, or delegates to existing scripts in canonical order).
   - `release:version <patch|minor|major>` or documented use of `npm version` plus a sync/validation script that confirms CLI `--version`, `package.json`, and lockfile agree.
     Implement `scripts/release-version.mjs` (or equivalent) that: validates semver input; updates `package.json` and `package-lock.json` via `npm version` semantics; updates the README badge line; fails if any version string drifts. The script must not publish, login, or read npm tokens.
5. **Changelog:** Add `CHANGELOG.md` at repo root following [Keep a Changelog](https://keepachangelog.com/) format with a `[1.0.0]` section summarizing the first public release (CLI commands, discovery, markdown + HTML wiki output, search, init/open, JSON/llms.txt). Link it from README (Contributing or Development section).
6. **Maintainer documentation:** Add `docs/RELEASING.md` covering:
   - Prerequisites (npm maintainer access, Node ≥20, green CI on `main`)
   - Pre-release checklist (quality gate, `verify-package`, changelog entry)
   - Step-by-step: bump version → commit → tag (`vX.Y.Z`) → `npm publish` → GitHub Release (optional)
   - Post-publish: verify `npx specwiki@latest --version`, update README npm badge, announce using `docs/marketing/launch-copy.md`
   - Explicit boundary: contributors without npm publish rights follow `docs/CONTRIBUTING.md` only
7. **Contributor documentation:** Add `docs/CONTRIBUTING.md` covering:
   - Clone, install, build, quality gate (six HARNESS commands)
   - `npm run setup-hooks`, `npm run dev`, running targeted tests
   - PR expectations (CI must pass; no version bumps in feature PRs unless release story)
   - Pointer to `docs/RELEASING.md` for maintainers only
   - Do not document npm credentials, tokens, or `.npmrc` secrets
8. **Tests:** Add contract tests that: `package.json` version matches what the built CLI reports via `--version`; README badge contains the same version; `release-version.mjs` (or its exported helpers) rejects invalid semver and detects drift; `CHANGELOG.md` exists and contains `[1.0.0]`. No live registry calls.
9. **Scope boundary:** Do not run `npm publish`, `npm login`, or create GitHub Releases unless the owner explicitly instructs during implementation review. Do not add GitHub Actions release automation (reserved for E20 S20.3). Do not change frozen CLI contracts, discovery defaults, or wiki output layout.
10. **Quality gate:** Full HARNESS §0.2 passes with coverage ≥90%.

## Tasks / Subtasks

- [ ] Confirm S13.1 publish gate is complete (AC: 1)
  - [ ] Verify `prepublishOnly`, `verify-package`, and `scripts/prepublish-check.mjs` exist and pass
  - [ ] If missing, complete S13.1 Tasks 2–4 before version work
- [ ] Single-source CLI version (AC: 2)
  - [ ] Write failing test: built CLI `--version` equals `package.json` version
  - [ ] Replace hardcoded version in `src/cli.ts` with runtime read from `../package.json`
  - [ ] Confirm `npm run dev -- --version` and `node dist/cli.js --version` both work
- [ ] Release tooling (AC: 4)
  - [ ] Write failing tests for semver validation and version drift detection
  - [ ] Implement `scripts/release-version.mjs` and wire `release:check` / `release:version` npm scripts
  - [ ] Ensure scripts never log tokens, env values, or absolute paths in verbose mode
- [ ] Bump to 1.0.0 (AC: 3)
  - [ ] Set `package.json` and `package-lock.json` to `1.0.0`
  - [ ] Update README version badge
  - [ ] Re-run tests asserting version consistency
- [ ] Changelog and docs (AC: 5, 6, 7)
  - [ ] Create `CHANGELOG.md` with `[1.0.0]` entry
  - [ ] Create `docs/RELEASING.md` maintainer guide
  - [ ] Create `docs/CONTRIBUTING.md` contributor guide
  - [ ] Add README links to CONTRIBUTING, RELEASING (maintainer note), and CHANGELOG
- [ ] Verify and record (AC: 8, 9, 10)
  - [ ] Run six-command quality gate + `npm run verify-package` + `npm run release:check`
  - [ ] Update `IMPLEMENTATION.md` with story outcome and verification evidence

## Dev Notes

### Product and scope

- **Release story, not marketing story.** S13.3 owns launch copy; this story owns semver mechanics, maintainer scripts, and contributor/release documentation.
- **Depends on S13.1** for `prepublishOnly`, `verify-package`, and pack/install proof. S13.2 CI should be green on `main` before publish but does not block doc/script work.
- **First public release is 1.0.0** per owner decision. Semver policy: `1.0.0` signals stable CLI surface (`list`, `generate`, `open`, `init`, JSON/llms.txt flags). Pre-1.0 history is captured in CHANGELOG as the initial release note, not as separate 0.x entries unless owner requests.
- **Publishing is owner-only.** Implementation prepares everything; `npm publish` and GitHub Release creation require explicit owner instruction at review time.

### Current version drift (must fix)

| Location            | Current             | Action                                                  |
| ------------------- | ------------------- | ------------------------------------------------------- |
| `package.json`      | `0.1.0`             | Bump to `1.0.0`                                         |
| `package-lock.json` | `0.1.0` (root)      | Bump with `npm version` or lockfile sync                |
| `src/cli.ts:133`    | hardcoded `"0.1.0"` | Read from `package.json` at runtime                     |
| `README.md:8`       | badge `0.1.0`       | Update to `1.0.0`; document npm badge swap post-publish |

No other application files embed the package semver today.

### CLI version resolution design

- Use `import.meta.url` + `path.join(dirname, '../package.json')` + `readFileSync` (or `createRequire`) so the same code works from `src/cli.ts` (dev) and `dist/cli.js` (published).
- Do **not** add `package.json` to the TypeScript `rootDir` compile graph unless necessary — runtime read avoids tsconfig changes.
- Commander `.version()` accepts a string; pass the parsed semver from `package.json`.
- Add a focused test in `tests/package/` (extend `publish-contract.test.ts` or new `release-version.test.ts`) that spawns the built CLI with `--version`.

### Release script design

**`scripts/release-version.mjs`** responsibilities:

1. Accept `--patch`, `--minor`, `--major`, or explicit `--set X.Y.Z` (exactly one).
2. Invoke `npm version <bump> --no-git-tag-version` to update manifest + lockfile atomically, OR perform equivalent validated writes.
3. Update README badge regex: `version-([\d.]+)` → new version.
4. Print summary: old → new version; remind maintainer to update `CHANGELOG.md` and run `release:check`.
5. Exit non-zero on invalid semver, dirty unexpected state, or README sync failure.

**`release:check`** orchestration (prefer composition over duplication):

```text
npm run test → lint → format → coverage → typecheck → build → verify-package
```

Reuse S13.1 `prepublish-check.mjs` gate order; `release:check` may call the same script or mirror its steps via npm scripts.

**Git tagging:** Document that maintainers run `git tag v1.0.0` (or let `npm version` create the tag when not using `--no-git-tag-version`). Pick one workflow in `docs/RELEASING.md` and test-document it — do not leave both paths ambiguous.

### Documentation structure

```
docs/
├── CONTRIBUTING.md    # all contributors — setup, gate, PR norms
├── RELEASING.md       # maintainers only — semver bump, verify, publish
└── marketing/         # existing S13.3 artifacts (reference, do not duplicate)
CHANGELOG.md           # repo root — Keep a Changelog
```

**CONTRIBUTING.md** sections (minimum):

- Getting started (clone, `npm ci`, `npm run build`)
- Quality gate (six commands; link HARNESS §0.2)
- Git hooks (`npm run setup-hooks`)
- Running tests (`npm test`, targeted vitest)
- PR checklist (CI green, no drive-by version bumps)
- "I want to publish a release" → see RELEASING.md (maintainers only)

**RELEASING.md** sections (minimum):

- Who can publish (npm maintainer role)
- Pre-release checklist
- Version bump commands (`npm run release:version minor` or documented equivalent)
- Changelog update requirement
- Verification (`npm run release:check`, `npm run verify-package`)
- Publish (`npm publish` — dry-run optional via `npm publish --dry-run` for maintainers)
- Post-publish verification (`npm view specwiki version`, `npx specwiki@latest --version`)
- README badge update to `https://img.shields.io/npm/v/specwiki`
- GitHub Release + optional marketing (`docs/marketing/launch-copy.md`)
- Rollback notes (npm deprecate / unpublish window — document policy, do not automate)

### CHANGELOG 1.0.0 content guidance

Summarize shipped capabilities (do not list every story):

- Cross-framework spec discovery (Cursor, BMAD, OpenSpec, AGENTS.md, etc.)
- `list`, `generate`, `open`, `init` commands
- Markdown + HTML wiki output with search, dark mode, responsive layout
- JSON machine output and `llms.txt` export
- Node.js ≥20, MIT license

### Previous story intelligence

**S13.1 (in-progress):** Task 1 complete — `files` allowlist, LICENSE, no consumer `prepare`. Tasks 2–4 (prepublish gate, verify-package, README maintainer docs) still pending — **must land before or as part of this story's first task**. Reuse `scripts/prepublish-check.mjs`; do not fork gate logic.

**S13.2 (review):** CI runs six gate commands on push/PR. Release docs should state "merge to `main` with green CI before publish."

**S13.3 (review):** README consumer path, marketing copy, CI badge present. README version badge still static `0.1.0` — update in this story. `docs/marketing/launch-copy.md` has pre-publish CTAs; RELEASING.md should note switching CTAs after npm publish.

### Testing requirements

- TDD for version contract tests before changing `src/cli.ts`.
- Spawn built CLI for `--version` assertion; avoid testing Commander internals.
- Test `release-version.mjs` helpers with temp copies or direct function exports where practical.
- No `npm publish`, registry fetch, or `npm login` in tests.
- Extend `tests/package/` — keep package/release tests colocated with S13.1/S13.2 contract tests.

### Architecture, security, and regression guardrails

- Release scripts are maintainer tooling — not runtime CLI behavior. Do not use the `Logger` API; use deterministic stdout for script diagnostics.
- Never log `NPM_TOKEN`, registry URLs with credentials, or `.npmrc` contents.
- Preserve frozen CLI contracts — version change only affects `--version` output and package metadata.
- Minimal diff: no new runtime dependencies; dev/release scripts use Node built-ins only.
- `package-lock.json` may change from version bump — intentional.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E13 — Distribution & Publish`]
- [Source: `_bmad-output/implementation-artifacts/13-1-npm-publish-preparation.md`]
- [Source: `_bmad-output/implementation-artifacts/13-2-github-actions-ci-workflow.md`]
- [Source: `_bmad-output/implementation-artifacts/13-3-publication-readiness-and-launch-marketing.md`]
- [Source: `package.json`, `src/cli.ts`, `README.md`]
- [Source: `docs/marketing/launch-copy.md` — post-publish CTA switch]
- [Source: `HARNESS.md#0.2` — quality gate order]

## Dev Agent Record

### Agent Model Used

<!-- Populated during dev-story -->

### Debug Log References

- 2026-07-15 — Story created from owner request: bump to 1.0.0, release scripts, and contributor/maintainer publishing documentation.

### Implementation Plan

<!-- Populated during dev-story -->

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.

### File List

<!-- Populated during dev-story -->

### Change Log

- 2026-07-15 — Created E13 S13.4: version 1.0.0 release, maintainer scripts, CONTRIBUTING/RELEASING docs, CHANGELOG.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:**  
**Review outcome:**  
**Reviewer model:**

### Action Items

### Review Findings

## QA Manual Validation

1. `npm run build && node dist/cli.js --version` — expected outcome: prints `1.0.0` matching `package.json`.
2. `npm run release:check` — expected outcome: full gate + package verification pass; no publish or credential prompt.
3. `npx vitest run tests/package/` — expected outcome: all package/release contract tests pass including version consistency.
4. Read `docs/CONTRIBUTING.md` — expected outcome: setup, quality gate, and PR norms clear; points maintainers to RELEASING.md.
5. Read `docs/RELEASING.md` — expected outcome: step-by-step bump → verify → tag → publish documented; npm badge swap noted.
6. Open `CHANGELOG.md` — expected outcome: `[1.0.0]` section present with first-release summary.
7. `npm pack --dry-run` — expected outcome: tarball contains `dist/`, README, LICENSE only; `package.json` version is `1.0.0`.
8. _(Owner, optional)_ `npm publish --dry-run` then `npm publish` — expected outcome: registry accepts package; `npx specwiki@latest --version` returns `1.0.0`.
