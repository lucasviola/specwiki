---
baseline_commit: 37482ed87a7b5b54fd6579ac207fc3264112972c
---

# Story 21.4: Trust Warning When Loading specwiki.config.js

Status: done

## Story

As a developer running specwiki on a cloned repository,
I want an explicit warning when `specwiki.config.js` is loaded,
so that I know arbitrary Node.js from the project is about to execute.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Place `specwiki.config.js` in fixture project → `specwiki list` stderr shows one clear warning naming the file; JSON config does not warn.

**Binds:** E21 | **Finding:** SEC-2

## Acceptance Criteria

### Functional

1. When `loadProjectConfig` loads `specwiki.config.js`, emit a single user-visible warning per process invocation (not per subcommand retry).
2. Warning states that `.js` config executes arbitrary code; suggest `specwiki.config.json` for static patterns.
3. JSON config load does not emit this warning.
4. `--json` stdout remains clean; warning goes to stderr only.

### Logging & diagnostics (§0.8)

5. Optional structured `config.warn` event on stderr (always, not verbose-gated) with `{ sourcePath: "specwiki.config.js" }` — no config body or env values.

### Security (§0.9)

6. Do not log config file contents, env vars, or resolved pattern strings.

### Quality measures

7. Tests in `tests/config/loader.test.ts` and CLI integration for js vs json.
8. Full §0.2 gate passes.

## Tasks / Subtasks

- [x] Add always-on `log.warn` to `src/core/Logger.ts` (AC: 5)
- [x] Emit user-visible stderr warning + `config.warn` from `loadProjectConfig` when `.js` config loads; once per process (AC: 1–3, 6)
- [x] Add loader unit tests for js vs json warning behavior (AC: 7)
- [x] Add CLI integration tests including `--json` stdout cleanliness (AC: 4, 7)
- [x] Run full §0.2 quality gate and update project records (AC: 8)

## Dev Agent Record

### Agent Model Used

Composer

### Completion Notes List

- Added `log.warn` (always-on, JSON stderr) alongside existing `log.info` / `log.error`.
- `loadProjectConfig` emits one chalk yellow stderr line naming `specwiki.config.js`, plus structured `config.warn` with basename only; guarded by process-level flag with test reset helper.
- JSON config load unchanged — no warning.
- 4 loader tests + 3 CLI subprocess tests; 555 tests total; full §0.2 gate green.

### File List

- `_bmad-output/implementation-artifacts/21-4-config-js-trust-warning.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `IMPLEMENTATION.md`
- `src/core/Logger.ts`
- `src/config/loader.ts`
- `tests/core/Logger.test.ts`
- `tests/config/loader.test.ts`
- `tests/cli.test.ts`

### Change Log

- 2026-07-19: Implemented config.js trust warning with stderr user message and `config.warn` event — ready for review
- 2026-07-19: Applied review patches — ESM CLI fixture helper; warn-after-import test for invalid shape; Bugbot clean

## Senior Developer Review (AI)

**Review date:** 2026-07-19  
**Review outcome:** Approve (after review patches)  
**Reviewer model:** Bugbot subagent

### Action Items

- [x] [Patch][Med] CLI integration tests used CJS `module.exports` — added `writeEsmJsConfigProject` helper with `package.json` `"type":"module"` and `export default` (matches demo path)
- [x] [Patch][Med] Add regression test that trust warning fires when js import succeeds but config validation fails (arbitrary code already ran)
- [x] [Defer][Low] Document ESM `export default` requirement for `.js` configs without `"type":"module"` — already covered in README/ADR-0003

## QA Manual Validation

1. Create temp project with `specwiki.config.js` using `module.exports = { patterns: ["custom/**/*.md"] }` and a matching spec file — `specwiki list --project <dir>` prints yellow warning on stderr naming `.js` config and suggesting JSON.
2. Same project with only `specwiki.config.json` — quiet stderr (no `config.warn`).
3. `specwiki list --project <dir> --json` with `.js` config — stdout is valid JSON only; warning remains on stderr.
