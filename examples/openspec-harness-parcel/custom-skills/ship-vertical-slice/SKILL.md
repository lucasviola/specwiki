---
name: ship-vertical-slice
description: >-
  Deliver one vertical feature slice in Parcel Path (parse → adapter → formatted
  output). Use when implementing a new command flag, output format, or carrier path.
---

# Ship vertical slice

Ship one thin end-to-end path before polishing edge cases or refactoring.

## Slice template

```text
Input (CLI args)
  → validate / parse
  → carrier adapter (fixture or client)
  → domain types (TrackingEvent[])
  → formatTimeline() + next-action copy
  → stdout + exit code
```

## Workflow

1. **Write the test first** — one happy-path integration test from argv to expected stdout.
2. **Implement the narrowest path** — skip flags you do not need yet.
3. **Add one failure test** — bad id, unknown carrier, or adapter throw.
4. **Document user-facing changes** — README flag table + example command.
5. **Run the session checklist** from `CLAUDE.md`:
   - `npm test` before and after
   - Re-run only the tests you touched if iterating

## Scope guardrails

- Do not add a database, web UI, or label printing in the same slice.
- Do not refactor unrelated carriers — leave drive-by cleanups for a separate PR.
- Keep diffs commit-sized; if the slice spans more than ~3 files, split it.

## Exit codes (do not change casually)

| Code | Meaning                                     |
| ---- | ------------------------------------------- |
| `0`  | Success                                     |
| `1`  | Usage / validation (bad args, unknown flag) |
| `2`  | Carrier or runtime failure                  |

## Done when

- Happy + one failure path covered
- README updated for anything users type differently
- Verbose output still PII-safe (run `/review-pii-redaction` if you added logging)
