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
npx specwiki generate --project examples/agent-harness-parcel
npx specwiki open --project examples/agent-harness-parcel
```

## Quick start (fictional)

```bash
npm install
npm test
npx parcel-path track --id DEMO-1001
```

## Project layout (planned)

```text
src/
  cli.ts
  carriers/
  format.ts
tests/
```
