---
name: add-carrier-adapter
description: >-
  Add or extend a shipping carrier adapter for Parcel Path. Use when integrating
  a new carrier, adding status mapping, or wiring a CarrierAdapter implementation.
---

# Add carrier adapter

Extend Parcel Path with a new carrier without breaking existing adapters.

## Before you start

1. Read `openspec/project.md` — one vertical slice at a time.
2. Run `npm test` to confirm a green baseline.
3. Check whether the carrier has a documented API or you must use fixtures only (v0: fixtures preferred).

## Steps

1. **Define types** — extend `src/carriers/types.ts` if the carrier exposes fields other adapters do not share (prefer reusing `TrackingEvent` and `CarrierAdapter`).
2. **Create the adapter** — add `src/carriers/<carrier-id>.ts` implementing `CarrierAdapter`:
   - `fetchTracking(id: string): Promise<TrackingEvent[]>`
   - Map raw carrier statuses to internal enums before formatting.
3. **Register the adapter** — wire it in the CLI carrier registry (follow the pattern used by existing adapters).
4. **Add fixtures** — put offline JSON under `tests/fixtures/<carrier-id>/` for unit tests; never hit the network in tests.
5. **Table-driven status tests** — one test row per carrier status → expected next-action copy.
6. **Update README** — document the carrier id flag and any carrier-specific options.

## Naming conventions

- File: `src/carriers/<kebab-case-id>.ts`
- Export: `create<CamelCase>Adapter()` factory
- Fixture id for demos: `DEMO-<carrier>-1001`

## Definition of done

- Happy path + one failure path tested with mocks/fixtures
- No PII in logs (tracking tokens and addresses redacted)
- Exit codes unchanged: `0` success, `1` validation, `2` carrier/runtime failure
