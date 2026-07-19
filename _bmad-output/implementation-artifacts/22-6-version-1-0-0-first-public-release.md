---
baseline_commit: HEAD
---

# Story 22.6: Version 1.0.0 first public release

Status: backlog

## Story

As the project owner,
I want to execute the first public npm release at semver 1.0.0,
so that users can install `@lucasviola/specwiki` from the registry with a stable, verified version.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** On green `main`, `npm run release:check` passes; `npx @lucasviola/specwiki@1.0.0 --version` prints `1.0.0` after owner publishes; git tag `v1.0.0` exists.

**Binds:** E22, E13, E21 | **Depends:** S22.1–S22.5; E21 S21.3, S21.5, S21.6 recommended (owner may waive)

## Acceptance Criteria

1. **Version consistency at 1.0.0:**
   - `package.json` and `package-lock.json` at `1.0.0`
   - CLI `--version` prints `1.0.0`
   - README badge at `1.0.0` (static) or npm badge (post-publish)
   - `CHANGELOG.md` `[1.0.0]` dated
2. **Pre-publish gate:**
   - Green CI on `main`
   - `npm run release:check` passes
   - E21 security gate satisfied or explicitly waived by owner in story review
3. **Release execution (owner action — document, do not automate unless instructed):**
   - Commit: `chore: release v1.0.0`
   - Tag: `git tag -a v1.0.0 -m "v1.0.0"` and push tag
   - `npm run publish:package -- --dry-run` then `--confirm`
4. **Post-publish verification (record in story completion notes):**
   - `npm view @lucasviola/specwiki version` → `1.0.0`
   - `npx @lucasviola/specwiki@latest --version` → `1.0.0`
   - `npx @lucasviola/specwiki@latest generate --help` succeeds
5. **Post-publish README:** Switch version badge to npm shields.io URL.
6. **Optional:** Create GitHub Release from CHANGELOG `[1.0.0]` section; announce via `docs/marketing/launch-copy.md`.
7. **Contract tests:** Full version consistency suite passes (`tests/package/version-contract.test.ts` or equivalent aggregating S22.1–S22.2 tests).
8. **Scope boundary:** `npm publish` and GitHub Release require explicit owner instruction at implementation review — story prepares everything; owner executes publish step.
9. **Quality gate:** Full HARNESS §0.2 passes.

## Tasks / Subtasks

- [ ] Confirm S22.1–S22.5 complete
- [ ] Confirm E21 gate stories done or waived
- [ ] Run `npm run release:version -- --set 1.0.0` if not already at 1.0.0
- [ ] Fix any remaining drift (README badge was `0.1.0` as of 2026-07-16)
- [ ] Finalize CHANGELOG date for `[1.0.0]`
- [ ] Run `npm run release:check`
- [ ] **Owner:** tag, publish, verify (record outputs in Completion Notes)
- [ ] Swap README to npm badge post-publish
- [ ] Update `IMPLEMENTATION.md` with release evidence

## Dev Notes

### Epic gate dependencies

| Prerequisite      | Epic story | Status      |
| ----------------- | ---------- | ----------- |
| Publish contract  | E13 S13.1  | in-progress |
| CI green          | E13 S13.2  | review      |
| Marketing ready   | E13 S13.3  | review      |
| SECURITY.md       | E21 S21.3  | backlog     |
| Audit gate        | E21 S21.5  | backlog     |
| Publish checklist | E21 S21.6  | backlog     |

Owner may ship 1.0.0 with documented residual risk if E21 stories are waived.

### SemVer meaning of 1.0.0

Signals stable CLI surface: `list`, `generate`, `open`, `init`, JSON/llms.txt flags, default discovery, wiki output layout.

## QA Manual Validation

1. `npm run release:check` — full gate passes
2. `node dist/cli.js --version` — `1.0.0`
3. `npm run publish:package -- --dry-run` — tarball contents correct
4. **After owner publish:** `npx @lucasviola/specwiki@latest --version` — `1.0.0`
5. `git tag -l 'v1.0.0'` — tag exists on release commit
