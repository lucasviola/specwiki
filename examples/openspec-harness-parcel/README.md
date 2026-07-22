# Parcel Path (OpenSpec mock)

A pretend CLI that answers: **“Where is my package, and what should I do next?”**

This folder is an **[OpenSpec](https://openspec.dev/)** mock — the same Parcel Path product as [`../agent-harness-parcel/`](../agent-harness-parcel/), but structured with living specs + a delta change instead of a root agent harness:

| Path                                  | Role                                                |
| ------------------------------------- | --------------------------------------------------- |
| `openspec/project.md`                 | Project conventions agents must honor               |
| `openspec/specs/cli/spec.md`          | Current truth — minimal CLI capability              |
| `openspec/changes/add-track-command/` | Active change: proposal, design, tasks, delta specs |

Generate a wiki from this OpenSpec tree:

```bash
npx @lucasviola/specwiki generate --project examples/openspec-harness-parcel
npx @lucasviola/specwiki open --project examples/openspec-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
openspec/
  project.md
  specs/cli/                  # living capability specs
  changes/add-track-command/  # proposal + design + tasks + deltas
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
