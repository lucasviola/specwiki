---
baseline_commit: e3a487837615a562d749b21b4cfabb359c32adc3
---

# Story 8.1: `--patterns` CLI Flag

Status: review

## Story

As Alex, a developer with project-specific documentation layouts,
I want to supply comma-separated discovery globs to `specwiki list` and `specwiki generate`,
so that I can include files the default discovery patterns do not cover without changing source code.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

## Acceptance Criteria

1. Both `specwiki list` and `specwiki generate` accept `--patterns <globs>`, where the value is a comma-separated list of glob patterns.
2. When `--patterns` is present, the parsed custom patterns replace `DEFAULT_SPEC_PATTERNS` for that invocation; when absent, existing default discovery behavior is unchanged.
3. Pattern parsing trims surrounding whitespace, preserves glob syntax, and rejects an empty value or empty comma-delimited entries as a usage error with exit code 2.
4. A valid custom pattern can discover a file omitted by defaults in both commands; `generate` emits the corresponding markdown and HTML page.
5. With `--verbose`, a custom override emits `config.patterns-override` to stderr with `patternCount` only; quiet mode emits no override diagnostic and log payloads contain no file contents or secrets.
6. Invalid pattern input emits `config.error` with an actionable, sanitized message before the CLI exits 2.
7. Existing `--project`, `--output`, `--verbose`, `--no-search`, default-pattern behavior, output path confinement, and HTML escaping remain unchanged.
8. The full HARNESS §0.2 quality gate passes and coverage remains at least 90% for touched modules.

## Tasks / Subtasks

- [x] Add and validate the `--patterns` CLI contract for `list` and `generate` (AC: 1, 2, 3, 5, 6)
  - [x] Write failing CLI tests for comma-separated parsing, whitespace trimming, default replacement, missing/empty entries, exit code 2, and structured diagnostics.
  - [x] Add a focused parser in `src/config/patterns.ts`; do not add dependencies or alter `DEFAULT_SPEC_PATTERNS`.
  - [x] Wire the parsed `string[]` through existing `GenerateOptions.patterns` for both commands.
- [x] Prove custom discovery end-to-end through both user journeys (AC: 4, 7)
  - [x] Write failing command/CLI tests using a temporary file outside default patterns.
  - [x] Verify `list` prints the custom file and `generate` writes its markdown and HTML pages.
  - [x] Confirm absent `--patterns` keeps the current fixture count and behavior.
- [x] Complete validation and project records (AC: 8)
  - [x] Run the six-command HARNESS §0.2 quality gate.
  - [x] Run HARNESS §0.2.5 automated code review and §0.2.6 QA analysis on a different model family.
  - [x] Update `IMPLEMENTATION.md`, this story's Dev Agent Record, File List, review findings, and QA manual validation.

## Dev Notes

### Implementation Plan

- Use Commander's supported custom option processing for `--patterns <globs>` and return `string[]`.
- Keep parsing/validation in `src/config/patterns.ts`, then pass the result into the already-existing `GenerateOptions.patterns` and `DiscoverOptions.patterns` pipeline.
- Treat malformed CLI text as a Commander `InvalidArgumentError` so the established `handleCommanderError` path logs `cli.error` and exits 2. Emit the story-required `config.error` once at the validation boundary.
- Emit `config.patterns-override` after verbose mode is configured and before discovery. Include only `{ patternCount }`; discovery already logs `discover.start.patternCount`.
- Custom patterns are a full invocation-level override, not additive. Config-file and environment precedence belong to S8.2 and must not be implemented here.

### Current State and Required Changes

- `src/types.ts` already defines optional `patterns?: string[]` on both `GenerateOptions` and `DiscoverOptions`; reuse these types without duplication.
- `src/commands/generate.ts` already forwards `options.patterns` to `discoverSpecs` for both journeys and reports the effective pattern count in `cli.command`; preserve this behavior.
- `src/discover/specs.ts` already selects `options.patterns ?? DEFAULT_SPEC_PATTERNS`; no new discovery abstraction is needed.
- `src/cli.ts` currently exposes no pattern option. Add identical `--patterns <globs>` options to `generate` and `list`, and pass the parsed value into each command's options.
- `src/config/patterns.ts` currently contains frozen defaults and category labels. Add the parser without removing or reordering defaults.
- `tests/cli.test.ts` is the primary contract surface for Commander parsing and process exit codes. Command tests may supplement propagation assertions, but must not replace CLI process tests.

### Guardrails

- Preserve module direction: `cli → commands → discover`; config remains a leaf utility and must not import command/discovery modules.
- Do not implement `specwiki.config.js`, JSON config, environment variables, extended defaults, README indexing, or repeated `--patterns` accumulation; these are later E8 stories.
- Do not validate by reading matched files or execute user-controlled content. Patterns flow only to `fast-glob`.
- Do not log raw pattern strings because they may reveal private directory names. Log count and sanitized validation reasons only.
- Do not modify the frozen default pattern list in this story.
- No new runtime dependency is required. Commander 13 custom option processors support comma-separated coercion.
- No browser/e2e tests; use Vitest unit/integration tests and CLI subprocess tests per HARNESS §0.2.1.

### Testing Requirements

- Red phase must demonstrate failures before implementation.
- Parser unit cases: one glob; multiple globs; surrounding whitespace; braces/extglobs preserved; empty string; whitespace-only; leading/trailing/doubled commas.
- CLI integration cases:
  - `list --patterns "custom/**/*.md"` discovers a temporary custom file not matched by defaults.
  - `generate --patterns "custom/**/*.md"` produces exactly the custom page plus index/assets required by the existing output contract.
  - `--patterns ""` and malformed comma lists exit 2 and include `config.error` plus `cli.error`.
  - `--verbose` emits one `config.patterns-override` with `patternCount`; quiet mode does not.
  - No flag preserves current fixture discovery behavior.
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build` in order.

### Project Structure Notes

- Modified runtime files should be limited to `src/cli.ts` and `src/config/patterns.ts` unless a failing test proves a command-layer change is necessary.
- Expected tests: `tests/config/patterns.test.ts`, `tests/cli.test.ts`, and optionally focused additions to `tests/commands/generate.test.ts`.
- ESM relative imports retain `.js` extensions; TypeScript remains strict.

### References

- [Source: _bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#S8.1]
- [Source: _bmad-output/planning-artifacts/discovery/prd/prd.md#FR-005]
- [Source: _bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md#POST-MVP-extension-points]
- [Source: _bmad-output/planning-artifacts/discovery/project-context.md#Critical-Implementation-Rules]
- [Source: HARNESS.md#0.1-Test-Driven-Development]
- [Source: HARNESS.md#0.8-Structured-logging]
- [Commander custom option processing: https://github.com/tj/commander.js/blob/master/Readme.md#custom-option-processing]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Sol

### Debug Log References

- Red: `npm test -- tests/config/patterns.test.ts tests/cli.test.ts` failed with 17 expected failures because `parsePatternList` and `--patterns` did not exist.
- Green/refactor: focused suite passed 31 tests after parser, CLI wiring, diagnostics, and formatting.
- Quality gate: 226 tests passed after review patches; lint, format, coverage, typecheck, and build all passed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added delimiter-aware comma parsing that preserves brace globs, extglobs, character classes, and escaped commas while rejecting empty or unbalanced input.
- Added `--patterns` to both CLI journeys and reused the existing `GenerateOptions.patterns` → `discoverSpecs` override path.
- Added verbose-only `config.patterns-override` and always-on sanitized `config.error` events without logging raw globs.
- Proved custom-only list and markdown/HTML generate behavior with CLI subprocess tests; default behavior remained green in the full regression suite.
- Applied owner-approved review patches: escaped-delimiter parsing for asymmetric escapes, project-root pattern rejection, and discover-time confinement for outside-root matches.

### File List

- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/8-1-patterns-cli-flag.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/cli.ts`
- `src/config/patterns.ts`
- `tests/cli.test.ts`
- `tests/config/patterns.test.ts`

### Change Log

- 2026-07-14: Implemented E8 S8.1 `--patterns` override with validation, safe diagnostics, end-to-end tests, and project tracking.
- 2026-07-14: Applied review patches — escaped delimiter parsing, project-root pattern guard, discover confinement tests.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-14  
**Review outcome:** Approved (patches applied)  
**Reviewer model:** claude-opus-4-8-thinking-high

### Action Items

- [x] **Patch — Medium:** Correct escaped delimiter handling so a valid glob such as `foo\{bar}.md` is not rejected when its closing delimiter is unescaped.

### Review Findings

| Severity | Location                    | Finding                                                                                                                        | Triage        |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Medium   | `src/config/patterns.ts:62` | Escaped opening delimiters are not stacked, but a later unescaped close is popped, falsely rejecting valid asymmetric escapes. | Patch (fixed) |

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** claude-opus-4-8-thinking-high  
**Review date:** 2026-07-14

### AC coverage

- AC1–AC6 and AC8 have direct parser/CLI evidence; both commands accept and apply comma-separated overrides, diagnostics and exit codes are asserted, and the full gate is green.
- AC2 default preservation and AC7 existing path/HTML invariants are covered indirectly by the unchanged regression suite rather than dedicated new tests.

### Regression risks

- Commander error handling relies on `exitOverride()`, `USAGE_ERROR_CODES`, and module-scoped validation state remaining coordinated.
- The custom parser may diverge from advanced `fast-glob` syntax.
- `config.patterns-override` now precedes `cli.command` when verbose custom patterns are used.

### Gaps

- Parent-directory patterns are now rejected at parse time and outside-root matches are blocked in `discoverSpecs`; generate-verbose logging and custom-pattern HTML title escaping still lack dedicated tests.
- `generate --patterns --verbose` logging and custom-pattern HTML title escaping do not have dedicated tests.
- `src/cli.ts` remains coverage-excluded by project convention; subprocess tests exercise its branches.

### Manual validation steps

1. `npm run dev list -- --project tests/fixtures/sample-project --patterns "specs/**/*.md"` — prints only `Feature — specs/feature.md`; default-only files are absent.
2. `rm -rf /tmp/specwiki-patterns-qa && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-patterns-qa --patterns "specs/**/*.md"` — reports one page and writes `specs-feature.md` plus `html/specs-feature.html`.
3. `npm run dev list -- --project tests/fixtures/sample-project --patterns "specs/**/*.md, docs/plans/**/*.md" --verbose 2>&1 | grep config.patterns-override` — prints one override event with `"patternCount":2` and no raw globs.
4. `npm run dev list -- --project tests/fixtures/sample-project --patterns "specs/**/*.md"; echo "exit=$?"` — lists the matching spec, emits no stderr diagnostics, and prints `exit=0`.
5. `npm run dev list -- --project tests/fixtures/sample-project --patterns "specs/**/*.md,"; echo "exit=$?"` — emits sanitized `config.error` and `cli.error` events and prints `exit=2`.
6. `npm run dev list -- --project tests/fixtures/sample-project --patterns "**/*.{md,mdc"; echo "exit=$?"` — reports unbalanced delimiters and prints `exit=2`.
7. `npm run dev list -- --project tests/fixtures/sample-project --patterns; echo "exit=$?"` — reports the missing pattern list and prints `exit=2`.
8. `npm run dev list -- --project tests/fixtures/sample-project` — lists the unchanged default fixture set across all existing categories.
