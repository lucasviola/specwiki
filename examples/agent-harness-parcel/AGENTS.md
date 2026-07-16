# Agent Instructions — Parcel Path

You are working in a small TypeScript CLI. Prefer tiny, testable changes.

## Setup

```bash
npm install
npm test
npm run typecheck
```

## Commands to know

| Command                          | Purpose             |
| -------------------------------- | ------------------- |
| `npm test`                       | Unit tests (Vitest) |
| `npm run dev -- track --id <id>` | Local CLI entry     |
| `npm run build`                  | Emit `dist/`        |

## Coding rules

1. **One vertical slice at a time** — parse input → call carrier adapter → print result.
2. **No network in unit tests** — mock carrier clients.
3. **Never log tracking tokens or full addresses** — redact PII in errors and verbose logs.
4. Match existing naming: `CarrierAdapter`, `TrackingEvent`, `formatTimeline()`.

## Definition of done

- Tests cover the happy path and one failure path
- `README.md` mentions any new user-facing flag
- Exit codes: `0` success, `1` usage/validation, `2` carrier/runtime failure
