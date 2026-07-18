# ADR-0001: Path confinement and trust boundary model

## Status

accepted

## Date

2026-07-18

## Context

Specwiki reads markdown from a user-supplied `--project` root and writes a wiki under `--output` (resolved relative to that root). Without confinement checks, malicious or mistaken paths could escape the project directory via `..` segments or symlink targets — especially after E21 S21.1 hardened output to stay within the project root.

The spine (AD-7) requires all wiki writes to land under `path.resolve(projectRoot, outputDir)` and rejects traversal in slug-derived filenames. E5 added explicit guards; E21 made output confinement mandatory for `generate` and `open`.

Today, path safety logic is centralized in `src/core/paths.ts`, but not every module routes through it. Inline checks in `config/loader.ts` and `commands/init.ts` duplicate the relative-path pattern. Consolidating on `core/paths.ts` reduces drift and makes CI enforcement feasible (ADR-0013 candidate).

## Decision

1. **`src/core/paths.ts` is the canonical gateway** for “target must stay under root” checks in product code.
2. **Public API:**
   - `assertConfinedUnder(root, target, label)` — synchronous lexical check via `path.relative`
   - `assertRealpathConfinedUnder(root, target, label)` — resolves symlinks; treats `ENOENT` as pass (target may not exist yet)
   - `resolveOutputWithinProject(projectRoot, outputDir)` — resolves output dir and applies both checks
   - `PathEscapeError` — typed error with human-readable message for CLI mapping
3. **Mandatory use** for user-influenced paths:
   - Output directory resolution (`commands/generate.ts`)
   - Wiki index path before browser launch (`commands/open.ts`)
   - BMAD catalog reads under project root (`output/html/nav-grouping-catalog.ts`)
4. **Known debt (inline checks, not yet consolidated):**
   - `config/loader.ts` — `assertConfigPathWithinProject` uses inline `path.relative` + `realpath` (same semantics, different module)
   - `commands/init.ts` — `assertConfinedUnderProject` for scaffold write target
5. **New filesystem I/O** that crosses a trust boundary (user-supplied root + derived path) MUST use `core/paths.ts` wrappers or extend them — not ad-hoc `path.relative` copies.

## Consequences

### Positive

- Single module to audit for path traversal regressions
- Symlink escape covered by `assertRealpathConfinedUnder` where files exist on disk
- `PathEscapeError` gives consistent CLI error mapping in `generate` and `open`

### Negative

- Duplicated inline checks remain until refactored (loader, init)
- Lexical-only checks without `realpath` can miss symlink escapes if caller skips the async guard

### Neutral

- Tests live in `tests/core/paths.test.ts`; command-level tests assert escape rejection end-to-end
- Slug `..` normalization is handled separately in output layer (see AD-5 / ADR-0005 in S25.3)

## References

- [Source: src/core/paths.ts]
- [Source: src/commands/generate.ts — `resolveOutputWithinProject`]
- [Source: src/commands/open.ts — output + index confinement]
- [Source: src/output/html/nav-grouping-catalog.ts — catalog path reads]
- [Source: src/config/loader.ts — inline config path check (debt)]
- [Source: src/commands/init.ts — inline scaffold path check (debt)]
- [Source: ARCHITECTURE-SPINE.md — AD-7]
- Follow-up candidate: ADR-0013 — CI grep for raw `fs.*` outside approved wrappers
