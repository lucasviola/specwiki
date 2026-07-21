# Parcel Path Constitution

Non-negotiable principles for the Parcel Path CLI. Spec Kit agents must honor
these when writing specs, plans, tasks, and code.

## Core principles

1. **One vertical slice at a time** — parse input → call a carrier adapter →
   print a plain-language next action.
2. **No network in unit tests** — mock carrier clients; ship offline fixtures.
3. **Never log PII** — redact tracking tokens and full addresses in errors and
   verbose logs.
4. **Tiny, testable diffs** — prefer short commit-sized changes over drive-by
   refactors.

## Stack defaults

- TypeScript CLI, Vitest for unit tests
- Exit codes: `0` success, `1` usage/validation, `2` carrier/runtime failure
- Naming: `CarrierAdapter`, `TrackingEvent`, `formatTimeline()`

## Non-goals (v0)

- Database-backed history
- Scraping carrier HTML
- Label printing or full shipping ops
