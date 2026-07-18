# ADR-0007: CLI dual-audience contract

## Status

accepted

## Date

2026-07-18

## Context

Specwiki serves two audiences from the same binary:

1. **Interactive users** — human-readable summaries, colors, tips (e.g. zero-spec discovery hint)
2. **Automation** — machine-readable `--json` on `generate` and `list`, plus scriptable exit codes

Mixing structured logs with user output breaks piping and CI parsers. The spine (AD-9) defines structured logging; E6 S6.2 wired explicit exit code 2 for usage errors.

## Decision

1. **stdout (human + JSON consumers):**
   - Success summaries, chalk-colored messages, zero-spec tips
   - `--json` results: single JSON object per invocation via `console.log(JSON.stringify(result))` in `commands/generate.ts`
   - No structured log lines on stdout
2. **stderr (operators + verbose diagnostics):**
   - All `log.info` and `log.error` events from `src/core/Logger.ts` — JSON lines with `event`, `level`, and payload
   - `log.info` is verbose-gated; `log.error` always emits
   - Payloads contain paths and counts, not full file bodies (AD-9)
3. **Exit codes:**
   | Code | Meaning            | Examples                                                                       |
   | ---- | ------------------ | ------------------------------------------------------------------------------ |
   | 0    | Success            | Wiki generated, list printed, config scaffolded                                |
   | 1    | Runtime failure    | I/O error, parse failure, path escape, browser spawn failure                   |
   | 2    | Usage / validation | Unknown option, invalid `--patterns`, config parse error, init usage conflicts |
   - Commander usage errors: `program.exitOverride()` + `USAGE_ERROR_CODES` set in `cli.ts` → exit 2 with `cli.error`
   - `init` may attach custom exit codes via `getInitExitCode` (usage cases → 2)
4. **`--json` stability:**
   - **`list`:** `{ categories: [{ name, files: [{ relativePath, title, category }] }] }` sorted by category name
   - **`generate`:** `{ specCount, outputDir, pages: [{ slug, title, category, sourcePath, description }] }`
   - Field additions allowed; renames or removals require semver major or documented breaking change in release notes
   - `--json` on `generate` still writes wiki files; JSON reports metadata only (not page bodies)
5. **Commands without `--json` today:** `init`, `open` — human stdout only; failures follow exit table above

## Consequences

### Positive

- `specwiki list --json | jq` works without log noise on stderr (unless `--verbose`)
- CI can distinguish mis-invocation (2) from project failures (1)
- Consistent event names for log aggregation (`cli.command`, `cli.error`, `config.error`, etc.)

### Negative

- Users must know stderr carries diagnostics when debugging with `--verbose`
- JSON schema is implicit — no JSON Schema file shipped yet

### Neutral

- Quality gate (AD-10) remains separate from CLI contract — tests in `tests/cli.test.ts`
- Structured log format is JSON-per-line, not OpenTelemetry

## References

- [Source: src/cli.ts — exit override, command handlers]
- [Source: src/core/Logger.ts — stderr JSON lines]
- [Source: src/commands/generate.ts — `printJsonResult`, result shapes]
- [Source: src/types.ts — `JsonListResult`, `JsonGenerateResult`]
- [Source: IMPLEMENTATION.md — exit code table]
- [Source: ARCHITECTURE-SPINE.md — AD-9, AD-10]
