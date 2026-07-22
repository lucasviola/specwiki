# Parcel Path (Kiro mock)

A pretend CLI that answers: **“Where is my package, and what should I do next?”**

This folder is an **[AWS Kiro](https://kiro.dev/)** mock — the same Parcel Path product as [`../agent-harness-parcel/`](../agent-harness-parcel/), but structured with Kiro steering + a three-file feature spec:

| Path                          | Role                                        |
| ----------------------------- | ------------------------------------------- |
| `.kiro/steering/product.md`   | Product purpose agents always see           |
| `.kiro/steering/tech.md`      | Stack and engineering constraints           |
| `.kiro/steering/structure.md` | Folder and naming conventions               |
| `.kiro/specs/track-command/`  | Feature spec: requirements → design → tasks |

Generate a wiki from this Kiro tree:

```bash
npx @lucasviola/specwiki generate --project examples/kiro-harness-parcel
npx @lucasviola/specwiki open --project examples/kiro-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
.kiro/
  steering/                 # persistent project context
  specs/track-command/      # requirements.md + design.md + tasks.md
custom-skills/              # example agent skills for day-to-day tasks
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
