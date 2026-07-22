# Parcel Path — Architecture Notes

Companion notes to the [technical research](./technical-research.md). Kept short
on purpose.

## Runtime shape

```text
CLI (commander)
  → parse: track --id <id>
  → CarrierAdapter.lookup(id)
  → formatTimeline(events)
  → print + exit code
```

## Adapter contract

```ts
interface TrackingEvent {
  at: string;
  status: string;
  location?: string;
  rawCode?: string;
}

interface CarrierAdapter {
  id: string;
  supports(id: string): boolean;
  lookup(id: string): Promise<TrackingEvent[]>;
}
```

v0 implements a demo adapter that loads `tests/fixtures/DEMO-1001.json`. A future
live carrier adapter should satisfy the same interface so `cli.ts` stays thin.

## Exit codes

| Code | Meaning                         |
| ---- | ------------------------------- |
| `0`  | Success                         |
| `1`  | Usage / validation (unknown id) |
| `2`  | Carrier / runtime failure       |

## Logging

Emit structured events on stderr when `--verbose`:

- `carrier.lookup`
- `format.timeline`
- `cli.error` (PII-redacted)
