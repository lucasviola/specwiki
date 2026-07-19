---
baseline_commit: 7ee60fb
---

# Story 13.1: npm publish preparation

Status: done

## Story

As an open-source maintainer,
I want the built CLI package prepared for safe npm publication,
so that users can run `npx specwiki` successfully from a clean environment.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `npm pack --dry-run` shows only the intended distributable artifacts, then a locally installed packed tarball runs `npx specwiki --help` successfully in a clean temporary directory.

1. `package.json` declares a deliberate npm publish contract: the existing `bin.specwiki` points to the built `dist/cli.js` executable, `files` allowlists only the package artifacts required by consumers (at minimum `dist/`, `README.md`, and `LICENSE` when present), and package metadata remains suitable for the public `specwiki` package. Repository tooling, source, tests, planning artifacts, generated wiki output, and local configuration are excluded from the published tarball. The existing git-hook setup is removed from consumer install lifecycle scripts (or safely limited to this repository), so installing the packed package does not run `git config`.
2. `npm publish` is protected by a `prepublishOnly` lifecycle script that runs the complete project quality gate in its canonical order—`test`, `lint`, `format`, `coverage`, `typecheck`, then `build`—and fails publication on the first failure. It must not publish, prompt for credentials, or perform network I/O itself.
3. The publish-preparation script emits concise, deterministic `publish.prep` step messages only when explicitly invoked in verbose mode. Its output contains step names/status only: never npm tokens, environment-variable values, package source contents, or absolute paths. Normal `prepublishOnly` output remains useful without enabling verbose diagnostics.
4. Add a local, non-publishing verification path that packages the current checkout with `npm pack`, installs that tarball into a fresh temporary directory, and runs `npx specwiki --help` (or equivalent local executable invocation). It proves the shipped tarball contains the built CLI and that the command is executable without source files, a global link, or the development toolchain.
5. Tests cover the package contract and lifecycle behavior without making a registry call: expected `files`/`bin`/`prepublishOnly` metadata; the quality-gate command order; verbose-safe `publish.prep` output; tarball contents excluding source/test/internal artifacts; and clean-install CLI execution. The test workflow must clean up all temporary files and tarballs even when assertions fail.
6. README documents the supported consumer path (`npx specwiki <command>`), the maintainer's non-publishing package verification command, Node.js ≥20 requirement, and that actual registry publishing is an explicit maintainer action after this story's checks pass. Do not document or automate `npm publish` credentials, access tokens, provenance configuration, or release-version selection.
7. Existing CLI behavior and frozen contracts remain unchanged: no changes to discovery defaults, category rules, generated wiki layout, output-path confinement, or HTML escaping. Do not add runtime dependencies, a GitHub Actions workflow (S13.2), release automation, semantic-versioning policy, or registry publication.
8. The full HARNESS §0.2 quality gate passes with all global coverage thresholds at or above 90%.

## Tasks / Subtasks

- [x] Define the distributable npm package contract (AC: 1, 7)
  - [x] Write metadata-focused tests first for `package.json` fields and the expected pack-file allowlist.
  - [x] Add a minimal `files` allowlist and any necessary package metadata; preserve the current ESM and `bin` entrypoint contract.
  - [x] Move or guard the current `prepare` git-hook configuration so consumers installing the tarball do not require a checkout or mutate git configuration.
  - [x] Add `LICENSE` only if it does not already exist and its text matches the declared MIT license; otherwise correct the metadata/documentation mismatch rather than shipping a false license claim.
- [x] Add a safe publish gate and diagnostics (AC: 2, 3)
  - [x] Write failing tests for exact canonical gate ordering and redacted deterministic verbose output.
  - [x] Implement a small repository script invoked by `prepublishOnly`; it orchestrates existing npm scripts rather than duplicating their commands.
  - [x] Make verbose diagnostics opt-in through an explicit script argument or documented environment toggle; do not inspect or print arbitrary environment values.
- [x] Prove the consumer package path locally (AC: 4, 5)
  - [x] Write focused integration tests that run `npm pack`, inspect tarball file names, install into an isolated temp directory, and invoke the installed binary.
  - [x] Ensure test isolation: no dependency on global `specwiki`, workspace `node_modules` as an installed consumer dependency, or npm registry access; clean temporary artifacts in `finally`.
  - [x] Add a maintainer-facing package verification script/command that reuses the proven flow and never invokes `npm publish`.
- [x] Document and verify the release boundary (AC: 6, 8)
  - [x] Update README with consumer `npx` usage and the local package verification command.
  - [x] Run the six-command quality gate and the pack/clean-install demo path.
  - [x] Update `IMPLEMENTATION.md` after implementation with the story result, verification evidence, and commit reference.

## Dev Notes

### Product and scope

- This story implements FR-027 (the package publishing contract) only. S13.2 owns `.github/workflows/` and CI-on-push/PR; do not add a workflow here.
- “Prepared for publishing” does not authorize publishing to npm. Do not run `npm publish`, `npm login`, `npm version`, configure a registry, create tokens, or change the package version without a separate owner instruction.
- The success criterion is a consumer-equivalent local install of the tarball produced from this checkout. `npm link`, `tsx src/cli.ts`, and running `node dist/cli.js` from the repository are insufficient because they can hide missing packed files or development-only dependencies.
- Keep the initial package surface intentionally small. A `files` allowlist is the source of truth; do not rely only on `.npmignore`, which is absent today.

### Current implementation intelligence

- `package.json` already has `"name": "specwiki"`, `"type": "module"`, Node `>=20`, and `"bin": { "specwiki": "./dist/cli.js" }`. Build is `tsc && node scripts/copy-html-assets.mjs`; the copied HTML assets under `dist/` are required by the CLI and must ship.
- `dist/` is gitignored and currently not explicitly included in a package allowlist. A publish lifecycle must build it before creating/validating a package.
- The existing `prepare` script runs `git config core.hooksPath .githooks`. npm executes `prepare` during installs in several contexts, so this repository-only hook setup must not run for package consumers. Preserve developer hook setup through a non-lifecycle script or a checkout-aware safe guard.
- Existing quality scripts are exactly `test`, `lint`, `format`, `coverage`, `typecheck`, and `build`. Preserve their semantics and use that order in the gate.
- `src/cli.ts` already has the `#!/usr/bin/env node` shebang and creates the Commander program. The published binary must remain `dist/cli.js`; do not introduce a wrapper or change the command interface.
- The package now has post-MVP runtime dependencies (`mustache`, `highlight.js`, `lunr`, and `wikimedia-ui-base`) in addition to the original CLI stack. The pack/install test must validate the actual lockfile-resolved production dependency set; do not move a runtime import to `devDependencies`.
- README already presents `npx specwiki` examples but its install section currently describes local development (`npm install`, `npm run build`, `npm link`). Distinguish consumer installation from contributor setup instead of removing development instructions.
- Current checkout has unrelated owner changes in `.cursor/rules/specwiki-checkpoint.mdc`, `HARNESS.md`, sprint status, and epics. Preserve them; scope implementation diffs to this story and its test/documentation/log updates.

### Publish-gate design and logging guardrails

- Use a dedicated Node `.mjs` script under `scripts/` for deterministic cross-platform orchestration. It may spawn existing `npm run <script>` commands sequentially and forward their status; avoid shell-specific chaining.
- Make the lifecycle script fail fast and propagate non-zero exit codes. Do not run the gate in `prepare`: `prepare` executes on ordinary installs and git dependencies, while `prepublishOnly` is the intended publish-only guard.
- Define an explicit, testable verbose interface such as `node scripts/prepublish-check.mjs --verbose`; `prepublishOnly` can call the script without that flag. Emit only stable messages of the form `publish.prep <step> <status>`. These release-tool diagnostics are not the runtime `Logger` API and must never change CLI stdout/stderr behavior.
- The local pack verification must never pass `--dry-run` as its sole proof: inspect a real tarball, then install it in a clean temporary prefix. Avoid `npx --yes specwiki`, which can reach the npm registry; resolve the binary from the fresh local install or use `npx --no-install specwiki --help`.

### Testing requirements

- Follow strict TDD: add tests, observe the failure before production metadata/script changes, implement minimally, then refactor green.
- Prefer a focused test module such as `tests/package/publish-preparation.test.ts`, using Node temp directories and child-process APIs. Mock only where unit isolation is necessary; retain at least one real pack/install integration assertion.
- Package archive inspection must assert required entries (`package/package.json`, `package/README.md`, `package/dist/cli.js`, and needed `dist` assets) and reject representative internal entries (`package/src/`, `package/tests/`, `package/_bmad-output/`, `package/.agents/`, `package/.cursor/`, and repository config). Adapt expected license assertion to the resolved licensing decision.
- In the clean-install test, run the binary with `--help` and assert a successful exit plus the CLI description/usage; do not generate wiki output or add browser/e2e coverage.
- Make subprocess tests tolerant of npm’s normal local cache but do not permit registry fetching. Always delete test-created tarballs, temp prefixes, and output directories in cleanup.
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.

### Architecture, security, and regression guardrails

- No application-layer source module should change. This story is package/release tooling around the existing `src/cli.ts → commands → domain modules` architecture.
- Preserve Node ≥20, TypeScript strict/ESM behavior, relative `.js` imports, all frozen output/discovery contracts, and all existing public CLI commands/flags.
- Treat all environment variables, registry configuration, and user paths as sensitive/untrusted release context. Do not log values, write credentials, or cause network calls.
- Maintain a small, focused diff. Do not modify `package-lock.json` unless npm necessarily updates it from an intentional manifest change; no new runtime dependencies.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E13 — Distribution & Publish`]
- [Source: `_bmad-output/planning-artifacts/discovery/prd/prd.md#FR-027`]
- [Source: `_bmad-output/planning-artifacts/discovery/project-context.md#Technology Stack & Versions`]
- [Source: `package.json` — current bin, build, scripts, dependencies, Node engine]
- [Source: `src/cli.ts` — published executable entrypoint]
- [Source: `README.md#Install`, `README.md#Usage`]
- [Source: `HARNESS.md#0.1`, `HARNESS.md#0.2`, `HARNESS.md#0.8`, `HARNESS.md#0.9`]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Story context created 2026-07-15 from the E13 plan, FR-027, current package/CLI/README state, architecture/project context, and recent implementation history.
- 2026-07-15 — Task 1 TDD: `npm run test -- tests/package/publish-contract.test.ts` failed first because `files` and `LICENSE` were absent and `prepare` configured git hooks; passed after package-contract changes.
- 2026-07-15 — Tasks 2–4 TDD: `tests/package/publish-preparation.test.ts` failed before scripts landed; green after `prepublish-check.mjs`, `verify-package.mjs`, and README maintainer section.

### Implementation Plan

- Add `scripts/prepublish-check.mjs` for canonical gate orchestration with opt-in verbose diagnostics.
- Add `scripts/verify-package.mjs` for real tarball pack/install/`--help` proof without registry access.
- Wire `prepublishOnly` and `verify-package` npm scripts; extend package contract tests.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Task 1: package allowlist, LICENSE, explicit `setup-hooks`, four contract tests.
- Tasks 2–4: prepublish gate, verify-package flow, 10 publish-preparation tests, README maintainer docs, IMPLEMENTATION.md updated.
- Bugbot patches applied: verify-package throws instead of `process.exit` in `finally` path; stderr surfaced on npm failures; Windows shell parity for npm/npx spawns.

### File List

- _bmad-output/implementation-artifacts/13-1-npm-publish-preparation.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- package.json
- LICENSE
- scripts/prepublish-check.mjs
- scripts/verify-package.mjs
- tests/package/publish-contract.test.ts
- tests/package/publish-preparation.test.ts
- README.md
- IMPLEMENTATION.md

### Change Log

- 2026-07-15 — Created E13 S13.1 implementation story and developer guardrails.
- 2026-07-15 — Completed Task 1 package publish contract: allowlisted consumer artifacts, removed consumer install hook configuration, and added MIT licensing/tests.
- 2026-07-19 — Owner sign-off; story → done; epic-13 complete.

## Senior Developer Review (AI)

**Review date:** 2026-07-15  
**Review outcome:** Approve (after patches)  
**Reviewer model:** Bugbot

### Action Items

- [x] [Patch][Medium] Avoid `process.exit` inside `runVerifyPackage` so temp dirs always clean up.
- [x] [Patch][Medium] Surface npm stderr when pack/install subprocesses fail.
- [x] [Patch][Medium] Use Windows shell for npm/npx spawns in verify-package.

### Review Findings

| Severity | Location                     | Finding                                       | Status   |
| -------- | ---------------------------- | --------------------------------------------- | -------- |
| Medium   | `scripts/verify-package.mjs` | `process.exit` skipped `finally` temp cleanup | Resolved |
| Medium   | `scripts/verify-package.mjs` | Piped npm stderr hidden on failure            | Resolved |
| Medium   | `scripts/verify-package.mjs` | Missing Windows shell for npm spawn           | Resolved |

## QA Manual Validation

**QA model:** Composer  
**Review date:** 2026-07-15

### AC coverage

- AC 1: `files` allowlist, `bin`, LICENSE, no consumer `prepare` — five contract tests.
- AC 2–3: `prepublishOnly` → `prepublish-check.mjs`; canonical gate order; verbose dry-run emits redacted `publish.prep` lines only.
- AC 4–5: `verify-package` packs real tarball, validates entries, clean-installs, runs `npx --no-install specwiki --help`; integration test with temp cleanup.
- AC 6: README maintainer section documents `verify-package`, `prepublishOnly`, and explicit publish boundary.
- AC 7: no `src/` changes; 373 tests pass.
- AC 8: full §0.2 gate green; repo coverage 95.83%.

### Regression risks

- `verify-package` integration test adds ~3s to CI test suite (acceptable).
- Maintainers must run `npm run build` before pack if skipping verify-package (script runs build internally).

### Gaps

- No live `npm publish` or registry validation (intentionally out of scope).
- Version bump and semver policy deferred to S13.4.

### Manual validation steps

1. `npm run verify-package` — expected outcome: builds, validates tarball contents, clean-installs locally, and prints success message; temp artifacts removed.
2. `npm pack --dry-run` — expected outcome: lists `dist/**`, `README.md`, `LICENSE`, and `package.json` only; excludes `src/`, `tests/`, `_bmad-output/`.
3. `npm run prepublishOnly` — expected outcome: runs six quality-gate scripts in order and exits 0; does not publish or request npm credentials.
4. `node scripts/prepublish-check.mjs --verbose --dry-run` — expected outcome: deterministic `publish.prep` step/status lines with no credentials, env values, or absolute paths.
5. `npx vitest run tests/package/` — expected outcome: all package contract and publish-preparation tests pass.
