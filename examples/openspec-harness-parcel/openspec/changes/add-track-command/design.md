# Design — add-track-command

## Approach

Keep v0 as an ephemeral API-view CLI: no database. Carrier adapters return
normalized `TrackingEvent[]`; `formatTimeline()` maps status → next-action copy.

## Architecture

```text
cli.ts
  → parse track --id
  → CarrierAdapter.lookup(id)
  → formatTimeline(events)
  → print + exit code
```

## Data model (sketch)

| Type             | Fields                                  |
| ---------------- | --------------------------------------- |
| `TrackingEvent`  | `at`, `status`, `location?`, `rawCode?` |
| `CarrierAdapter` | `id`, `supports(id)`, `lookup(id)`      |

## Testing strategy

- Table-driven tests for status → next-action mapping
- Fixture `tests/fixtures/DEMO-1001.json` for offline happy path
- Mock adapter for carrier failure (`exit 2`)

## Risks

| Risk                    | Mitigation                                 |
| ----------------------- | ------------------------------------------ |
| Carrier field ambiguity | Add fixture + failing test before guessing |
| PII in error paths      | `review-pii-redaction` skill before PR     |
