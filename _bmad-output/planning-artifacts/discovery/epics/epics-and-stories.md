---
title: specwiki Epics and Stories
product: specwiki
status: final
created: 2026-07-12
updated: 2026-07-12
author: Discovery loop (vertical slicing; logging woven per story)
sources:
  - _bmad-output/planning-artifacts/discovery/prd/prd.md
  - _bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md
  - HARNESS.md §0.8, §0.10
slicing: vertical + INVEST
stepsCompleted:
  [step-vertical-slice-restructure, step-logging-merged-into-features]
---

# specwiki — Epics and Stories

Stories are **vertical slices** per **HARNESS §0.10**. **Structured logging (§0.8) is not a separate epic** — every story includes **Logging & diagnostics** and **Quality measures** acceptance criteria alongside functional ACs.

**Brownfield note:** v0.1 implements list → generate. Remaining MVP work is hardening via vertical slices with logging shipped in the same story as the feature.

---

## Story slicing principles (HARNESS §0.10)

| Principle             | Application                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Vertical**          | User journey: list specs, generate markdown, generate HTML, trustworthy output, CLI contracts, sign-off |
| **INVEST**            | Each story: `INVEST: I✓ N✓ V✓ E✓ S✓ T✓`                                                                 |
| **Logging woven in**  | No logging epic — §0.8 events ship with the feature story that touches those code paths                 |
| **Demo path**         | CLI command + fixture proving value after merge                                                         |
| **Logger foundation** | `src/core/Logger.ts` introduced in **E1 S1.3**; all later stories use it                                |

### Mandatory AC blocks (every story)

Every story below has three AC groups:

1. **Functional** — user-visible outcome
2. **Logging & diagnostics (§0.8)** — structured events, verbose gating, safe payloads
3. **Quality measures** — §0.2 gate + coverage on touched modules

**Post-implementation (HARNESS §0.2.5–§0.2.6, not separate AC):** after each story, the
implementing agent runs automated code review and QA analysis subagents on a different LLM,
includes results in the §0.3 checkpoint, and asks the owner whether to apply review patches
before committing.

Doc-only or verify-only stories (E1) use minimal logging ACs where no runtime code changes.

---

## MVP Epics

### E1 — Project Foundation

**Vertical slice:** Harness, quality gate, and `Logger.ts` exist before feature work.

**Binds:** FR-030, FR-021, NFR-001, NFR-002, NFR-004, NFR-006, HARNESS §9 Phase 0, 3.1

| Story | Summary                       | HARNESS |
| ----- | ----------------------------- | ------- |
| S1.1  | `IMPLEMENTATION.md` build log | 0.1     |
| S1.2  | Verify quality-gate tooling   | 0.2–0.4 |
| S1.3  | Structured `Logger.ts` module | 3.1     |

#### S1.1 — Create IMPLEMENTATION.md build log

**As a** implementation agent, **I want** a single authoritative build log, **so that** every vertical slice records progress audibly.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Open `IMPLEMENTATION.md` — checklist and build log visible.

**HARNESS:** Phase 0.1 | **FR:** FR-030

**Functional:**

- [ ] `IMPLEMENTATION.md` at repo root with status header
- [ ] Checklist lists MVP epics E1–E7 with checkboxes
- [ ] Build log table: date, story, summary, commit, quality-gate status
- [ ] References HARNESS §0 workflow, §0.8, §0.10
- [ ] `npm run typecheck` and `npm run build` pass

**Logging & diagnostics (§0.8):**

- [ ] N/A — no runtime code; document §0.8 requirement in build log template row

**Quality measures:**

- [ ] `typecheck` and `build` pass

#### S1.2 — Verify quality-gate tooling

**As a** developer, **I want** the §0.2 gate green on brownfield code, **so that** feature slices start from a known-good baseline.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Full §0.2 sequence — all pass.

**HARNESS:** Phase 0.2–0.4 | **NFR:** NFR-001, NFR-002, NFR-004

**Functional:**

- [ ] Vitest + coverage v8 ≥ 90%; ESLint + Prettier configured
- [ ] Scripts: `test`, `coverage`, `lint`, `format`, `typecheck`, `build`
- [ ] `tests/` mirrors `src/`; fixture has ≥ 5 discoverable specs
- [ ] Full gate passes; gaps documented in build log

**Logging & diagnostics (§0.8):**

- [ ] N/A — verification only unless gaps require fixes

**Quality measures:**

- [ ] Full §0.2 gate passes on current codebase

#### S1.3 — Structured Logger module

**As a** developer, **I want** a shared verbose-gated logger, **so that** every feature story emits consistent diagnostics.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Unit test — `log.info` suppressed without verbose; `log.error` always emits.

**HARNESS:** Phase 3.1 | **FR:** FR-021 | **AD:** AD-9

**Functional:**

- [ ] `src/core/Logger.ts` with `log.info` (verbose-gated) and `log.error` (always)
- [ ] Dot-separated event names; JSON-serializable payload objects
- [ ] No business logic in Logger module

**Logging & diagnostics (§0.8):**

- [ ] Logger unit tests cover verbose gate and error-always behaviour
- [ ] Logger writes to stderr; no stdout pollution

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `Logger.ts` has unit tests; coverage on `src/core/` ≥ 90%

---

### E2 — List Discovered Specs (`specwiki list`)

**Vertical slice:** discover → categorize → display; discover logging included.

**Binds:** FR-001–004, FR-021, NFR-002, NFR-006, NFR-007, AD-2, AD-3, HARNESS §9 Phase 1

| Story | Summary                              | HARNESS  |
| ----- | ------------------------------------ | -------- |
| S2.1  | Category grouping on list output     | 1.1      |
| S2.2  | Human-readable titles on list output | 1.2      |
| S2.3  | Fixture discovery + discover logging | 1.3, 1.4 |
| S2.4  | Zero-match helpful tip               | —        |

#### S2.1 — Category grouping on list output

**As** Alex, **I want** specs grouped by category when I run `specwiki list`, **so that** I see Cursor rules, OpenSpec, and root agent files separately.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki list --project tests/fixtures/sample-project` — grouped categories.

**HARNESS:** Phase 1.1 | **FR:** FR-002

**Functional:**

- [ ] `deriveCategory` covers all known path prefixes; prefix order tested
- [ ] `specwiki list` groups by category on fixture
- [ ] Category keys unchanged without owner approval (NFR-013)

**Logging & diagnostics (§0.8):**

- [ ] If `deriveCategory` paths change: errors use `log.error` with relative path context
- [ ] No raw `console.log` added in `discover/specs.ts`

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `discover/specs.ts` coverage ≥ 90% on touched functions

#### S2.2 — Human-readable titles on list output

**As** Alex, **I want** readable titles for SKILL and agent files, **so that** I recognize specs without reading paths.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** List on fixture — SKILL and AGENTS titles correct in generate index / derived titles.

**HARNESS:** Phase 1.2 | **FR:** FR-002

**Functional:**

- [ ] `deriveTitle` handles SKILL, AGENTS, SPEC, CLAUDE, GEMINI and generic basenames
- [ ] No regressions on fixture expectations

**Logging & diagnostics (§0.8):**

- [ ] No new diagnostic noise in default (non-verbose) list mode

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `deriveTitle` coverage ≥ 90%

#### S2.3 — Fixture discovery integration and discover logging

**As** Alex, **I want** `specwiki list` to find all specs and show discover diagnostics with `--verbose`, **so that** I trust discovery and can debug pattern misses.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3  
**Demo path:** `specwiki list --verbose --project tests/fixtures/sample-project` — `discover.start` + `discover.match` on stderr; default mode quiet.

**HARNESS:** Phase 1.3, 1.4 | **FR:** FR-001, FR-003, FR-021 | **AD:** AD-2

**Functional:**

- [ ] `discoverSpecs` returns expected count on fixture (≥ 5; actual 10)
- [ ] Sorted by category then `relativePath`; ignores node_modules/dist/wiki/.specwiki
- [ ] Default patterns cover Cursor, OpenSpec/Kiro, Copilot, root agents

**Logging & diagnostics (§0.8):**

- [ ] `discover.start` logs project root and pattern count (verbose only)
- [ ] `discover.match` logs each relative path (verbose only)
- [ ] `discover.error` on glob/read failures (always via `log.error`)
- [ ] Payloads: paths and counts only — no file bodies (NFR-007)
- [ ] Tests verify verbose vs non-verbose stderr behaviour

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `discoverSpecs` coverage ≥ 90%

#### S2.4 — Zero-match helpful tip

**As** Alex, **I want** a helpful tip when no specs are found, **so that** I know to check `--project` or patterns.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki list` on empty dir — exit 0 with tip.

**FR:** FR-004 | **AD:** AD-1

**Functional:**

- [ ] Zero matches: exit 0 with tip (consistent with generate)
- [ ] Test asserts tip and exit code

**Logging & diagnostics (§0.8):**

- [ ] `discover.empty` event when zero matches (verbose only) with pattern hint
- [ ] Tip remains on stdout (user-facing); diagnostics on stderr

**Quality measures:**

- [ ] Full §0.2 gate passes

**E2 gate:** List on fixture works; discover logging verified with `--verbose`.

---

### E3 — Generate Markdown Wiki (`wiki/*.md`)

**Vertical slice:** discover → parse → build → write markdown; parse logging included.

**Binds:** FR-007–013, FR-021, NFR-002, AD-4, AD-5, AD-8, HARNESS §9 Phase 2.1–2.3, 2.5, 2.6

| Story | Summary                              | HARNESS       |
| ----- | ------------------------------------ | ------------- |
| S3.1  | Parse specs + parse logging          | 2.1, 2.2, 2.6 |
| S3.2  | Write markdown wiki + output logging | 2.3, 2.5, 2.6 |

#### S3.1 — Parse specs into structured page content

**As** Alex, **I want** each spec parsed with frontmatter, TOC, and description, **so that** wiki pages are navigable.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3  
**Demo path:** `specwiki generate --verbose` on fixture — `parse.file` per spec on stderr.

**HARNESS:** Phase 2.1–2.2 | **FR:** FR-007, FR-008, FR-009

**Functional:**

- [ ] `extractSections` / `extractDescription` / `parseSpecFile` behaviour verified
- [ ] Frontmatter `title` overrides derived title; raw body preserved
- [ ] No eval, dynamic import, or network I/O (NFR-010, NFR-012)

**Logging & diagnostics (§0.8):**

- [ ] `parse.file` logs relative path per parsed spec (verbose only)
- [ ] `parse.error` logs path + message on read/parse failure (always)
- [ ] No full file contents in payloads (NFR-007)
- [ ] Tests verify verbose vs quiet

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `parse/markdown.ts` coverage ≥ 90%

#### S3.2 — Write categorized markdown wiki tree

**As** Alex, **I want** `wiki/index.md` and `{slug}.md` files, **so that** I browse specs in my editor.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3, S3.1  
**Demo path:** Generate on fixture — `output.write` per file with `--verbose`.

**HARNESS:** Phase 2.3, 2.5 | **FR:** FR-011, FR-012, FR-013

**Functional:**

- [ ] `pageSlug`, `buildPageContent`, `buildIndex`, `writeWiki` match frozen layout
- [ ] Writes confined to resolved output directory

**Logging & diagnostics (§0.8):**

- [ ] `output.write` logs target relative path per markdown file (verbose only)
- [ ] `output.error` on mkdir/write failures (always)
- [ ] `generate.summary` log with page count (verbose only) — or equivalent in command layer

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `output/wiki.ts` coverage ≥ 90% on touched functions

**E3 gate:** Markdown wiki on fixture matches README layout; parse/output logs with `--verbose`.

---

### E4 — Generate HTML Wiki (`wiki/html/`)

**Vertical slice:** safe HTML rendering → write `html/` tree; output logging included.

**Binds:** FR-011, FR-015, FR-016, FR-021, NFR-003, NFR-008, NFR-009, NFR-011, AD-6, AD-7, HARNESS §9 Phase 2.4–2.5

| Story | Summary                                    | HARNESS |
| ----- | ------------------------------------------ | ------- |
| S4.1  | HTML title escaping and page structure     | 2.4     |
| S4.2  | Write HTML wiki tree + HTML output logging | 2.5     |

#### S4.1 — HTML title escaping and page structure

**As** Alex, **I want** HTML pages safe from title injection, **so that** malicious spec titles cannot break my browser.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Malicious title test — escaped in `<title>`.

**HARNESS:** Phase 2.4 | **FR:** FR-015 | **AD:** AD-6

**Functional:**

- [ ] `escapeHtml` / `wrapHtml` / `renderMarkdown` safety verified
- [ ] Tests use malicious title strings; structure intent tested

**Logging & diagnostics (§0.8):**

- [ ] `render.error` on markdown parse failure if applicable (always)
- [ ] No logging of unsanitized user title strings at info level

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] HTML-related functions coverage ≥ 90%

#### S4.2 — Write HTML wiki tree with path confinement

**As** Alex, **I want** browsable `wiki/html/`, **so that** I open index in a browser without a server.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3, S4.1  
**Demo path:** `specwiki generate --verbose` — `output.write` for each `.html` on stderr.

**HARNESS:** Phase 2.5 | **FR:** FR-011, FR-015 | **NFR:** NFR-008, NFR-009

**Functional:**

- [ ] `writeHtmlWiki` creates `html/index.html` and `html/{slug}.html`
- [ ] Path traversal guards; temp-dir integration tests

**Logging & diagnostics (§0.8):**

- [ ] `output.write` logs each HTML path (verbose only)
- [ ] `output.error` on write failures (always)
- [ ] Tests verify verbose emission for HTML writes

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `writeHtmlWiki` coverage ≥ 90%

**E4 gate:** HTML wiki browsable; path confinement tested; HTML logging with `--verbose`.

---

### E5 — Trustworthy Generate Output

**Vertical slice:** unique slugs + confined writes; errors logged on failure paths.

**Binds:** FR-014, NFR-008, NFR-009, AD-5, HARNESS §9 Phase 3.4, §11 #1

| Story | Summary                       | HARNESS |
| ----- | ----------------------------- | ------- |
| S5.1  | Slug collision disambiguation | 3.4     |
| S5.2  | Path traversal guard tests    | 2.5     |

#### S5.1 — Slug collision disambiguation

**As** Alex, **I want** colliding paths to get unique filenames, **so that** I never lose a spec silently.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Collision fixture — distinct output files; index links correct.

**HARNESS:** Phase 3.4, §11 #1 | **FR:** FR-014

**Functional:**

- [ ] Duplicate slugs disambiguated; index links match
- [ ] Non-colliding paths preserve existing algorithm (NFR-013)

**Logging & diagnostics (§0.8):**

- [ ] `output.slug-collision` logs original and disambiguated slug (verbose only)
- [ ] Test verifies log emission when collision occurs

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] Collision path coverage in `output/wiki.ts`

#### S5.2 — Path traversal guard tests

**As** Alex, **I want** writes confined to `--output`, **so that** generate cannot escape the target directory.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Malicious slug test — no writes outside output dir.

**NFR:** NFR-008, NFR-009

**Functional:**

- [ ] Tests cover `..` in slug-derived paths
- [ ] No files outside resolved output directory

**Logging & diagnostics (§0.8):**

- [ ] `output.error` when path guard rejects a write (always)
- [ ] Payload includes attempted path, not file content

**Quality measures:**

- [ ] Full §0.2 gate passes

**E5 gate:** Collisions handled; path guards tested and logged.

---

### E6 — CLI Contracts & Command Polish

**Vertical slice:** flags, exit codes, stdout summaries, command lifecycle logging.

**Binds:** FR-003, FR-004, FR-016, FR-019–022, FR-021, AD-10, HARNESS §9 Phase 3.2–3.3

| Story | Summary                                 | HARNESS  |
| ----- | --------------------------------------- | -------- |
| S6.1  | Command integration + lifecycle logging | 3.2, 3.3 |
| S6.2  | Exit code contracts                     | —        |

#### S6.1 — Command integration and lifecycle logging

**As** Alex, **I want** predictable flags and structured command events with `--verbose`, **so that** I script against specwiki and debug CLI issues.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3  
**Demo path:** `specwiki generate --verbose` — `cli.command` on start; raw `console.log` diagnostics removed.

**HARNESS:** Phase 3.2, 3.3 | **FR:** FR-003, FR-016, FR-019, FR-020, FR-021

**Functional:**

- [ ] `listSpecs` / `generateWiki` tests for flags, defaults, stdout summaries
- [ ] Non-zero exit on simulated I/O/parse failure
- [ ] Command module ≥ 90% coverage

**Logging & diagnostics (§0.8):**

- [ ] `cli.command` logs command name + resolved flags (verbose only)
- [ ] `cli.error` on runtime failures with message, no stack secrets (always)
- [ ] User summaries remain on stdout (chalk); diagnostics on stderr via Logger
- [ ] No raw `console.log` for verbose diagnostics in `commands/generate.ts`
- [ ] Tests verify `cli.command` / `cli.error` emission

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `commands/generate.ts` coverage ≥ 90%

#### S6.2 — Exit code contracts

**As** Alex, **I want** exit code 2 for usage errors and 1 for runtime failures, **so that** scripts distinguish failure modes.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Invalid flag → 2; write failure → 1.

**FR:** FR-022 | **AD:** AD-10

**Functional:**

- [ ] Usage → 2; runtime → 1; success → 0
- [ ] Documented in README or IMPLEMENTATION.md

**Logging & diagnostics (§0.8):**

- [ ] `cli.error` logs usage errors before exit 2
- [ ] `cli.error` logs runtime errors before exit 1

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] Tests cover usage and runtime exit codes

---

### E7 — MVP Validation & Sign-off

**Vertical slice:** dogfood → §13 checklist → repo-wide gate including logging audit.

**Binds:** FR-030, FR-031, HARNESS §9 Phase 3.5, §13

| Story | Summary                           | HARNESS |
| ----- | --------------------------------- | ------- |
| S7.1  | Dogfood wiki on fixture           | —       |
| S7.2  | Full quality gate + §13 checklist | 3.5     |

#### S7.1 — Dogfood wiki on fixture

**As a** maintainer, **I want** end-to-end generate on a real layout, **so that** MVP synthesis is proven.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki generate --verbose --project tests/fixtures/sample-project` — full pipeline logs + 10 pages < 60s.

**FR:** FR-031

**Functional:**

- [ ] Generate < 60s; ≥ 5 pages; categorized index + HTML
- [ ] Repo root zero-yield documented (POST-MVP FR-006)
- [ ] Result in IMPLEMENTATION.md build log

**Logging & diagnostics (§0.8):**

- [ ] Dogfood run with `--verbose` shows discover → parse → output → cli event chain
- [ ] No missing pipeline stage logs vs E2–E6 requirements

**Quality measures:**

- [ ] Full §0.2 gate passes before sign-off

#### S7.2 — Full quality gate and §13 checklist

**As a** product owner, **I want** §13 confirmed including §0.8, **so that** MVP sign-off is objective.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** §13 checklist in readiness report — all green.

**HARNESS:** Phase 3.5, §13 | **FR:** FR-030

**Functional:**

- [ ] All §13 functionality, meta, and quality items pass
- [ ] `IMPLEMENTATION.md` complete through E7

**Logging & diagnostics (§0.8):**

- [ ] §13 item "structured logging follows §0.8" explicitly verified
- [ ] No feature story merged without logging ACs satisfied

**Quality measures:**

- [ ] Full §0.2 gate; coverage ≥ 90% repo-wide

**MVP gate:** E1–E7 complete; §13 green; logging woven — no deferred logging epic.

---

## POST-MVP Epics

POST-MVP stories use the same three AC groups (Functional, Logging & diagnostics, Quality measures).

### E8 — Custom Discovery Configuration

**Binds:** FR-005, FR-006

| Story | Summary                    |
| ----- | -------------------------- |
| S8.1  | `--patterns` CLI flag      |
| S8.2  | Project config file loader |
| S8.3  | Extended default patterns  |

#### S8.1 — --patterns CLI flag

**Functional:** `--patterns` on list/generate; CLI overrides defaults; tests verify.custom discovery.  
**Logging & diagnostics:** `config.patterns-override` (verbose); `config.error` on invalid glob (always).  
**Quality measures:** Full §0.2 gate; config/command coverage maintained.

#### S8.2 — Project config file loader

**Functional:** `specwiki.config.js`/`.json`; precedence CLI > env > config > defaults; exit 2 on invalid config.  
**Logging & diagnostics:** `config.load` with source path (verbose); `config.error` with actionable message (always).  
**Quality measures:** Full §0.2 gate.

#### S8.3 — Extended default patterns

**Functional:** BMAD/nested AGENTS patterns (owner-approved); fixture tests.  
**Logging & diagnostics:** `discover.match` for new pattern types (verbose); match count in `discover.start`.  
**Quality measures:** Full §0.2 gate; discover coverage ≥ 90%.

---

### E9 — Agent Interoperability (`--json`, `llms.txt`)

**Binds:** FR-017, FR-023

#### S9.1 — --json machine-readable output

**Functional:** `list --json` / `generate --json`; stable schema; snapshot tests.  
**Logging & diagnostics:** `output.json` summary count (verbose); errors via `cli.error`.  
**Quality measures:** Full §0.2 gate.

#### S9.2 — wiki/llms.txt export

**Functional:** `--emit-llms-txt`; category-grouped manifest; README documented.  
**Logging & diagnostics:** `output.write` for `llms.txt` (verbose).  
**Quality measures:** Full §0.2 gate.

---

### E10 — Team CI Freshness (`generate --check`)

#### S10.1 — generate --check CI freshness

**Functional:** Dry-run compare; exit 0 fresh / 1 stale; markdown + HTML.  
**Logging & diagnostics:** `check.diff` with file count (verbose); `check.fail` (always on stale).  
**Quality measures:** Full §0.2 gate.

---

### E11 — Live Developer Loop (watch + serve)

**Binds:** FR-025, FR-026

#### S11.1 — generate --watch

**Functional:** Debounced rebuild; Ctrl+C exits 0; reuses generate pipeline.  
**Logging & diagnostics:** `watch.start`, `watch.rebuild`, `watch.debounce` (verbose); `watch.error` (always).  
**Quality measures:** Full §0.2 gate.

#### S11.2 — specwiki serve

**Functional:** `127.0.0.1` only; Node `http`; optional `--port`.  
**Logging & diagnostics:** `serve.start` with bind address/port (verbose); `serve.error` (always).  
**Quality measures:** Full §0.2 gate.

---

### E12 — Semantic Framework Enrichment

**Binds:** FR-010

#### S12.1–S12.3 — Cursor badges, OpenSpec grouping, BMAD kernel cards

Each story: functional enrichment ACs; `parse.enrich` / `output.enrich` (verbose) when metadata extracted; `parse.error` on malformed frontmatter; full §0.2 gate.

---

### E13 — Distribution & Publish

**Binds:** FR-027, FR-028

#### S13.1 — npm publish preparation

**Functional:** `files` field; `prepublishOnly` gate; `npx specwiki` on clean machine.  
**Logging & diagnostics:** `publish.prep` steps (verbose) in prepublish script output.  
**Quality measures:** Full §0.2 gate in prepublish.

#### S13.2 — GitHub Actions CI workflow

**Functional:** CI on push/PR; Node 20.x.  
**Logging & diagnostics:** N/A CI config; local gate passes before commit.  
**Quality measures:** CI runs full §0.2 gate.

---

### E14 — Ecosystem Export & Intelligence

**Binds:** FR-018, FR-029

#### S14.1–S14.3 — SSG export, drift detection, plugins

Each story: functional ACs; `export.write` / `drift.warn` / `plugin.load` events per feature (verbose); errors always logged; full §0.2 gate.

---

### E15 — IDE Integration (future bet)

#### S15.1 — IDE wiki panel extension

**Functional:** Cursor/VS Code sidebar; separate artifact.  
**Logging & diagnostics:** Extension uses its own debug channel — not core Logger.  
**Quality measures:** Extension test suite; core package unchanged.

---

## Traceability Summary

### MVP epics (E1–E7)

| Epic           | User journey       | Stories   | FR-021 logging                |
| -------------- | ------------------ | --------- | ----------------------------- |
| E1 Foundation  | Gate + Logger      | S1.1–S1.3 | S1.3 introduces Logger        |
| E2 List        | `specwiki list`    | S2.1–S2.4 | discover.* in S2.3+           |
| E3 Markdown    | `wiki/*.md`        | S3.1–S3.2 | parse.* + output.write        |
| E4 HTML        | `wiki/html/`       | S4.1–S4.2 | output.write HTML             |
| E5 Trustworthy | Unique safe output | S5.1–S5.2 | slug-collision + guard errors |
| E6 CLI         | Flags + exit codes | S6.1–S6.2 | cli.command + cli.error       |
| E7 Sign-off    | Dogfood + §13      | S7.1–S7.2 | Full pipeline log audit       |

### POST-MVP epics (E8–E15)

| Epic                | Stories     |
| ------------------- | ----------- |
| E8 Custom discovery | S8.1–S8.3   |
| E9 Agent I/O        | S9.1–S9.2   |
| E10 Team CI         | S10.1       |
| E11 Live loop       | S11.1–S11.2 |
| E12 Semantic        | S12.1–S12.3 |
| E13 Distribution    | S13.1–S13.2 |
| E14 Ecosystem       | S14.1–S14.3 |
| E15 IDE             | S15.1       |

---

## Migration notes

| Change                       | Detail                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| E5 Verbose epic **removed**  | Logging merged into E2–E4, E6; Logger in E1 S1.3                        |
| E6–E8 renumbered → **E5–E7** | Trustworthy, CLI, Sign-off                                              |
| POST-MVP E9–E16 → **E8–E15** | Shifted down one                                                        |
| Every story                  | Functional + **Logging & diagnostics** + **Quality measures** AC groups |

---

## Implementation order

1. **E1** — S1.1 (`IMPLEMENTATION.md`) → S1.3 (`Logger.ts`) → S1.2 verify
2. **E2 → E3 → E4** — Core journeys; logging in same story as feature
3. **E5 → E6 → E7** — Trustworthy output, CLI, sign-off
4. **POST-MVP:** E8 → E15

---

## Discovery Artifacts

| Artifact             | Path                            |
| -------------------- | ------------------------------- |
| HARNESS §0.8 + §0.10 | `HARNESS.md`                    |
| PRD                  | [prd/prd.md](prd/prd.md)        |
| Decisions            | [decisions.md](../decisions.md) |
