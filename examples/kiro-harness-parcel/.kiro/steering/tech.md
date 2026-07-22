# Tech — Parcel Path

## Stack

- TypeScript CLI
- Vitest for unit tests
- No database in v0 — responses are ephemeral API views

## Exit codes

| Code | Meaning                   |
| ---- | ------------------------- |
| `0`  | Success                   |
| `1`  | Usage / validation error  |
| `2`  | Carrier / runtime failure |

## Non-negotiables

1. No network in unit tests — mock carrier clients; ship offline fixtures.
2. Never log PII — redact tracking tokens and full addresses in errors and
   verbose logs.
3. Prefer table-driven tests for status → next-action mapping.
4. Prefer short commit-sized diffs; leave drive-by refactors alone.

## Naming

- `CarrierAdapter`, `TrackingEvent`, `formatTimeline()`
