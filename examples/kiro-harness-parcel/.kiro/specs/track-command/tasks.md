# Tasks — Track command

Dependency-ordered implementation checklist from the Kiro design.

## Phase 1 — Skeleton

- [ ] 1. Add `src/carriers/types.ts` with `TrackingEvent` and `CarrierAdapter`
- [ ] 2. Wire `src/cli.ts` argument parsing for `track --id`
- [ ] 3. Add offline fixture `tests/fixtures/DEMO-1001.json`

## Phase 2 — Happy path

- [ ] 4. Implement mock carrier adapter that loads the fixture
- [ ] 5. Implement `formatTimeline()` with plain-language next actions
- [ ] 6. Unit test happy path (no network)

## Phase 3 — Failure paths

- [ ] 7. Unknown id → exit `1`
- [ ] 8. Adapter throw → exit `2`
- [ ] 9. Unit test one failure path; confirm logs redact tokens/addresses

## Phase 4 — Docs

- [ ] 10. Document `track --id` in `README.md`
- [ ] 11. Run `npm test` and `npm run typecheck`
