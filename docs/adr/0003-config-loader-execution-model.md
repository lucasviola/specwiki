# ADR-0003: Config loader execution model

## Status

accepted

## Date

2026-07-18

## Context

POST-MVP story E8 S8.2 added project-level discovery configuration so brownfield repos can extend patterns without CLI flags every run. Config files live at the project root as `specwiki.config.json` or `specwiki.config.js`.

Two formats imply different trust models:

- **JSON** is parsed as data — no code execution.
- **JavaScript** is loaded via dynamic `import()` — arbitrary Node.js runs with the invoking user's privileges.

The README security section warns about `.js` config; this ADR records the architectural boundary for maintainers and aligns with future E21 S21.4 trust warnings.

## Decision

1. **Supported config files** (first match wins, fixed order in `CONFIG_CANDIDATES`):
   - `specwiki.config.js` — checked before JSON when both exist in loader loop; **executes code**
   - `specwiki.config.json` — parsed with `JSON.parse`; **data only**
2. **Effective pattern precedence** (`resolveEffectivePatterns`):
   1. CLI `--patterns` (replaces defaults entirely when provided)
   2. Environment variable `SPECWIKI_PATTERNS` (comma-separated globs)
   3. Project config file (`patterns` array, optional — empty object falls back to defaults)
   4. Built-in `DEFAULT_SPEC_PATTERNS` (extend-only per AD-2)
3. **Config schema:** plain object export; optional `patterns: string[]` validated by `validatePatternList`. Invalid shape throws `ConfigError`.
4. **Path confinement:** config file must resolve under project root via `realpath` (inline check in loader — see ADR-0001 debt note).
5. **Trust boundary:** Treat `specwiki.config.js` as **trusted code**, same class as running a local npm script. Prefer `specwiki.config.json` in untrusted or third-party repos. Specwiki does not sandbox config execution.
6. **`init` command:** scaffolds `specwiki.config.json` only; never writes `.js` automatically.

## Consequences

### Positive

- JSON path gives a safe default for teams that only need static glob lists
- JS path supports programmatic patterns without a separate plugin system
- Precedence chain is deterministic and test-covered (`tests/config/loader.test.ts`)

### Negative

- `.js` config is an RCE surface if an attacker can commit to the repo
- Dual format increases documentation and support burden

### Neutral

- Config errors map to exit code 2 via `cli.ts` (`config.error` + `cli.error`)
- Full security guidance stays in README — link, do not duplicate

## References

- [Source: src/config/loader.ts]
- [Source: src/config/patterns.ts — `DEFAULT_SPEC_PATTERNS`, `validatePatternList`]
- [Source: src/cli.ts — `resolveCommandPatterns`, exit 2 on `ConfigError`]
- [Source: src/commands/init.ts — JSON scaffold only]
- [Source: README.md — Security section (`specwiki.config.js` warning)]
- [Source: ARCHITECTURE-SPINE.md — AD-2]
- Related: ADR-0001 (config path confinement debt)
