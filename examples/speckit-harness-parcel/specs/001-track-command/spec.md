# Feature Spec — Track command

**Feature:** `001-track-command`  
**Status:** Specified  
**Product:** Parcel Path (mock)

## Problem

Users paste a carrier tracking id and need a clear answer: where the package is
now, and what they should do next — without reading raw carrier status codes.

## Goals

- Accept `parcel-path track --id <id>` from the CLI
- Resolve the carrier via a small adapter registry
- Print a timeline plus one plain-language next action
- Work offline against the `DEMO-1001` fixture

## Non-goals

- Multi-package batch tracking
- Push notifications
- Account login with carriers

## User stories

1. As a shopper, I track `DEMO-1001` locally and see “Out for delivery — wait for
   the courier today” instead of a cryptic status enum.
2. As a developer, I add a failing fixture first when a carrier field is unclear.

## Acceptance criteria

- [ ] Unknown ids exit `1` with usage-safe guidance (no stack traces to stdout)
- [ ] Carrier/runtime failures exit `2`
- [ ] Happy-path and one failure-path unit tests pass with no network
- [ ] README documents the `track --id` flag
