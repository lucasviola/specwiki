---
baseline_commit: bc9184c
---

# Story 13.2: GitHub Actions CI workflow

Status: review

## Story

As an open-source maintainer,
I want GitHub Actions to run the full quality gate on every push and pull request,
so that regressions are caught before merge without relying on local discipline alone.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Push a branch (or open a PR) and confirm the `CI` workflow runs on `ubuntu-latest` with Node 20, executing `npm ci` followed by the six canonical HARNESS §0.2 scripts in order.

1. A GitHub Actions workflow file exists at `.github/workflows/ci.yml` and triggers on both `push` and `pull_request`.
2. The workflow runs on `ubuntu-latest` with Node.js 20.x and installs dependencies via `npm ci` before any quality-gate step.
3. The workflow runs the complete HARNESS §0.2 quality gate in canonical order: `test`, `lint`, `format`, `coverage`, `typecheck`, then `build`. Each step fails fast and surfaces which script broke.
4. The workflow does not publish to npm, request registry credentials, run `npm login`, or perform other release automation reserved for S13.1.
5. Tests assert the workflow contract: file presence, triggers, Node 20.x runner, `npm ci` before the gate, canonical script order, and absence of publish/registry steps.
6. Existing CLI behavior and frozen contracts remain unchanged: no changes to discovery defaults, category rules, generated wiki layout, output-path confinement, or HTML escaping. Do not add runtime dependencies.
7. The full HARNESS §0.2 quality gate passes locally with all global coverage thresholds at or above 90%.

## Tasks / Subtasks

- [x] Define the CI workflow contract (AC: 1, 2, 3, 4, 5)
  - [x] Write failing tests first for workflow triggers, Node version, install step, gate order, and publish exclusions.
  - [x] Add `.github/workflows/ci.yml` with checkout, Node 20 setup, `npm ci`, and the six gate scripts as separate steps.
- [x] Verify and document (AC: 6, 7)
  - [x] Run the six-command local quality gate.
  - [x] Update `IMPLEMENTATION.md` after implementation with verification evidence and commit reference.

## Dev Notes

### Product and scope

- This story implements FR-028 (package-level CI quality gate) only. S13.1 owns npm publish prep and `prepublishOnly`; do not add publish automation here.
- CI config is declarative YAML; it does not use the runtime `Logger` API. Local gate discipline remains the pre-commit expectation.
- Keep the workflow minimal: one job, one Node version matrix entry (20.x), no e2e/browser tests per HARNESS §0.2.1.

### Workflow design

- Use `actions/checkout@v4` and `actions/setup-node@v4` with `cache: npm` for reproducible installs.
- Run each gate script as its own step so GitHub Actions logs show which command failed.
- Preserve the exact script names from `package.json`: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Testing requirements

- Follow strict TDD: add `tests/package/ci-workflow.test.ts`, observe failure, add workflow, confirm green.
- Parse the workflow as text; do not add a YAML parser dependency.
- No subprocess execution of `act` or live GitHub API calls in unit tests.

### Architecture, security, and regression guardrails

- No application-layer source module changes. This story is repository CI configuration only.
- Do not add secrets, tokens, or registry configuration to the workflow.
- Preserve all frozen output/discovery contracts and existing public CLI commands/flags.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E13 — Distribution & Publish`]
- [Source: `_bmad-output/planning-artifacts/discovery/prd/prd.md#FR-028`]
- [Source: `HARNESS.md#0.2`]
- [Source: `package.json` — quality-gate scripts]

## Dev Agent Record

### Agent Model Used

Composer 2.5 Fast

### Debug Log References

- 2026-07-15 — TDD red: `npm run test -- tests/package/ci-workflow.test.ts` failed because `.github/workflows/ci.yml` was absent.

### Implementation Plan

- Add contract tests for the workflow file, then implement a single-job GitHub Actions workflow that mirrors the local §0.2 gate.

### Completion Notes List

- Story started 2026-07-15; workflow and contract tests added.
- 2026-07-15 — Applied Bugbot patches: `on:` block parsing for trigger assertions; expanded registry credential exclusions.

### File List

- .github/workflows/ci.yml
- tests/package/ci-workflow.test.ts
- _bmad-output/implementation-artifacts/13-2-github-actions-ci-workflow.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- IMPLEMENTATION.md

### Change Log

- 2026-07-15 — Started S13.2: added CI workflow contract tests and `.github/workflows/ci.yml`.
- 2026-07-15 — Strengthened contract tests per Bugbot review (trigger block parsing, registry exclusions).

## Senior Developer Review (AI)

**Review date:** 2026-07-15  
**Review outcome:** Approve (after patches)  
**Reviewer model:** Bugbot

### Action Items

- [x] [Patch][High] Parse the `on:` block when asserting push/pull_request triggers.
- [x] [Patch][Medium] Expand registry credential exclusions (`NODE_AUTH_TOKEN`, `registry-url`, `secrets.`).

### Review Findings

| Severity | Location                            | Finding                                          | Status   |
| -------- | ----------------------------------- | ------------------------------------------------ | -------- |
| High     | `tests/package/ci-workflow.test.ts` | Trigger regex could false-positive outside `on:` | Resolved |
| Medium   | `tests/package/ci-workflow.test.ts` | Incomplete registry credential checks            | Resolved |

## QA Manual Validation

**QA model:** Composer 2.5 Fast  
**Review date:** 2026-07-15

### AC coverage

- AC 1–4: `.github/workflows/ci.yml` triggers on push/PR, uses ubuntu-latest + Node 20, runs `npm ci` then six gate scripts as separate steps, and excludes publish/registry automation.
- AC 5: six contract tests cover file presence, `on:` triggers, Node version, install ordering, gate order, and publish exclusions.
- AC 6: no `src/` changes; 362 tests pass.
- AC 7: full local §0.2 gate green; repo coverage 95.83%.

### Regression risks

- CI will fail on the first broken gate script — same behavior as local discipline; contributors should run the gate before push.
- Live GitHub Actions execution requires pushing to remote; contract tests do not substitute for first-run verification on GitHub.

### Gaps

- No `act` or live GitHub API integration test (intentionally out of scope).
- README does not yet mention CI badge or contributor CI expectations (optional follow-up).

### Manual validation steps

1. `npx vitest run tests/package/ci-workflow.test.ts` — expected outcome: 6 contract tests pass.
2. `cat .github/workflows/ci.yml` — expected outcome: `on: push` and `pull_request`; `node-version: "20"`; steps for `npm ci`, `npm run test`, `lint`, `format`, `coverage`, `typecheck`, `build`.
3. `npm run test && npm run lint && npm run format && npm run coverage && npm run typecheck && npm run build` — expected outcome: all six commands exit 0 locally.
4. Push branch to GitHub and open a PR — expected outcome: `CI` workflow runs on `ubuntu-latest` with Node 20 and all gate steps pass (requires remote).
