---
baseline_commit: a52ff64
---

# Story 21.1: Generate Output Confined to Project Root

Status: done

## Story

As an npm user running `specwiki generate`,
I want `--output` to stay within `--project` (matching `specwiki open`),
so that a malicious or mistaken output path cannot write wiki files outside my repository.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `specwiki generate --project . --output ../outside` — exits non-zero with `output.error` and `cli.error`; no files written outside project.

**Binds:** HARNESS §0.9 | **Epic:** E21 | **Finding:** SEC-1

## Acceptance Criteria

### Functional

1. `generate` resolves `--output` relative to `--project` and rejects paths that escape the project root (same semantics as `open`).
2. Symlinked output directories that resolve outside the project are rejected.
3. Slug-level `assertPathConfined` guards remain unchanged for writes within the resolved output dir.

### Logging & diagnostics (§0.8)

4. `output.error` emitted with actionable message when output escapes project (always).
5. `cli.error` with `command: "generate"` on rejection (always).

### Quality measures

6. Unit tests in `tests/commands/generate.test.ts` for `..` escape and symlink escape.
7. CLI integration test in `tests/cli.test.ts` for generate `--output ../outside`.
8. Shared helper `src/core/paths.ts` with tests in `tests/core/paths.test.ts`.
9. Full HARNESS §0.2 gate passes.

## Completion notes

- Implemented in commit `a52ff64`: `resolveOutputWithinProject`, `generate` + `open` parity, regression tests.
