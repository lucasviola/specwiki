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

| ID                              | Title | Status | Date |
| ------------------------------- | ----- | ------ | ---- |
| _No ADRs yet — see S25.2/S25.3_ |       |        |      |

## Template

Use [template.md](./template.md) when authoring a new ADR.

## Related

- [ARCHITECTURE-SPINE.md](../../_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md) — invariant architecture summary
