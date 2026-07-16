# Story 21.4: Trust Warning When Loading specwiki.config.js

Status: backlog

## Story

As a developer running specwiki on a cloned repository,
I want an explicit warning when `specwiki.config.js` is loaded,
so that I know arbitrary Node.js from the project is about to execute.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Place `specwiki.config.js` in fixture project → `specwiki list` stderr shows one clear warning naming the file; JSON config does not warn.

**Binds:** E21 | **Finding:** SEC-2

## Acceptance Criteria

### Functional

1. When `loadProjectConfig` loads `specwiki.config.js`, emit a single user-visible warning per process invocation (not per subcommand retry).
2. Warning states that `.js` config executes arbitrary code; suggest `specwiki.config.json` for static patterns.
3. JSON config load does not emit this warning.
4. `--json` stdout remains clean; warning goes to stderr only.

### Logging & diagnostics (§0.8)

5. Optional structured `config.warn` event on stderr (always, not verbose-gated) with `{ sourcePath: "specwiki.config.js" }` — no config body or env values.

### Security (§0.9)

6. Do not log config file contents, env vars, or resolved pattern strings.

### Quality measures

7. Tests in `tests/config/loader.test.ts` and CLI integration for js vs json.
8. Full §0.2 gate passes.
