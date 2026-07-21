# Tasks — Track command

Dependency-ordered implementation checklist from the Spec Kit plan.

## Phase 1 — Skeleton

- [ ] T1. Add `src/carriers/types.ts` with `TrackingEvent` and `CarrierAdapter`
- [ ] T2. Wire `src/cli.ts` argument parsing for `track --id`
- [ ] T3. Add offline fixture `tests/fixtures/DEMO-1001.json`

## Phase 2 — Happy path

- [ ] T4. Implement mock carrier adapter that loads the fixture
- [ ] T5. Implement `formatTimeline()` with plain-language next actions
- [ ] T6. Unit test happy path (no network)

## Phase 3 — Failure paths

- [ ] T7. Unknown id → exit `1`
- [ ] T8. Adapter throw → exit `2`
- [ ] T9. Unit test one failure path; confirm logs redact tokens/addresses

## Phase 4 — Docs

- [ ] T10. Document `track --id` in `README.md`
- [ ] T11. Run `npm test` and `npm run typecheck`
