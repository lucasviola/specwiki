# specwiki — Implementation Build Log

**Last updated:** 2026-07-12  
**Current position:** HARNESS Phase 0.1 complete (E1 S1.1) — next: E1 S1.2 verify quality-gate tooling  
**Test count:** 15 passing

## Deliverables

| Deliverable | Status | Reference |
| ----------- | ------ | --------- |
| `IMPLEMENTATION.md` build log | In progress | this file |
| Quality gate scripts (`test`, `lint`, `format`, `coverage`, `typecheck`, `build`) | Brownfield complete — verify in S1.2 | `package.json` |
| Structured logger (`src/core/Logger.ts`) | Pending — E1 S1.3 | — |
| `specwiki list` + discover logging | Pending — E2 | — |
| Markdown wiki (`wiki/*.md`) | Brownfield complete — harden in E3 | `src/output/wiki.ts` |
| HTML wiki (`wiki/html/`) | Brownfield complete — harden in E4 | `src/output/wiki.ts` |
| Slug collision disambiguation | Pending — E5 S5.1 | HARNESS §11 #1 |
| CLI contracts + exit codes | Pending — E6 | `src/commands/` |
| MVP sign-off (HARNESS §13) | Pending — E7 | — |

## Workflow References

Active development follows **[HARNESS.md](./HARNESS.md)**:

- **[§0 Working rules](./HARNESS.md#0-working-rules-mandatory--never-bypass)** — TDD (§0.1), quality gate (§0.2), checkpoint (§0.3), project logs (§0.4)
- **[§0.8 Structured logging](./HARNESS.md#08-structured-logging-mandatory)** — every feature story ships diagnostics; logging is woven into vertical slices, not a separate epic
- **[§0.10 Vertical slices + INVEST](./HARNESS.md#010-story-slicing--vertical-slices-and-invest-mandatory)** — thin end-to-end user value per story; no horizontal layer-only work

Epic and story definitions: [`_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md`](./_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md)

## MVP Epic Progression Checklist

- [ ] **E1 — Project Foundation** — harness, quality gate, `Logger.ts`
- [ ] **E2 — List Discovered Specs** (`specwiki list`) — discover → categorize → display
- [ ] **E3 — Generate Markdown Wiki** (`wiki/*.md`) — discover → parse → write markdown
- [ ] **E4 — Generate HTML Wiki** (`wiki/html/`) — safe HTML rendering + `html/` tree
- [ ] **E5 — Trustworthy Generate Output** — slug collisions + path confinement
- [ ] **E6 — CLI Contracts & Command Polish** — flags, exit codes, lifecycle logging
- [ ] **E7 — MVP Validation & Sign-off** — dogfood + HARNESS §13 checklist

## Build Log

One row per completed story/task. Quality gate column uses §0.2 shorthand: `test · lint · format · coverage · typecheck · build`.

| Date | Story | Summary | Commit | Quality gate |
| ---- | ----- | ------- | ------ | ------------ |
| 2026-07-12 | E1 S1.1 | `docs: create IMPLEMENTATION.md build log and MVP epic checklist` — §0.8 N/A (doc-only); structured logging required in runtime stories from S1.3 onward | uncommitted | typecheck ✓ · build ✓ |
| _template_ | _E?_ S?_ | _`<type>(<scope>): imperative summary`_ | _hash or uncommitted_ | _full §0.2 gate result_ |
