---
baseline_commit: ea5f4d7274272076d3c8f57734563e79bd0e4dd2
---

# Story 17.3: `specwiki init` Config Scaffold

Status: review

## Story

As Lucas, a specwiki user,
I want `specwiki init` to create a `specwiki.config.json` in my project with sensible discovery patterns,
so that I can customize specwiki for my folder layout without reading the docs first.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `mkdir /tmp/specwiki-init-qa && specwiki init --project /tmp/specwiki-init-qa` — creates valid `specwiki.config.json`; `specwiki list --project /tmp/specwiki-init-qa` loads it.

**Binds:** FR-038 | **Depends:** S17.1 (scaffold reflects post-S17.1 defaults) | **NFR:** NFR-008

## Acceptance Criteria

### Functional

1. New `specwiki init` subcommand with `-p, --project` (default `cwd`).
2. Writes `{project}/specwiki.config.json` with `{ "patterns": [...] }` using the current `DEFAULT_SPEC_PATTERNS` (post-S17.1).
3. JSON pretty-printed (2-space indent) for human editability.
4. When config already exists (`specwiki.config.js` or `.json`), exit 2 with message unless `--force` passed.
5. With `--force`, overwrite `.json` only if `.js` absent; never overwrite `.js` (exit 2 with message to edit manually).
6. Exit 0 on success; stdout confirms path created.

### Logging & diagnostics (§0.8)

7. `init.write` with `{ sourcePath: "specwiki.config.json" }` (verbose).
8. `init.error` when file exists or write fails (always).
9. `cli.command` on start (verbose).

### Quality measures

10. Full HARNESS §0.2 gate passes.
11. Tests cover create, exists-without-force (exit 2), force overwrite, js-present guard.
12. `commands/init.ts` coverage ≥ 90%.

### Security checklist

13. Write target confined to resolved `--project` root.
14. Scaffolded patterns validated through `validatePatternList` before write — no invalid template shipped.
15. No secrets or environment values embedded in scaffold.

### UX checklist

16. Success message includes next steps: `specwiki list` then `specwiki generate`.
17. `--help` documents `--force` behavior clearly.

## Tasks / Subtasks

- [x] Implement `init` command module (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16)
  - [x] Write failing `tests/commands/init.test.ts`.
  - [x] Add `src/commands/init.ts` with scaffold builder, exists guards, path confinement.
  - [x] Wire `init` subcommand in `src/cli.ts` with `--force` and exit 2 handling.
- [x] CLI integration tests (AC: 11, 17)
  - [x] Test create + list loads config.
  - [x] Test exists-without-force exits 2 with `init.error`.
  - [x] Test `--force` overwrite and js-present guard.
  - [x] Test `--help` lists `init` and documents `--force`.
- [x] Documentation and validation (AC: 10, 12)
  - [x] Update IMPLEMENTATION.md E17 checklist and logging audit.
  - [x] Run six-command HARNESS §0.2 quality gate.

## Dev Notes

### Implementation Plan

- **Module:** `src/commands/init.ts` — `initConfig(options)` parallel to `openWiki`.
- **Scaffold:** `validatePatternList([...DEFAULT_SPEC_PATTERNS])` then `JSON.stringify(..., null, 2)`.
- **Exists guard:** Check `.js` first (always blocks); then `.json` unless `--force`.
- **Exit codes:** `getInitExitCode` returns 2 for config conflicts, 1 for write failures.

## Dev Agent Record

### Implementation Plan

- Added `initConfig` with DEFAULT_SPEC_PATTERNS scaffold and validatePatternList guard.
- Exists guard: `.js` always blocks; `.json` requires `--force` to overwrite.
- `init.error` always; `init.write` and `cli.command` verbose-only.
- Success stdout: green path + dim next-steps line.

### Completion Notes

- 20 new tests (15 unit + 5 CLI integration); 312 tests total.
- init.ts at 97.87% coverage.

## File List

- `src/commands/init.ts`
- `src/cli.ts`
- `src/types.ts`
- `tests/commands/init.test.ts`
- `tests/cli.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/17-3-specwiki-init-config-scaffold.md`

## Change Log

- 2026-07-14: Story created and implemented; status → review.

## QA Manual Validation

1. `mkdir /tmp/specwiki-init-qa && npm run dev init -- --project /tmp/specwiki-init-qa` — creates `specwiki.config.json`; stdout shows green success + next steps.
2. `npm run dev list -- --project /tmp/specwiki-init-qa` — loads scaffolded config (discovers markdown in project).
3. `npm run dev init -- --project /tmp/specwiki-init-qa` — exit 2; message suggests `--force`.
4. `npm run dev init -- --project /tmp/specwiki-init-qa --force` — overwrites `.json` with defaults.
5. `npm run dev init -- --help` — documents `--force` and `.js` guard.
