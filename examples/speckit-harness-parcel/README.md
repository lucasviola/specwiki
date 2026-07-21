# Parcel Path (Spec Kit mock)

A pretend CLI that answers: **“Where is my package, and what should I do next?”**

This folder is a **[GitHub Spec Kit](https://github.com/github/spec-kit)** mock — the same Parcel Path product as [`../agent-harness-parcel/`](../agent-harness-parcel/), but structured with Spec Kit constitution + feature artifacts instead of a root agent harness:

| Path                               | Role                                 |
| ---------------------------------- | ------------------------------------ |
| `.specify/memory/constitution.md`  | Project principles agents must honor |
| `specs/001-track-command/spec.md`  | Feature specification                |
| `specs/001-track-command/plan.md`  | Technical plan                       |
| `specs/001-track-command/tasks.md` | Dependency-ordered tasks             |

Generate a wiki from this Spec Kit tree:

```bash
npx @lucasviola/specwiki generate --project examples/speckit-harness-parcel
npx @lucasviola/specwiki open --project examples/speckit-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
.specify/memory/        # Spec Kit constitution
specs/001-track-command/
custom-skills/          # example agent skills for day-to-day tasks
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
