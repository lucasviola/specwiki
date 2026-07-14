---
baseline_commit: 2e232505365a20db15b5718ad35a1f0c52aaf214
---

# Story 8.2: Project Config File Loader

Status: review

## Story

As Alex, a developer with project-specific documentation layouts,
I want specwiki to load discovery patterns from `specwiki.config.js` or `specwiki.config.json`,
so that I can configure custom globs once per project without passing `--patterns` every time.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. `specwiki list` and `specwiki generate` load `specwiki.config.js` (preferred) or `specwiki.config.json` from the resolved `--project` root when no `--patterns` flag is present.
2. Pattern precedence is CLI `--patterns` > `SPECWIKI_PATTERNS` env > project config `patterns` > `DEFAULT_SPEC_PATTERNS`.
3. Config `patterns` must be a non-empty array of glob strings when present; each entry is validated with the same rules as `--patterns` (non-empty, balanced delimiters, confined to project root).
4. Invalid config (malformed JSON, failed JS import, wrong shape, invalid globs) exits 2 with `config.error` and `cli.error` before discovery.
5. With `--verbose`, a successfully loaded config file emits `config.load` on stderr with `sourcePath` only (basename, no secrets); quiet mode emits no load diagnostic.
6. Config without a `patterns` key loads successfully and discovery falls back to defaults; env and CLI overrides still win when set.
7. A valid config pattern discovers files omitted by defaults in both `list` and `generate`; absent config/env/CLI keeps S8.1 default behavior unchanged.
8. The full HARNESS §0.2 quality gate passes and coverage remains at least 90% for touched modules.

## Tasks / Subtasks

- [x] Add config loader and pattern resolution (AC: 1, 2, 3, 6)
  - [x] Write failing tests for JSON/JS load, precedence chain, and shape validation.
  - [x] Add `validatePatternList` in `src/config/patterns.ts` for array validation.
  - [x] Add `src/config/loader.ts` with `loadProjectConfig` and env resolution; no new runtime dependencies.
- [x] Wire CLI and prove end-to-end discovery (AC: 4, 5, 7)
  - [x] Write failing CLI tests for config-driven list/generate, invalid config exit 2, and verbose `config.load`.
  - [x] Resolve patterns in `src/cli.ts` before commands; preserve S8.1 `--patterns` override logging.
- [x] Complete validation and project records (AC: 8)
  - [x] Run the six-command HARNESS §0.2 quality gate.
  - [x] Update `IMPLEMENTATION.md`, Dev Agent Record, File List, and sprint status.

## Dev Notes

### Implementation Plan

- Keep loading in `src/config/loader.ts`; CLI remains thin wiring.
- Load order: `specwiki.config.js` then `specwiki.config.json`; first existing file wins.
- JS configs load via dynamic `import(pathToFileURL(...))`; accept `export default` or module namespace object.
- Env var `SPECWIKI_PATTERNS` uses existing `parsePatternList` (comma-separated).
- `config.load` logs basename only (`specwiki.config.json`); never log pattern strings or file contents.
- Invalid config throws `ConfigError`; CLI maps to `config.error` + exit 2 (same as S8.1 pattern validation).
- Do not implement `.specwikirc`, category overrides, output options, plugins, or extended defaults (S8.3+).

### Guardrails

- Module direction: `cli → commands → discover`; `config/loader.ts` is a leaf like `config/patterns.ts`.
- Config `patterns` replace defaults when set (same semantics as CLI override); users may spread defaults in their config file if they want additive behavior.
- No cosmiconfig or new runtime deps.

### References

- [Source: epics-and-stories.md#S8.2]
- [Source: FR-005]
- [Source: ARCHITECTURE-SPINE.md POST-MVP extension points]
- [Source: 8-1-patterns-cli-flag.md — CLI override and validation patterns]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Red: `npm test -- tests/config/loader.test.ts` failed with 15 expected failures before loader existed.
- Green: focused suite 62 tests; full regression 244 tests after CLI wiring and formatting.

### Completion Notes List

- Added `src/config/loader.ts` loading `specwiki.config.js` (preferred) or `specwiki.config.json` via dynamic import / JSON parse.
- Pattern precedence: CLI `--patterns` > `SPECWIKI_PATTERNS` env > config `patterns` > defaults.
- Extracted `validatePatternList` for array validation shared by config and CLI comma parsing.
- Wired `resolveCommandPatterns` in CLI with verbose `config.load` and exit-2 `config.error` on invalid config.
- Proved config-driven list/generate via CLI subprocess tests; S8.1 default behavior unchanged without config.

### File List

- `_bmad-output/implementation-artifacts/8-2-project-config-file-loader.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `IMPLEMENTATION.md`
- `src/cli.ts`
- `src/config/loader.ts`
- `src/config/patterns.ts`
- `tests/cli.test.ts`
- `tests/config/loader.test.ts`

### Change Log

- Applied review patches: symlink confinement via realpath, sanitized load failure messages, distinct JS vs JSON error labels.

- Applied review patches: symlink confinement via realpath, sanitized load failure messages, distinct JS vs JSON error labels.

## Senior Developer Review (AI)

**Review date:** 2026-07-14  
**Review outcome:** Approved (patches applied)  
**Reviewer model:** Bugbot

### Action Items

- [x] **Patch — Medium:** Use distinct JS vs JSON syntax error messages.
- [x] **Patch — High:** Sanitize config load errors; do not log raw loader internals.
- [x] **Patch — Medium:** Reject config symlinks that resolve outside project root.

### Review Findings

| Severity | Location    | Finding                                             | Triage        |
| -------- | ----------- | --------------------------------------------------- | ------------- |
| Medium   | `loader.ts` | JS syntax errors mislabeled as JSON                 | Patch (fixed) |
| High     | `loader.ts` | Raw loader `err.message` leaked into `config.error` | Patch (fixed) |
| Medium   | `loader.ts` | Symlinked config could escape project root          | Patch (fixed) |

## QA Manual Validation

**QA model:** Composer (inline)  
**Review date:** 2026-07-14

### AC coverage

- AC1–AC8 covered by loader unit tests, CLI integration tests, and full §0.2 gate (246 tests).
- Env precedence (`SPECWIKI_PATTERNS`) covered in unit tests; no dedicated CLI subprocess test for env-only override.

### Regression risks

- Config without `patterns` key still loads and falls back to defaults; ensure future config keys do not break this path.
- `specwiki.config.js` dynamic import executes user code (accepted POST-MVP tradeoff).

### Gaps

- No CLI subprocess test for env-only override or JS config file end-to-end.
- Config with empty `patterns: []` rejected; behavior matches CLI empty-list semantics.

### Manual validation steps

1. `echo '{"patterns":["custom/**/*.md"]}' > /tmp/specwiki-config-qa/specwiki.config.json` (after `mkdir -p /tmp/specwiki-config-qa/custom` and adding a `custom/notes.md`) — config file present at project root.
2. `npm run dev list -- --project /tmp/specwiki-config-qa` — lists `custom/notes.md`; default-only files absent.
3. `npm run dev list -- --project /tmp/specwiki-config-qa --verbose 2>&1 | grep config.load` — prints one `config.load` with `"sourcePath":"specwiki.config.json"`.
4. `npm run dev list -- --project /tmp/specwiki-config-qa --patterns "specs/**/*.md" --project tests/fixtures/sample-project` — CLI override wins over config when both present on fixture project.
5. `echo '{"patterns":["../**/*.md"]}' > /tmp/specwiki-config-qa/specwiki.config.json && npm run dev list -- --project /tmp/specwiki-config-qa; echo "exit=$?"` — emits `config.error`, exits 2.
6. `SPECWIKI_PATTERNS="custom/**/*.md" npm run dev list -- --project /tmp/specwiki-config-qa` — env override wins when config also present.
7. `npm run dev list -- --project tests/fixtures/sample-project` — unchanged default fixture behavior without config file.
