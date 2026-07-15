---
baseline_commit: f8b2286211b0748c935f1c230e5c8660d1a73e83
---

# Story 9.1: JSON machine-readable output

Status: review

## Story

As an AI agent or automation author,
I want `specwiki list` and `specwiki generate` to emit stable JSON summaries,
so that I can consume discovery and generation results without parsing terminal-formatted text.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev list -- --json --project tests/fixtures/sample-project` prints one valid JSON document on stdout; `npm run dev generate -- --json --project tests/fixtures/sample-project --output /tmp/specwiki-json-qa` prints one valid JSON document after writing the wiki.

1. `specwiki list --json` writes exactly one JSON object to stdout and no human-oriented headings, ANSI styling, blank-line grouping, or helpful-tip prose. Its stable schema is `{ categories: [{ name, files: [{ relativePath, title, category }] }] }`. Category names are existing category keys, categories are sorted by key, and files preserve discovery order (category, then relative path). Do not expose absolute paths, file bodies, frontmatter, or arbitrary parsed content.
2. `specwiki generate --json` performs the unchanged discovery → parse → markdown/HTML write pipeline, then writes exactly one JSON object to stdout and no human-oriented summary. Its stable schema is `{ specCount, outputDir, pages }`, where `outputDir` is the resolved absolute output directory and each page is `{ slug, title, category, sourcePath, description }`. Page order preserves `buildWiki()` order; `sourcePath` is project-relative. Counts must derive from values actually generated, not a follow-up filesystem scan.
3. Zero-match `list --json` and `generate --json` exit 0 and return `{ categories: [] }` and `{ specCount: 0, outputDir, pages: [] }`, respectively; they never mix the existing human helpful-tip text into JSON mode. `generate --json` does not create output when discovery is empty.
4. Without `--json`, existing human-readable `list` grouping, zero-match tips, generate summary text, ANSI behavior, exit codes, and generated wiki layout remain unchanged.
5. `--json --verbose` remains machine-safe: stdout contains only the result JSON while structured diagnostics, including a new verbose-only `output.json` event with command and summary counts, stay on stderr. Existing `cli.error` behavior and exit code 1/2 contracts remain unchanged on failure/usage errors.
6. CLI and command tests assert parseable JSON, exact stable fields/order, zero-match behavior, normal-mode regression behavior, generated file counts, and stdout/stderr separation. No browser/e2e tests and no new runtime dependencies.
7. The full HARNESS §0.2 quality gate passes, with ≥90% coverage thresholds maintained for touched modules.

## Tasks / Subtasks

- [x] Add JSON result contracts and command output selection (AC: 1–5)
  - [x] Define JSON-only result types in `src/types.ts`; reuse `SpecFile` data rather than duplicate discovery or parsing logic.
  - [x] Extend `GenerateOptions` with an optional JSON-mode flag and make `listSpecs`/`generateWiki` select either existing human output or exactly one `JSON.stringify` result.
  - [x] Add `--json` Commander options to `list` and `generate`, forwarding the flag without altering project/pattern/output/no-search behavior.
  - [x] Emit verbose-only `output.json` after the JSON result has been constructed, with counts/command only; retain existing lifecycle and error logging.
- [x] Add red-green regression coverage (AC: 1–7)
  - [x] Add command-level snapshot tests for successful and zero-match JSON results, including stable fields, category/page order, and count accuracy.
  - [x] Add CLI integration tests proving stdout parses as one JSON document and verbose diagnostics stay exclusively on stderr.
  - [x] Preserve and run existing human-output and exit-code tests; add only focused regression assertions needed for JSON mode.
- [x] Verify the complete quality and operational contract (AC: 4–7)
  - [x] Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.
  - [x] Manually run both JSON demo commands and a verbose JSON command; confirm stdout can be piped to `JSON.parse` and stderr has structured diagnostics only.
  - [x] Update `IMPLEMENTATION.md` with the E9 S9.1 checkbox, status/test count, and one build-log row before the HARNESS checkpoint.

## Dev Notes

### Product and scope

- This is the first E9 vertical slice for FR-023: agent/script consumers need summaries that do not require parsing Chalk-formatted terminal text. E9 S9.2 (`--emit-llms-txt`) is explicitly out of scope.
- Use the schema stated in the ACs as the v1 stable contract. Fields may be added only in a future, compatible story; do not rename or change the types of these fields in this story.
- JSON mode is an output-format flag, not an alternate pipeline: it must call the same `discoverSpecs`, `parseSpecFile`, `buildWiki`, `writeWiki`, and `writeHtmlWiki` implementations as normal mode.

### Current implementation intelligence

- `src/cli.ts` owns Commander option wiring, resolves `--project`, selects effective patterns, and handles exit codes. Add `--json` only to `generate` and `list`; do not add it to `init` or `open`.
- `src/commands/generate.ts` owns current stdout formatting through `console.log`. Keep `printZeroSpecsMessage()` for normal mode; JSON mode must bypass it.
- `discoverSpecs()` already supplies `SpecFile` records sorted by category then `relativePath`. JSON list results must group them into sorted category-key `categories` entries and map only `relativePath`, `category`, and `title`.
- `generateWiki()` currently returns `void`; it may remain command-oriented, but its JSON result must use the resolved output path, `wiki.pages.length`, and page fields already available from `WikiPage`. Do not infer values from filesystem scans.
- `src/types.ts` is the shared contract location. Add interfaces there before duplicating JSON shapes in CLI or command modules.
- `--verbose` logs JSON Lines to stderr via `src/core/Logger.ts`; stdout is reserved for user results. `output.json` must never contain full spec content, frontmatter, raw `--patterns` input, or secrets.

### Architecture, security, and regression guardrails

- Preserve module direction: `cli.ts → commands/generate.ts → discover/parse/output`; keep JSON shape formatting in commands/types, not discovery or output modules.
- Do not change frozen discovery patterns, category labels, wiki output layout, HTML escaping, slug behavior, or generated asset behavior.
- Treat `--project`, `--output`, and `--patterns` exactly as existing code does. JSON mode introduces no new file reads, writes, network calls, or path resolution behavior.
- Preserve `cli.error` on stderr and exit code 1 for runtime errors / 2 for usage errors. A Commander usage failure with `--json` is not a JSON success response.
- Do not log absolute paths or raw source content in the new `output.json` event. Use command and numeric counts only.

### Testing requirements

- Follow strict TDD: write a failing focused test before implementation, run it to confirm the intended failure, then implement the smallest change and refactor with tests green.
- Mirror existing tests in `tests/commands/generate.test.ts` (direct command output/log spies) and `tests/cli.test.ts` (real CLI process with `execFile`).
- Parse stdout with `JSON.parse`; also assert it has no ANSI/human-summary contamination. Validate stderr separately with the existing JSON-lines helpers.
- Include snapshots for successful and zero-match JSON results, plus assertions for list category/page order, resolved output path, verbose-mode logging separation, and stable fields. Existing non-JSON tests are regression evidence.
- Do not add e2e/browser tests unless the owner explicitly requests them.

### Project Structure Notes

- Expected modified files: `src/cli.ts`, `src/commands/generate.ts`, `src/types.ts`, `tests/commands/generate.test.ts`, `tests/cli.test.ts`, and `IMPLEMENTATION.md`.
- Do not touch current E19 story files or modify their existing uncommitted content. Preserve all unrelated worktree changes.
- No new dependency is expected or approved.

### References

- [Source: _bmad-output/planning-artifacts/discovery/prd/prd.md#CLI Interface — FR-023]
- [Source: _bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E9 — Agent Interoperability]
- [Source: _bmad-output/planning-artifacts/discovery/POST-MVP-ROADMAP.md#Phase B — Agent Interoperability]
- [Source: _bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md#Layer boundaries and Data Flow — List vs Generate]
- [Source: _bmad-output/planning-artifacts/discovery/project-context.md#Critical Implementation Rules]
- [Source: HARNESS.md#0.1 Test-Driven Development, #0.2 Quality gate, #0.8 Structured logging, #0.9 Security]
- [Source: src/cli.ts]
- [Source: src/commands/generate.ts]
- [Source: tests/commands/generate.test.ts]
- [Source: tests/cli.test.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Terra

### Debug Log References

- Story context created 2026-07-15 from E9, PRD, architecture, project context, current CLI/command/test implementation, and recent git history.
- Red: focused command JSON tests failed because the commands still emitted human output.
- Green: 346 tests pass after adding JSON contracts, command selection, CLI flags, and integration coverage.
- Manual validation: direct CLI JSON pipelines parsed successfully; `output.json` appears only on verbose stderr.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added `--json` for `list` and `generate` with stable, restricted result schemas and preserved human-mode output.
- Added safe verbose `output.json` diagnostics containing only command names and numeric counts.
- Verified success, zero-match, ordering, stdout/stderr separation, unchanged human output, and all six quality-gate commands.
- Documented the JSON flags and stdout/stderr behavior in `README.md`.

### File List

- _bmad-output/implementation-artifacts/9-1-json-machine-readable-output.md
- src/types.ts
- src/commands/generate.ts
- src/cli.ts
- tests/commands/generate.test.ts
- tests/cli.test.ts
- README.md
- IMPLEMENTATION.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-07-15 — Created E9 S9.1 implementation story and stable JSON contract.
- 2026-07-15 — Aligned the JSON schema with the Phase B roadmap definition of done.
- 2026-07-15 — Implemented JSON output for `list` and `generate`; added command and CLI regression coverage.
- 2026-07-15 — Documented JSON command usage and diagnostic stream separation in the README.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-15  
**Review outcome:** Changes Requested  
**Reviewer model:** claude-sonnet-5-thinking-high

### Action Items

- [ ] [Medium][Patch] `README.md`: document that zero-match JSON results are successful, return empty result objects, and that `generate --json` does not create output.

### Review Findings

`README.md` omits the zero-match `generate --json` contract.

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** claude-sonnet-5-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC1–3: command and spawned-CLI tests validate exact result fields, category/page ordering, zero-match output, and no generated output directory.
- AC4–5: existing human-mode and exit-code tests remain green; verbose CLI tests validate JSON stdout and `output.json` on stderr.
- AC6–7: no runtime dependencies added; all six quality commands pass with 95.72% statements and 90.35% branches.

### Regression risks

- `list` ordering relies on the existing discovery sort contract, which JSON tests now assert with multi-file categories.
- `npm run dev` prints npm script banners; use the direct CLI command or `npm --silent run dev` when validating strict stdout JSON.

### Gaps

None release-blocking. Category names are internally normalized; mixed-case locale ordering is not separately exercised. The README does not yet describe successful zero-match JSON results or that empty generate runs skip output creation.

### Manual validation steps

1. `node --import tsx/esm src/cli.ts list --json --project tests/fixtures/sample-project | node -e 'let s=""; process.stdin.on("data", c => s += c).on("end", () => { const r = JSON.parse(s); if (!Array.isArray(r.categories)) process.exit(1); console.log(r.categories.length); })'` — prints the discovered category count and exits 0 with only JSON on the CLI stdout.
2. `output_dir="$(mktemp -d)" && node --import tsx/esm src/cli.ts generate --json --project tests/fixtures/sample-project --output "$output_dir" | node -e 'let s=""; process.stdin.on("data", c => s += c).on("end", () => { const r = JSON.parse(s); if (r.specCount !== r.pages.length) process.exit(1); console.log(r.specCount); })' && test -f "$output_dir/index.md" && rm -rf "$output_dir"` — prints the generated page count, confirms the wiki was written, then removes the temporary output.
3. `node --import tsx/esm src/cli.ts list --json --verbose --project tests/fixtures/sample-project >/tmp/specwiki-json-out 2>/tmp/specwiki-json-err && node -e 'JSON.parse(require("node:fs").readFileSync("/tmp/specwiki-json-out", "utf8"))' && rg '"event":"output.json"' /tmp/specwiki-json-err` — stdout parses as JSON and stderr contains the structured `output.json` event only.
