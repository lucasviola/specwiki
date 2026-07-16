# Story 21.5: Release-Time Dependency Audit Gate

Status: backlog

## Story

As a maintainer publishing specwiki to npm,
I want the release pipeline to fail on high or critical dependency vulnerabilities,
so that known CVEs do not ship to end users.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run prepublishOnly` (or `release:check`) runs `npm audit` at configured threshold; clean tree passes; injected high vuln fails with clear message.

**Binds:** E21 | **Finding:** SEC-5 | **Depends:** S13.1 prepublish scripts

## Acceptance Criteria

### Functional

1. Add audit step to `scripts/prepublish-check.mjs` and/or `docs/RELEASING.md` release checklist.
2. Fail on `high` and `critical` by default (`npm audit --audit-level=high` or equivalent).
3. Document how to record a time-bounded exception (issue link + expiry) if a false positive blocks publish.
4. Audit runs on production dependencies; devDependency policy documented separately.

### Logging & diagnostics (§0.8)

5. `publish.prep audit start|ok|fail` messages when `--verbose` on prepublish script.

### Quality measures

6. Contract test asserts audit step is in `QUALITY_GATE_STEPS` or documented release script.
7. Full §0.2 gate passes on clean dependency tree.
