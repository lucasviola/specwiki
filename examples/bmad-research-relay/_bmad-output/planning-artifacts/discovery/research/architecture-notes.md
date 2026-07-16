# Relay Desk — Architecture Notes

Companion notes to the [technical research](./technical-research.md). Kept short on purpose.

## Runtime shape

```text
CLI (commander/yargs)
  → commands: init | add | list | sync-hint
  → store adapter (files v0.1)
  → printer (human + optional --json)
```

## Store adapter contract

```ts
interface NoteStore {
  add(note: { title: string; body: string; column: string }): Promise<string>;
  list(filter?: { column?: string }): Promise<Note[]>;
}
```

v0.1 implements `FileNoteStore`. A future `SqliteNoteStore` should satisfy the same interface so commands stay thin.

## Config

- Project marker: `.relay/board.json`
- Optional user config: `relay.config.json` at repo root (patterns, default column)

## Logging

Emit structured events on stderr when `--verbose`:

- `store.write`
- `store.list`
- `cli.error`
