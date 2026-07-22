# Delta — cli capability

## MODIFIED Requirements

### Requirement: No track command yet

**Replaced by:** Track subcommand is accepted.

The system SHALL accept a `track` subcommand that takes `--id <id>` as defined
in the `tracking` capability specs.

#### Scenario: Track subcommand recognized

- **WHEN** the user runs `parcel-path track --id DEMO-1001`
- **THEN** the CLI does not treat `track` as an unknown command
- **AND** control passes to the tracking flow

## REMOVED Requirements

### Requirement: No track command yet

**Reason:** Superseded by `add-track-command`.  
**Migration:** Archive merges this delta; callers use `track --id` going forward.
