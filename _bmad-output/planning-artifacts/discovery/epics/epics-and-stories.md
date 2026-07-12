---
title: specwiki Epics and Stories
product: specwiki
status: final
created: 2026-07-12
updated: 2026-07-12T21:40:00
author: Discovery loop (vertical slicing; logging woven per story)
sources:
  - _bmad-output/planning-artifacts/discovery/prd/prd.md
  - _bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md
  - HARNESS.md §0.8, §0.10
slicing: vertical + INVEST
stepsCompleted:
  [
    step-vertical-slice-restructure,
    step-logging-merged-into-features,
    step-e16-wikipedia-html-skin,
    step-mvp-implementation-status-audit,
    step-mvp-formal-closure,
  ]
---

# specwiki — Epics and Stories

Stories are **vertical slices** per **HARNESS §0.10**. **Structured logging (§0.8) is not a separate epic** — every story includes **Logging & diagnostics** and **Quality measures** acceptance criteria alongside functional ACs.

**Brownfield note:** MVP (E1–E7) is **closed** (2026-07-12) — 147 tests passing, §13 checklist green, all stories `done`. POST-MVP epics (E8–E16) are not started.

## Implementation status (closed 2026-07-12)

Source of truth: [`sprint-status.yaml`](../../implementation-artifacts/sprint-status.yaml) (`mvp_status: closed`), story files under [`implementation-artifacts/`](../../implementation-artifacts/), [`IMPLEMENTATION.md`](../../../../IMPLEMENTATION.md).

| Epic                          | Status      | Stories        | Notes                                          |
| ----------------------------- | ----------- | -------------- | ---------------------------------------------- |
| **E1** Project Foundation     | **closed**  | S1.1–S1.3 done | `IMPLEMENTATION.md`, quality gate, `Logger.ts` |
| **E2** List Discovered Specs  | **closed**  | S2.1–S2.4 done | discover logging, zero-match tip               |
| **E3** Generate Markdown Wiki | **closed**  | S3.1–S3.2 done | parse + markdown output logging                |
| **E4** Generate HTML Wiki     | **closed**  | S4.1–S4.2 done | escapeHtml, writeHtmlWiki, path guards         |
| **E5** Trustworthy Output     | **closed**  | S5.1–S5.2 done | slug collision, traversal guards               |
| **E6** CLI Contracts          | **closed**  | S6.1–S6.2 done | lifecycle logging, exit codes 0/1/2            |
| **E7** MVP Sign-off           | **closed**  | S7.1–S7.2 done | dogfood fixture, §13 + harness tests           |
| **E8–E16** POST-MVP           | **backlog** | —              | not implemented                                |

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

### E1 — Project Foundation ✅ done

**Vertical slice:** Harness, quality gate, and `Logger.ts` exist before feature work.

**Binds:** FR-030, FR-021, NFR-001, NFR-002, NFR-004, NFR-006, HARNESS §9 Phase 0, 3.1

| Story | Summary                       | HARNESS | Status |
| ----- | ----------------------------- | ------- | ------ |
| S1.1  | `IMPLEMENTATION.md` build log | 0.1     | done   |
| S1.2  | Verify quality-gate tooling   | 0.2–0.4 | done   |
| S1.3  | Structured `Logger.ts` module | 3.1     | done   |

#### S1.1 — Create IMPLEMENTATION.md build log

**As a** implementation agent, **I want** a single authoritative build log, **so that** every vertical slice records progress audibly.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Open `IMPLEMENTATION.md` — checklist and build log visible.

**HARNESS:** Phase 0.1 | **FR:** FR-030

**Functional:**

- [x] `IMPLEMENTATION.md` at repo root with status header
- [x] Checklist lists MVP epics E1–E7 with checkboxes
- [x] Build log table: date, story, summary, commit, quality-gate status
- [x] References HARNESS §0 workflow, §0.8, §0.10
- [x] `npm run typecheck` and `npm run build` pass

**Logging & diagnostics (§0.8):**

- [x] N/A — no runtime code; document §0.8 requirement in build log template row

**Quality measures:**

- [x] `typecheck` and `build` pass

#### S1.2 — Verify quality-gate tooling

**As a** developer, **I want** the §0.2 gate green on brownfield code, **so that** feature slices start from a known-good baseline.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Full §0.2 sequence — all pass.

**HARNESS:** Phase 0.2–0.4 | **NFR:** NFR-001, NFR-002, NFR-004

**Functional:**

- [x] Vitest + coverage v8 ≥ 90%; ESLint + Prettier configured
- [x] Scripts: `test`, `coverage`, `lint`, `format`, `typecheck`, `build`
- [x] `tests/` mirrors `src/`; fixture has ≥ 5 discoverable specs
- [x] Full gate passes; gaps documented in build log

**Logging & diagnostics (§0.8):**

- [x] N/A — verification only unless gaps require fixes

**Quality measures:**

- [x] Full §0.2 gate passes on current codebase

#### S1.3 — Structured Logger module

**As a** developer, **I want** a shared verbose-gated logger, **so that** every feature story emits consistent diagnostics.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Unit test — `log.info` suppressed without verbose; `log.error` always emits.

**HARNESS:** Phase 3.1 | **FR:** FR-021 | **AD:** AD-9

**Functional:**

- [x] `src/core/Logger.ts` with `log.info` (verbose-gated) and `log.error` (always)
- [x] Dot-separated event names; JSON-serializable payload objects
- [x] No business logic in Logger module

**Logging & diagnostics (§0.8):**

- [x] Logger unit tests cover verbose gate and error-always behaviour
- [x] Logger writes to stderr; no stdout pollution

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `Logger.ts` has unit tests; coverage on `src/core/` ≥ 90%

---

### E2 — List Discovered Specs (`specwiki list`) ✅ done

**Vertical slice:** discover → categorize → display; discover logging included.

**Binds:** FR-001–004, FR-021, NFR-002, NFR-006, NFR-007, AD-2, AD-3, HARNESS §9 Phase 1

| Story | Summary                              | HARNESS  | Status |
| ----- | ------------------------------------ | -------- | ------ |
| S2.1  | Category grouping on list output     | 1.1      | done   |
| S2.2  | Human-readable titles on list output | 1.2      | done   |
| S2.3  | Fixture discovery + discover logging | 1.3, 1.4 | done   |
| S2.4  | Zero-match helpful tip               | —        | done   |

#### S2.1 — Category grouping on list output

**As** Alex, **I want** specs grouped by category when I run `specwiki list`, **so that** I see Cursor rules, OpenSpec, and root agent files separately.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki list --project tests/fixtures/sample-project` — grouped categories.

**HARNESS:** Phase 1.1 | **FR:** FR-002

**Functional:**

- [x] `deriveCategory` covers all known path prefixes; prefix order tested
- [x] `specwiki list` groups by category on fixture
- [x] Category keys unchanged without owner approval (NFR-013)

**Logging & diagnostics (§0.8):**

- [x] If `deriveCategory` paths change: errors use `log.error` with relative path context
- [x] No raw `console.log` added in `discover/specs.ts`

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `discover/specs.ts` coverage ≥ 90% on touched functions

#### S2.2 — Human-readable titles on list output

**As** Alex, **I want** readable titles for SKILL and agent files, **so that** I recognize specs without reading paths.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** List on fixture — SKILL and AGENTS titles correct in generate index / derived titles.

**HARNESS:** Phase 1.2 | **FR:** FR-002

**Functional:**

- [x] `deriveTitle` handles SKILL, AGENTS, SPEC, CLAUDE, GEMINI and generic basenames
- [x] No regressions on fixture expectations

**Logging & diagnostics (§0.8):**

- [x] No new diagnostic noise in default (non-verbose) list mode

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `deriveTitle` coverage ≥ 90%

#### S2.3 — Fixture discovery integration and discover logging

**As** Alex, **I want** `specwiki list` to find all specs and show discover diagnostics with `--verbose`, **so that** I trust discovery and can debug pattern misses.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3  
**Demo path:** `specwiki list --verbose --project tests/fixtures/sample-project` — `discover.start` + `discover.match` on stderr; default mode quiet.

**HARNESS:** Phase 1.3, 1.4 | **FR:** FR-001, FR-003, FR-021 | **AD:** AD-2

**Functional:**

- [x] `discoverSpecs` returns expected count on fixture (≥ 5; actual 10)
- [x] Sorted by category then `relativePath`; ignores node_modules/dist/wiki/.specwiki
- [x] Default patterns cover Cursor, OpenSpec/Kiro, Copilot, root agents

**Logging & diagnostics (§0.8):**

- [x] `discover.start` logs project root and pattern count (verbose only)
- [x] `discover.match` logs each relative path (verbose only)
- [x] `discover.error` on glob/read failures (always via `log.error`)
- [x] Payloads: paths and counts only — no file bodies (NFR-007)
- [x] Tests verify verbose vs non-verbose stderr behaviour

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `discoverSpecs` coverage ≥ 90%

#### S2.4 — Zero-match helpful tip

**As** Alex, **I want** a helpful tip when no specs are found, **so that** I know to check `--project` or patterns.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki list` on empty dir — exit 0 with tip.

**FR:** FR-004 | **AD:** AD-1

**Functional:**

- [x] Zero matches: exit 0 with tip (consistent with generate)
- [x] Test asserts tip and exit code

**Logging & diagnostics (§0.8):**

- [x] `discover.empty` event when zero matches (verbose only) with pattern hint
- [x] Tip remains on stdout (user-facing); diagnostics on stderr

**Quality measures:**

- [x] Full §0.2 gate passes

**E2 gate:** List on fixture works; discover logging verified with `--verbose`.

---

### E3 — Generate Markdown Wiki (`wiki/*.md`) ✅ done

**Vertical slice:** discover → parse → build → write markdown; parse logging included.

**Binds:** FR-007–013, FR-021, NFR-002, AD-4, AD-5, AD-8, HARNESS §9 Phase 2.1–2.3, 2.5, 2.6

| Story | Summary                              | HARNESS       | Status |
| ----- | ------------------------------------ | ------------- | ------ |
| S3.1  | Parse specs + parse logging          | 2.1, 2.2, 2.6 | done   |
| S3.2  | Write markdown wiki + output logging | 2.3, 2.5, 2.6 | done   |

#### S3.1 — Parse specs into structured page content

**As** Alex, **I want** each spec parsed with frontmatter, TOC, and description, **so that** wiki pages are navigable.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3  
**Demo path:** `specwiki generate --verbose` on fixture — `parse.file` per spec on stderr.

**HARNESS:** Phase 2.1–2.2 | **FR:** FR-007, FR-008, FR-009

**Functional:**

- [x] `extractSections` / `extractDescription` / `parseSpecFile` behaviour verified
- [x] Frontmatter `title` overrides derived title; raw body preserved
- [x] No eval, dynamic import, or network I/O (NFR-010, NFR-012)

**Logging & diagnostics (§0.8):**

- [x] `parse.file` logs relative path per parsed spec (verbose only)
- [x] `parse.error` logs path + message on read/parse failure (always)
- [x] No full file contents in payloads (NFR-007)
- [x] Tests verify verbose vs quiet

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `parse/markdown.ts` coverage ≥ 90%

#### S3.2 — Write categorized markdown wiki tree

**As** Alex, **I want** `wiki/index.md` and `{slug}.md` files, **so that** I browse specs in my editor.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3, S3.1  
**Demo path:** Generate on fixture — `output.write` per file with `--verbose`.

**HARNESS:** Phase 2.3, 2.5 | **FR:** FR-011, FR-012, FR-013

**Functional:**

- [x] `pageSlug`, `buildPageContent`, `buildIndex`, `writeWiki` match frozen layout
- [x] Writes confined to resolved output directory

**Logging & diagnostics (§0.8):**

- [x] `output.write` logs target relative path per markdown file (verbose only)
- [x] `output.error` on mkdir/write failures (always)
- [x] `generate.summary` log with page count (verbose only) — or equivalent in command layer

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `output/wiki.ts` coverage ≥ 90% on touched functions

**E3 gate:** Markdown wiki on fixture matches README layout; parse/output logs with `--verbose`.

---

### E4 — Generate HTML Wiki (`wiki/html/`) ✅ done

**Vertical slice:** safe HTML rendering → write `html/` tree; output logging included.

**Binds:** FR-011, FR-015, FR-016, FR-021, NFR-003, NFR-008, NFR-009, NFR-011, AD-6, AD-7, HARNESS §9 Phase 2.4–2.5

| Story | Summary                                    | HARNESS | Status |
| ----- | ------------------------------------------ | ------- | ------ |
| S4.1  | HTML title escaping and page structure     | 2.4     | done   |
| S4.2  | Write HTML wiki tree + HTML output logging | 2.5     | done   |

#### S4.1 — HTML title escaping and page structure

**As** Alex, **I want** HTML pages safe from title injection, **so that** malicious spec titles cannot break my browser.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Malicious title test — escaped in `<title>`.

**HARNESS:** Phase 2.4 | **FR:** FR-015 | **AD:** AD-6

**Functional:**

- [x] `escapeHtml` / `wrapHtml` / `renderMarkdown` safety verified
- [x] Tests use malicious title strings; structure intent tested

**Logging & diagnostics (§0.8):**

- [x] `render.error` on markdown parse failure if applicable (always)
- [x] No logging of unsanitized user title strings at info level

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] HTML-related functions coverage ≥ 90%

#### S4.2 — Write HTML wiki tree with path confinement

**As** Alex, **I want** browsable `wiki/html/`, **so that** I open index in a browser without a server.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3, S4.1  
**Demo path:** `specwiki generate --verbose` — `output.write` for each `.html` on stderr.

**HARNESS:** Phase 2.5 | **FR:** FR-011, FR-015 | **NFR:** NFR-008, NFR-009

**Functional:**

- [x] `writeHtmlWiki` creates `html/index.html` and `html/{slug}.html`
- [x] Path traversal guards; temp-dir integration tests

**Logging & diagnostics (§0.8):**

- [x] `output.write` logs each HTML path (verbose only)
- [x] `output.error` on write failures (always)
- [x] Tests verify verbose emission for HTML writes

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `writeHtmlWiki` coverage ≥ 90%

**E4 gate:** HTML wiki browsable; path confinement tested; HTML logging with `--verbose`.

---

### E5 — Trustworthy Generate Output ✅ done

**Vertical slice:** unique slugs + confined writes; errors logged on failure paths.

**Binds:** FR-014, NFR-008, NFR-009, AD-5, HARNESS §9 Phase 3.4, §11 #1

| Story | Summary                       | HARNESS | Status |
| ----- | ----------------------------- | ------- | ------ |
| S5.1  | Slug collision disambiguation | 3.4     | done   |
| S5.2  | Path traversal guard tests    | 2.5     | done   |

#### S5.1 — Slug collision disambiguation

**As** Alex, **I want** colliding paths to get unique filenames, **so that** I never lose a spec silently.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Collision fixture — distinct output files; index links correct.

**HARNESS:** Phase 3.4, §11 #1 | **FR:** FR-014

**Functional:**

- [x] Duplicate slugs disambiguated; index links match
- [x] Non-colliding paths preserve existing algorithm (NFR-013)

**Logging & diagnostics (§0.8):**

- [x] `output.slug-collision` logs original and disambiguated slug (verbose only)
- [x] Test verifies log emission when collision occurs

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] Collision path coverage in `output/wiki.ts`

#### S5.2 — Path traversal guard tests

**As** Alex, **I want** writes confined to `--output`, **so that** generate cannot escape the target directory.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Malicious slug test — no writes outside output dir.

**NFR:** NFR-008, NFR-009

**Functional:**

- [x] Tests cover `..` in slug-derived paths
- [x] No files outside resolved output directory

**Logging & diagnostics (§0.8):**

- [x] `output.error` when path guard rejects a write (always)
- [x] Payload includes attempted path, not file content

**Quality measures:**

- [x] Full §0.2 gate passes

**E5 gate:** Collisions handled; path guards tested and logged.

---

### E6 — CLI Contracts & Command Polish ✅ done

**Vertical slice:** flags, exit codes, stdout summaries, command lifecycle logging.

**Binds:** FR-003, FR-004, FR-016, FR-019–022, FR-021, AD-10, HARNESS §9 Phase 3.2–3.3

| Story | Summary                                 | HARNESS  | Status |
| ----- | --------------------------------------- | -------- | ------ |
| S6.1  | Command integration + lifecycle logging | 3.2, 3.3 | done   |
| S6.2  | Exit code contracts                     | —        | done   |

#### S6.1 — Command integration and lifecycle logging

**As** Alex, **I want** predictable flags and structured command events with `--verbose`, **so that** I script against specwiki and debug CLI issues.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S1.3  
**Demo path:** `specwiki generate --verbose` — `cli.command` on start; raw `console.log` diagnostics removed.

**HARNESS:** Phase 3.2, 3.3 | **FR:** FR-003, FR-016, FR-019, FR-020, FR-021

**Functional:**

- [x] `listSpecs` / `generateWiki` tests for flags, defaults, stdout summaries
- [x] Non-zero exit on simulated I/O/parse failure
- [x] Command module ≥ 90% coverage

**Logging & diagnostics (§0.8):**

- [x] `cli.command` logs command name + resolved flags (verbose only)
- [x] `cli.error` on runtime failures with message, no stack secrets (always)
- [x] User summaries remain on stdout (chalk); diagnostics on stderr via Logger
- [x] No raw `console.log` for verbose diagnostics in `commands/generate.ts`
- [x] Tests verify `cli.command` / `cli.error` emission

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] `commands/generate.ts` coverage ≥ 90%

#### S6.2 — Exit code contracts

**As** Alex, **I want** exit code 2 for usage errors and 1 for runtime failures, **so that** scripts distinguish failure modes.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Invalid flag → 2; write failure → 1.

**FR:** FR-022 | **AD:** AD-10

**Functional:**

- [x] Usage → 2; runtime → 1; success → 0
- [x] Documented in README or IMPLEMENTATION.md

**Logging & diagnostics (§0.8):**

- [x] `cli.error` logs usage errors before exit 2
- [x] `cli.error` logs runtime errors before exit 1

**Quality measures:**

- [x] Full §0.2 gate passes
- [x] Tests cover usage and runtime exit codes

---

### E7 — MVP Validation & Sign-off ✅ done

**Vertical slice:** dogfood → §13 checklist → repo-wide gate including logging audit.

**Binds:** FR-030, FR-031, HARNESS §9 Phase 3.5, §13

| Story | Summary                           | HARNESS | Status |
| ----- | --------------------------------- | ------- | ------ |
| S7.1  | Dogfood wiki on fixture           | —       | done   |
| S7.2  | Full quality gate + §13 checklist | 3.5     | done   |

#### S7.1 — Dogfood wiki on fixture

**As a** maintainer, **I want** end-to-end generate on a real layout, **so that** MVP synthesis is proven.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki generate --verbose --project tests/fixtures/sample-project` — full pipeline logs + 10 pages < 60s.

**FR:** FR-031

**Functional:**

- [x] Generate < 60s; ≥ 5 pages; categorized index + HTML
- [x] Repo root zero-yield documented (POST-MVP FR-006)
- [x] Result in IMPLEMENTATION.md build log

**Logging & diagnostics (§0.8):**

- [x] Dogfood run with `--verbose` shows discover → parse → output → cli event chain
- [x] No missing pipeline stage logs vs E2–E6 requirements

**Quality measures:**

- [x] Full §0.2 gate passes before sign-off

#### S7.2 — Full quality gate and §13 checklist

**As a** product owner, **I want** §13 confirmed including §0.8, **so that** MVP sign-off is objective.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** §13 checklist in readiness report — all green.

**HARNESS:** Phase 3.5, §13 | **FR:** FR-030

**Functional:**

- [x] All §13 functionality, meta, and quality items pass
- [x] `IMPLEMENTATION.md` complete through E7

**Logging & diagnostics (§0.8):**

- [x] §13 item "structured logging follows §0.8" explicitly verified
- [x] No feature story merged without logging ACs satisfied

**Quality measures:**

- [x] Full §0.2 gate; coverage ≥ 90% repo-wide

**MVP gate:** E1–E7 complete ✅ **MVP closed 2026-07-12**; §13 green; logging woven — no deferred logging epic.

---

## POST-MVP Epics

POST-MVP stories use the same three AC groups (Functional, Logging & diagnostics, Quality measures). **None started** as of 2026-07-12.

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

### E16 — Wikipedia-Style HTML Wiki

**Vertical slice:** Replace minimal inline HTML with a Vector-inspired wiki skin — templates, shared assets, navigation chrome, and optional search — while preserving the frozen `wiki/html/` output contract.

**Binds:** FR-032, FR-033, FR-034, FR-015 (extends), NFR-003, NFR-008, NFR-009, NFR-011, NFR-013, HARNESS §0.9, POST-MVP-ROADMAP UX theme

**Recommended sequencing:** After MVP E4 (HTML foundation). Independent of E8 extended discovery; pairs well before E8 S8.3 so self-repo dogfood benefits from readable navigation at scale.

| Story | Summary                                     | HARNESS |
| ----- | ------------------------------------------- | ------- |
| S16.1 | Mustache HTML renderer and Wikimedia assets | 4+      |
| S16.2 | Wikipedia layout chrome and navigation      | 4+      |
| S16.3 | Rich HTML content rendering                 | 4+      |
| S16.4 | Client-side wiki search                     | 4+      |

#### S16.1 — Mustache HTML renderer and Wikimedia assets

**As** Alex, **I want** generated HTML to use a proper wiki skin with shared CSS, **so that** opening `wiki/html/index.html` feels like a real wiki instead of a blog post.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** E4 S4.1, S4.2  
**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-skin` → open `/tmp/specwiki-skin/html/index.html` — Vector-inspired header, typography, and linked `assets/specwiki.css`.

**FR:** FR-032 | **NFR:** NFR-003, NFR-011, NFR-013

**Functional:**

- [ ] `wrapHtml()` replaced by `HtmlRenderer` using **mustache** templates (`layout`, `article`, `index` partials under `templates/`)
- [ ] **`wikimedia-ui-base`** design tokens drive colors, spacing, and typography in `assets/specwiki.css` (MIT — no GPL Vector bundle in v1)
- [ ] `writeHtmlWiki` copies static assets to `{output}/html/assets/` with relative URLs (works via `file://` and static hosting)
- [ ] Frozen output contract preserved: `html/index.html`, `html/{slug}.html` paths unchanged (NFR-013 extend-only)
- [ ] `escapeHtml` applied to all user-controlled template fields (titles, source paths, descriptions)
- [ ] Owner approval recorded for HTML presentation change (NFR-013)

**Logging & diagnostics (§0.8):**

- [ ] `output.write` logs each HTML path and `html/assets/*` copies (verbose only)
- [ ] `output.error` on template render failure or asset copy failure (always)
- [ ] No logging of raw spec body at info level

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] `src/output/html/` renderer module coverage ≥ 90%
- [ ] Existing HTML escaping and path confinement tests still pass

#### S16.2 — Wikipedia layout chrome and navigation

**As** Alex, **I want** category sidebar, infobox, and section TOC on every article page, **so that** I can browse the spec landscape like Wikipedia without running a server.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S16.1  
**Demo path:** Generate fixture wiki → click category link in left nav → open article → infobox shows source path and category; right rail TOC jumps to `#section`.

**FR:** FR-033 | **NFR:** NFR-013

**Functional:**

- [ ] Index page styled as wiki **Main Page** portal with category sections (reuses `CATEGORY_LABELS`)
- [ ] Article pages: header bar (site title + link home), **left category nav**, main content, **right TOC rail** from parsed `sections`, **infobox** (title, category, source path, description)
- [ ] Breadcrumb trail: `Main Page › {Category} › {Title}` on article pages
- [ ] Inter-page links use relative `{slug}.html` paths; `file://` navigation works without a server
- [ ] Markdown wiki output (`wiki/*.md`) unchanged

**Logging & diagnostics (§0.8):**

- [ ] `output.render` logs page kind (`index` | `article`) and slug (verbose only)
- [ ] `output.error` if template context missing required fields (always)

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] Integration test asserts semantic regions: `#content`, `.infobox`, `.toc`, `.category-nav`
- [ ] HTML renderer coverage ≥ 90%

#### S16.3 — Rich HTML content rendering

**As** Alex, **I want** code blocks highlighted and headings linkable, **so that** long spec pages are as readable as Wikipedia articles.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S16.2  
**Demo path:** Generate wiki including a spec with fenced code and `##` headings → code blocks syntax-highlighted; heading anchors clickable.

**FR:** FR-034 (partial — content rendering) | **AD:** AD-6

**Functional:**

- [ ] `marked` configured for GFM (tables, strikethrough, task lists where supported)
- [ ] Heading IDs generated for `h2`–`h6` matching parsed section anchors (permalink ¶ links optional)
- [ ] **`highlight.js`** (or equivalent lightweight highlighter) applied to fenced code blocks; theme CSS bundled under `html/assets/`
- [ ] Article body wrapped in `.mw-parser-output` (or equivalent) for content typography scoped to main column
- [ ] Malicious markdown in titles/content still escaped at template boundary; no script injection via skin

**Logging & diagnostics (§0.8):**

- [ ] `render.error` on markdown/highlighter failure (always) — extends existing event
- [ ] Highlighter language unknown falls back silently (no error spam)

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] Parse/render tests for code fence + heading anchor output
- [ ] HTML escaping tests unchanged or extended for new template fields

#### S16.4 — Client-side wiki search

**As** Alex, **I want** a search box on the wiki header, **so that** I can find specs by title or content without scrolling the index.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S16.2  
**Demo path:** Generate fixture wiki → open index → type query in header search → results link to matching `{slug}.html` pages (no server).

**FR:** FR-034 (partial — search)

**Functional:**

- [ ] `writeHtmlWiki` emits `html/search-index.json` built at generate time from page titles, descriptions, and plain-text body excerpts
- [ ] Header search UI powered by **lunr** (client-side only; no network fetch beyond static files)
- [ ] Search works when opening HTML via `file://` (relative asset paths)
- [ ] Optional `--no-search` flag skips index + JS for minimal output (default: search enabled)
- [ ] Index page includes "All pages" link listing every slug

**Logging & diagnostics (§0.8):**

- [ ] `output.write` for `html/search-index.json` (verbose only)
- [ ] `output.search-index` logs document count (verbose only)
- [ ] `output.error` if search index build fails (always)

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] Unit test: search index JSON schema and document count matches page count
- [ ] No new network I/O in `generate` beyond existing filesystem writes (NFR-012)

**E16 gate:** Fixture wiki opens in browser with Wikipedia-like layout, navigation, highlighted code, and working client-side search; markdown output unchanged; frozen `wiki/html/` contract preserved.

---

## Traceability Summary

### MVP epics (E1–E7) — **closed** (2026-07-12)

| Epic           | User journey       | Stories   | Status | FR-021 logging                |
| -------------- | ------------------ | --------- | ------ | ----------------------------- |
| E1 Foundation  | Gate + Logger      | S1.1–S1.3 | closed | S1.3 introduces Logger        |
| E2 List        | `specwiki list`    | S2.1–S2.4 | closed | discover.* in S2.3+           |
| E3 Markdown    | `wiki/*.md`        | S3.1–S3.2 | closed | parse.* + output.write        |
| E4 HTML        | `wiki/html/`       | S4.1–S4.2 | closed | output.write HTML             |
| E5 Trustworthy | Unique safe output | S5.1–S5.2 | closed | slug-collision + guard errors |
| E6 CLI         | Flags + exit codes | S6.1–S6.2 | closed | cli.command + cli.error       |
| E7 Sign-off    | Dogfood + §13      | S7.1–S7.2 | closed | Full pipeline log audit       |

### POST-MVP epics (E8–E16) — **backlog**

| Epic                | Stories     | FR binding     | Status  |
| ------------------- | ----------- | -------------- | ------- |
| E8 Custom discovery | S8.1–S8.3   | FR-005, FR-006 | backlog |
| E9 Agent I/O        | S9.1–S9.2   | FR-017, FR-023 | backlog |
| E10 Team CI         | S10.1       | FR-024         | backlog |
| E11 Live loop       | S11.1–S11.2 | FR-025, FR-026 | backlog |
| E12 Semantic        | S12.1–S12.3 | FR-010         | backlog |
| E13 Distribution    | S13.1–S13.2 | FR-027, FR-028 | backlog |
| E14 Ecosystem       | S14.1–S14.3 | FR-018, FR-029 | backlog |
| E15 IDE             | S15.1       | —              | backlog |
| E16 Wiki HTML skin  | S16.1–S16.4 | FR-032–FR-034  | backlog |

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
4. **POST-MVP:** E8 → E15; **E16** (wiki HTML skin) recommended after E4, before or parallel with E8 S8.3

---

## Discovery Artifacts

| Artifact             | Path                            |
| -------------------- | ------------------------------- |
| HARNESS §0.8 + §0.10 | `HARNESS.md`                    |
| PRD                  | [prd/prd.md](prd/prd.md)        |
| Decisions            | [decisions.md](../decisions.md) |
