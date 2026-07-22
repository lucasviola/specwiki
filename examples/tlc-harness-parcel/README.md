# Parcel Path (tlc-spec-driven mock)

A pretend CLI that answers: **“Where is my package, and what should I do next?”**

This folder is a **[tlc-spec-driven](https://github.com/tech-leads-club/agent-skills)** mock — the same Parcel Path product as [`../agent-harness-parcel/`](../agent-harness-parcel/), but structured with Tech Lead's Club `.specs/` project memory + a feature under Specify → Design → Tasks:

| Path                                       | Role                                   |
| ------------------------------------------ | -------------------------------------- |
| `.specs/STATE.md`                          | Persistent memory: decisions + handoff |
| `.specs/features/track-command/spec.md`    | Requirements with traceable IDs        |
| `.specs/features/track-command/context.md` | Gray-area decisions from discuss       |
| `.specs/features/track-command/design.md`  | Architecture and components            |
| `.specs/features/track-command/tasks.md`   | Atomic tasks with verification         |

Generate a wiki from this tlc-spec-driven tree:

```bash
npx @lucasviola/specwiki generate --project examples/tlc-harness-parcel
npx @lucasviola/specwiki open --project examples/tlc-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
.specs/
  STATE.md
  features/track-command/
    spec.md
    context.md
    design.md
    tasks.md
custom-skills/                # example agent skills for day-to-day tasks
  add-carrier-adapter/
  track-package-locally/
  write-tracking-fixture/
  review-pii-redaction/
  ship-vertical-slice/
src/
  cli.ts
  carriers/
  format.ts
tests/
```

See [`custom-skills/README.md`](./custom-skills/README.md) for how to use or copy them into `.cursor/skills/`.
