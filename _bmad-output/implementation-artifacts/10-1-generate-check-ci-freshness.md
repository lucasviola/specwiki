---
baseline_commit: e308bd96bc2b5e8c12f3c9d15960b5833f26efbe
---

# Story 10.1: generate --check CI freshness

Status: review

## Story

As a tech lead running specwiki in CI,
I want `specwiki generate --check` to verify the committed wiki matches a fresh generation,
so that stale documentation fails the pipeline without writing files.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output .specwiki/check-qa` then `npm run dev generate -- --check --project tests/fixtures/sample-project --output .specwiki/check-qa` → exit 0; tamper `index.md` without regenerating → same check command exits 1 with no writes to the output directory. (`--output` must stay within `--project`.)

1. `specwiki generate --check` runs the same discovery → parse → build pipeline as normal generate, compares markdown + HTML output (including bundled assets and search files when enabled) against the resolved `--output` directory, and performs **no writes** to the target output path.
2. When output matches a fresh generation, exit **0** with no failure logs. When output is missing, differs, or contains extra generated-path files, exit **1**.
3. Zero-match projects: exit **0** when the output directory is absent or contains no wiki files; exit **1** when stale wiki files remain from a prior generation.
4. `--check` respects `--no-search`, `--emit-llms-txt`, and `--patterns` the same as normal generate — comparison includes only what those flags would produce.
5. Structured logging: verbose-only `check.diff` with compared file count; always-on `check.fail` when stale (includes diff count, no file bodies). Normal human summary and JSON stdout remain unchanged when `--check` is not set; `--check` takes precedence over `--json`.
6. Command and CLI tests cover fresh, stale, missing output, zero-match, flag parity (`--no-search`, `--emit-llms-txt`), stdout/stderr separation, and exit codes. No browser/e2e tests.
7. Full HARNESS §0.2 quality gate passes with ≥90% coverage on touched modules.

## Tasks / Subtasks

- [x] Add wiki output comparison helper (AC: 1–2)
  - [x] Create `src/output/compare.ts` to recursively compare expected vs actual wiki trees (missing, extra, changed files).
  - [x] Export a typed result with `fresh`, `diffCount`, and path lists for logging.
- [x] Wire `--check` through CLI and generate command (AC: 1–5)
  - [x] Extend `GenerateOptions` with `check?: boolean`; add Commander `--check` on `generate`.
  - [x] In check mode: generate to a temp directory, compare with resolved output, clean up temp; throw a typed stale error for exit 1.
  - [x] Emit `check.diff` (verbose) and `check.fail` (always on stale); preserve existing exit-code contracts for runtime errors.
- [x] Add red-green regression coverage (AC: 2–6)
  - [x] Command tests: fresh wiki passes; tampered/stale wiki fails; missing output fails when specs exist; zero-match fresh vs stale.
  - [x] CLI integration tests: exit 0/1, no writes on check, stderr events, flag parity.
- [x] Verify quality gate and docs (AC: 7)
  - [x] Run full §0.2 gate; manual demo path; update `IMPLEMENTATION.md` and README consumer CI snippet.

## Dev Notes

### Product and scope

- E10 S10.1 implements FR-024: consumer CI freshness without side effects. E11 (`--watch`) and E11 (`serve`) are out of scope.
- Precedent: Prettier `--check` — dry-run compare, exit 1 on drift, no writes to target.
- Persona B (tech lead) runs this in GitHub Actions to enforce wiki regeneration before merge.

### Current implementation intelligence

- `src/commands/generate.ts` owns the generate pipeline; reuse `discoverSpecs`, `parseSpecFile`, `buildWiki`, `writeWiki`, `writeHtmlWiki`, `writeLlmsTxt` unchanged.
- Check mode generates to `fs.mkdtemp` under the OS temp dir, compares trees, then deletes temp — never calls write helpers against the resolved `--output`.
- `resolveOutputWithinProject` and output-ignore discovery behaviour stay identical to normal generate.
- Exit 1 on stale via a dedicated error class marked with `cliErrorLogged` so `cli.ts` does not double-emit `cli.error`.
- `--check` suppresses human success summary and `--json` stdout; errors still use structured stderr logging.

### Architecture, security, and regression guardrails

- Module direction: `cli.ts → commands/generate.ts → output/compare.ts`; compare is filesystem-only, no network.
- Do not change frozen discovery patterns, slug behaviour, HTML layout, or generated asset content.
- Comparison uses project-relative paths in logs only; never log file bodies or secrets.
- Preserve path confinement on `--output`; check mode must not weaken S21.1 guards.

### Testing requirements

- TDD: failing test first, confirm failure, implement, refactor green.
- Mirror patterns in `tests/commands/generate.test.ts` and `tests/cli.test.ts`.
- Assert no modification timestamps / writes on target output during `--check` (stat before/after or spy write calls).

### References

- [Source: _bmad-output/planning-artifacts/discovery/prd/prd.md#FR-024]
- [Source: _bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E10]
- [Source: _bmad-output/planning-artifacts/discovery/POST-MVP-ROADMAP.md#Phase C]
- [Source: _bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md]
- [Source: HARNESS.md#0.2, #0.8, #0.9]
- [Source: src/commands/generate.ts]
- [Source: src/output/wiki.ts]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Story created 2026-07-19 from E10 epic, PRD FR-024, architecture spine, and current generate pipeline.
- Red: command/CLI tests failed until compare module and check wiring landed.
- Green: 580 tests pass; generate.ts 98.7%, compare.ts 94.87% coverage.

### Completion Notes List

- Added `src/output/compare.ts` for recursive wiki tree comparison (missing/extra/changed).
- Wired `--check` on generate: temp-dir generation, compare, no target writes; `WikiCheckFailedError` for exit 1 without duplicate `cli.error`.
- Logging: verbose `check.diff` with file/diff counts; always-on `check.fail` on stale.
- 13 new tests (5 compare unit, 6 command, 2 CLI); README CI snippet and IMPLEMENTATION.md updated.

### File List

- _bmad-output/implementation-artifacts/10-1-generate-check-ci-freshness.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/output/compare.ts
- src/commands/generate.ts
- src/types.ts
- src/cli.ts
- tests/output/compare.test.ts
- tests/commands/generate.test.ts
- tests/cli.test.ts
- README.md
- IMPLEMENTATION.md

### Change Log

- 2026-07-19 — Created E10 S10.1 implementation story with check-mode contract and test plan.
- 2026-07-19 — Implemented `generate --check` with compare module, tests, and README CI docs.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. -->

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis. -->
