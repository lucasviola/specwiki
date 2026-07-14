---
baseline_commit: 9631704a5d37105dac60fb2128ede6dabb42807c
---

# Story 17.2: `specwiki open` Browser Command

Status: review

## Story

As Lucas, a specwiki user,
I want `specwiki open` to launch the generated HTML wiki in my default browser,
so that I can preview the wiki immediately after generate without manually running `open`.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `specwiki generate --project tests/fixtures/sample-project --output /tmp/specwiki-open-qa && specwiki open --project tests/fixtures/sample-project --output /tmp/specwiki-open-qa` — default browser opens `html/index.html`.

**Binds:** FR-037 | **Depends:** E4 (HTML output exists) | **NFR:** NFR-009

## Acceptance Criteria

### Functional

1. New `specwiki open` subcommand with `-p, --project` (default `cwd`) and `-o, --output` (default `wiki`, same semantics as generate).
2. Resolves `{project}/{output}/html/index.html`; verifies file exists before launch.
3. When index missing, exit 1 with actionable message: run `specwiki generate` first (stdout/stderr per existing CLI chalk conventions).
4. Cross-platform launch via `child_process.execFile` (no shell): macOS `open`, Linux `xdg-open`, Windows `cmd /c start ""` with quoted path.
5. Exit 0 on successful spawn; exit 1 if spawn fails or file missing.
6. `--verbose` logs `open.launch` with `{ indexPath }` (resolved absolute path is OK — it is under project output, not spec content).

### Logging & diagnostics (§0.8)

7. `cli.command` on start with command `open` (verbose).
8. `open.error` when index missing or spawn fails (always).
9. `open.launch` on success (verbose).

### Quality measures

10. Full HARNESS §0.2 gate passes.
11. CLI tests mock `execFile` — no real browser spawn in CI.
12. `commands/open.ts` coverage ≥ 90%.

### Security checklist

13. Resolved index path MUST be confined under `path.resolve(projectRoot, outputDir)` — reject traversal via `../` in `--output`.
14. Browser launcher invoked with argument array; path passed as single argument, never concatenated into a shell string.

### UX checklist

15. Success stdout: `Opened wiki in browser` + dim path line (matches generate summary style).
16. Listed in `specwiki --help` alongside `generate` and `list`.

## Tasks / Subtasks

- [x] Implement `open` command module (AC: 1, 2, 4, 5, 6, 7, 8, 9, 13, 14, 15)
  - [x] Write failing `tests/commands/open.test.ts` with mocked launch handler.
  - [x] Add `src/commands/open.ts` with path confinement, index check, cross-platform launcher.
  - [x] Wire `open` subcommand in `src/cli.ts`.
- [x] CLI integration tests (AC: 3, 11, 16)
  - [x] Test missing index exits 1 with actionable message and `open.error`.
  - [x] Test `--help` lists `open` alongside `generate` and `list`.
  - [x] Test path traversal via `--output` rejected.
- [x] Documentation and validation (AC: 10, 12)
  - [x] Update IMPLEMENTATION.md E17 checklist and logging audit.
  - [x] Run six-command HARNESS §0.2 quality gate.
  - [x] Run §0.2.5 code review and §0.2.6 QA analysis.

## Dev Notes

### Implementation Plan

- **Module:** `src/commands/open.ts` — `openWiki(options)` parallel to `generateWiki`.
- **Path confinement:** String `path.relative` check plus `fs.realpath` guard against symlink escapes.
- **Launcher:** Injectable `launchHandler` for tests; production uses `promisify(execFile)`.
- **Missing index:** `ENOENT` from `fs.access` → actionable generate-first message; other I/O errors reported separately.

## Dev Agent Record

### Implementation Plan

- Added `openWiki` with cross-platform `execFile` launcher (darwin/linux/win32).
- Path confinement via string relative check + `realpath` symlink guard.
- Injectable `setLaunchHandlerForTests` avoids real browser spawn in CI.
- User-facing yellow chalk messages on stdout for all error paths.

### Completion Notes

- 292 tests pass; `open.ts` at 93.78% coverage.
- Code review flagged symlink bypass and access-error misreporting — both fixed with `realpath` confinement and distinct ENOENT handling.

## File List

- `src/commands/open.ts`
- `src/cli.ts`
- `src/types.ts`
- `tests/commands/open.test.ts`
- `tests/cli.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/17-2-specwiki-open-browser-command.md`

## Change Log

- 2026-07-14: Story created and implemented; status → review.

## Senior Developer Review (AI)

**Reviewer:** Bugbot subagent | **Date:** 2026-07-14 | **Outcome:** Changes Requested → Patched

| Severity | Finding                                   | Resolution                               |
| -------- | ----------------------------------------- | ---------------------------------------- |
| High     | Symlink bypasses output path confinement  | Fixed with `assertRealpathConfinedUnder` |
| Medium   | Access errors misreported as missing wiki | Fixed ENOENT vs other I/O error handling |

## QA Manual Validation

1. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-open-qa` — wiki generated with `html/index.html`.
2. `npm run dev open -- --project tests/fixtures/sample-project --output /tmp/specwiki-open-qa` — browser opens wiki index; stdout shows green success + dim path.
3. `npm run dev open -- --project tests/fixtures/sample-project --output /tmp/specwiki-missing` — exit 1; message suggests running generate first.
4. `npm run dev -- --help` — lists `open` alongside `generate` and `list`.

## QA Analysis (§0.2.6)

**AC coverage:** All 16 ACs satisfied. Path traversal (`../outside`) and symlink escape both tested. Platform launchers tested via `process.platform` mock.

**Regression risks:** Low — new command only; existing generate/list unchanged.

**Gaps:** No subprocess success test for `open` (would spawn real browser); covered by unit tests with injectable handler.
