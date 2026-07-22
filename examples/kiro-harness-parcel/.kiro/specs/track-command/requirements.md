# Requirements — Track command

**Feature:** `track-command`  
**Status:** Specified  
**Product:** Parcel Path (mock)

## Introduction

Users paste a carrier tracking id and need a clear answer: where the package is
now, and what they should do next — without reading raw carrier status codes.

## Requirements

### Requirement 1: Track by id

**User story:** As a shopper, I track `DEMO-1001` locally and see “Out for
delivery — wait for the courier today” instead of a cryptic status enum.

#### Acceptance criteria

1. WHEN the user runs `parcel-path track --id DEMO-1001` with the offline
   fixture available, THE SYSTEM SHALL print a timeline plus one plain-language
   next action and exit `0`.
2. WHEN the user runs `track` with an unknown id, THE SYSTEM SHALL exit `1`
   with usage-safe guidance and SHALL NOT print a stack trace to stdout.
3. WHEN a carrier adapter throws at runtime, THE SYSTEM SHALL exit `2` and
   SHALL NOT leak PII in error output.

### Requirement 2: Offline tests

**User story:** As a developer, I add a failing fixture first when a carrier
field is unclear.

#### Acceptance criteria

1. WHEN `npm test` runs, THE SYSTEM SHALL include a happy-path unit test that
   uses `tests/fixtures/DEMO-1001.json` with no network.
2. WHEN `npm test` runs, THE SYSTEM SHALL include at least one failure-path
   unit test for exit `1` or exit `2`.

### Requirement 3: Documented flag

#### Acceptance criteria

1. WHEN a contributor opens `README.md`, THE SYSTEM documentation SHALL describe
   the `track --id` flag.
