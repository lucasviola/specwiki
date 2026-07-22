# Tasks — add-track-command

Implementation checklist for the OpenSpec change.

## Phase 1 — Skeleton

- [ ] 1.1 Add `src/carriers/types.ts` with `TrackingEvent` and `CarrierAdapter`
- [ ] 1.2 Wire `src/cli.ts` argument parsing for `track --id`
- [ ] 1.3 Add offline fixture `tests/fixtures/DEMO-1001.json`

## Phase 2 — Happy path

- [ ] 2.1 Implement mock carrier adapter that loads the fixture
- [ ] 2.2 Implement `formatTimeline()` with plain-language next actions
- [ ] 2.3 Unit test happy path (no network)

## Phase 3 — Failure paths

- [ ] 3.1 Unknown id → exit `1`
- [ ] 3.2 Adapter throw → exit `2`
- [ ] 3.3 Unit test one failure path; confirm logs redact tokens/addresses

## Phase 4 — Docs + archive prep

- [ ] 4.1 Document `track --id` in `README.md`
- [ ] 4.2 Run `npm test` and `npm run typecheck`
- [ ] 4.3 Archive change (merge deltas into `openspec/specs/`)
