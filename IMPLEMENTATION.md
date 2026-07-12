# specwiki — Implementation Build Log

**Last updated:** 2026-07-12  
**Current position:** **POST-MVP E16 in progress** — S16.1 complete (review); MVP closed E1–E7  
**Test count:** 155 passing

## Deliverables

| Deliverable                                                                       | Status                                      | Reference               |
| --------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------- |
| `IMPLEMENTATION.md` build log                                                     | Complete through E7                         | this file               |
| Quality gate scripts (`test`, `lint`, `format`, `coverage`, `typecheck`, `build`) | Verified — full §0.2 gate green (S1.2)      | `package.json`          |
| Structured logger (`src/core/Logger.ts`)                                          | Complete — E1 S1.3                          | `src/core/Logger.ts`    |
| `specwiki list` + discover logging                                                | Complete — E2                               | `src/discover/specs.ts` |
| Markdown wiki (`wiki/*.md`)                                                       | Complete — E3                               | `src/output/wiki.ts`    |
| HTML wiki (`wiki/html/`)                                                          | Complete — E4; **E16 S16.1 skin** in review | `src/output/html/`      |
| Slug collision disambiguation                                                     | Complete — E5 S5.1                          | HARNESS §11 #1          |
| CLI contracts + exit codes                                                        | Complete — E6                               | `src/cli.ts`            |
| MVP sign-off (HARNESS §13)                                                        | **Closed** — E7 S7.2 owner sign-off         | below                   |

## Workflow References

Active development follows **[HARNESS.md](./HARNESS.md)**:

- **[§0 Working rules](./HARNESS.md#0-working-rules-mandatory--never-bypass)** — TDD (§0.1), quality gate (§0.2), checkpoint (§0.3), project logs (§0.4)
- **[§0.2.5 Automated code review](./HARNESS.md#025-automated-code-review--mandatory-after-every-task)** — subagent on a different LLM after every task; triage Patch/Defer/Reject; ask owner before applying patches or committing
- **[§0.2.6 QA analysis](./HARNESS.md#026-qa-analysis--mandatory-after-every-task)** — subagent QA report + step-by-step manual validation in every checkpoint summary
- **[§0.8 Structured logging](./HARNESS.md#08-structured-logging--mandatory-on-every-feature)** — every feature story ships diagnostics; logging is woven into vertical slices, not a separate epic
- **[§0.10 Vertical slices + INVEST](./HARNESS.md#010-story-slicing--vertical-slices-and-invest-mandatory)** — thin end-to-end user value per story; no horizontal layer-only work

Epic and story definitions: [`_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md`](./_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md)

## MVP closure (2026-07-12)

**Status:** Formally closed by owner directive.

| Milestone                | Evidence                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| E1–E7 all stories `done` | [`sprint-status.yaml`](./_bmad-output/implementation-artifacts/sprint-status.yaml) — `mvp_status: closed` |
| §13 checklist green      | Below + `tests/harness/deliverables.test.ts`                                                              |
| Quality gate             | 147 tests; lint, typecheck, build pass                                                                    |
| Dogfood                  | 10 specs / 8 categories / ~0.4s on `tests/fixtures/sample-project/`                                       |
| Logging woven            | §0.8 audit table — no deferred logging epic                                                               |

**Next work:** POST-MVP per [`POST-MVP-ROADMAP.md`](./_bmad-output/planning-artifacts/discovery/POST-MVP-ROADMAP.md) — recommended first targets: E8 (extended discovery) or E16 (Wikipedia HTML skin).

## CLI exit codes (FR-022)

| Code | Meaning         | Examples                                              |
| ---- | --------------- | ----------------------------------------------------- |
| 0    | Success         | `generate`/`list` completed; zero matches with tip    |
| 1    | Runtime failure | I/O error, parse failure, write failure, path guard   |
| 2    | Usage error     | Unknown option/command, missing required option value |

Usage errors emit `cli.error` on stderr (JSON) before exit 2. Runtime failures emit `cli.error` before exit 1. User-facing messages remain on stdout.

## Dogfood validation (FR-031)

**Fixture:** `tests/fixtures/sample-project/` — the canonical MVP proof layout.

| Metric           | Result (2026-07-12)              |
| ---------------- | -------------------------------- |
| Spec files found | 10                               |
| Wiki pages       | 10                               |
| Categories       | 8                                |
| Generate time    | ~0.4s (< 60s AC)                 |
| Markdown + HTML  | ✓ `index.md` + `html/index.html` |

**Repo root limited yield (POST-MVP FR-006):** Running `specwiki list --project .` on the specwiki repository finds only paths matching `DEFAULT_SPEC_PATTERNS` (currently 1 file: `.cursor/rules/specwiki-checkpoint.mdc`). High-value self-repo paths **outside** default patterns — `HARNESS.md`, `_bmad-output/`, `.agents/skills/` — are deferred to E8 (extended patterns / `--config`). This is intentional per FR-031 readiness patch; not an MVP blocker.

## MVP Epic Progression Checklist

Story status mirrors [`sprint-status.yaml`](./_bmad-output/implementation-artifacts/sprint-status.yaml). **MVP closed 2026-07-12** — all E1–E7 stories `done`.

- [x] **E1 — Project Foundation** — harness, quality gate, `Logger.ts`
  - [x] S1.1 — `IMPLEMENTATION.md` build log _(done)_
  - [x] S1.2 — Verify quality-gate tooling _(done)_
  - [x] S1.3 — Structured `Logger.ts` module _(done)_
- [x] **E2 — List Discovered Specs** (`specwiki list`) — discover → categorize → display
  - [x] S2.1 — Category grouping on list output _(done)_
  - [x] S2.2 — Human-readable titles on list output _(done)_
  - [x] S2.3 — Fixture discovery integration and discover logging _(done)_
  - [x] S2.4 — Zero-match helpful tip _(done)_
- [x] **E3 — Generate Markdown Wiki** (`wiki/*.md`) — discover → parse → write markdown
  - [x] S3.1 — Parse specs into structured page content _(done)_
  - [x] S3.2 — Write categorized markdown wiki tree _(done)_
- [x] **E4 — Generate HTML Wiki** (`wiki/html/`) — safe HTML rendering + `html/` tree
  - [x] S4.1 — HTML title escaping and page structure _(done)_
  - [x] S4.2 — Write HTML wiki tree with path confinement _(done)_
- [x] **E5 — Trustworthy Generate Output** — slug collisions + path confinement
  - [x] S5.1 — Slug collision disambiguation _(done)_
  - [x] S5.2 — Path traversal guard tests _(done)_
- [x] **E6 — CLI Contracts & Command Polish** — flags, exit codes, lifecycle logging
  - [x] S6.1 — Command integration and lifecycle logging _(done)_
  - [x] S6.2 — Exit code contracts _(done)_
- [x] **E7 — MVP Validation & Sign-off** — dogfood + HARNESS §13 checklist
  - [x] S7.1 — Dogfood wiki on fixture _(done)_
  - [x] S7.2 — Full quality gate and §13 checklist _(done)_

## POST-MVP Epic Progression Checklist

Story status mirrors [`sprint-status.yaml`](./_bmad-output/implementation-artifacts/sprint-status.yaml). POST-MVP work begins after MVP sign-off (E7).

- [ ] **E8 — Custom Discovery Configuration** — `--patterns`, config loader, extended defaults
- [ ] **E9 — Agent Interoperability** — `--json`, `llms.txt`
- [ ] **E10 — Team CI Freshness** — `generate --check`
- [ ] **E11 — Live Developer Loop** — `--watch`, `serve`
- [ ] **E12 — Semantic Framework Enrichment** — Cursor badges, OpenSpec grouping, BMAD cards
- [ ] **E13 — Distribution & Publish** — npm, GitHub Actions
- [ ] **E14 — Ecosystem Export & Intelligence** — SSG export, drift, plugins
- [ ] **E15 — IDE Integration** — wiki panel extension (future bet)
- [ ] **E16 — Wikipedia-Style HTML Wiki** — Vector-inspired skin, navigation chrome, search _(in progress)_
  - [x] S16.1 — Mustache HTML renderer and Wikimedia assets _(review)_
  - [x] S16.2 — Wikipedia layout chrome and navigation
  - [ ] S16.3 — Rich HTML content rendering
  - [ ] S16.4 — Client-side wiki search

## HARNESS §13 Deliverables Checklist

Verified 2026-07-12 as part of E7 S7.2. Automated guards in `tests/harness/deliverables.test.ts`.

### Functionality

| Item                                                  | Status | Evidence                                                              |
| ----------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| `specwiki list` discovers and groups specs per README | ✓      | `tests/discover/specs.test.ts`, `tests/cli.test.ts`                   |
| `specwiki generate` writes markdown + HTML wiki       | ✓      | `tests/output/wiki.test.ts`, dogfood CLI test                         |
| `--project`, `--output`, `--verbose` flags            | ✓      | `tests/cli.test.ts`, `tests/commands/generate.test.ts`                |
| Zero-spec projects exit cleanly with helpful message  | ✓      | `tests/cli.test.ts` list/generate zero-match; shared `ZERO_SPECS_TIP` |

### Meta / persistence

| Item                                              | Status | Evidence                                  |
| ------------------------------------------------- | ------ | ----------------------------------------- |
| `IMPLEMENTATION.md` build log complete through E7 | ✓      | This file — build log + epic checklist    |
| HARNESS §0.2 lists all quality-gate scripts       | ✓      | `package.json` scripts; deliverables test |

### Code quality

| Item                                      | Status | Evidence                                            |
| ----------------------------------------- | ------ | --------------------------------------------------- |
| All §0.2 quality gate commands pass       | ✓      | S7.2 gate run (see build log row)                   |
| §0.2.5 automated code review per task     | ✓      | Story files under `Senior Developer Review (AI)`    |
| §0.2.6 QA analysis with manual validation | ✓      | Story files under `QA Manual Validation`            |
| Coverage ≥ 90% repo-wide                  | ✓      | vitest thresholds + coverage run                    |
| Comments follow §0.6                      | ✓      | Minimal, non-obvious only                           |
| Code cleanliness follows §0.7             | ✓      | Focused modules; no scope creep                     |
| Structured logging follows §0.8           | ✓      | Logger in all pipeline modules; audit below         |
| Path/HTML safety follows §0.9             | ✓      | `escapeHtml`, `assertPathConfined`; traversal tests |

## §0.8 Logging Audit (E2–E6)

Every MVP feature story shipped structured logging ACs. No deferred logging epic.

| Story | Module(s)                    | Events verified                                                   |
| ----- | ---------------------------- | ----------------------------------------------------------------- |
| S2.3  | discover/specs.ts            | discover.start, discover.match, discover.complete, discover.error |
| S2.4  | discover/specs.ts            | discover.empty                                                    |
| S3.1  | parse/markdown.ts            | parse.file, parse.error                                           |
| S3.2  | output/wiki.ts               | output.write, output.error                                        |
| S4.1  | parse/markdown.ts            | render.error                                                      |
| S4.2  | output/wiki.ts               | output.write (html/), output.error                                |
| S5.1  | output/wiki.ts               | output.slug-collision                                             |
| S5.2  | output/wiki.ts               | output.error (path guard)                                         |
| S6.1  | commands/generate.ts, cli.ts | cli.command, cli.error, generate.summary                          |
| S6.2  | cli.ts                       | cli.error (usage vs runtime)                                      |
| S7.1  | (integration)                | Full verbose chain in dogfood CLI test                            |

User-facing summaries remain on stdout via chalk; diagnostics use JSON stderr via `Logger.ts`.

## Build Log

One row per completed story/task. Quality gate column uses §0.2 shorthand: `test · lint · format · coverage · typecheck · build`.

| Date       | Story     | Summary                                                                                                                                                                                                                                                                | Commit                | Quality gate                                                    |
| ---------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| 2026-07-12 | E1 S1.1   | `docs: create IMPLEMENTATION.md build log and MVP epic checklist` — §0.8 N/A (doc-only); structured logging required in runtime stories from S1.3 onward                                                                                                               | ec535e2               | typecheck ✓ · build ✓                                           |
| 2026-07-12 | E1 S1.2   | `chore: verify §0.2 quality gate on brownfield baseline` — fixed Prettier format on 16 doc files; per-file branch gaps documented (`discover/specs.ts` 87.5%, `output/wiki.ts` 82.6%; repo aggregate 90.32% meets threshold)                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E1 S1.3   | `feat(core): add structured Logger module with verbose-gated log.info` — JSON events to stderr; 7 unit tests; `src/core/` 100% coverage                                                                                                                                | 921c2f8               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E2 S2.1   | `test(discover): exhaustive deriveCategory tests and list grouping assertions` — exported deriveCategory; 16 new tests; discover branch coverage 95.34%                                                                                                                | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E2 S2.2   | `feat(list): show human-readable titles in list output` — exported deriveTitle; 12 unit tests; list lines formatted as `{title} — {path}`                                                                                                                              | d5563be               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E2 S2.3   | `feat(discover): structured discover logging and list --verbose` — discover.start/match/complete/error events; CLI and command verbose wiring; 8 new tests; discover branch coverage 100%                                                                              | 9e5c1e1               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E2 S2.4   | `feat(list): zero-match helpful tip and discover.empty logging` — list tip parity with generate; discover.empty verbose event; 3 new tests; CLI e2e for empty list exit 0                                                                                              | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E3 S3.1   | `feat(parse): structured parse logging and hardened parse tests` — parse.file verbose event; parse.error on read/parse failure; 12 parse tests; generate verbose parse.file integration; code review patches applied                                                   | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E3 S3.2   | `feat(output): structured output logging and hardened wiki tests` — output.write verbose event; output.error on mkdir/write failure; generate.summary in command layer; 11 new wiki tests; generate output.write integration                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E4 S4.1   | `feat(output): HTML title escaping and render.error logging` — exported escapeHtml/wrapHtml; apostrophe escaping; render.error on marked.parse failure; 10 new tests; wiki.ts 100% lines                                                                               | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E4 S4.2   | `feat(output): HTML wiki write logging and path confinement tests` — output.write verbose for html/ paths; output.error on mkdir/write failure; 8 new writeHtmlWiki tests; generate integration updated for htmlFiles                                                  | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E5 S5.1   | `feat(output): slug collision disambiguation with hash suffix` — assignUniqueSlugs in buildWiki; output.slug-collision verbose event; collision-project fixture; 7 new tests; generate integration for collisions                                                      | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E5 S5.2   | `feat(output): path traversal guards on wiki writes` — assertPathConfined with path.resolve/relative check; output.error on rejection; 5 traversal tests for markdown and HTML writes                                                                                  | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E6 S6.1   | `feat(cli): command lifecycle logging and error boundary` — cli.command (verbose) + cli.error (always); removed duplicate scan console.log; CLI try/catch exit 1; 8 new tests; generate.ts 98.16% coverage                                                             | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E6 S6.2   | `feat(cli): exit code contracts for usage vs runtime errors` — exit 2 for Commander usage errors with cli.error; exit 1 runtime unchanged; exitOverride before subcommands; 4 new CLI tests; documented in IMPLEMENTATION.md                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E7 S7.1   | `test(dogfood): end-to-end generate validation on sample-project fixture` — 10 pages / 8 categories in ~0.4s; full verbose pipeline log chain; FR-006 repo-root scope documented; 1 new CLI dogfood test                                                               | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E7 S7.2   | `test(harness): §13 deliverables guards and MVP sign-off checklist` — automated meta/logging guards; §13 checklist + §0.8 audit in IMPLEMENTATION.md; E1–E7 marked complete; 10 new harness tests                                                                      | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | MVP close | **MVP formally closed** — owner sign-off; all E1–E7 stories promoted to `done`; `mvp_status: closed` in sprint-status; quality gate re-verified (147 tests)                                                                                                            | uncommitted           | test ✓ · lint ✓ · typecheck ✓ · build ✓                         |
| 2026-07-12 | E16 S16.1 | `feat(output): Mustache HTML renderer with Wikimedia design tokens` — HtmlRenderer + mustache templates; bundled specwiki.css; wrapHtml removed; mustache + wikimedia-ui-base deps (AD-11); 9 renderer tests; renderer.ts 100% coverage                                | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-12 | E16 S16.2 | `feat(output): Wikipedia layout chrome and navigation` — WikiPage description/sections metadata; three-column Mustache chrome (category nav, infobox, TOC rail); Main Page index portal; output.render verbose event; 15 new/updated tests; renderer.ts 98.8% coverage | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓ |
| _template_ | _E?_ S?_  | _`<type>(<scope>): imperative summary`_                                                                                                                                                                                                                                | _hash or uncommitted_ | _full §0.2 gate result_                                         |
