# Change: add-track-command

**Status:** Proposed  
**Product:** Parcel Path (mock)

## Why

Users paste a carrier tracking id and need a clear answer: where the package is
now, and what they should do next — without reading raw carrier status codes.

## What changes

- Add `parcel-path track --id <id>`
- Resolve the carrier via a small adapter registry
- Print a timeline plus one plain-language next action
- Work offline against the `DEMO-1001` fixture

## Impact

| Area                      | Effect                                           |
| ------------------------- | ------------------------------------------------ |
| `openspec/specs/cli`      | Track subcommand becomes valid                   |
| New capability `tracking` | Living specs for timeline + next-action behavior |
| Tests                     | Happy path + one failure path, no network        |

## Out of scope

- Multi-package batch tracking
- Push notifications
- Account login with carriers
