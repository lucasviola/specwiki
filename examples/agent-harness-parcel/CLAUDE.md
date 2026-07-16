# Claude notes — Parcel Path

Project-specific guidance for Claude Code / Claude-based agents.

## Prefer

- Extending `src/carriers/types.ts` before inventing new abstractions
- Table-driven tests for status → next-action mapping
- Short commit-sized diffs; leave drive-by refactors alone

## Avoid

- Adding a database in v0 — responses are ephemeral API views
- Scraping carrier HTML; use documented APIs or fixtures only
- Expanding scope into full shipping / label printing

## Useful context

- Public demo fixture id: `DEMO-1001` (offline fixture in `tests/fixtures/`)
- “Next action” copy should be plain language (“Wait for out-for-delivery” not raw status codes)
- When unsure about a carrier field, add a fixture and a failing test first

## Session checklist

1. Read `AGENTS.md`
2. Run `npm test` before editing
3. After changes, re-run the tests you touched
