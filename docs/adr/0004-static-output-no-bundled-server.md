# ADR-0004: Static-file-only output; no bundled server

## Status

accepted

## Date

2026-07-18

## Context

Specwiki's core product transforms discovered markdown into a **static wiki tree** suitable for local browsing, CI artifacts, or upload to any static host. The layout contract (spine AD-4) requires `index.md`, per-spec markdown pages, and an `html/` subtree with `index.html` and article pages.

Users preview the HTML wiki via `specwiki open`, which launches the system default browser against a `file://` URL. POST-MVP epic E11 proposes `watch` and `serve` commands — introducing an HTTP server would change the trust and deployment model.

This ADR locks the **default product boundary**: generate static files; do not bundle a server in core commands today.

## Decision

1. **`generate` produces static artifacts only** — no listening socket, no background process. Output is written under the confined `--output` directory via `output/wiki.ts` (`writeWiki`, `writeHtmlWiki`).
2. **Layout contract unchanged:** `index.md`, `{slug}.md`, `html/index.html`, `html/{slug}.html`, optional search assets and `llms.txt` — all files on disk.
3. **`open` uses the OS browser launcher**, not an embedded HTTP server:
   - macOS: `open <indexPath>`
   - Linux: `xdg-open <indexPath>`
   - Windows: `cmd /c start "" <indexPath>`
   - Implementation: `src/commands/open.ts` via `execFile`
4. **Client-side search** (lunr index embedded at generate time) is designed for `file://` browsing — no server-side query endpoint (see ADR-0008 in S25.3).
5. **E11 boundary:** Any future `serve` or `watch` command is an **opt-in extension** that must document how it revisits this ADR (bind address, auth, directory exposure). Core `generate` + static deploy path remains the default supported workflow.

## Consequences

### Positive

- Simple deployment: copy `wiki/` to S3, GitHub Pages, or open locally
- No open-port attack surface in the default CLI path
- CI can artifact the output directory without process lifecycle management

### Negative

- `file://` constraints affect some browser APIs and large-site search scaling
- Live reload requires a future server (E11) — not available in core today

### Neutral

- Landing site (`site/`, E20) is a separate deployable with its own build script — out of npm package `files` list
- `open` requires a prior successful `generate`; missing index exits 1 with actionable message

## References

- [Source: src/output/wiki.ts — `writeWiki`, `writeHtmlWiki`]
- [Source: src/commands/open.ts — browser launcher]
- [Source: src/commands/generate.ts — orchestration]
- [Source: ARCHITECTURE-SPINE.md — AD-4]
- Related: ADR-0011 (S25.5 — watch/serve design, revisits this ADR)
- Related: ADR-0008 (S25.3 — lunr `file://` constraint)
