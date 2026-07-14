---
baseline_commit: 71fac70081e0236b019b6f69ecf43ce8f603260c
---

# Story 17.1: Broad Markdown Discovery by Default

Status: review

## Story

As Lucas, a specwiki user in any markdown-heavy repo,
I want `specwiki generate` with no flags to discover all markdown files in my project,
so that I get a wiki without configuring patterns first.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `specwiki generate --project tests/fixtures/sample-project` — discovers markdown outside legacy spec-only paths; `specwiki list` shows the same expanded set.

**Binds:** FR-036 | **Depends:** S8.2 (config precedence unchanged) | **Enables:** S17.3 (init scaffold reflects post-S17.1 defaults)

**NFR-013 owner approval:** Extending `DEFAULT_SPEC_PATTERNS` with catch-all is extend-only. Owner approval recorded by Lucas requesting story S17.1 (2026-07-14).

## Acceptance Criteria

### Functional

1. `DEFAULT_SPEC_PATTERNS` includes catch-all `**/*.{md,mdc}` appended after existing entries (retains `llms.txt` and other non-markdown spec files).
2. Discovery ignore list extended with `**/.git/**`, `**/coverage/**`, `**/.venv/**`, `**/vendor/**` (in addition to existing ignores).
3. Precedence unchanged: CLI `--patterns` > env > config > defaults.
4. Projects with custom `specwiki.config.json` `patterns` array unaffected unless they omit the catch-all themselves.
5. Fixture test proves `docs/notes/general-notes.md` is discovered and appears in generated wiki.
6. Zero-match behavior unchanged: exit 0, helpful tip on stdout.

### Logging & diagnostics (§0.8)

7. `discover.start` includes `patternCount` reflecting updated defaults (verbose).
8. With `--verbose`, when match count exceeds threshold (500), emit `discover.large-set` with `{ matchCount }` — no file paths logged.

### Quality measures

9. Full HARNESS §0.2 gate passes.
10. `discover/specs.ts` and `config/patterns.ts` coverage ≥ 90% on touched paths.

### Security checklist

11. No new path-escape vectors via broad globs; existing `validatePatternList` rules unchanged.
12. Extended ignore list prevents scanning `.git` and common secret-adjacent build dirs.

### UX checklist

13. Update `ZERO_SPECS_TIP` to mention markdown anywhere in the project.
14. README documents new zero-config behavior.

## Tasks / Subtasks

- [x] Extend default patterns and ignore list (AC: 1, 2, 3, 4, 11, 12)
  - [x] Write failing `tests/config/patterns.test.ts` for catch-all glob appended after S8.3 entries.
  - [x] Append `**/*.{md,mdc}` to `DEFAULT_SPEC_PATTERNS` (extend-only).
  - [x] Extend `discoverSpecs` ignore list with `.git`, `coverage`, `.venv`, `vendor`.
  - [x] Add `discover.large-set` when verbose and matchCount > 500.
- [x] Fixture and discovery tests (AC: 5, 6, 7, 8)
  - [x] Add `tests/fixtures/sample-project/docs/notes/general-notes.md`.
  - [x] Update fixture count assertions; assert general-notes discovered with category `other`.
  - [x] Test extended ignore dirs; test `discover.large-set` via mocked glob.
  - [x] Update `ZERO_SPECS_TIP` and cli zero-match test.
- [x] Documentation and validation (AC: 9, 10, 13, 14)
  - [x] Update README "What it finds" and IMPLEMENTATION.md.
  - [x] Run six-command HARNESS §0.2 quality gate.
  - [x] Run §0.2.5 code review and §0.2.6 QA analysis.

## Dev Notes

### Implementation Plan

- **Extend-only:** Append `**/*.{md,mdc}` as final entry; do not remove or reorder existing patterns.
- **Catch-all supersedes nothing:** Specific globs remain for documentation clarity and custom-override users who enumerate legacy patterns only.
- **Ignore list:** Use `**/.git/**` form for fast-glob; test each new ignore dir.
- **Large-set threshold:** Export `LARGE_SET_THRESHOLD = 500` from `discover/specs.ts` for testability; emit only in verbose mode after glob completes.
- **Config precedence:** No loader/cli changes expected — custom config replaces full default list when set.

### Current State and Required Changes

| Module                           | Today                                          | This story                                           |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `src/config/patterns.ts`         | 19 globs (S8.3 extended)                       | Append catch-all → 20                                |
| `src/discover/specs.ts`          | Ignores node_modules, dist, wiki, .specwiki    | Add .git, coverage, .venv, vendor; add large-set log |
| `src/commands/generate.ts`       | ZERO_SPECS_TIP mentions AGENTS/SPEC paths only | Mention markdown anywhere                            |
| `tests/fixtures/sample-project/` | 16 discoverable specs                          | Add docs/notes/general-notes.md → 17                 |
| `README.md`                      | Table lists curated patterns                   | Add catch-all row                                    |

## Dev Agent Record

### Implementation Plan

- Appended catch-all `**/*.{md,mdc}` as final DEFAULT_SPEC_PATTERNS entry (20 total).
- Extended fast-glob ignore list with `.git`, `coverage`, `.venv`, `vendor`.
- Added `LARGE_SET_THRESHOLD = 500` and verbose-only `discover.large-set` event.
- Updated ZERO_SPECS_TIP, README, fixture + tests.

### Completion Notes

- All 275 tests pass; discover/specs.ts and config/patterns.ts at 100% / 97% coverage on touched paths.
- Code review flagged custom `--output` dirs (non-`wiki`/`.specwiki`) may be re-discovered with catch-all — **fixed**: generate passes resolved output dir via `ignorePaths`.

## File List

- `src/types.ts`
- `src/discover/specs.ts`
- `src/commands/generate.ts`
- `tests/fixtures/sample-project/docs/notes/general-notes.md`
- `tests/config/patterns.test.ts`
- `tests/discover/specs.test.ts`
- `tests/commands/generate.test.ts`
- `tests/cli.test.ts`
- `README.md`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/17-1-broad-markdown-discovery-by-default.md`

## Change Log

- 2026-07-14: Story created and implementation started.
- 2026-07-14: Review patch — generate excludes resolved `--output` dir from discovery via `ignorePaths`.

## QA Manual Validation

1. `npm run dev list -- --project tests/fixtures/sample-project` — output includes `docs/notes/general-notes.md`.
2. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-s17-qa` — wiki includes general-notes page.
3. `npm run dev list -- --verbose --project tests/fixtures/sample-project 2>&1 | grep discover.start` — `patternCount` is 20.
4. `open /tmp/specwiki-s17-qa/html/index.html` — general notes visible in wiki index.
