# specwiki — Implementation Build Log

**Last updated:** 2026-07-19
**Current position:** **E21 S21.5 release dependency audit gate** — review
**Test count:** 558 passing

## Deliverables

| Deliverable                                                                       | Status                                      | Reference                  |
| --------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| `IMPLEMENTATION.md` build log                                                     | Complete through E7                         | this file                  |
| Quality gate scripts (`test`, `lint`, `format`, `coverage`, `typecheck`, `build`) | Verified — full §0.2 gate green (S1.2)      | `package.json`             |
| Structured logger (`src/core/Logger.ts`)                                          | Complete — E1 S1.3                          | `src/core/Logger.ts`       |
| `specwiki list` + discover logging                                                | Complete — E2                               | `src/discover/specs.ts`    |
| Markdown wiki (`wiki/*.md`)                                                       | Complete — E3                               | `src/output/wiki.ts`       |
| HTML wiki (`wiki/html/`)                                                          | Complete — E4; **E16 S16.1 skin** in review | `src/output/html/`         |
| Slug collision disambiguation                                                     | Complete — E5 S5.1                          | HARNESS §11 #1             |
| CLI contracts + exit codes                                                        | Complete — E6                               | `src/cli.ts`               |
| Custom discovery `--patterns` override                                            | Complete — E8 S8.1                          | `src/config/patterns.ts`   |
| Project config file loader                                                        | Complete — E8 S8.2                          | `src/config/loader.ts`     |
| Extended default patterns                                                         | Complete — E8 S8.3                          | `src/discover/specs.ts`    |
| README folder index binding                                                       | Complete — E8 S8.4                          | `src/output/wiki.ts`       |
| JSON machine-readable command output                                              | Complete — E9 S9.1, awaiting review         | `src/commands/generate.ts` |
| Opt-in `wiki/llms.txt` export                                                     | Complete — E9 S9.2, awaiting review         | `src/output/llms.ts`       |
| HTML dark theme                                                                   | Complete — E19 S19.1, awaiting review       | `src/output/html/`         |
| Responsive HTML layout and mobile navigation                                      | Complete — E19 S19.2, awaiting review       | `src/output/html/`         |
| Wide-screen reading measure and sticky header                                     | Complete — E19 S19.3, awaiting review       | `src/output/html/`         |
| Accessible keyboard-driven HTML search                                            | Complete — E19 S19.4, awaiting review       | `src/output/html/`         |
| Collapsible category navigation                                                   | Complete — E19 S19.5, awaiting review       | `src/output/html/`         |
| Tablet breadcrumb layout stability                                                | Complete — E19 bugfix, awaiting review      | `src/output/html/`         |
| npm package publish contract                                                      | In progress — E13 S13.1 Task 1              | `package.json`, `LICENSE`  |
| GitHub Actions CI workflow                                                        | Complete — E13 S13.2, awaiting review       | `.github/workflows/ci.yml` |
| Publication README + launch marketing pack                                        | Complete — E13 S13.3, awaiting review       | `docs/marketing/`          |
| MVP sign-off (HARNESS §13)                                                        | **Closed** — E7 S7.2 owner sign-off         | below                      |

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

**Next work:** POST-MVP per [`POST-MVP-ROADMAP.md`](./_bmad-output/planning-artifacts/discovery/POST-MVP-ROADMAP.md) — E16 (Wikipedia HTML skin) in progress; E9+ backlog.

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
| Spec files found | 15 (extended defaults, S8.3)     |
| Wiki pages       | 15                               |
| Categories       | 10                               |
| Generate time    | ~0.4s (< 60s AC)                 |
| Markdown + HTML  | ✓ `index.md` + `html/index.html` |

**Extended default patterns (FR-006 / S8.3):** `DEFAULT_SPEC_PATTERNS` now includes `**/AGENTS.md`, `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md`, and `**/README.md` appended after legacy entries. Running `specwiki list --project .` on the specwiki repository discovers root `README.md`, `_bmad-output/`, `.agents/skills/`, and nested agent files alongside existing defaults.

**Broad markdown discovery (FR-036 / S17.1):** `DEFAULT_SPEC_PATTERNS` appends catch-all `**/*.{md,mdc}` so zero-config generate discovers any markdown in the project. Ignore list extended with `.git`, `coverage`, `.venv`, and `vendor`. Verbose mode emits `discover.large-set` when match count exceeds 500. Custom config / `--patterns` still replace the full default list.

**README folder index (FR-035 / S8.4):** When a directory contains both `README.md` and other discovered specs, the README parsed body becomes the introductory content for that category section on `wiki/index.md` and `wiki/html/index.html`. Root `README.md` replaces the auto-generated main-index boilerplate. README files still emit standalone wiki pages. Verbose generate emits `parse.readme-index` (folder bindings) and `output.index` with `readmeIndexCount`.

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

- [x] **E8 — Custom Discovery Configuration** — `--patterns`, config loader, extended defaults, `README.md` discovery and folder index pages _(done)_
  - [x] S8.1 — `--patterns` CLI flag _(done)_
  - [x] S8.2 — Project config file loader _(done)_
  - [x] S8.3 — Extended default patterns _(done)_
  - [x] S8.4 — README discovery and folder index _(done)_
- [ ] **E9 — Agent Interoperability** — `--json`, `llms.txt` _(in progress)_
  - [x] S9.1 — JSON machine-readable output _(review)_
  - [x] S9.2 — wiki/llms.txt export _(review)_
- [ ] **E10 — Team CI Freshness** — `generate --check`
- [ ] **E11 — Live Developer Loop** — `--watch`, `serve`
- [ ] **E12 — Semantic Framework Enrichment** — Cursor badges, OpenSpec grouping, BMAD cards
- [ ] **E13 — Distribution & Publish** — npm, GitHub Actions _(in progress)_
  - [ ] S13.1 — npm publish preparation _(Task 1 package contract complete; awaiting review)_
- [ ] **E14 — Ecosystem Export & Intelligence** — SSG export, drift, plugins
- [ ] **E15 — IDE Integration** — wiki panel extension (future bet; POST-MVP Bet 1)
- [ ] **E23 — MemPalace Integration** — palace export → browsable wiki (future bet; POST-MVP Bet 7)
- [ ] **E24 — Obsidian Integration** — vault export + Obsidian-as-source workflows (future bet; POST-MVP Bet 8)
- [ ] **E16 — Wikipedia-Style HTML Wiki** — Vector-inspired skin, navigation chrome, search _(done)_
  - [x] S16.1 — Mustache HTML renderer and Wikimedia assets _(review)_
  - [x] S16.2 — Wikipedia layout chrome and navigation
  - [x] S16.3 — Rich HTML content rendering
  - [x] S16.4 — Client-side wiki search _(review)_
  - [x] S16.5 — HTML inter-page link resolution
- [ ] **E17 — CLI Developer Experience** — broad markdown discovery, `open`, `init` _(in progress — impromptu)_
  - [x] S17.1 — Broad markdown discovery by default _(review)_
  - [x] S17.2 — `specwiki open` browser command _(review)_
  - [x] S17.3 — `specwiki init` config scaffold _(review)_
- [ ] **E19 — Wiki UX Uplift (Strategy A)** — dark mode, responsive, reading measure, search UX, scroll-spy TOC, dashboard, portals, backlinks, callouts, Mermaid _(in progress)_
  - [x] S19.1 — Dark mode with pre-paint theme and toggle _(review)_
  - [x] S19.2 — Responsive layout and mobile navigation drawer _(review)_
  - [x] S19.3 — Reading measure and sticky header _(review — wide-screen grid preserves breakpoint/mobile geometry)_
  - [x] S19.4 — Search interaction upgrade _(review)_
  - [x] S19.5 — Collapsible category navigation _(review)_
- [ ] **E20 — Landing Page & Launch Surface** — narrative page, responsive/a11y hardening, hosting _(in progress)_
  - [x] S20.1 — Landing-page narrative and brand treatment (v2) _(review)_
  - [x] S20.2 — Responsive, accessible landing-page implementation _(review)_
  - [x] S20.3 — specwiki.ai hosting and release workflow _(review)_
  - [x] Landing copy-to-clipboard on quick start + agent prompt _(review)_
- [ ] **E23 — Navigation Drawer Hierarchy** — path grouping, BMad catalog, nested disclosure, portal/search parity _(in progress)_
  - [x] S23.1 — Nav grouping module + path-segment baseline _(review)_
  - [x] S23.2 — BMad catalog enrichment (CSV/TOML hybrid Agent Skills) _(review)_
  - [x] S23.3 — Nested disclosure UI (collapsible nav subgroups) _(review)_
  - [x] S23.6 — Agent Skills phase group dedup (skill-folder L2) _(review)_
  - [x] S23.7 — Breadcrumb subgroup parity _(review)_
- [ ] **E27 — Live Hero Example (specwiki.ai/examples)** — _idea logged 2026-07-18; conversion-first; not started_
  - Hero: `examples/agent-harness-parcel` → live wiki on landing §04; gallery deferred
  - Spec: [`epic-27-live-examples-gallery.md`](./_bmad-output/implementation-artifacts/epic-27-live-examples-gallery.md)

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

| Item                                      | Status | Evidence                                                                                  |
| ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| All §0.2 quality gate commands pass       | ✓      | S7.2 gate run (see build log row)                                                         |
| §0.2.5 automated code review per task     | ✓      | Story files under `Senior Developer Review (AI)`                                          |
| §0.2.6 QA analysis with manual validation | ✓      | Story files under `QA Manual Validation`                                                  |
| Coverage ≥ 90% repo-wide                  | ✓      | vitest thresholds + coverage run                                                          |
| Comments follow §0.6                      | ✓      | Minimal, non-obvious only                                                                 |
| Code cleanliness follows §0.7             | ✓      | Focused modules; no scope creep                                                           |
| Structured logging follows §0.8           | ✓      | Logger in all pipeline modules; audit below                                               |
| Path/HTML safety follows §0.9             | ✓      | `escapeHtml`, `assertPathConfined`, `resolveOutputWithinProject`; README security section |

## §0.8 Logging Audit (E2–E6)

Every MVP feature story shipped structured logging ACs. No deferred logging epic.

| Story      | Module(s)                      | Events verified                                                     |
| ---------- | ------------------------------ | ------------------------------------------------------------------- |
| S2.3       | discover/specs.ts              | discover.start, discover.match, discover.complete, discover.error   |
| S2.4       | discover/specs.ts              | discover.empty                                                      |
| S3.1       | parse/markdown.ts              | parse.file, parse.error                                             |
| S3.2       | output/wiki.ts                 | output.write, output.error                                          |
| S4.1       | parse/markdown.ts              | render.error                                                        |
| S4.2       | output/wiki.ts                 | output.write (html/), output.error                                  |
| S5.1       | output/wiki.ts                 | output.slug-collision                                               |
| S5.2       | output/wiki.ts                 | output.error (path guard)                                           |
| S6.1       | commands/generate.ts, cli.ts   | cli.command, cli.error, generate.summary                            |
| S6.2       | cli.ts                         | cli.error (usage vs runtime)                                        |
| S7.1       | (integration)                  | Full verbose chain in dogfood CLI test                              |
| S16.3      | parse/markdown.ts              | render.error (unchanged)                                            |
| S16.4      | output/wiki.ts, search-index   | output.write (search-index.json), output.search-index, output.error |
| S16.5      | wiki-link-resolver.ts, wiki.ts | output.link-unresolved (verbose); render.error unchanged            |
| S17.2      | commands/open.ts, cli.ts       | cli.command, open.error, open.launch                                |
| S17.3      | commands/init.ts, cli.ts       | cli.command, init.error, init.write                                 |
| S19.1      | output/wiki.ts (unchanged)     | output.write covers specwiki.css and highlight.css                  |
| S19.2      | output/wiki.ts (unchanged)     | output.write covers modified specwiki.css                           |
| S19.3      | output/wiki.ts (unchanged)     | output.write covers modified specwiki.css                           |
| S19.5      | output/wiki.ts (unchanged)     | output.write covers modified specwiki.css                           |
| E19 bugfix | output/wiki.ts (unchanged)     | output.write covers modified specwiki.css                           |
| S24.1      | output/wiki.ts (unchanged)     | output.write covers modified specwiki.css                           |

User-facing summaries remain on stdout via chalk; diagnostics use JSON stderr via `Logger.ts`.

## Build Log

One row per completed story/task. Quality gate column uses §0.2 shorthand: `test · lint · format · coverage · typecheck · build`.

| Date       | Story            | Summary                                                                                                                                                                                                                                                                                                                                                                                                                      | Commit                | Quality gate                                                                         |
| ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| 2026-07-12 | E1 S1.1          | `docs: create IMPLEMENTATION.md build log and MVP epic checklist` — §0.8 N/A (doc-only); structured logging required in runtime stories from S1.3 onward                                                                                                                                                                                                                                                                     | ec535e2               | typecheck ✓ · build ✓                                                                |
| 2026-07-12 | E1 S1.2          | `chore: verify §0.2 quality gate on brownfield baseline` — fixed Prettier format on 16 doc files; per-file branch gaps documented (`discover/specs.ts` 87.5%, `output/wiki.ts` 82.6%; repo aggregate 90.32% meets threshold)                                                                                                                                                                                                 | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E1 S1.3          | `feat(core): add structured Logger module with verbose-gated log.info` — JSON events to stderr; 7 unit tests; `src/core/` 100% coverage                                                                                                                                                                                                                                                                                      | 921c2f8               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E2 S2.1          | `test(discover): exhaustive deriveCategory tests and list grouping assertions` — exported deriveCategory; 16 new tests; discover branch coverage 95.34%                                                                                                                                                                                                                                                                      | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E2 S2.2          | `feat(list): show human-readable titles in list output` — exported deriveTitle; 12 unit tests; list lines formatted as `{title} — {path}`                                                                                                                                                                                                                                                                                    | d5563be               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E2 S2.3          | `feat(discover): structured discover logging and list --verbose` — discover.start/match/complete/error events; CLI and command verbose wiring; 8 new tests; discover branch coverage 100%                                                                                                                                                                                                                                    | 9e5c1e1               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E2 S2.4          | `feat(list): zero-match helpful tip and discover.empty logging` — list tip parity with generate; discover.empty verbose event; 3 new tests; CLI e2e for empty list exit 0                                                                                                                                                                                                                                                    | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E3 S3.1          | `feat(parse): structured parse logging and hardened parse tests` — parse.file verbose event; parse.error on read/parse failure; 12 parse tests; generate verbose parse.file integration; code review patches applied                                                                                                                                                                                                         | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E3 S3.2          | `feat(output): structured output logging and hardened wiki tests` — output.write verbose event; output.error on mkdir/write failure; generate.summary in command layer; 11 new wiki tests; generate output.write integration                                                                                                                                                                                                 | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E4 S4.1          | `feat(output): HTML title escaping and render.error logging` — exported escapeHtml/wrapHtml; apostrophe escaping; render.error on marked.parse failure; 10 new tests; wiki.ts 100% lines                                                                                                                                                                                                                                     | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E4 S4.2          | `feat(output): HTML wiki write logging and path confinement tests` — output.write verbose for html/ paths; output.error on mkdir/write failure; 8 new writeHtmlWiki tests; generate integration updated for htmlFiles                                                                                                                                                                                                        | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E5 S5.1          | `feat(output): slug collision disambiguation with hash suffix` — assignUniqueSlugs in buildWiki; output.slug-collision verbose event; collision-project fixture; 7 new tests; generate integration for collisions                                                                                                                                                                                                            | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E5 S5.2          | `feat(output): path traversal guards on wiki writes` — assertPathConfined with path.resolve/relative check; output.error on rejection; 5 traversal tests for markdown and HTML writes                                                                                                                                                                                                                                        | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E6 S6.1          | `feat(cli): command lifecycle logging and error boundary` — cli.command (verbose) + cli.error (always); removed duplicate scan console.log; CLI try/catch exit 1; 8 new tests; generate.ts 98.16% coverage                                                                                                                                                                                                                   | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E6 S6.2          | `feat(cli): exit code contracts for usage vs runtime errors` — exit 2 for Commander usage errors with cli.error; exit 1 runtime unchanged; exitOverride before subcommands; 4 new CLI tests; documented in IMPLEMENTATION.md                                                                                                                                                                                                 | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E7 S7.1          | `test(dogfood): end-to-end generate validation on sample-project fixture` — 10 pages / 8 categories in ~0.4s; full verbose pipeline log chain; FR-006 repo-root scope documented; 1 new CLI dogfood test                                                                                                                                                                                                                     | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E7 S7.2          | `test(harness): §13 deliverables guards and MVP sign-off checklist` — automated meta/logging guards; §13 checklist + §0.8 audit in IMPLEMENTATION.md; E1–E7 marked complete; 10 new harness tests                                                                                                                                                                                                                            | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | MVP close        | **MVP formally closed** — owner sign-off; all E1–E7 stories promoted to `done`; `mvp_status: closed` in sprint-status; quality gate re-verified (147 tests)                                                                                                                                                                                                                                                                  | uncommitted           | test ✓ · lint ✓ · typecheck ✓ · build ✓                                              |
| 2026-07-12 | E16 S16.1        | `feat(output): Mustache HTML renderer with Wikimedia design tokens` — HtmlRenderer + mustache templates; bundled specwiki.css; wrapHtml removed; mustache + wikimedia-ui-base deps (AD-11); 9 renderer tests; renderer.ts 100% coverage                                                                                                                                                                                      | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E16 S16.2        | `feat(output): Wikipedia layout chrome and navigation` — WikiPage description/sections metadata; three-column Mustache chrome (category nav, infobox, TOC rail); Main Page index portal; output.render verbose event; 15 new/updated tests; renderer.ts 98.8% coverage                                                                                                                                                       | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E16 S16.3        | `feat(parse): rich HTML content rendering with GFM and highlight.js` — exported slugify; heading ids h2–h6 matching TOC anchors; highlight.js fenced code blocks; highlight.css asset; `.mw-parser-output` wrapper; 10 new tests; markdown.ts 100% coverage                                                                                                                                                                  | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-12 | E16 S16.4        | `feat(output): client-side wiki search with lunr index` — buildSearchIndex at generate time; inline JSON for file://; header search UI; `--no-search` flag; All pages index section; lunr@^2.3.9 dep; 14 new tests; 194 tests total; repo coverage 95.79%                                                                                                                                                                    | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-14 | E8 S8.1          | `feat(discover): add custom --patterns CLI override` — comma-aware glob parser; list/generate wiring; sanitized config diagnostics; project-root pattern guard; discover confinement; review patches applied; 32 new tests; 226 tests total; repo coverage 96.1%                                                                                                                                                             | 2e23250               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-14 | E8 S8.4          | `feat(output): README folder index binding for wiki index pages` — resolveReadmeIndexBindings; root/category intros on md+html index; parse.readme-index + output.index logging; packages/nested README fixture; 25 new tests; 272 tests total; repo coverage 95.3%                                                                                                                                                          | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-14 | E8 close         | **E8 formally closed** — owner sign-off; all S8.1–S8.4 stories promoted to `done`; custom discovery configuration complete                                                                                                                                                                                                                                                                                                   | uncommitted           | test ✓ (272 tests)                                                                   |
| 2026-07-14 | E17 S17.2        | `feat(cli): specwiki open browser command` — cross-platform execFile launcher; path + symlink confinement; open.error/open.launch logging; injectable test handler; 13 new tests; 292 tests total; open.ts 93.78% coverage                                                                                                                                                                                                   | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-14 | E17 S17.3        | `feat(cli): specwiki init config scaffold` — writes specwiki.config.json with DEFAULT_SPEC_PATTERNS; --force overwrite guard; init.error/init.write logging; 20 new tests; 312 tests total; init.ts 97.87% coverage                                                                                                                                                                                                          | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | Brand v1         | `feat(brand): [[specwiki]] wordmark in HTML header, branded CLI summary, SVG kit` — logo spans + generator meta in layout; `.specwiki-logo-bracket` accent CSS; `[[specwiki]] mapped N specs across M categories` summary; docs/brand/ SVG wordmarks (light/dark) + BRAND.md; 3 new/updated tests; 314 tests total                                                                                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E19 S19.1        | `feat(output): add flicker-free persistent HTML dark mode` — pre-paint saved-theme initializer; accessible header toggle; system/no-JS fallback; semantic light/dark and syntax tokens; local variable-based highlight asset; 5 new tests; 318 tests total                                                                                                                                                                   | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E19 S19.2        | `feat(output): add responsive HTML layout and mobile navigation drawer` — single-column layout below 720px; accessible progressive drawer with inert closed state and mobile-safe scroll lock; in-flow no-JS nav and TOC; compact 320px header; contained table/code overflow; 3 new tests; 321 tests total                                                                                                                  | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E19 S19.4        | `feat(output): upgrade HTML search interactions` — accessible combobox/listbox keyboard flow; merged human-readable category groups; highlighted result cards; explicit empty state; bidirectional drawer precedence; visible active-option scrolling; safe DOM rendering; 13 new tests; 333 tests total                                                                                                                     | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E19 S19.3        | `feat(output): add regression-safe reading measure and sticky header` — coherent 70ch article grid only at ≥1200px; full-column table/code escape; exact 43px sticky offsets; portal geometry unchanged; 720px/375px baseline geometry preserved; 1 new test; 334 tests total                                                                                                                                                | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E19 S19.5        | `feat(output): add collapsible category navigation` — native multi-page category disclosures default closed on index and active-open on articles; count badges and tokenized chevrons; single-page groups remain visible; 3 new tests; 337 tests total                                                                                                                                                                       | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E19 bugfix       | `fix(output): stack tablet article infobox` — stacks the infobox below 1200px so wrapped breadcrumbs cannot shift article content; preserves desktop float and mobile drawer rules; 2 new tests; 339 tests total                                                                                                                                                                                                             | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E9 S9.1          | `feat(cli): add stable JSON output for list and generate` — restricted machine-readable schemas, zero-match JSON, verbose `output.json` diagnostics, and command/CLI regression coverage; 346 tests total                                                                                                                                                                                                                    | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E9 S9.2          | `feat(output): add opt-in wiki llms.txt export` — category-grouped manifest from generated page metadata; safe output logging/confinement; command and CLI regression coverage; 352 tests total                                                                                                                                                                                                                              | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E13 S13.1 Task 1 | `chore(package): define npm publish contract` — package allowlist for built artifacts, explicit contributor hook setup, MIT license, and four manifest contract tests; 356 tests total                                                                                                                                                                                                                                       | uncommitted           | test ✓ · lint ✓ · format ⚠ unrelated owner edit · coverage ✓ · typecheck ✓ · build ✓ |
| 2026-07-15 | E13 S13.2        | `ci: add GitHub Actions quality gate on push and PR` — ubuntu-latest + Node 20; npm ci then canonical §0.2 scripts as separate steps; six workflow contract tests; no publish/registry automation; 362 tests total                                                                                                                                                                                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-15 | E13 S13.3        | `docs(marketing): publication README review, market research, and launch copy` — UX-led README rewrite (consumer install first, quick-start, [[specwiki]] wordmark); `docs/marketing/readme-review.md`, `market-research.md`, `launch-copy.md`; CLI help spot-checked; doc-only (no quality gate)                                                                                                                            | uncommitted           | N/A (doc-only)                                                                       |
| 2026-07-16 | E20 S20.1        | `feat(site): v2 landing page with editorial dark-first brand treatment` — five-section static page (hero narrative + quick start + agent prompt, problem coverage table, how-it-works, live spec→wiki example with static wiki mock, facts strip); canonical BRAND.md tokens dark-first; v1 `href="/"` fix; 3 review patches applied (Main Page mock heading, subfolder link, repo-root note); 29 new tests; 402 tests total | 610b656               | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-16 | E20 S20.2        | `feat(site): responsive and accessible landing page hardening` — skip link + focusable main, :focus-visible outlines, coverage-table scroll wrapper, minmax(min(100%)) grids for 320px, narrow-viewport CSS, muted-text contrast bump (0.72), prefers-reduced-motion; 13 new tests; 415 tests total; no src/ changes                                                                                                         | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-16 | E20 S20.3        | `ci(site): GitHub Pages deploy workflow for specwiki.ai` — `build-landing-site.mjs` copies site/ to dist/landing-site with CNAME/.nojekyll; deploy-site.yml with split production/preview jobs and `--skip-cname` on PRs; docs/hosting/specwiki-ai.md; 17 new tests; 432 tests total; no src/ changes                                                                                                                        | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-16 | Security         | `fix(generate): confine --output to project root` — shared `resolveOutputWithinProject` with symlink checks (parity with `open`); README Security section; generate/CLI/paths regression tests; 442 tests total                                                                                                                                                                                                              | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-16 | E20 copy buttons | `feat(site): add copy-to-clipboard on landing quick start and agent prompt` — per-snippet Copy next to `# Try without installing` / `# Or install globally` plus agent-prompt Copy; clipboard API with execCommand fallback on rejection; aria-live status + aria-label feedback; timer race fix; progressive-enhancement `landing.js`; 453 tests total; no src/ changes                                                     | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-17 | E23 S23.1        | `feat(output): nav grouping module with path-segment baseline` — `nav-grouping.ts` L0/L3 inference, singleton promotion, 2-level depth cap; `buildNavCategories` subgroup view model; static subgroup headings in Mustache; `projectRoot` threaded through `writeHtmlWiki`; enriched sample-project fixture; 485 tests total; `src/output/html/` 96.73% coverage                                                             | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-17 | E23 S23.2        | `feat(output): BMad catalog enrichment for Agent Skills nav` — CSV/TOML load into `NavGroupingContext`; hybrid Your team → SDLC → Core/Deprecated/Uncatalogued grouping with L4 display titles; realpath catalog confinement + DEPRECATED multi-row merge; sample-project fixtures; 504 tests; `src/output/html/` ≥90%                                                                                                       | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-17 | E23 S23.6        | `feat(output): nest multi-page Agent Skills under phase groups` — hybrid phase buckets get skill-folder L2 (CSV/agent L4 as subgroup label; wiki titles on leaves); single-page skills stay as L4 phase leaves; uncatalogued multi-page uses humanized skill id; 23-IMP-1; 508 tests; `src/output/html/` ≥90%                                                                                                                | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-17 | E23 S23.3        | `feat(output): collapsible nested nav subgroups` — Mustache partials with nested `<details>` for L1/L2 subgroups; route-aware `open`; count badges; CSS chevrons; recursive template copy in `copy-html-assets.mjs`; 23-IMP-2; `src/output/html/` ≥90%                                                                                                                                                                       | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-18 | E23 S23.7        | `feat(output): breadcrumb subgroup parity with drawer ancestry` — `resolveActiveSubgroupTrail` walks finalized `NavSubgroup[]`; `buildBreadcrumbs` inserts L1/L2 labels after category; explicit `current` flag fixes `aria-current`; 23-IMP-3; 516 tests; `src/output/html/` ≥90%                                                                                                                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-18 | E24 S24.1        | `feat(output): article heading type scale and serif h1-h2` — `:root` `--font-size-h1`–`h6` tokens; `.specwiki-article-body .mw-parser-output` heading typography (serif h1–h2, sans h3–h6, h2 divider); `.specwiki-portal h1` parity; generated-CSS regression test; portal-intro scope fix from code review; 517 tests; `src/output/html/` 97.11%                                                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-18 | E24 S24.2        | `feat(output): chrome type tokens and system sans alignment` — `:root` `--font-size-caption/ui-sm/ui/body` + `--font-family-monospace-brand`; body `--font-family-system-sans`; nav/search/breadcrumb/TOC/infobox refactored to tokens; BRAND mono on logo/code/pre; chrome weight rhythm (600 labels, 700 active category + TOC); generated-CSS test; 518 tests; `src/output/html/` 97.11%                                  | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-18 | E24 S24.3        | `docs(brand): wiki typography specification in BRAND.md` — type scale token ladder, font stacks, chrome surface map, weight rhythm, landing-vs-wiki divergence, research links; §0.8 N/A (doc-only); no src/ changes                                                                                                                                                                                                         | uncommitted           | typecheck ✓ · build ✓                                                                |
| 2026-07-18 | E25 S25.1        | `feat(adr): scaffold docs/adr with wiki category discovery` — `docs/adr/index.md` + `template.md` (MADR skeleton, status lifecycle, authoring norms); `deriveCategory` maps `docs/adr/` → `adr`; `CATEGORY_LABELS.adr` = Architecture Decisions; `CATEGORY_PATH_PREFIXES` parity; 520 tests; `src/discover/specs.ts` 100%                                                                                                    | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-18 | E25 S25.2        | `docs(adr): foundational ADRs 0001, 0003, 0004, 0007, 0009` — path confinement, config trust model, static output boundary, CLI dual-audience contract, runtime dep budget (supersedes AD-11); index table + summaries; doc-only; §0.8 N/A; no src/ changes                                                                                                                                                                  | uncommitted           | wiki smoke ✓                                                                         |
| 2026-07-18 | E27 (idea)       | Logged epic: live hero example on specwiki.ai — conversion-first (`agent-harness-parcel`); party-mode architecture + owner decision breadth→conversion; `epic-27-live-examples-gallery.md`, sprint-status, epics index; no stories started                                                                                                                                                                                   | uncommitted           | planning only                                                                        |
| 2026-07-19 | E16 S16.5        | `feat(output): HTML inter-page link resolution for markdown body links` — `wiki-link-resolver.ts` index + resolver; optional `linkResolver` on `renderMarkdown`; wired in `writeHtmlWiki` + index intros; per-segment category intro link bases for merged READMEs; verbose `output.link-unresolved`; 28 new tests; 548 tests total; `wiki-link-resolver.ts` 95.87% coverage                                                 | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-19 | E21 S21.3        | `docs(security): add SECURITY.md vulnerability reporting policy` — GitHub Private Security Advisory path; supported versions table; in/out of scope aligned with README and ADR-0001/0003; README Security links to SECURITY.md; §0.8 N/A (doc-only)                                                                                                                                                                         | uncommitted           | typecheck ✓ · build ✓                                                                |
| 2026-07-19 | E21 S21.4        | `feat(config): trust warning when loading specwiki.config.js` — stderr yellow user message + always-on `config.warn` with basename only; once-per-process guard; `log.warn` in Logger; review patches (ESM CLI fixture helper, warn-after-import test); 556 tests total; loader.ts 94.04% coverage                                                                                                                           | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| 2026-07-19 | E21 S21.5        | `feat(publish): release-time dependency audit gate` — `npm run audit` (`--audit-level=high --omit=dev`) as seventh prepublish step; `PREPUBLISH_STEPS` / `AUDIT_STEP`; verbose `publish.prep audit` diagnostics; README exception policy; 558 tests total                                                                                                                                                                    | uncommitted           | test ✓ · lint ✓ · format ✓ · coverage ✓ · typecheck ✓ · build ✓                      |
| _template_ | _E?_ S?_         | _`<type>(<scope>): imperative summary`_                                                                                                                                                                                                                                                                                                                                                                                      | _hash or uncommitted_ | _full §0.2 gate result_                                                              |
