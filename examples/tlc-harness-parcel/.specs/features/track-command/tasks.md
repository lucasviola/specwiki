# Tasks — track-command

Atomic tasks with verification. One commit per task when Execute runs.

## T1 — Types

**Depends on:** —  
**Requirement:** TRACK-01  
**Do:** Add `src/carriers/types.ts` with `TrackingEvent` and `CarrierAdapter`.  
**Verify:** `npm run typecheck` passes; types exported for adapters.

## T2 — CLI parse

**Depends on:** T1  
**Requirement:** TRACK-01  
**Do:** Wire `src/cli.ts` argument parsing for `track --id`.  
**Verify:** Unknown subcommands still exit non-zero; `--help` mentions `track`.

## T3 — Offline fixture

**Depends on:** —  
**Requirement:** TRACK-02  
**Do:** Add `tests/fixtures/DEMO-1001.json` with a short out-for-delivery timeline.  
**Verify:** Fixture parses as JSON; ids/status fields match design model.

## T4 — Mock adapter

**Depends on:** T1, T3  
**Requirement:** TRACK-01  
**Do:** Implement demo `CarrierAdapter` that loads the fixture.  
**Verify:** Unit test loads fixture with no network.

## T5 — Format timeline

**Depends on:** T1  
**Requirement:** TRACK-01, TRACK-02  
**Do:** Implement `formatTimeline()` with table-driven next-action mapping.  
**Verify:** Table tests cover happy-path next-action copy (AC-01, AC-05).

## T6 — Happy path wiring

**Depends on:** T2, T4, T5  
**Requirement:** TRACK-01  
**Do:** Connect parse → lookup → format → print; exit `0` on success.  
**Verify:** `parcel-path track --id DEMO-1001` exits `0` (or equivalent unit test).

## T7 — Failure paths

**Depends on:** T6  
**Requirement:** TRACK-01  
**Do:** Unknown id → exit `1`; adapter throw → exit `2`; redact PII in errors.  
**Verify:** Unit tests for AC-02 and AC-03.

## T8 — Docs

**Depends on:** T6  
**Requirement:** TRACK-03  
**Do:** Document `track --id` and `DEMO-1001` in `README.md`.  
**Verify:** README contains both strings (AC-06).
