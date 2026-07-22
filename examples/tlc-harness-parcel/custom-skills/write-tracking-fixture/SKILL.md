---
name: write-tracking-fixture
description: >-
  Create offline tracking fixtures for Parcel Path tests. Use when adding carrier
  samples, reproducing edge cases, or building table-driven status tests.
---

# Write tracking fixture

Add realistic offline tracking data so unit tests stay fast and deterministic.

## Fixture layout

```text
tests/fixtures/
  <carrier-id>/
    demo-1001.json          # happy path timeline
    delayed.json            # optional edge case
    unknown-status.json     # unmapped carrier status
```

## Authoring rules

1. **Minimal PII** — use fake names, truncated addresses, and synthetic tracking ids (`DEMO-*`).
2. **Chronological events** — oldest event first; match what the adapter returns after parsing.
3. **Include raw + normalized fields** when the adapter maps statuses (helps table-driven tests).
4. **One scenario per file** — do not overload a single fixture with unrelated cases.

## Example shape

```json
{
  "trackingId": "DEMO-1001",
  "carrier": "mock",
  "events": [
    {
      "timestamp": "2026-07-20T08:00:00Z",
      "status": "label_created",
      "location": "Portland, OR",
      "description": "Label created"
    },
    {
      "timestamp": "2026-07-21T14:30:00Z",
      "status": "out_for_delivery",
      "location": "Portland, OR",
      "description": "Out for delivery"
    }
  ]
}
```

## Wire into tests

1. Load fixture in the adapter test with `readFileSync` + `JSON.parse`.
2. Assert `formatTimeline()` output and next-action string.
3. Register the demo id in README if it is user-facing (`DEMO-1001`).

## When to add a new fixture

- New carrier status code appears in docs
- Bug report includes a timeline the adapter mishandles
- You need a failure path (empty events, malformed timestamp, unknown status)
