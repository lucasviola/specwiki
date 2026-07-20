---
title: specwiki Epics and Stories
product: specwiki
status: final
created: 2026-07-12
updated: 2026-07-12T23:15:00
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

**Binds:** FR-005, FR-006, FR-035

**Scope note:** Extended discovery includes `**/README.md` so project and folder README files are scanned alongside spec/agent files. When a directory containing discovered specs also has a `README.md`, that file's content is used as the index introduction for that folder's category section on the wiki index page (markdown and HTML). Root `README.md` content replaces the auto-generated boilerplate on the main wiki index.

| Story | Summary                              |
| ----- | ------------------------------------ |
| S8.1  | `--patterns` CLI flag                |
| S8.2  | Project config file loader           |
| S8.3  | Extended default patterns            |
| S8.4  | README.md discovery and folder index |

#### S8.1 — --patterns CLI flag

**Functional:** `--patterns` on list/generate; CLI overrides defaults; tests verify.custom discovery.  
**Logging & diagnostics:** `config.patterns-override` (verbose); `config.error` on invalid glob (always).  
**Quality measures:** Full §0.2 gate; config/command coverage maintained.

#### S8.2 — Project config file loader

**Functional:** `specwiki.config.js`/`.json`; precedence CLI > env > config > defaults; exit 2 on invalid config.  
**Logging & diagnostics:** `config.load` with source path (verbose); `config.error` with actionable message (always).  
**Quality measures:** Full §0.2 gate.

#### S8.3 — Extended default patterns

**Functional:** BMAD/nested AGENTS patterns plus `**/README.md` (owner-approved); fixture tests verify README and nested AGENTS discovery.  
**Logging & diagnostics:** `discover.match` for new pattern types (verbose); match count in `discover.start`.  
**Quality measures:** Full §0.2 gate; discover coverage ≥ 90%.

#### S8.4 — README.md discovery and folder index

**As** a project maintainer, **I want** `README.md` files discovered and used as folder index content on the wiki, **so that** category sections reflect project-authored folder documentation instead of link-only lists.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** `specwiki generate --project tests/fixtures/sample-project` — root or folder `README.md` appears in `list` output; `wiki/index.md` and `wiki/html/index.html` use README body as the introductory content for the matching category section; root `README.md` replaces the default index boilerplate.

**Binds:** FR-035 | **Depends:** S8.3 (README in extended patterns)

**Functional:**

- [ ] When `README.md` is discovered in a directory that also contains other spec files, its parsed body is rendered as the introductory content for that category section on `wiki/index.md` and `wiki/html/index.html` (above the page link list for that category)
- [ ] Root `README.md` (`category: root`) replaces the auto-generated "Structured documentation generated from…" boilerplate on the main wiki index; category link lists still follow
- [ ] `README.md` remains a normal wiki page (`wiki/{slug}.md` / `wiki/html/{slug}.html`) in addition to its index role — no silent omission from page output
- [ ] Folders with `README.md` but no other discovered specs in that category: README still indexed as a standalone page; no empty category section
- [ ] Fixture test covers at least one folder README driving category index content and one root README driving main index intro

**Logging & diagnostics (§0.8):**

- [ ] `parse.readme-index` when a README is bound to a category index section (verbose); `{ relativePath, category }`
- [ ] `output.index` summary includes `readmeIndexCount` (verbose)

**Quality measures:**

- [ ] Full §0.2 gate; `buildIndex` / HTML index renderer coverage on touched paths

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

#### S13.3 — Publication readiness and launch marketing

**As** an open-source maintainer preparing the first npm release,  
**I want** a UX-led README review and channel-specific launch copy grounded in market research,  
**so that** the public-facing package story is clear, credible, and ready to promote on Reddit, LinkedIn, and other developer channels.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S13.1 (consumer install path and npm contract documented); may run in parallel with S13.2.  
**Demo path:** Review `README.md` and `docs/marketing/launch-copy.md` — README passes a publication checklist; launch pack includes at least Reddit, LinkedIn, Hacker News, and X/Twitter variants aligned with product brief positioning.

**Binds:** Product brief go-to-market; `docs/brand/BRAND.md`; domain-research Personas A–C

**Functional:**

- [ ] Sally (UX designer agent) reviews `README.md` against a publication checklist: value proposition above the fold; consumer install (`npx specwiki`) vs contributor setup clearly separated; Node ≥20 requirement; license; quick-start commands that match shipped CLI; no stale dev-only paths as the primary install story
- [ ] UX review produces a structured findings report with severity (blocker / should-fix / nice-to-have) and concrete rewrite suggestions; owner approves README edits before merge
- [ ] Market research (web-backed) documents target audience (Persona A wedge), competitive alternatives, positioning statement, recommended launch channels, and messaging guardrails (what specwiki is / is not)
- [ ] Launch copy pack generated for at least: Reddit (r/programming or r/cursor-style sub), LinkedIn, Hacker News (Show HN), X/Twitter, and one additional channel (Dev.to or Product Hunt draft)
- [ ] All public copy uses canonical `[[specwiki]]` wordmark rules from `docs/brand/BRAND.md`; no substitute branding
- [ ] Artifacts land under `docs/marketing/` (research + launch copy + README review report); README updated in repo root when approved
- [ ] Story does not publish to npm, post to social platforms, or automate marketing — deliverables and owner-approved README only

**Logging & diagnostics:** N/A — content/marketing story; no runtime Logger changes.

**Quality measures:** Owner review of README and launch copy; editorial pass for accuracy against current CLI commands; no HARNESS §0.2 gate required unless README edits break documented command examples (run spot-check: `npx specwiki --help` matches README).

#### S13.4 — Version 1.0.0 release and maintainer docs ⚠️ superseded by E22

> **Superseded (2026-07-16):** Decomposed into **E22 S22.1–S22.7**. Do not implement this story; use [`epic-22-semver-and-release-process.md`](../../implementation-artifacts/epic-22-semver-and-release-process.md) instead.

**As** an open-source maintainer or trusted contributor,  
**I want** a single-source version bump to 1.0.0, maintainer release scripts, and documented publishing steps,  
**so that** anyone with release permissions can safely cut a semver release and publish to npm without tribal knowledge.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S13.1 (prepublish gate, `verify-package`); S13.2 (green CI on `main` before publish); S13.3 (README/marketing ready).  
**Demo path:** `npm run release:check` passes; `specwiki --version` prints `1.0.0`; `docs/RELEASING.md` and `docs/CONTRIBUTING.md` document the full contributor and maintainer paths.

**Functional:**

- [ ] Single version source: `package.json` authority; CLI reads version at runtime (no hardcoded semver in `src/cli.ts`)
- [ ] Bump to `1.0.0` in manifest, lockfile, and README badge
- [ ] Maintainer scripts: `release:check`, `release:version` (or equivalent) via `scripts/release-version.mjs`
- [ ] `CHANGELOG.md` with `[1.0.0]` first-release notes
- [ ] `docs/RELEASING.md` (maintainers) and `docs/CONTRIBUTING.md` (all contributors)
- [ ] Contract tests for version consistency; no live registry calls
- [ ] Story prepares publish; `npm publish` requires explicit owner instruction at review

**Logging & diagnostics:** Release scripts emit deterministic step/status messages only; never log npm tokens or credentials.

**Quality measures:** Full §0.2 gate; `verify-package`; version contract tests.

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

**Roadmap:** POST-MVP-ROADMAP.md Bet 1.

---

### E23 — MemPalace Integration (future bet)

**Vertical slice:** Export MemPalace wing → room → drawer taxonomy to markdown and run specwiki generate for a browsable palace view — complementing MemPalace MCP semantic search.

**Binds:** POST-MVP-ROADMAP.md Bet 7; ecosystem theme

**Proposed capabilities:**

- Export bridge or `discover/mempalace` adapter reading palace via MCP/sqlite
- `mempalace-export/{wing}/{room}/{slug}.md` with YAML frontmatter
- Wing/room filters and hybrid index mode for large palaces
- `deriveCategory()` for `mempalace-export/` prefix

**Not sequenced.** Depends on MemPalace batch-read API stability and user demand for structured browse beyond `mempalace status`.

**MemPalace filing:** `app_ideas/devtools` — source `cursor/chat/specwiki-mempalace-obsidian-integration`.

---

### E24 — Obsidian Integration (future bet)

**Vertical slice:** First-class Obsidian vault export and documented Obsidian-as-source / annotation-layer workflows.

**Binds:** POST-MVP-ROADMAP.md Bet 8; ecosystem theme; Phase F SSG export family

**Proposed capabilities:**

- `specwiki export --format obsidian` — folder-per-category, wikilinks, YAML frontmatter, MOC pages
- Read-only `wiki/` vault pattern vs separate annotation vault
- Obsidian vault in git as spec source → HTML publish for team

**Not sequenced.** Pairs with `--emit-llms-txt` (agent-oriented) vs Obsidian (human-oriented exploration).

**MemPalace filing:** `app_ideas/devtools` — source `cursor/chat/specwiki-mempalace-obsidian-integration`.

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
| S16.5 | HTML inter-page link resolution             | 4+      |

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

#### S16.5 — HTML inter-page link resolution

**As** Alex, **I want** markdown links inside wiki article bodies to open the correct HTML pages, **so that** cross-references work when browsing via `file://` without a server.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Depends on:** S16.2, S16.3  
**Demo path:** `npm run dev generate -- --project . --output wiki` → open `wiki/html/docs-adr-index.html` → click `./template.md` and ARCHITECTURE-SPINE links → land on `{slug}.html` pages; open `wiki/html/readme.html` → click `CHANGELOG.md` → lands on `changelog.html`.

**FR:** FR-033 (completes S16.2 inter-page link AC for body content) | **AD:** AD-4, AD-7

**Functional:**

- [ ] Build a `WikiLinkIndex` at generate time mapping discovered source paths → output slugs (collision-aware, reusing `assignUniqueSlugs`)
- [ ] Resolve relative markdown hrefs from the **source file path** (not the flat `html/` output location) and rewrite known targets to `{slug}.html` (preserve `#fragment`)
- [ ] Wire link resolver into HTML rendering only: article bodies, index root intro, and category README intros — **not** markdown `wiki/*.md` output
- [ ] Pass through unchanged: `#anchors`, `http(s):`, `mailto:`, and targets not in the discovered corpus
- [ ] Reject rewriting dangerous schemes (`javascript:`, `data:`, `vbscript:`); do not emit absolute `file://` hrefs
- [ ] Verbose `output.link-unresolved` when a relative `.md`/`.mdc`/`.txt` href cannot be mapped (optional CSS class deferred)

**Logging & diagnostics (§0.8):**

- [ ] `output.link-unresolved` logs `{ sourcePath, href }` when rewrite lookup fails (verbose only)
- [ ] `render.error` unchanged on markdown failure (always)

**Quality measures:**

- [ ] Full §0.2 gate passes
- [ ] Unit tests for resolver matrix (same-dir, parent traversal, cross-tree, fragments, externals, escape paths)
- [ ] Integration test: generated HTML body links contain no raw `.md` hrefs for discovered targets
- [ ] Markdown wiki output byte-identical aside from unrelated changes

**E16 gate:** Fixture wiki opens in browser with Wikipedia-like layout, navigation, highlighted code, working client-side search, and **clickable inline cross-links**; markdown output unchanged; frozen `wiki/html/` contract preserved.

---

### E20 — SpecWiki.ai Landing Page

**Value proposition:** Make AI knowledge useful to humans. The public site explains how `[[specwiki]]` turns AI-oriented project knowledge into a navigable, trustworthy wiki for the people who need to understand and use it.

**Audience:** Developers and technical teams evaluating SpecWiki, plus non-author stakeholders who need a clear human-facing view of AI-generated project knowledge.

**Brand and logo:** Use the canonical `[[specwiki]]` text wordmark from [`docs/brand/BRAND.md`](../../../../docs/brand/BRAND.md), never a substitute icon or title-cased “Spec Wiki.” Use the light SVG on light surfaces and the dark SVG on dark surfaces; preserve at least `1em` clear space. The landing page inherits the documented monospace typography and primary bracket accent, while remaining a distinct product-marketing surface rather than generated wiki output.

**Dependency:** E20 starts only after **E13 — Distribution & Publish**, specifically **S13.1 — npm publish preparation**, has completed and the `specwiki` package is published to npm. The landing page’s primary CTA may then direct visitors to a real, installable package rather than a pre-release workflow.

**Hosting:** Publish the production static site at `https://specwiki.ai` with HTTPS. The deployment provider is intentionally left open; the implementation must document the selected provider, build command, DNS configuration, and preview/release workflow.

| Story | Summary                                            | Outcome                                                                          |
| ----- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| S20.1 | Landing-page narrative and brand treatment         | A clear, on-brand explanation of why AI knowledge needs a human-useful wiki      |
| S20.2 | Responsive, accessible landing-page implementation | A fast public page that works across screen sizes and keyboard/screen-reader use |
| S20.3 | specwiki.ai hosting and release workflow           | The page is reliably published at the production domain                          |

#### S20.1 — Landing-page narrative and brand treatment

**As** a prospective user, **I want** a concise explanation of how SpecWiki makes AI knowledge useful to humans, **so that** I can decide whether it solves my team’s documentation-discovery problem.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓
**Depends on:** Canonical brand kit in `docs/brand/BRAND.md`
**Demo path:** Open the landing-page preview → hero states “Make AI knowledge useful to humans” → scroll through the product explanation and CTA.

**Functional:**

- [ ] Hero uses the exact value proposition: **“Make AI knowledge useful to humans.”**
- [ ] Page explains the problem (AI-era knowledge is difficult for people to find and understand), the product approach (generate a navigable wiki from project knowledge), and the human outcome (shared, usable understanding).
- [ ] Copy includes a primary call to action appropriate to the available product path (for example, install, view documentation, or view source), with destination confirmed before implementation.
- [ ] Canonical `[[specwiki]]` wordmark is visible in the header and follows all variant, color, typography, casing, and clear-space rules in `docs/brand/BRAND.md`.
- [ ] Logo has meaningful accessible text; decorative duplicates are hidden from assistive technology.

**Quality measures:**

- [ ] Content review verifies the value proposition is present verbatim and the product claims are supportable.
- [ ] Brand review verifies only canonical logo assets and documented colors are used.

#### S20.2 — Responsive, accessible landing-page implementation

**As** a visitor, **I want** the landing page to be readable and usable on desktop and mobile, **so that** I can understand SpecWiki regardless of device or input method.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓
**Depends on:** S20.1
**Demo path:** Open the deployed preview at desktop and 320px widths → navigate all calls to action with a keyboard → verify readable structure and no horizontal page overflow.

**Functional:**

- [ ] Implement a static landing page with semantic landmarks, a single `h1`, descriptive links, visible keyboard focus, and contrast that meets WCAG 2.1 AA.
- [ ] Layout adapts without page-level horizontal overflow from 320px through desktop widths.
- [ ] Images and SVG assets are optimized and include appropriate alternative text or are marked decorative.
- [ ] Page loads without requiring client-side JavaScript for the core value proposition, navigation, or primary CTA.
- [ ] Core CLI package behavior and frozen generated-wiki output contracts remain unchanged.

**Quality measures:**

- [ ] Automated checks cover the selected page build and static asset validation.
- [ ] Manual accessibility check verifies keyboard navigation, focus visibility, heading order, and light/dark logo contrast.

#### S20.3 — specwiki.ai hosting and release workflow

**As** a prospective user, **I want** `specwiki.ai` to load the official landing page securely, **so that** I can trust the product’s public entry point.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓
**Depends on:** S20.2 and owner-selected deployment provider
**Demo path:** Visit `https://specwiki.ai` → HTTPS loads the production landing page → navigate a primary CTA and confirm it reaches its intended destination.

**Functional:**

- [ ] Configure the selected static-site provider to publish the landing-page build at `https://specwiki.ai` with HTTPS.
- [ ] Document the build command, deployment configuration, DNS records, environment variables (if any), and rollback process; no secrets are committed.
- [ ] A pull-request preview or equivalent pre-production verification path exists before production deployment.
- [ ] Production releases are reproducible from the repository and do not depend on local-only assets or undocumented manual steps.

**Quality measures:**

- [ ] Deployment verification confirms `https://specwiki.ai` serves the current production page with a valid certificate.
- [ ] Release documentation is sufficient for another maintainer to deploy and roll back safely.

**E20 gate:** E13 S13.1 is complete and `specwiki` is published to npm; `https://specwiki.ai` presents an accessible, responsive, on-brand landing page that clearly communicates “Make AI knowledge useful to humans,” uses the canonical `[[specwiki]]` wordmark correctly, and has a documented, reproducible release path.

---

### E21 — NPM Security Hardening & Publish Safety

**Vertical slice:** Close security gaps identified in the 2026-07-16 pre-publish security analysis so npm consumers are not exposed to path escape, undocumented trust boundaries, or weak maintainer release hygiene.

**Audience:** npm installers, maintainers cutting releases, security researchers.

**Dependency:** Complete **before E22 S22.6** first public `npm publish` (or owner explicitly waives open stories). Complements **E13 S13.1** (`verify-package`, `prepublishOnly`).

**Context:** [`epic-21-npm-security-hardening.md`](../../implementation-artifacts/epic-21-npm-security-hardening.md)

| Story | Summary                                         | Finding / source                 | Status  |
| ----- | ----------------------------------------------- | -------------------------------- | ------- |
| S21.1 | Generate output confined to project root        | SEC-1                            | done    |
| S21.2 | README security section for npm users           | SEC-3, SEC-4, SEC-6              | done    |
| S21.3 | SECURITY.md vulnerability reporting policy      | Publish gate                     | backlog |
| S21.4 | Trust warning when loading `specwiki.config.js` | SEC-2                            | backlog |
| S21.5 | Release-time dependency audit gate              | SEC-5                            | backlog |
| S21.6 | Maintainer npm publish security checklist       | Analysis recs 3–4, SEC-6         | backlog |
| S21.7 | Opt-in HTML sanitization (`--sanitize-html`)    | SEC-3 mitigation; POST-MVP Bet 6 | backlog |

#### S21.1 — Generate output confined to project root ✅ done

**As** an npm user, **I want** `generate --output` confined to `--project`, **so that** wiki files cannot be written outside my repo.

**Demo path:** `specwiki generate --output ../outside` — exits non-zero; `output.error` + `cli.error`.

**Functional:**

- [x] Shared `resolveOutputWithinProject` in `src/core/paths.ts`
- [x] Symlink escape rejected via `realpath`
- [x] Parity with `specwiki open` output guards

**Quality measures:**

- [x] `tests/commands/generate.test.ts`, `tests/cli.test.ts`, `tests/core/paths.test.ts`
- [x] Commit `a52ff64`

#### S21.2 — README security section ✅ done

**As** a prospective user, **I want** README security guidance, **so that** I understand trusted-project and npm-surface risks before running specwiki.

**Functional:**

- [x] `## Security` — trusted projects, path safety, npm package surface
- [x] Documents `specwiki.config.js` RCE and markdown/HTML XSS model
- [x] Documents `--output` confinement for `generate` and `open`

#### S21.3 — SECURITY.md vulnerability reporting

**As** a researcher, **I want** `SECURITY.md`, **so that** I can report vulnerabilities privately.

**Functional:**

- [ ] `SECURITY.md` at repo root with supported versions and private reporting channel
- [ ] README links to `SECURITY.md`
- [ ] Scope statement (CLI vs user spec content)

#### S21.4 — Config.js trust warning

**As** a developer on a cloned repo, **I want** a warning when `.js` config loads, **so that** I know arbitrary code is executing.

**Functional:**

- [ ] One stderr warning per invocation when `specwiki.config.js` is used
- [ ] No warning for JSON config; `--json` stdout stays clean
- [ ] `config.warn` structured event without config body

#### S21.5 — Release dependency audit gate

**As** a maintainer, **I want** `npm audit` in the release gate, **so that** high/critical CVEs block publish.

**Functional:**

- [ ] Audit step in prepublish or `release:check`
- [ ] Fail on high/critical; document exception process

#### S21.6 — Maintainer publish security checklist

**As** a maintainer, **I want** a releasing checklist, **so that** every publish uses verify-package, dry-run, and 2FA.

**Functional:**

- [ ] `docs/RELEASING.md` (or equivalent) with numbered pre-publish steps
- [ ] Documents `verify-package`, `prepublishOnly`, `publish:package --dry-run`, npm 2FA
- [ ] References `check-secrets`, tarball allowlist, no install hooks

#### S21.7 — Opt-in HTML sanitization (deferred)

**As** a user with contributor specs, **I want** `--sanitize-html`, **so that** untrusted markdown cannot inject scripts in HTML output.

**Functional:**

- [ ] Opt-in flag on `generate`; default unchanged (AD-6)
- [ ] Tests for script injection stripped in HTML body
- [ ] Not required for v1.0.0 unless owner prioritizes

**E21 gate:** S21.1–S21.2 done; S21.3–S21.6 complete before first npm publish; S21.7 optional post-v1.

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

### POST-MVP epics (E8–E20) — **backlog**

| Epic                 | Stories     | FR binding                                            | Status        |
| -------------------- | ----------- | ----------------------------------------------------- | ------------- |
| E8 Custom discovery  | S8.1–S8.4   | FR-005, FR-006, FR-035                                | backlog       |
| E9 Agent I/O         | S9.1–S9.2   | FR-017, FR-023                                        | backlog       |
| E10 Team CI          | S10.1       | FR-024                                                | backlog       |
| E11 Live loop        | S11.1–S11.2 | FR-025, FR-026                                        | backlog       |
| E12 Semantic         | S12.1–S12.3 | FR-010                                                | backlog       |
| E13 Distribution     | S13.1–S13.4 | FR-027, FR-028; go-to-market (S13.3); release (S13.4) | backlog       |
| E14 Ecosystem        | S14.1–S14.3 | FR-018, FR-029                                        | backlog       |
| E15 IDE              | S15.1       | —                                                     | backlog       |
| E16 Wiki HTML skin   | S16.1–S16.5 | FR-032–FR-034                                         | backlog       |
| E20 specwiki.ai      | S20.1–S20.3 | New public web surface; depends on E13 S13.1          | backlog       |
| E21 NPM security     | S21.1–S21.7 | Pre-publish hardening; gate before E22 S22.6          | in-progress   |
| E22 SemVer & release | S22.1–S22.7 | FR-027 release process; supersedes E13 S13.4          | ready-for-dev |

---

### E22 — SemVer & Release Process

**Vertical slice:** Repeatable semver bump, verify, tag, publish, and post-publish checks for `@lucasviola/specwiki` on npm.

**Audience:** npm maintainers and trusted contributors.

**Supersedes:** E13 S13.4 (monolithic release story decomposed here).

**Dependency:** E13 S13.1 (publish contract), E13 S13.2 (CI), E21 (security gate before S22.6).

**Context:** [`epic-22-semver-and-release-process.md`](../../implementation-artifacts/epic-22-semver-and-release-process.md)

| Story | Summary                                     | Depends          | Status        |
| ----- | ------------------------------------------- | ---------------- | ------------- |
| S22.1 | Single-source CLI version                   | S13.1            | ready-for-dev |
| S22.2 | Release version bump script                 | S22.1            | ready-for-dev |
| S22.3 | `release:check` orchestration               | S13.1, S22.2     | ready-for-dev |
| S22.4 | CHANGELOG and SemVer policy                 | —                | ready-for-dev |
| S22.5 | Maintainer and contributor docs             | S22.3, S22.4     | ready-for-dev |
| S22.6 | Version 1.0.0 first public release          | S22.1–S22.5, E21 | ready-for-dev |
| S22.7 | GitHub tag-triggered npm publish (optional) | S22.6            | backlog       |

#### S22.1 — Single-source CLI version

**As** an npm user, **I want** `--version` to match `package.json`, **so that** published and dev builds never drift.

**Demo path:** `node dist/cli.js --version` equals manifest semver.

**Functional:**

- [ ] `src/version.ts` reads `package.json` at runtime
- [ ] No hardcoded semver in `src/cli.ts`
- [ ] Contract tests for CLI and unit paths

#### S22.2 — Release version bump script

**As** a maintainer, **I want** `npm run release:version`, **so that** manifest, lockfile, and README badge stay in sync.

**Functional:**

- [ ] `scripts/release-version.mjs` with `--patch|--minor|--major|--set`
- [ ] README badge sync; drift detection
- [ ] Never publishes or reads npm tokens

#### S22.3 — Release check orchestration

**As** a maintainer, **I want** `npm run release:check`, **so that** I can verify a release without publishing.

**Functional:**

- [ ] Composes `prepublish-check` + `verify-package`
- [ ] Optional audit step when S21.5 lands

#### S22.4 — CHANGELOG and SemVer policy

**As** a user, **I want** a changelog and semver rules, **so that** I know what changed and how versions are chosen.

**Functional:**

- [ ] `CHANGELOG.md` with `[Unreleased]` and `[1.0.0]`
- [ ] `docs/SEMVER.md` with PATCH/MINOR/MAJOR rules

#### S22.5 — Maintainer and contributor documentation

**As** a contributor or maintainer, **I want** CONTRIBUTING and RELEASING docs, **so that** roles and release steps are explicit.

**Functional:**

- [ ] `docs/CONTRIBUTING.md` — setup, gate, PR norms, no publish rights
- [ ] `docs/RELEASING.md` — bump → check → tag → publish → verify
- [ ] README links; integrates S21.6 checklist when available

#### S22.6 — Version 1.0.0 first public release

**As** the owner, **I want** to ship 1.0.0 to npm, **so that** `npx @lucasviola/specwiki` works from the registry.

**Functional:**

- [ ] All version strings at 1.0.0; `release:check` green
- [ ] Owner executes tag + publish; post-publish verification recorded
- [ ] README npm badge after publish

#### S22.7 — GitHub tag-triggered npm publish (optional)

**As** a maintainer, **I want** CI publish on tag push, **so that** releases are reproducible without laptop publish.

**Functional:**

- [ ] `.github/workflows/release.yml` on `v*` tags
- [ ] `NPM_TOKEN` secret; provenance; tag/version validation
- [ ] Deferred until S22.6 manual release succeeds

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
4. **POST-MVP:** E8 → E15; **E16** (wiki HTML skin) recommended after E4; **E21** (npm security) before **E22 S22.6** first publish; **E22** (semver & release) S22.1–S22.6 for 1.0.0; **E20** follows E13 S13.1 once the package is published to npm.
5. **Backlog idea:** **E27** (live hero example on specwiki.ai) — logged 2026-07-18; conversion-first; no stories started.
6. **Backlog:** **E28** (specwiki blog at specwiki.ai/blog) — logged 2026-07-20; no RSS in v1.

---

### E28 — specwiki Blog (specwiki.ai/blog) — **backlog**

**Status:** Epic created 2026-07-20 from party-mode huddle. Publisher editorial channel; markdown-in-repo; extends landing build.

**JTBD:** _“Tell me why I should care today, what changed, and how specwiki fits the SDD ecosystem.”_

**Depends on:** E20 (complete).

**Owner decisions:** No RSS, no comments UI, analytics-free, markdown-in-PR authoring.

**Full spec:** [`epic-28-specwiki-blog.md`](../../implementation-artifacts/epic-28-specwiki-blog.md)

| Story | Summary                                      | v1?   |
| ----- | -------------------------------------------- | ----- |
| S28.1 | Blog build pipeline + frontmatter validation | ✓     |
| S28.2 | Blog index, post layout, longform CSS        | ✓     |
| S28.3 | Landing nav integration + deploy/CI tests    | ✓     |
| S28.4 | Seed post + editorial conventions            | ✓     |
| S28.5 | README and launch-copy discovery links       | ✓     |
| S28.6 | Launch trilogy posts (editorial)             | defer |
| S28.7 | RSS syndication                              | defer |
| S28.8 | sitemap.xml + per-post OG images             | defer |
| S28.9 | Email subscribe CTA                          | defer |

---

### E27 — Live Hero Example (specwiki.ai/examples) — **backlog / idea**

**Status:** Logged only (2026-07-18). Owner decision: **conversion over breadth** — one live generated wiki on the landing page before a multi-example gallery.

**Idea:** Replace the landing page’s static fake wiki mock with a build-time generated wiki for `examples/agent-harness-parcel`, served at `https://specwiki.ai/examples/agent-harness-parcel/`. Defer five-demo gallery hub until the hero proves it moves visitors toward install.

**JTBD:** _“Show me the real output — then I’ll try it on my project.”_

**Depends on:** E20 (complete).

**Full spec:** [`epic-27-live-examples-gallery.md`](../../implementation-artifacts/epic-27-live-examples-gallery.md)

| Story | Summary                                | v1?   |
| ----- | -------------------------------------- | ----- |
| S27.1 | Example metadata manifest (hero-first) | ✓     |
| S27.2 | Build-time hero wiki generation        | ✓     |
| S27.4 | Landing §04 → live hero wiki           | ✓     |
| S27.5 | Deploy verification and site tests     | ✓     |
| S27.3 | Examples gallery hub                   | defer |
| S27.6 | Cross-example navigation chrome        | defer |

---

## Discovery Artifacts

| Artifact             | Path                            |
| -------------------- | ------------------------------- |
| HARNESS §0.8 + §0.10 | `HARNESS.md`                    |
| PRD                  | [prd/prd.md](prd/prd.md)        |
| Decisions            | [decisions.md](../decisions.md) |
