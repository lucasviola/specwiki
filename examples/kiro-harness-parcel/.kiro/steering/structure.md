# Structure — Parcel Path

## Planned layout

```text
.kiro/
  steering/                 # this folder
  specs/<feature>/          # requirements.md, design.md, tasks.md
custom-skills/              # optional Cursor skills
src/
  cli.ts
  carriers/
    types.ts
    <carrier-id>.ts
  format.ts
tests/
  fixtures/
```

## Conventions

- One feature spec folder per vertical slice under `.kiro/specs/`
- Carrier adapters live under `src/carriers/` and implement `CarrierAdapter`
- Offline fixtures live under `tests/fixtures/` and are named by tracking id or
  carrier id
- Active feature for the track command: `.kiro/specs/track-command/`
