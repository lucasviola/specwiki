# Delta — tracking capability

## ADDED Requirements

### Requirement: Track by id

The system SHALL accept `parcel-path track --id <id>` and print a timeline of
normalized tracking events plus one plain-language next action.

#### Scenario: Offline demo fixture

- **WHEN** the user runs `parcel-path track --id DEMO-1001` with the offline
  fixture available
- **THEN** the CLI prints a timeline ending in an out-for-delivery style status
  and a next action such as “Wait for the courier today”
- **AND** the process exits `0`

#### Scenario: Unknown id

- **WHEN** the user runs `track` with an unknown id
- **THEN** the CLI exits `1` with usage-safe guidance (no stack traces on stdout)

#### Scenario: Carrier failure

- **WHEN** a carrier adapter throws at runtime
- **THEN** the CLI exits `2` and does not leak PII in error output

### Requirement: Offline unit tests

The system SHALL provide happy-path and failure-path unit tests that run with no
network access.

#### Scenario: Fixture-backed tests

- **WHEN** `npm test` runs in CI
- **THEN** tracking tests use `tests/fixtures/DEMO-1001.json` (or mocks) and do
  not call external carrier APIs
