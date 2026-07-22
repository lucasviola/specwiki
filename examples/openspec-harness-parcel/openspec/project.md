# Parcel Path — OpenSpec project context

Project conventions for AI assistants working under `openspec/`.

## Product

Parcel Path is a TypeScript CLI that answers: where is my package, and what
should I do next? Users paste a carrier tracking id; the CLI prints a timeline
plus one plain-language next action.

## Stack

- TypeScript CLI, Vitest for unit tests
- Exit codes: `0` success, `1` usage/validation, `2` carrier/runtime failure
- Naming: `CarrierAdapter`, `TrackingEvent`, `formatTimeline()`

## Non-negotiables

1. **One vertical slice at a time** — parse input → call a carrier adapter →
   print a plain-language next action.
2. **No network in unit tests** — mock carrier clients; ship offline fixtures.
3. **Never log PII** — redact tracking tokens and full addresses in errors and
   verbose logs.
4. **Tiny, testable diffs** — prefer short commit-sized changes over drive-by
   refactors.

## Non-goals (v0)

- Database-backed history
- Scraping carrier HTML
- Label printing or full shipping ops

## Public demo fixture

Offline fixture id: `DEMO-1001` under `tests/fixtures/`.
