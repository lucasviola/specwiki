# Story 21.5: Release-Time Dependency Audit Gate

Status: done

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

## Tasks / Subtasks

- [x] Add `audit` npm script and wire into `scripts/prepublish-check.mjs` via `PREPUBLISH_STEPS`
- [x] Emit `publish.prep audit` verbose diagnostics and clear failure message on block
- [x] Document audit policy, devDependency scope, and exception process in README maintainer section
- [x] Extend `tests/package/publish-preparation.test.ts` with audit contract tests
- [x] Run full HARNESS §0.2 quality gate

## Dev Agent Record

### Completion Notes

- Added `npm run audit` (`--audit-level=high --omit=dev`) as the seventh prepublish step after the §0.2 gate.
- Exported `PREPUBLISH_STEPS` / `AUDIT_STEP` from `prepublish-check.mjs`; kept `QUALITY_GATE_STEPS` as the six §0.2 steps.
- README maintainer section documents production-only audit, devDependency policy, and time-bounded exception process (issue + expiry).

### File List

- scripts/prepublish-check.mjs
- package.json
- tests/package/publish-preparation.test.ts
- README.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/21-5-release-dependency-audit-gate.md

## Change Log

- 2026-07-19 — S21.5: release-time dependency audit gate in prepublish-check; README exception policy; contract tests.
