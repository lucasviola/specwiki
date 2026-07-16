# Story 21.7: Opt-In HTML Sanitization (`--sanitize-html`)

Status: backlog

## Story

As a maintainer generating a wiki from contributor-submitted specs,
I want an opt-in flag to sanitize HTML in rendered wiki bodies,
so that untrusted markdown cannot inject scripts when the HTML wiki is opened in a browser.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓ (large — defer until demand)

**Demo path:** `specwiki generate --sanitize-html` — spec with `<script>` in body is stripped in HTML output; default generate unchanged.

**Binds:** E21 | **Finding:** SEC-3 mitigation | **POST-MVP:** Bet 6 in `POST-MVP-ROADMAP.md`

## Acceptance Criteria

### Functional

1. Opt-in `--sanitize-html` on `generate` only; default off (trusted-local-content / AD-6).
2. Sanitize rendered article body HTML before Mustache `{{{content}}}` insertion (or sanitize marked output).
3. Template metadata fields (title, paths, descriptions) remain Mustache-escaped.
4. Markdown wiki (`wiki/*.md`) unchanged.
5. Document flag in README Security section when shipped.

### Logging & diagnostics (§0.8)

6. `output.sanitize` verbose event with page count when enabled.

### Quality measures

7. Tests with malicious `<script>` and `onerror=` payloads in spec bodies.
8. Full §0.2 gate; no new runtime deps without owner approval (evaluate `rehype-sanitize` size).

### Deferral

- Not required for v1.0.0 npm publish unless owner prioritizes untrusted-repo use case.
