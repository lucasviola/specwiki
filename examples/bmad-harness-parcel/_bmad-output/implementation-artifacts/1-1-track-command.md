# Story 1.1: Track command

**Status:** ready-for-dev  
**Epic:** E1 — Parcel Path CLI  
**Product:** Parcel Path (mock)

## User story

As a shopper, I track `DEMO-1001` locally so I see a plain-language next action
instead of a cryptic carrier status enum.

## Acceptance criteria

1. **Given** the offline fixture is present, **when** I run
   `parcel-path track --id DEMO-1001`, **then** the CLI prints a timeline plus one
   next-action line and exits `0`.
2. **Given** an unknown id, **when** I run `track --id`, **then** the CLI exits
   `1` with usage-safe guidance and no stack trace on stdout.
3. **Given** a carrier adapter throw, **when** lookup fails, **then** the CLI
   exits `2` without leaking PII in error output.
4. **Given** `npm test`, **when** CI runs, **then** happy-path and one
   failure-path unit tests pass with no network.

## Tasks

- [ ] Add `src/carriers/types.ts` with `TrackingEvent` and `CarrierAdapter`
- [ ] Wire `src/cli.ts` argument parsing for `track --id`
- [ ] Add offline fixture `tests/fixtures/DEMO-1001.json`
- [ ] Implement mock carrier adapter that loads the fixture
- [ ] Implement `formatTimeline()` with plain-language next actions
- [ ] Unit test happy path + one failure path
- [ ] Document `track --id` in `README.md`

## Dev notes

- Prefer table-driven tests for status → next-action mapping
- Honor planning research: fixtures first, no HTML scraping
- Useful skills: `write-tracking-fixture`, `review-pii-redaction`,
  `ship-vertical-slice`

## Demo path

```bash
npm test
npx parcel-path track --id DEMO-1001
```
