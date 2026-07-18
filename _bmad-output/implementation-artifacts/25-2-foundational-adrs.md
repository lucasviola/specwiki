---
baseline_commit: 309d559
---

# Story 25.2: Foundational ADRs (0001, 0003, 0004, 0007, 0009)

Status: review

## Story

As a maintainer reviewing security or CLI changes,
I want the five governing ADRs written and accepted,
so that path safety, config trust, output boundaries, CLI contract, and dependency policy are explicit before more features land.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Read `docs/adr/0001-…md` through `0009-…md` — each status `accepted`, references real modules (`core/paths.ts`, `config/loader.ts`, etc.).

**Binds:** Epic 25 owner decisions | **Depends:** S25.1 | **Enables:** S25.4, S25.5 | **Epic:** E25

## Acceptance Criteria

### Functional

1. **ADR-0001** — `docs/adr/0001-path-confinement-trust-boundary.md`:
   - Status `accepted`; date 2026-07-18
   - Documents `src/core/paths.ts` as the canonical path-confinement gateway (`assertConfinedUnder`, `assertRealpathConfinedUnder`, `resolveOutputWithinProject`, `PathEscapeError`)
   - Lists known consumers: `commands/generate.ts`, `commands/open.ts`, `output/html/nav-grouping-catalog.ts`
   - Notes inline confinement in `config/loader.ts` and `commands/init.ts` as consolidation debt (ADR-0013 candidate: CI grep)
   - References spine AD-7

2. **ADR-0003** — `docs/adr/0003-config-loader-execution-model.md`:
   - Status `accepted`; date 2026-07-18
   - Documents `.json` vs `.js` config (`specwiki.config.json` preferred; `.js` executes via dynamic `import`)
   - Precedence chain: CLI `--patterns` → `SPECWIKI_PATTERNS` env → project config → `DEFAULT_SPEC_PATTERNS`
   - RCE trust boundary stated explicitly; links README security section (does not duplicate full text)
   - References `config/loader.ts`, spine AD-2

3. **ADR-0004** — `docs/adr/0004-static-output-no-bundled-server.md`:
   - Status `accepted`; date 2026-07-18
   - Documents static-file-only wiki output (`index.md`, `{slug}.md`, `html/`)
   - `open` command delegates to OS browser launcher (`open` / `xdg-open` / `cmd start`) — no HTTP server in core product
   - Explicitly bounds E11 watch/serve design (future server is opt-in extension, revisits this ADR)
   - References `commands/open.ts`, `output/wiki.ts`, spine AD-4

4. **ADR-0007** — `docs/adr/0007-cli-dual-audience-contract.md`:
   - Status `accepted`; date 2026-07-18
   - stdout/stderr split: user summaries and `--json` on stdout; structured Logger events on stderr
   - Exit codes: 0 success, 1 runtime failure, 2 usage/validation (Commander usage codes + config validation)
   - `--json` stability note on `generate` and `list` result shapes
   - References `cli.ts`, `core/Logger.ts`, spine AD-9/AD-10

5. **ADR-0009** — `docs/adr/0009-runtime-dependency-budget.md`:
   - Status `accepted`; date 2026-07-18
   - Supersedes spine AD-11 “five-dep freeze” with budget + ADR justification rule
   - Lists current nine runtime dependencies from `package.json`
   - Documents when a new runtime dep requires a new ADR (not silent addition)
   - Cross-reference note: ADR-0002 (S25.3) covers HTML stack deps added post-MVP

6. **Update `docs/adr/index.md`** — replace placeholder row with all five ADRs (ID, Title, Status, Date) and one-line summary links

7. **Out of scope:**
   - No retroactive ADRs (0002, 0005, 0006, 0008, 0010) — S25.3
   - No `ARCHITECTURE-SPINE.md` edits — S25.4
   - No `src/` code changes

### Quality measures

8. Each ADR follows MADR template sections and stays under ~150 lines
9. Each ADR references real file paths (not generic prose)
10. `IMPLEMENTATION.md` build log updated with S25.2 row
11. Wiki generate discovers all five ADRs under **Architecture Decisions** (smoke verify)

## Tasks / Subtasks

- [x] Read S25.1 scaffold, epic S25.2 outline, and source modules before writing (AC: 1–5)
- [x] Write ADR-0001 path confinement (AC: 1)
- [x] Write ADR-0003 config loader (AC: 2)
- [x] Write ADR-0004 static output (AC: 3)
- [x] Write ADR-0007 CLI contract (AC: 4)
- [x] Write ADR-0009 dependency budget (AC: 5)
- [x] Update `docs/adr/index.md` with five-row table and summaries (AC: 6)
- [x] Update `IMPLEMENTATION.md` build log (AC: 10)
- [x] Smoke verify wiki discovery (AC: 11)

## Dev Notes

**Primary deliverables:** five ADR files + updated index  
**Code touch:** none — documentation only  
**Depends on S25.1:** `docs/adr/` scaffold, template, wiki category

### ADR content guidance (from epic)

| ADR  | Key modules / facts                                                                         |
| ---- | ------------------------------------------------------------------------------------------- |
| 0001 | `core/paths.ts`; consumers in generate, open, nav-grouping-catalog; loader/init inline debt |
| 0003 | `config/loader.ts`; JSON safe / JS RCE; precedence chain                                    |
| 0004 | static wiki tree; `open.ts` browser spawn; no bundled server                                |
| 0007 | stdout JSON + chalk summaries; stderr Logger; exit 0/1/2                                    |
| 0009 | nine runtime deps; supersedes AD-11; ADR required for new deps                              |

### Verification commands

```bash
ls docs/adr/000*.md
rg -n "^accepted$" docs/adr/0001-*.md docs/adr/0003-*.md docs/adr/0004-*.md docs/adr/0007-*.md docs/adr/0009-*.md
rg -n "0001|0003|0004|0007|0009" docs/adr/index.md
npm run dev generate -- --project . --output .tmp-specwiki-adr252 --no-search
rg -n "Architecture Decisions|0001-path-confinement" .tmp-specwiki-adr252/html/index.html
```

### References

- [Source: _bmad-output/implementation-artifacts/epic-25-architecture-decision-records.md#S25.2]
- [Source: _bmad-output/implementation-artifacts/25-1-adr-scaffolding-template-and-wiki-category.md]
- [Source: src/core/paths.ts, src/config/loader.ts, src/cli.ts, src/commands/open.ts]

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- Wiki smoke generate used `.tmp-specwiki-adr252` (project-root output per S21.1).

### Completion Notes List

- Created five foundational ADRs (0001, 0003, 0004, 0007, 0009) with status `accepted` and real module references.
- Updated `docs/adr/index.md` with table rows and one-line summaries.
- Verified wiki generate lists all ADRs under Architecture Decisions category.
- Doc-only story — no `src/` changes; spine sync deferred to S25.4.

### File List

- docs/adr/0001-path-confinement-trust-boundary.md (added)
- docs/adr/0003-config-loader-execution-model.md (added)
- docs/adr/0004-static-output-no-bundled-server.md (added)
- docs/adr/0007-cli-dual-audience-contract.md (added)
- docs/adr/0009-runtime-dependency-budget.md (added)
- docs/adr/index.md (modified)
- IMPLEMENTATION.md (modified)
- _bmad-output/implementation-artifacts/25-2-foundational-adrs.md (added)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)

### Change Log

- 2026-07-18 — S25.2 foundational ADRs 0001, 0003, 0004, 0007, 0009 (Composer)

## Senior Developer Review (AI)

## QA Manual Validation

### Manual validation steps

1. `ls docs/adr/000*.md` — five ADR files present (0001, 0003, 0004, 0007, 0009).
2. `rg -n "^accepted$" docs/adr/000*.md` — five matches (one per ADR).
3. `rg -n "0001|0003|0004|0007|0009" docs/adr/index.md` — index table lists all five with links.
4. `npm run dev generate -- --project . --output .tmp-specwiki-adr252 --no-search` — succeeds; Architecture Decisions category includes ADR pages.
5. Spot-read ADR-0001 — references `src/core/paths.ts` and notes loader/init inline debt.
6. Spot-read ADR-0009 — lists nine runtime deps and states AD-11 supersession.
