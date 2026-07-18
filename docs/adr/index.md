# Architecture Decision Records

Architecture Decision Records (ADRs) are the durable engineering record for specwiki. Each ADR captures one architectural choice with its rationale, alternatives considered, and consequences.

## Status lifecycle

`proposed → accepted → deprecated → superseded by ADR-NNNN`

- **proposed** — under discussion; not yet team-agreed
- **accepted** — active decision the codebase and docs should follow
- **deprecated** — no longer recommended; may still exist in older code
- **superseded by ADR-NNNN** — replaced by a newer ADR; link to the successor

## Authoring norms

- **Filename:** `NNNN-kebab-title.md` — 4-digit zero-padded ID, kebab-case slug; **never reuse IDs**
- **One decision per file** — do not bundle unrelated choices (e.g. HTML stack ≠ search index)
- **When to write an ADR:** when a choice needs rationale, alternatives, or consequences beyond a one-line spine update
- **When to update the spine:** for the invariant summary of what is true now; link to the ADR for full context (see S25.4 for supersession links)
- **Do not duplicate** full ADR text in the spine — the spine summarizes; ADRs explain

## Index

| ID   | Title                                                                                   | Status   | Date       |
| ---- | --------------------------------------------------------------------------------------- | -------- | ---------- |
| 0001 | [Path confinement and trust boundary model](./0001-path-confinement-trust-boundary.md)  | accepted | 2026-07-18 |
| 0003 | [Config loader execution model](./0003-config-loader-execution-model.md)                | accepted | 2026-07-18 |
| 0004 | [Static-file-only output; no bundled server](./0004-static-output-no-bundled-server.md) | accepted | 2026-07-18 |
| 0007 | [CLI dual-audience contract](./0007-cli-dual-audience-contract.md)                      | accepted | 2026-07-18 |
| 0009 | [Runtime dependency budget policy](./0009-runtime-dependency-budget.md)                 | accepted | 2026-07-18 |

### Summaries

- **0001** — `core/paths.ts` is the canonical gateway for path confinement; inline checks in config loader and init are consolidation debt.
- **0003** — JSON config is data-only; `.js` config executes via dynamic import; precedence CLI → env → file → defaults.
- **0004** — Wiki output is static files; `open` uses the OS browser; no bundled HTTP server in core (E11 must revisit).
- **0007** — stdout for humans/JSON, stderr for structured logs; exit 0/1/2 contract on all commands.
- **0009** — Nine runtime deps with ADR gate for additions; supersedes spine AD-11 five-package freeze.

## Template

Use [template.md](./template.md) when authoring a new ADR.

## Related

- [ARCHITECTURE-SPINE.md](../../_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md) — invariant architecture summary
