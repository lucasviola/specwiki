# Parcel Path (mock)

A pretend CLI that answers: **“Where is my package, and what should I do next?”**

This folder is a minimal **agent harness** — the three root files many AI tools read first:

| File        | Role                              |
| ----------- | --------------------------------- |
| `README.md` | Human onboarding                  |
| `AGENTS.md` | Vendor-neutral agent instructions |
| `CLAUDE.md` | Claude-oriented project notes     |

Generate a wiki from this harness:

```bash
npx @lucasviola/specwiki generate --project examples/agent-harness-parcel
npx @lucasviola/specwiki open --project examples/agent-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
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
