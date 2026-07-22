# Design — track-command

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

## Components

| Component                       | Responsibility                      |
| ------------------------------- | ----------------------------------- |
| `cli.ts`                        | Parse args, choose exit code, print |
| `CarrierAdapter`                | Resolve id → `TrackingEvent[]`      |
| `formatTimeline()`              | Status → plain-language next action |
| `tests/fixtures/DEMO-1001.json` | Offline happy-path payload          |

## Data model

| Type             | Fields                                  |
| ---------------- | --------------------------------------- |
| `TrackingEvent`  | `at`, `status`, `location?`, `rawCode?` |
| `CarrierAdapter` | `id`, `supports(id)`, `lookup(id)`      |

## Testing strategy

- Table-driven tests for status → next-action mapping (TRACK-02 / AC-05)
- Fixture `DEMO-1001` for offline happy path (TRACK-01 / AC-01)
- Mock adapter throw for exit `2` (TRACK-01 / AC-03)

## Risks

| Risk                    | Mitigation                                     |
| ----------------------- | ---------------------------------------------- |
| Carrier field ambiguity | Add fixture + failing test before guessing     |
| PII in error paths      | `review-pii-redaction` skill before PR; AD-003 |
