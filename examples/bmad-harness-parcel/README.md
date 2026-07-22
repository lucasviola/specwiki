# Parcel Path (BMAD mock)

A pretend CLI that answers: **“Where is my package, and what should I do next?”**

This folder is a **[BMAD](https://github.com/bmad-code-org/BMAD-METHOD)** mock — the same Parcel Path product as [`../agent-harness-parcel/`](../agent-harness-parcel/), but structured as BMAD planning + implementation output under `_bmad-output/`:

| Path                                                         | Role                                    |
| ------------------------------------------------------------ | --------------------------------------- |
| `_bmad-output/planning-artifacts/discovery/product-brief.md` | Product framing                         |
| `_bmad-output/planning-artifacts/discovery/research/`        | Technical research + architecture notes |
| `_bmad-output/implementation-artifacts/1-1-track-command.md` | Implementation story for `track`        |

Generate a wiki from this BMAD tree:

```bash
npx @lucasviola/specwiki generate --project examples/bmad-harness-parcel
npx @lucasviola/specwiki open --project examples/bmad-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
_bmad-output/
  planning-artifacts/discovery/
    product-brief.md
    research/
  implementation-artifacts/
    1-1-track-command.md
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
