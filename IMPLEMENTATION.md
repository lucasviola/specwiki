# specwiki — Implementation Build Log

**Last updated:** 2026-07-12  
**Current position:** E2 S2.2 complete — next: E2 S2.3 fixture discovery and discover logging  
**Test count:** 52 passing

## Deliverables

| Deliverable                                                                       | Status                                      | Reference                  |
| --------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| `IMPLEMENTATION.md` build log                                                     | In progress                                 | this file                  |
| Quality gate scripts (`test`, `lint`, `format`, `coverage`, `typecheck`, `build`) | Verified — full §0.2 gate green (S1.2)      | `package.json`             |
| Structured logger (`src/core/Logger.ts`)                                          | Complete — E1 S1.3                          | `src/core/Logger.ts`       |
| `specwiki list` + discover logging                                                | In progress — E2 S2.2 titles on list output | `src/commands/generate.ts` |
| Markdown wiki (`wiki/*.md`)                                                       | Brownfield complete — harden in E3          | `src/output/wiki.ts`       |
| HTML wiki (`wiki/html/`)                                                          | Brownfield complete — harden in E4          | `src/output/wiki.ts`       |
| Slug collision disambiguation                                                     | Pending — E5 S5.1                           | HARNESS §11 #1             |
| CLI contracts + exit codes                                                        | Pending — E6                                | `src/commands/`            |
| MVP sign-off (HARNESS §13)                                                        | Pending — E7                                | —                          |

## Workflow References

Active development follows **[HARNESS.md](./HARNESS.md)**:

- **[§0 Working rules](./HARNESS.md#0-working-rules-mandatory--never-bypass)** — TDD (§0.1), quality gate (§0.2), checkpoint (§0.3), project logs (§0.4)
- **[§0.8 Structured logging](./HARNESS.md#08-structured-logging-mandatory)** — every feature story ships diagnostics; logging is woven into vertical slices, not a separate epic
- **[§0.10 Vertical slices + INVEST](./HARNESS.md#010-story-slicing--vertical-slices-and-invest-mandatory)** — thin end-to-end user value per story; no horizontal layer-only work

Epic and story definitions: [`_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md`](./_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md)

## MVP Epic Progression Checklist

Story status mirrors [`sprint-status.yaml`](./_bmad-output/implementation-artifacts/sprint-status.yaml). `[x]` = implemented (in `review` or `done`); `[ ]` = not started.

- [x] **E1 — Project Foundation** — harness, quality gate, `Logger.ts`
  - [x] S1.1 — `IMPLEMENTATION.md` build log _(done)_
  - [x] S1.2 — Verify quality-gate tooling _(done)_
  - [x] S1.3 — Structured `Logger.ts` module _(done)_
- [ ] **E2 — List Discovered Specs** (`specwiki list`) — discover → categorize → display
  - [x] S2.1 — Category grouping on list output _(done)_
  - [x] S2.2 — Human-readable titles on list output _(review)_
  - [ ] S2.3 — Fixture discovery integration and discover logging
  - [ ] S2.4 — Zero-match helpful tip
- [ ] **E3 — Generate Markdown Wiki** (`wiki/*.md`) — discover → parse → write markdown
  - [ ] S3.1 — Parse specs into structured page content
  - [ ] S3.2 — Write categorized markdown wiki tree
- [ ] **E4 — Generate HTML Wiki** (`wiki/html/`) — safe HTML rendering + `html/` tree
  - [ ] S4.1 — HTML title escaping and page structure
  - [ ] S4.2 — Write HTML wiki tree with path confinement
- [ ] **E5 — Trustworthy Generate Output** — slug collisions + path confinement
  - [ ] S5.1 — Slug collision disambiguation
  - [ ] S5.2 — Path traversal guard tests
- [ ] **E6 — CLI Contracts & Command Polish** — flags, exit codes, lifecycle logging
  - [ ] S6.1 — Command integration and lifecycle logging
  - [ ] S6.2 — Exit code contracts
- [ ] **E7 — MVP Validation & Sign-off** — dogfood + HARNESS §13 checklist
  - [ ] S7.1 — Dogfood wiki on fixture
  - [ ] S7.2 — Full quality gate and §13 checklist

## Build Log

One row per completed story/task. Quality gate column uses §0.2 shorthand: `test · lint · format · coverage · typecheck · build`.

| Date       | Story    | Summary                                                                                                                                                                                                                      | Commit                | Quality gate                                                    |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| 2026-07-12 | E1 S1.1  | `docs: create IMPLEMENTATION.md build log and MVP epic checklist` — §0.8 N/A (doc-only); structured logging required in runtime stories from S1.3 onward                                                                     | ec535e2               | typecheck ✓ · build ✓                                           |
| 2026-07-12 | E1 S1.2  | `chore: verify §0.2 quality gate on brownfield baseline` — fixed Prettier format on 16 doc files; per-file branch gaps documented (`discover/specs.ts` 87.5%, `output/wiki.ts` 82.6%; repo aggregate 90.32% meets threshold) | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E1 S1.3  | `feat(core): add structured Logger module with verbose-gated log.info` — JSON events to stderr; 7 unit tests; `src/core/` 100% coverage                                                                                      | 921c2f8               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E2 S2.1  | `test(discover): exhaustive deriveCategory tests and list grouping assertions` — exported deriveCategory; 16 new tests; discover branch coverage 95.34%                                                                      | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E2 S2.2  | `feat(list): show human-readable titles in list output` — exported deriveTitle; 12 unit tests; list lines formatted as `{title} — {path}`                                                                                    | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| _template_ | _E?_ S?_ | _`<type>(<scope>): imperative summary`_                                                                                                                                                                                      | _hash or uncommitted_ | _full §0.2 gate result_                                         |
