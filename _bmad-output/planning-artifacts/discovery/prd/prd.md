---
title: specwiki Product Requirements Document
product: specwiki
status: final
created: 2026-07-12
updated: 2026-07-12
author: Discovery loop (headless, bmad-prd Create, fast path)
primary_persona: Solo Cursor/AI agent developer
---

# specwiki — Product Requirements Document

## Executive Summary

**specwiki** is a local CLI that discovers AI agent instructions, spec-driven development artifacts, and framework outputs scattered across a repository, then synthesizes them into a categorized, browsable wiki (markdown + HTML). It does not author specs, run agents, or host documentation — it makes existing agent-facing files human-navigable with one command.

**MVP primary user:** Solo developers using Cursor, Claude Code, or similar AI coding agents who accumulate rules, skills, and SDD artifacts faster than they can mentally track them.

**MVP proves:** A zero-config `specwiki generate` run produces a complete wiki from a brownfield repo in under 60 seconds, with 90% test coverage, structured logging, and slug-collision safety — without requiring a docs platform, team infrastructure, or framework migration.

**Product vision:** For developers who use AI coding agents, specwiki is a CLI documentation synthesizer that discovers and unifies agent specs, rules, and skills into a browsable wiki. Unlike SDD frameworks that create specs or IDEs that run agents, specwiki makes existing agent instructions human-navigable with one command.

---

## Problem Statement

AI-assisted development produces persistent instruction artifacts — `AGENTS.md`, `.cursor/rules/*.mdc`, `.cursor/skills/**/SKILL.md`, `openspec/`, `.kiro/specs/`, `specs/`, and framework outputs — scattered across directory trees. Agents consume these files one at a time during sessions; humans have no unified view.

Solo developers feel this pain first:

- After weeks of iterative rule-writing, they cannot answer "what did I tell the agents?"
- Context loss between sessions forces re-discovery via grep or re-prompting
- Cross-tool duplication (`AGENTS.md` + `CLAUDE.md` + Copilot instructions) stays invisible until something breaks
- SDD frameworks produce specs faster than humans curate documentation

Existing alternatives (IDE rule browsers, SDD framework UIs, static site generators, agent-context authoring tools) each cover a slice but none offer cross-framework, zero-config discovery with category-aware indexing and dual markdown + HTML output from a single CLI command.

---

## Target Users

### Primary — Persona A: Solo Cursor/AI Agent Developer ("Alex")

| Attribute   | Detail                                                                                |
| ----------- | ------------------------------------------------------------------------------------- |
| Profile     | Individual developer using Cursor, Claude Code, or Copilot on 1–3 active repos        |
| Behavior    | Adopts BMAD or OpenSpec opportunistically; accumulates rules and skills organically   |
| Environment | Local machine, Node.js ≥ 20, no team coordination                                     |
| Trigger     | "I added five rules last month — where are they all?" or returning after context loss |

**Why primary for MVP:** v0.1 is a local CLI with `list` and `generate` only. Solo workflow = install → run → browse. Highest pain frequency and shortest time-to-value.

### Secondary (POST-MVP expansion)

| Persona                          | Role                                               | Unlock                                           |
| -------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| B — Small team tech lead         | Standardizes OpenSpec/BMAD; needs async onboarding | CI regeneration, shared publishing               |
| C — OSS maintainer               | Documents contributor agent conventions            | npm publish, GitHub Pages export                 |
| D — Enterprise platform engineer | Monorepo rule inventory, compliance                | Multi-repo scan, auth, dashboards (out of scope) |

---

## User Journey — Persona A (MVP)

**Alex** returns to a side project after three weeks away. They remember adding Cursor rules and an OpenSpec change but not where everything lives.

1. Alex runs `specwiki list` from the repo root and sees 12 spec files grouped by category (Cursor Rules, OpenSpec, Project Root).
2. Encouraged, Alex runs `specwiki generate --verbose` and receives a summary: 12 pages written to `wiki/`.
3. Alex opens `wiki/html/index.html` in a browser and navigates the categorized index.
4. Alex clicks into a Cursor rule page, sees the source path, TOC, and full rule content.
5. After adding two new skills, Alex re-runs `specwiki generate` to refresh the wiki.

**Success:** Alex understands the full agent instruction landscape in under 60 seconds without grep or re-prompting.

---

## MVP Scope

MVP completes when HARNESS Phases 0–3 deliverables pass the §13 checklist: working `list`/`generate`, structured logging, slug collision fix, 90% coverage, path/HTML safety, and `IMPLEMENTATION.md` build log through Phase 3.

### In scope

| Area              | Capability                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discovery**     | Scan project with 15+ default glob patterns (`DEFAULT_SPEC_PATTERNS`) covering Cursor, AGENTS.md, OpenSpec, Kiro, Copilot, generic `specs/` |
| **Preview**       | `specwiki list` — group discovered paths by category; exit 0 with helpful tip when zero matches                                             |
| **Synthesis**     | `specwiki generate` — discover → parse frontmatter/sections → write wiki                                                                    |
| **Markdown wiki** | `wiki/index.md` categorized by `CATEGORY_LABELS`; `wiki/{slug}.md` per spec with title, source path, description, TOC, full content         |
| **HTML wiki**     | Self-contained `wiki/html/*.html` with nav back to index; title escaping via `escapeHtml`                                                   |
| **CLI flags**     | `--project`, `--output`, `--verbose`                                                                                                        |
| **Hardening**     | Structured logger (`src/core/Logger.ts`); slug collision disambiguation; path traversal safety on writes                                    |
| **Quality**       | Vitest with 90% coverage thresholds; full §0.2 quality gate (test, lint, format, coverage, typecheck, build)                                |
| **Build log**     | `IMPLEMENTATION.md` with progression checklist and per-task build log through Phase 3                                                       |
| **Validation**    | [ASSUMPTION] Local install via `npm link` / `npm run dev`; formal `npx specwiki` publish deferred to POST-MVP Phase 4.2                     |

### Out of scope

| Area                                                                        | Rationale                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Hosted wiki SaaS                                                            | Local CLI product; no account or hosting infrastructure      |
| Spec authoring, validation, or enforcement                                  | Complementary to OpenSpec/BMAD; read-only aggregator         |
| Real-time watch/regenerate                                                  | Manual re-run sufficient for Persona A MVP validation        |
| Bundled dev server (`specwiki serve`)                                       | Static HTML files browsable directly; decision 2026-07-12    |
| Custom pattern config (`--patterns`, config file)                           | Zero-config MVP; Phase 4.1 POST-MVP                          |
| npm publish / CI workflow                                                   | Distribution after hardening; Phase 4.2–4.3 POST-MVP         |
| `--json` machine output                                                     | Agent/script consumers POST-MVP                              |
| `wiki/llms.txt` export                                                      | High value but not required to prove synthesis for Persona A |
| Extended discovery (`**/AGENTS.md`, `_bmad-output/**`, `.agents/skills/**`) | Default patterns sufficient for Persona A; POST-MVP Epic A   |
| Semantic parsing (OpenSpec deltas, BMAD kernels, Cursor frontmatter badges) | Treat all inputs as markdown-with-frontmatter for MVP        |
| Cross-repo / OpenSpec Stores scanning                                       | Enterprise/team scope                                        |
| Team admin, rule enforcement, analytics                                     | Persona D; not MVP                                           |
| Semantic search or AI Q&A over specs                                        | Future exploration                                           |
| SSG export (VitePress, MkDocs scaffold)                                     | Users can point SSG at generated `wiki/` manually            |
| Spec drift detection / duplicate diffing                                    | POST-MVP value add                                           |
| Plugins / extension API                                                     | Premature before config API stable                           |
| E2E / browser tests                                                         | HARNESS §0.2.1 default skip unless owner requests            |

---

## POST-MVP Scope

POST-MVP begins at HARNESS Phase 4 and expansion epics. Capabilities deferred with rationale:

| Capability                                   | Phase / Epic       | Rationale                                                                                            |
| -------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| **`--patterns` flag / `specwiki.config.js`** | Phase 4.1 / Epic B | Monorepos and org-specific layouts need overrides; zero-config MVP must prove default patterns first |
| **npm publish (`npx specwiki`)**             | Phase 4.2 / Epic D | Distribution unlocks Personas B/C; requires slug fix and quality gate stability                      |
| **CI workflow (GitHub Actions)**             | Phase 4.3 / Epic D | Package-level quality gate; consumer CI docs (`generate --check`) follow                             |
| **`specwiki serve`**                         | Epic B             | Local static server on `127.0.0.1` via Node built-in `http`; browsing works without it today         |
| **`generate --watch`**                       | Epic B             | Debounced rebuild reduces friction for frequent rule editors; not needed to prove core value         |
| **`generate --check`**                       | Epic B             | CI freshness (exit 1 if wiki stale); depends on stable generate contract                             |
| **`--json` output**                          | Epic A             | Machine-readable summaries for agent/script consumers                                                |
| **`wiki/llms.txt` export**                   | Epic A             | Agent-oriented index from discovered specs; high value, low MVP urgency                              |
| **Extended discovery patterns**              | Epic A             | `**/AGENTS.md`, `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md` for BMAD-heavy repos            |
| **Semantic enrichment**                      | Epic C             | Cursor rule badges, OpenSpec change-set grouping, BMAD kernel cards                                  |
| **SSG export**                               | Epic D             | `specwiki export --format vitepress\|mkdocs` scaffold                                                |
| **Spec drift detection**                     | POST-MVP           | Compare duplicate instruction files; flag stale wiki                                                 |
| **Plugins / extension API**                  | POST-MVP           | Custom category rules after config API stabilizes                                                    |
| **MCP manifest indexing**                    | POST-MVP           | Document `.cursor/mcp.json` and similar configs                                                      |
| **VS Code / Cursor extension**               | POST-MVP           | IDE-integrated wiki panel                                                                            |

**Expansion path:** Persona A (solo local generate) → Persona B (CI-regenerated wiki) → Persona C (published OSS docs) → Persona D (enterprise inventory).

---

## Functional Requirements

Requirements use stable `FR-xxx` IDs. Tag indicates MVP or POST-MVP delivery.

### Discovery & Preview

| ID     | Tag      | Requirement                                                                                                                                                                                 |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | MVP      | The CLI SHALL scan `--project` (default: current working directory) using `DEFAULT_SPEC_PATTERNS` from `src/config/patterns.ts` and ignore `node_modules/`, `dist/`, `wiki/`, `.specwiki/`. |
| FR-002 | MVP      | The CLI SHALL derive category from path prefix via `deriveCategory` and title from basename via `deriveTitle`, with special cases for `SKILL`, `AGENTS`, `SPEC`, `CLAUDE`, `GEMINI`.        |
| FR-003 | MVP      | `specwiki list` SHALL group discovered file paths by category, print to stdout sorted by category then relative path, and exit 0.                                                           |
| FR-004 | MVP      | When zero spec files match, `specwiki list` SHALL exit 0 and print a helpful tip suggesting the user verify patterns or project path.                                                       |
| FR-005 | POST-MVP | The CLI SHALL accept `--patterns` (comma-separated globs) or load patterns from `specwiki.config.js` / `specwiki.config.json` with precedence: CLI flags > env > project config > defaults. |
| FR-006 | POST-MVP | The CLI SHALL discover nested `**/AGENTS.md`, `_bmad-output/**/*.md`, and `.agents/skills/**/SKILL.md` when included in extended or custom patterns.                                        |

### Parsing & Content

| ID     | Tag      | Requirement                                                                                                                                                             |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-007 | MVP      | For each discovered file, the CLI SHALL read UTF-8 content, parse YAML frontmatter via gray-matter, and use frontmatter `title` when present else derived title.        |
| FR-008 | MVP      | The CLI SHALL extract description from the first non-heading paragraph (max 300 characters) and build a TOC from markdown headings `#`–`######` with slugified anchors. |
| FR-009 | MVP      | The CLI SHALL preserve full spec body as raw markdown content in wiki pages without semantic transformation.                                                            |
| FR-010 | POST-MVP | The CLI MAY extract and display framework-specific metadata (Cursor rule `globs`/`alwaysApply`, OpenSpec change-set grouping, BMAD SPEC kernel fields) on wiki pages.   |

### Wiki Output

| ID     | Tag      | Requirement                                                                                                                                                             |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-011 | MVP      | `specwiki generate` SHALL write `wiki/index.md` grouped by `CATEGORY_LABELS` with links to per-spec pages.                                                              |
| FR-012 | MVP      | `specwiki generate` SHALL write `wiki/{slug}.md` for each spec containing title, source path blockquote, optional description, TOC, and full content.                   |
| FR-013 | MVP      | Slugs SHALL be derived from relative path: lowercase, `/` → `-`, strip `.md`/`.mdc`/`.txt` extension.                                                                   |
| FR-014 | MVP      | When distinct relative paths produce identical slugs, the CLI SHALL disambiguate slugs (path suffix or hash) so no silent overwrites occur.                             |
| FR-015 | MVP      | `specwiki generate` SHALL write `wiki/html/index.html` and `wiki/html/{slug}.html` with minimal styled HTML, navigation back to index, and `escapeHtml` on page titles. |
| FR-016 | MVP      | `specwiki generate` SHALL print a stdout summary with file counts and output paths upon completion.                                                                     |
| FR-017 | POST-MVP | `specwiki generate` MAY emit `wiki/llms.txt` indexed by category with descriptions from `extractDescription()`.                                                         |
| FR-018 | POST-MVP | `specwiki export --format vitepress\|mkdocs` SHALL scaffold SSG configuration pointing at generated `wiki/` directory.                                                  |

### CLI Interface

| ID     | Tag      | Requirement                                                                                                                                                                                    |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-019 | MVP      | Both commands SHALL accept `-p, --project <path>` defaulting to `process.cwd()`.                                                                                                               |
| FR-020 | MVP      | `specwiki generate` SHALL accept `-o, --output <dir>` defaulting to `wiki` relative to project root.                                                                                           |
| FR-021 | MVP      | `specwiki generate` SHALL accept `-v, --verbose` to emit structured diagnostic logs to stderr.                                                                                                 |
| FR-022 | MVP      | On runtime failure (I/O error, parse failure, write failure), the CLI SHALL exit non-zero. [ASSUMPTION] Exit code 1 for runtime failure, 2 for usage/validation errors per CLI best practices. |
| FR-023 | POST-MVP | `specwiki list` and `specwiki generate` SHALL support `--json` emitting stable-field machine-readable summaries to stdout.                                                                     |
| FR-024 | POST-MVP | `specwiki generate --check` SHALL exit 1 if generated output would differ from existing wiki (CI freshness).                                                                                   |
| FR-025 | POST-MVP | `specwiki generate --watch` SHALL debounce and rebuild wiki on spec file changes.                                                                                                              |
| FR-026 | POST-MVP | `specwiki serve [--port]` SHALL serve resolved `--output` directory over HTTP on `127.0.0.1` only using Node built-in `http`.                                                                  |

### Distribution & Operations

| ID     | Tag      | Requirement                                                                                                                                      |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-027 | POST-MVP | The package SHALL publish to npm with correct `files` field and prepublish script enabling `npx specwiki` on a clean machine.                    |
| FR-028 | POST-MVP | A GitHub Actions workflow SHALL run the full §0.2 quality gate on push/PR.                                                                       |
| FR-029 | POST-MVP | The CLI MAY detect duplicate instruction files (e.g., `AGENTS.md` vs `CLAUDE.md`) and surface drift warnings in verbose output or wiki metadata. |

### Build & Documentation (MVP meta)

| ID     | Tag | Requirement                                                                                                                                                                                                                                                                                                             |
| ------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-030 | MVP | `IMPLEMENTATION.md` SHALL exist with progression checklist, build log rows, and status header updated through HARNESS Phase 3 completion.                                                                                                                                                                               |
| FR-031 | MVP | The specwiki repository SHALL dogfood: `specwiki generate` on `tests/fixtures/sample-project/` (and any repo-root paths matching `DEFAULT_SPEC_PATTERNS`) produces a complete wiki. Self-repo paths outside default patterns (`.agents/skills/`, `HARNESS.md`, `_bmad-output/`) are POST-MVP FR-006 — not MVP blockers. |

---

## Non-Functional Requirements

Derived from HARNESS §0. Cross-cutting constraints apply to all MVP functional requirements.

| ID      | Source | Requirement                                                                                                                                                                                                                               |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | §0.1   | Code coverage SHALL meet ≥ 90% thresholds for lines, functions, branches, and statements, enforced via `npm run coverage` (Vitest + v8).                                                                                                  |
| NFR-002 | §0.1   | All logic in `src/discover/`, `src/parse/`, `src/output/`, `src/config/`, and `src/commands/` SHALL follow strict TDD (Red → Green → Refactor) with tests preceding or co-developed with implementation.                                  |
| NFR-003 | §0.1   | HTML output tests SHALL verify rendered structure and title escaping intent, not pixel equality.                                                                                                                                          |
| NFR-004 | §0.2   | After every implementation task, all quality gate commands SHALL pass: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.                                                                                                        |
| NFR-005 | §0.2.1 | E2E and browser tests SHALL NOT be added unless the owner explicitly requests them.                                                                                                                                                       |
| NFR-006 | §0.8   | A structured logger module (`src/core/Logger.ts`) SHALL gate detailed events behind `--verbose`; errors log regardless. Event names include `discover.start`, `discover.match`, `parse.file`, `output.write`, `cli.command`, `cli.error`. |
| NFR-007 | §0.8   | Log payloads SHALL NOT contain secrets, tokens, passwords, or full file contents.                                                                                                                                                         |
| NFR-008 | §0.9   | `--project` and `--output` paths SHALL be resolved with `path.resolve` and validated; writes SHALL be confined to the resolved output directory only.                                                                                     |
| NFR-009 | §0.9   | Output slug paths SHALL NOT contain `..` segments or escape the resolved output directory.                                                                                                                                                |
| NFR-010 | §0.9   | Discovered spec files SHALL be parsed as text only; the CLI SHALL NOT execute code from spec contents.                                                                                                                                    |
| NFR-011 | §0.9   | HTML titles and user-controlled strings in HTML wrappers SHALL be escaped via `escapeHtml`; body content rendered through `marked` is acceptable for trusted local specs.                                                                 |
| NFR-012 | §0.9   | The CLI SHALL NOT perform network I/O by default (no bundled server, no remote fetches).                                                                                                                                                  |
| NFR-013 | §12    | Frozen contracts SHALL NOT change without explicit approval: `DEFAULT_SPEC_PATTERNS` (extend only), wiki layout, `CATEGORY_LABELS`, HTML title escaping, gitignore entries.                                                               |
| NFR-014 | §12    | No new runtime npm dependencies SHALL be added without justification; current stack: commander, fast-glob, gray-matter, marked, chalk.                                                                                                    |
| NFR-015 | Stack  | TypeScript 5.8 strict mode, Node.js ≥ 20, ESM with `.js` import extensions.                                                                                                                                                               |
| NFR-016 | §0.6   | Comments SHALL be minimal — only where logic is genuinely non-obvious.                                                                                                                                                                    |
| NFR-017 | §0.7   | Code changes SHALL be small, focused diffs with no dead code or drive-by refactors.                                                                                                                                                       |

---

## Success Metrics

### MVP targets

| Metric                   | Target                                                             | Measurement                                                                        |
| ------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Time to first wiki       | < 60 seconds from clone to browsable output                        | Benchmark on specwiki repo + fixture tree                                          |
| Discovery yield          | Median project finds ≥ 5 spec files                                | `specwiki list` count on fixtures + dogfood repo                                   |
| Zero-config rate         | ≥ 80% of BMAD/OpenSpec/Cursor sample repos need no custom patterns | Fixture coverage in `tests/fixtures/`                                              |
| Dogfood validation       | Fixture tree + default-pattern paths generate complete wiki        | `tests/fixtures/sample-project/` after Phase 3; self-repo full yield awaits FR-006 |
| Quality gate reliability | 100% pass on full §0.2 gate                                        | All six npm scripts                                                                |
| Coverage threshold       | ≥ 90% lines/functions/branches/statements                          | Vitest enforced                                                                    |
| Slug integrity           | Zero silent overwrites from path collisions                        | Phase 3.4 tests                                                                    |
| Re-run habit             | [ASSUMPTION] ≥ 50% of activated users regenerate at least once     | No telemetry in MVP; dogfood + early adopters                                      |

### Anti-metrics (do not optimize in MVP)

- Monthly active users / SaaS retention (no SaaS)
- Spec authoring engagement (not our job)
- Agent implementation quality (downstream of specs)
- npm download volume before Phase 4.2 publish

### Falsification signals

| Signal                                            | Implication                                                  |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Users run `list`, see files, but never `generate` | Discovery without synthesis value — parsing/output UX broken |
| Wiki generated once, never re-run                 | Output not useful enough to maintain                         |
| `--config` requested before basic generate works  | Pattern coverage gap dominates                               |
| Zero spec files in majority of target repos       | Default patterns miss real-world layouts                     |

---

## Alignment with HARNESS §9 Build Phases

This PRD defines **what** specwiki must deliver and **for whom**. HARNESS §9 defines **how** implementation proceeds task-by-task. The two documents complement each other; the PRD does not duplicate §9 bullet lists.

| Relationship       | Detail                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope boundary** | PRD MVP = HARNESS Phases 0–3. PRD POST-MVP = Phase 4+ and expansion epics.                                                                                    |
| **Phase 0**        | PRD FR-030 maps to `IMPLEMENTATION.md` creation; NFR-004 maps to tooling scripts added in Phase 0.2–0.3.                                                      |
| **Phase 1**        | PRD FR-001–FR-004 map to discovery module; FR-002 category/title rules; NFR-006 logging in discover paths.                                                    |
| **Phase 2**        | PRD FR-007–FR-009, FR-011–FR-015 map to parse/output modules; NFR-003 HTML tests; NFR-008–NFR-011 path/HTML safety.                                           |
| **Phase 3**        | PRD FR-014 (slug collisions), FR-021 (verbose), NFR-006 (Logger.ts), NFR-004 (full quality gate) — remaining MVP hardening.                                   |
| **Phase 4+**       | PRD POST-MVP FRs (FR-005–FR-006, FR-017–FR-029) — not required for MVP sign-off per §13 checklist.                                                            |
| **§13 checklist**  | PRD MVP success = all §13 deliverables true. Architecture and epics steps translate FRs into module-level design and sprint stories without redefining scope. |
| **Checkpoints**    | HARNESS §0.3 owner review checkpoints govern implementation cadence; PRD does not alter that workflow.                                                        |

**Implementation agents:** Use HARNESS §9 for the next single bullet to implement. Use this PRD to validate that bullet delivers toward an MVP or POST-MVP FR. When conflict arises, `IMPLEMENTATION.md` wins for behaviour detail once it exists; this PRD wins for scope and persona intent.

---

## Risks and Mitigations

| Risk                                         | Severity | Mitigation                                                               |
| -------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| Slug collisions corrupt wiki                 | High     | FR-014 / Phase 3.4 before npm publish                                    |
| Format fragmentation accelerates             | Medium   | Extend-only patterns; POST-MVP config (FR-005)                           |
| Competing AGENTS.md tools absorb aggregation | Medium   | Cross-framework scan differentiation; POST-MVP `llms.txt` (FR-017)       |
| Monorepo nested AGENTS.md missed             | Medium   | POST-MVP FR-006; document `--patterns` workaround                        |
| marked XSS via embedded HTML                 | Low      | Trusted local specs; document; sanitize POST-MVP if `--allow-html` added |
| HARNESS §4 known-gaps stale vs code          | Low      | `project-context.md` authoritative for brownfield state                  |

---

## Assumptions

Tagged `[ASSUMPTION]` where inferred without owner confirmation:

1. **[ASSUMPTION]** MVP primary persona remains Solo Cursor/AI agent developer.
2. **[ASSUMPTION]** Formal npm publish (`npx specwiki`) is POST-MVP Phase 4.2; MVP validation uses local `npm link` / `npm run dev`.
3. **[ASSUMPTION]** Re-run habit rate (≥50%) is a reasonable MVP proxy; no telemetry until POST-MVP.
4. **[ASSUMPTION]** `_bmad-output/**` discovery deferred to POST-MVP; default patterns sufficient for Persona A repos today.
5. **[ASSUMPTION]** Phases 0–2 retrofit tests largely complete per `project-context.md`; remaining MVP work concentrates on Phase 3 and Phase 0.1 (`IMPLEMENTATION.md`).
6. **[ASSUMPTION]** Explicit exit codes (1 runtime, 2 usage) are desirable but not yet implemented in v0.1; included in FR-022 as MVP target.

---

## Open Questions

| Question                                                  | Status            | Owner action                                                                        |
| --------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| Emit `llms.txt` by default or via flag?                   | Deferred POST-MVP | Recommend opt-in first (`--emit-llms-txt`), default-on after validation             |
| Body HTML sanitization beyond title escape?               | Deferred POST-MVP | Stay with `marked` for trusted local specs; add `rehype-sanitize` if `--allow-html` |
| Should MVP include explicit exit code 2 for usage errors? | [ASSUMPTION] Yes  | Implement in Phase 3 CLI polish if time permits                                     |

---

## Discovery Artifacts (complete)

| Artifact           | Path                                                                                |
| ------------------ | ----------------------------------------------------------------------------------- |
| Architecture spine | [architecture/ARCHITECTURE-SPINE.md](architecture/ARCHITECTURE-SPINE.md)            |
| Epics and stories  | [epics/epics-and-stories.md](epics/epics-and-stories.md)                            |
| Readiness report   | [readiness/readiness-report.md](readiness/readiness-report.md) — ready-with-caveats |
| MVP roadmap        | [MVP-ROADMAP.md](MVP-ROADMAP.md)                                                    |
| POST-MVP roadmap   | [POST-MVP-ROADMAP.md](POST-MVP-ROADMAP.md)                                          |

---

## References

- `_bmad-output/planning-artifacts/discovery/product-brief.md` — vision, persona, feature tables
- `_bmad-output/planning-artifacts/discovery/project-context.md` — brownfield status, frozen contracts, implementation rules
- `_bmad-output/planning-artifacts/discovery/research/technical-research.md` — format landscape, CLI patterns, static output decision
- `_bmad-output/planning-artifacts/discovery/research/domain-research.md` — ecosystem positioning, Persona A decision
- `HARNESS.md` §0 (working rules), §4 (feature spec), §9 (build phases), §13 (deliverables)
- `README.md` — user-facing commands and output contract
- `decisions.md` — logged discovery decisions (static output, persona, scope boundary)
