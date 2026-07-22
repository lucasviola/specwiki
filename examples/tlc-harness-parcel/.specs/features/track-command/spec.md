# Feature Spec — track-command

**Feature:** `track-command`  
**Status:** Specified  
**Product:** Parcel Path (mock)  
**Scope:** Large (multi-file CLI slice + tests)

## Summary

Users paste a carrier tracking id and need a clear answer: where the package is
now, and what they should do next — without reading raw carrier status codes.

## Requirements

### TRACK-01 — Track by id

The system SHALL accept `parcel-path track --id <id>` and print a timeline of
normalized tracking events plus one plain-language next action.

**Acceptance criteria**

- AC-01: Given fixture `DEMO-1001`, when the user runs
  `parcel-path track --id DEMO-1001`, then the CLI exits `0` and prints a
  timeline ending in an out-for-delivery style status with a next action such as
  “Wait for the courier today”.
- AC-02: Given an unknown id, when the user runs `track --id`, then the CLI
  exits `1` with usage-safe guidance and does not print a stack trace to stdout.
- AC-03: Given a carrier adapter throw, when lookup fails, then the CLI exits
  `2` and does not leak PII in error output.

### TRACK-02 — Offline unit tests

The system SHALL provide happy-path and failure-path unit tests that run with no
network access.

**Acceptance criteria**

- AC-04: Given `npm test` in CI, then tracking tests use
  `tests/fixtures/DEMO-1001.json` (or mocks) and do not call external carrier
  APIs.
- AC-05: Given the status → next-action table, then unit tests cover at least
  one happy-path row and one failure-path row.

### TRACK-03 — Documented flag

The project README SHALL document the `track --id` flag.

**Acceptance criteria**

- AC-06: Given a contributor opens `README.md`, then the docs describe
  `track --id` and mention the `DEMO-1001` fixture.

## Non-goals

- Multi-package batch tracking
- Push notifications
- Carrier account login
- HTML scraping of carrier sites
