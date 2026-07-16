---
baseline_commit: a52ff64
---

# Story 21.2: README Security Section for NPM Users

Status: done

## Story

As a prospective npm user evaluating specwiki,
I want a clear Security section in the README,
so that I understand the trust model before running the CLI on a repository or opening generated HTML in a browser.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Open `README.md` → `## Security` covers trusted projects, `specwiki.config.js`, markdown/HTML XSS, path safety, and npm package surface.

**Binds:** E21 | **Findings:** SEC-3, SEC-4, SEC-6 (documented)

## Acceptance Criteria

### Functional

1. README includes `## Security` with subsections: Trusted projects only, Path safety, npm package surface.
2. Documents that `specwiki.config.js` executes arbitrary Node.js; recommends JSON config when programmatic patterns are not needed.
3. Documents that spec markdown may contain raw HTML rendered into generated wiki pages (trusted-local-content).
4. Documents `--output` must stay within `--project` for `generate` and `open`.
5. Documents published tarball scope (`dist/`, README, LICENSE), no install hooks, and `prepublishOnly` gate.
6. Development example uses in-project output (not `/tmp` escape) for `specwiki open`.

### Quality measures

7. No inaccurate claims of network sandboxing or HTML sanitization by default.
8. Editorial review for accuracy against current CLI behavior.

## Completion notes

- Implemented in commit `a52ff64`: README Security section and usage clarifications.
