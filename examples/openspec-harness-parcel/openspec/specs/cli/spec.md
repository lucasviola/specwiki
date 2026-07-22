# CLI capability

Current deployed behavior for the Parcel Path entrypoint.

## Requirements

### Requirement: CLI entrypoint exists

The system SHALL expose a `parcel-path` CLI binary that prints usage help when
invoked with `--help`.

#### Scenario: Help flag

- **WHEN** the user runs `parcel-path --help`
- **THEN** the CLI prints usage text and exits `0`

### Requirement: No track command yet

The system SHALL NOT accept a `track` subcommand until the
`add-track-command` change is archived.

#### Scenario: Unknown track subcommand

- **WHEN** the user runs `parcel-path track --id DEMO-1001` before the change
  ships
- **THEN** the CLI exits non-zero with usage guidance
