# STATE — Parcel Path

Persistent memory across agent sessions (tlc-spec-driven).

## Decisions

### AD-001 — Fixture-backed adapters first

**Date:** 2026-07-22  
**Decision:** v0 carrier lookups use offline fixtures and mock `CarrierAdapter`s.  
**Why:** Deterministic CI, no API keys, agent-readable payloads.  
**Consequence:** Live carrier HTTP adapters are deferred until the CLI shape and
next-action copy stabilize.

### AD-002 — Exit code contract

**Date:** 2026-07-22  
**Decision:** `0` success, `1` usage/validation, `2` carrier/runtime failure.  
**Why:** Matches other Parcel Path harness examples and keeps scripts predictable.

### AD-003 — No PII in logs

**Date:** 2026-07-22  
**Decision:** Redact tracking tokens and full addresses in errors and `--verbose`
stderr events.  
**Why:** Tracking ids and locations are sensitive in shared terminals/CI logs.

## Handoff

**Active feature:** `track-command`  
**Phase:** Tasks complete — ready for Execute  
**Next step:** Implement T1 (`src/carriers/types.ts`) then run the task gate  
**Blockers:** None  
**Notes:** Public demo fixture id is `DEMO-1001`.
