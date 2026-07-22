# Context — track-command

Gray-area decisions captured during Discuss (tlc-spec-driven).

## Q1 — Live APIs in v0?

**Decision:** No. Use offline fixtures and a mock adapter only (see AD-001).  
**Rationale:** Fast iteration on next-action copy; avoid keys/rate limits until
the vertical slice ships.

## Q2 — Machine-readable `--json` output?

**Decision:** Deferred. Human printing only in v0.  
**Rationale:** Keeps the first slice small; scripts can parse later if needed.

## Q3 — Unknown-id hint text

**Decision:** Exit `1` with short usage guidance; optionally mention
`DEMO-1001` as the offline demo id.  
**Rationale:** Helps first-time users without inventing a help subsystem.
