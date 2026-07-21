# Claude notes — Parcel Path

Project-specific guidance for Claude Code / Claude-based agents working from the
Spec Kit tree (`.specify/` + `specs/`).

## Prefer

- Extending `src/carriers/types.ts` before inventing new abstractions
- Table-driven tests for status → next-action mapping
- Short commit-sized diffs; leave drive-by refactors alone
- Honoring `.specify/memory/constitution.md` over ad-hoc style choices

## Avoid

- Adding a database in v0 — responses are ephemeral API views
- Scraping carrier HTML; use documented APIs or fixtures only
- Expanding scope into full shipping / label printing

## Useful context

- Public demo fixture id: `DEMO-1001` (offline fixture in `tests/fixtures/`)
- “Next action” copy should be plain language (“Wait for out-for-delivery” not raw status codes)
- When unsure about a carrier field, add a fixture and a failing test first
- Active Spec Kit feature: `specs/001-track-command/`

## Session checklist

1. Read `.specify/memory/constitution.md` and the active feature under `specs/`
2. Run `npm test` before editing
3. After changes, re-run the tests you touched
