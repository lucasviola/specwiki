---
product: specwiki
status: draft
created: 2026-07-12
updated: 2026-07-12
author: Discovery loop (headless, fast path)
primary_persona: Solo Cursor/AI agent developer
---

# Product Brief — specwiki

## Executive Summary

**specwiki** is a local CLI that discovers AI agent instructions, spec-driven development artifacts, and framework outputs scattered across a repository, then synthesizes them into a categorized, browsable wiki (markdown + HTML). It does not author specs, run agents, or host documentation — it makes existing agent-facing files human-navigable with one command.

**MVP primary user:** Solo developers using Cursor, Claude Code, or similar AI coding agents who accumulate rules, skills, and SDD artifacts faster than they can mentally track them.

**MVP proves:** A zero-config `specwiki generate` run produces a complete wiki from a brownfield repo in under 60 seconds, with 90% test coverage, structured logging, and slug-collision safety — without requiring a docs platform, team infrastructure, or framework migration.

---

## Problem Statement

### The pain

AI-assisted development in 2026 produces **persistent instruction artifacts** — `AGENTS.md`, `.cursor/rules/*.mdc`, `.cursor/skills/**/SKILL.md`, `openspec/`, `.kiro/specs/`, `specs/`, and framework outputs like `_bmad-output/` — scattered across directory trees. Agents consume these files one at a time during sessions; humans have no unified view.

Solo developers feel this pain first and most often:

- After weeks of iterative rule-writing, they cannot answer "what did I tell the agents?"
- Context loss between sessions forces re-discovery via grep or re-prompting
- Cross-tool duplication (`AGENTS.md` + `CLAUDE.md` + Copilot instructions) stays invisible until something breaks
- SDD frameworks (BMAD, OpenSpec) **produce** specs faster than humans **curate** documentation

### What exists today does not solve this

| Alternative                                             | Gap                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| IDE rule browsers (Cursor settings)                     | Single-tool, not exportable, no cross-framework view                        |
| SDD framework UIs (OpenSpec, BMAD, Kiro)                | Workflow-centric, not documentation-centric; no cross-framework aggregation |
| Static site generators (Docusaurus, MkDocs)             | Require manual nav config; not discovery-aware of agent-spec layouts        |
| Agent-context authoring tools (Dewey, Ruler, agents-md) | Generate or distribute specs; do not aggregate what already exists          |
| Manual README curation                                  | High friction, stale within days                                            |

### The opportunity

No tool currently offers **cross-framework, zero-config discovery** of agent instruction surfaces with **category-aware indexing** and **dual output** (markdown for agents + HTML for humans) from a single CLI command. specwiki owns this narrow synthesis niche.

---

## Product Vision

> **For developers who use AI coding agents**, specwiki is a **CLI documentation synthesizer** that **discovers and unifies agent specs, rules, and skills into a browsable wiki**. Unlike SDD frameworks that _create_ specs or IDEs that _run_ agents, specwiki **makes existing agent instructions human-navigable** with one command.

### Long-term direction

specwiki becomes the **readability layer** for the spec-driven development ecosystem — the tool you run after BMAD, OpenSpec, or Cursor have done their work, to see the full landscape of what your project expects agents to know. Expansion path: solo developers → small teams (CI-regenerated wiki) → OSS maintainers (published docs) → enterprise inventory (multi-repo scanning). Persona A is the wedge; Personas B and C follow once distribution and CI ship.

---

## Target Users

### Primary — Persona A: Solo Cursor/AI Agent Developer ("Alex")

| Attribute       | Detail                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**     | Individual developer, indie hacker, or senior IC using Cursor, Claude Code, or Copilot on 1–3 active repos                                            |
| **Behavior**    | Adopts BMAD or OpenSpec opportunistically; accumulates `.cursor/rules/`, skills, and root instruction files organically; rarely maintains formal docs |
| **Environment** | Local machine, npm/Node.js ≥ 20, no team coordination required                                                                                        |
| **Trigger**     | "I added five rules last month — where are they all?" or returning to a repo after context loss                                                       |

**Why primary for MVP:** v0.1 is a local CLI with `list` and `generate` only. No auth, dashboards, CI hooks, or hosted publishing. Solo workflow = install → run → browse. Highest pain frequency and shortest time-to-value.

### Secondary (POST-MVP expansion)

| Persona                              | Role                                               | MVP fit      | Unlock                             |
| ------------------------------------ | -------------------------------------------------- | ------------ | ---------------------------------- |
| **B — Small team tech lead**         | Standardizes OpenSpec/BMAD; needs async onboarding | Deferred     | CI regeneration, shared publishing |
| **C — OSS maintainer**               | Documents contributor agent conventions            | Deferred     | npm publish, GitHub Pages export   |
| **D — Enterprise platform engineer** | Monorepo rule inventory, compliance                | Out of scope | Multi-repo scan, auth, dashboards  |

---

## Core Job-to-Be-Done

**When** I have accumulated agent instructions and SDD artifacts across my repo over weeks of AI-assisted development,

**I want to** run one command that discovers every spec file and produces a categorized, browsable wiki,

**So I can** understand the full landscape of what my agents are configured to know — without grep, without re-prompting, and without adopting another framework or docs platform.

### Functional jobs

1. **Discover** — Find all agent-facing spec files using opinionated default glob patterns (15+ patterns covering Cursor, AGENTS.md, OpenSpec, Kiro, Copilot, generic `specs/`)
2. **Preview** — List discovered files grouped by category before writing (`specwiki list`)
3. **Synthesize** — Parse frontmatter, extract TOC and descriptions, preserve full content
4. **Publish locally** — Write `wiki/index.md`, per-spec pages, and `wiki/html/*.html` for browser reading
5. **Re-run** — Regenerate after adding rules or specs (manual today; watch mode POST-MVP)

### Emotional jobs

- Regain confidence after context loss ("I know what I configured")
- Reduce anxiety about invisible duplication across tool-specific files
- Feel in control of growing instruction surface area without documentation debt

### Social jobs (POST-MVP)

- Share a navigable wiki with teammates or contributors
- Commit wiki to repo for async review of agent conventions

---

## Key Features

### MVP features (HARNESS Phases 0–3)

Aligned with implementation phases that harden the brownfield v0.1 scaffold into a shippable product.

| Feature                     | Description                                                                                | HARNESS phase              |
| --------------------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| **Spec discovery**          | Scan project with `DEFAULT_SPEC_PATTERNS`; derive category and title from path conventions | Phase 1 (retrofit tests)   |
| **`specwiki list`**         | Group and print discovered paths; exit 0 with helpful tip when zero matches                | Existing + Phase 3 tests   |
| **`specwiki generate`**     | Discover → parse → write markdown wiki + HTML subtree                                      | Phase 2 (retrofit tests)   |
| **Categorized index**       | `wiki/index.md` grouped by `CATEGORY_LABELS` (Cursor Rules, OpenSpec, Project Root, etc.)  | Existing                   |
| **Per-spec wiki pages**     | Title, source path, description, TOC, full markdown content                                | Existing                   |
| **HTML output**             | Self-contained `wiki/html/*.html` with nav back to index; title escaping                   | Existing + Phase 2.4 tests |
| **CLI flags**               | `--project`, `--output`, `--verbose`                                                       | Existing                   |
| **Test infrastructure**     | Vitest, 90% coverage thresholds, fixture tree                                              | Phase 0                    |
| **Structured logger**       | `src/core/Logger.ts`; verbose-gated events to stderr                                       | Phase 3.1–3.2              |
| **Slug collision handling** | Disambiguate duplicate slugs from different paths                                          | Phase 3.4                  |
| **Path safety**             | Writes confined to resolved `--output`; no traversal                                       | Phase 2.5 + §0.9           |
| **Quality gate**            | `test`, `lint`, `format`, `coverage`, `typecheck`, `build` all pass                        | Phase 3.5                  |
| **Build log**               | `IMPLEMENTATION.md` with progression checklist and per-task log                            | Phase 0.1                  |

**MVP explicitly excludes:** custom pattern config, npm publish, CI workflow, dev server, watch mode, `--json` output, semantic parsing of framework-specific structures.

### POST-MVP features (HARNESS Phase 4+ and beyond)

| Feature                        | Description                                                                     | Phase / epic    |
| ------------------------------ | ------------------------------------------------------------------------------- | --------------- |
| **`--patterns` / config file** | Override or extend default glob sets; `specwiki.config.js`                      | Phase 4.1       |
| **npm publish**                | `npx specwiki` on clean machine; `files` field, prepublish                      | Phase 4.2       |
| **CI workflow**                | GitHub Actions quality gate for the package                                     | Phase 4.3       |
| **`specwiki serve`**           | Local static server on `127.0.0.1` (Node built-in `http`)                       | POST-MVP Epic B |
| **`generate --watch`**         | Debounced rebuild on spec file changes                                          | POST-MVP Epic B |
| **`generate --check`**         | Exit 1 if wiki stale (CI freshness)                                             | POST-MVP Epic B |
| **`--json` output**            | Machine-readable `list` and `generate` summaries                                | POST-MVP Epic A |
| **`wiki/llms.txt` export**     | Generate agent-oriented index from discovered specs                             | POST-MVP Epic A |
| **Extended discovery**         | `**/AGENTS.md`, `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md`            | POST-MVP Epic A |
| **Semantic enrichment**        | Cursor rule frontmatter badges, OpenSpec change-set grouping, BMAD kernel cards | POST-MVP Epic C |
| **SSG export**                 | `specwiki export --format vitepress\|mkdocs` scaffold                           | POST-MVP Epic D |
| **Spec drift detection**       | Compare duplicate instruction files; flag stale wiki                            | POST-MVP        |
| **Plugins / extension API**    | Custom category rules for org-specific layouts                                  | POST-MVP        |

---

## MVP vs POST-MVP Boundary

### Hypothesis

specwiki wins MVP when a **solo developer** can run `specwiki generate` on their repo and immediately understand the full landscape of agent instructions — without configuring a docs platform, without team infrastructure, and without adopting another SDD framework.

**MVP completes when HARNESS Phases 0–3 deliverables pass §13 checklist:** working `list`/`generate`, structured logging, slug collision fix, 90% coverage, path/HTML safety, and `IMPLEMENTATION.md` build log through Phase 3.

**POST-MVP begins at Phase 4:** distribution (`npm publish`), configurability (`--patterns`), and CI — then expansion features (`serve`, watch, `llms.txt`, semantic enrichment) that unlock Personas B and C.

### In scope (MVP proves)

- Discover 15+ default spec patterns across BMAD-adjacent, OpenSpec, Kiro, Cursor, AGENTS.md, Copilot layouts
- Generate categorized markdown wiki + HTML subtree (static files only)
- `list` command for discovery preview without write
- 90% test coverage, structured logging, path traversal safety, slug disambiguation
- [ASSUMPTION] npm-installable CLI validated locally via `npm link`; formal `npx specwiki` publish is Phase 4.2

### Out of scope (POST-MVP validates)

- Hosted wiki SaaS
- Spec authoring, validation, or enforcement
- Real-time watch/regenerate
- Cross-repo / OpenSpec Stores scanning
- Team admin, rule enforcement, or analytics
- Semantic search or AI Q&A over specs
- Bundled dev server (`specwiki serve`)

### Falsification signals

| Signal                                            | Implication                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Users run `list`, see files, but never `generate` | Discovery without synthesis value — parsing/output UX broken         |
| Wiki generated once, never re-run                 | No habit loop — output not useful enough to maintain                 |
| `--config` requested before basic generate works  | Pattern coverage gap dominates; fix discovery before configurability |
| Zero spec files in majority of target repos       | Default patterns miss real-world layouts                             |
| Users prefer maintaining README index manually    | Synthesis value insufficient vs. friction                            |

---

## Success Metrics (MVP)

| Metric                       | Target                                                                                | Measurement                                                |
| ---------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Time to first wiki**       | < 60 seconds from clone to browsable output                                           | Benchmark on specwiki repo + fixture tree                  |
| **Discovery yield**          | Median project finds ≥ 5 spec files                                                   | `specwiki list` count on fixtures + dogfood repo           |
| **Zero-config rate**         | ≥ 80% of BMAD/OpenSpec/Cursor sample repos need no custom patterns                    | Fixture coverage in `tests/fixtures/`                      |
| **Dogfood validation**       | specwiki repo generates complete wiki of its own specs                                | Self-host test after Phase 3                               |
| **Quality gate reliability** | 100% pass on full §0.2 gate                                                           | `npm run test/lint/format/coverage/typecheck/build`        |
| **Coverage threshold**       | ≥ 90% lines/functions/branches/statements                                             | Vitest enforced thresholds                                 |
| **Slug integrity**           | Zero silent overwrites from path collisions                                           | Phase 3.4 tests                                            |
| **Re-run habit**             | [ASSUMPTION] ≥ 50% of activated users regenerate wiki at least once after initial run | No telemetry in MVP; validate via dogfood + early adopters |

### Anti-metrics (do not optimize in MVP)

- Monthly active users / SaaS retention (no SaaS)
- Spec authoring engagement (not our job)
- Agent implementation quality (downstream of specs)
- npm download volume before Phase 4.2 publish

### Activation funnel (Persona A)

```
Awareness → Install (npm link / local) → list shows >0 files → generate → browse wiki → re-run after changes → recommend to others
```

---

## Competitive Differentiation

### Positioning matrix

specwiki is a **read-only aggregator and renderer** — not a spec authoring framework, agent runtime, or full documentation platform.

| Tool                                | Direction                                | vs specwiki                                                                    |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| **Dewey**                           | Docs → agent artifacts (+ optional site) | Expects controlled `docs/` tree; specwiki scans heterogeneous existing layouts |
| **Ruler**                           | `.ruler/` → distribute to 30+ agents     | Writes agent context; complementary — Ruler generates, specwiki aggregates     |
| **agents-md**                       | Fragments → compose AGENTS.md            | Composition, not cross-framework discovery                                     |
| **OpenSpec CLI**                    | Creates/manages `openspec/` artifacts    | Spec lifecycle owner; specwiki reflects output                                 |
| **BMAD Method**                     | Intent → PRD/UX/SPEC pipeline            | Planning orchestration; specwiki dogfoods and indexes output                   |
| **Docusaurus / VitePress / MkDocs** | Markdown → full SSG site                 | Require config and build pipeline; not agent-spec-aware                        |
| **Cursor IDE**                      | Runs agents with rules/skills            | No exportable cross-tool wiki                                                  |

### Differentiation pillars

1. **Framework-agnostic discovery** — BMAD-adjacent paths, OpenSpec, Kiro, Cursor, AGENTS.md, Copilot out of the box; extend-only pattern list
2. **Zero SaaS, zero config** — Local CLI, no account; `npx specwiki generate` in any repo [ASSUMPTION: after Phase 4.2 publish; MVP uses `npm link` / local install]
3. **Brownfield-native** — Scans what exists; no `init` ceremony or framework migration
4. **Agent-ecosystem aware** — Category labels and title derivation tuned for `SKILL.md`, `AGENTS.md`, `.mdc` frontmatter paths
5. **Dual output** — Markdown wiki for agent/script consumption + HTML for human browsing in one command
6. **Static-first** — No network by default; no bundled server; aligns with CLI peer pattern (ripgrep, Prettier, TypeDoc)

### Strategic moat (long-term)

Breadth of discovery patterns across the SDD ecosystem + zero-config CLI trust. Moat deepens as instruction file volume grows and new frameworks emerge (add patterns). Weak if SSGs ship agent-spec discovery plugins — speed of pattern updates and community trust matter.

---

## Technical Constraints (carry-forward)

From `project-context.md` and HARNESS — non-negotiable for MVP:

| Constraint              | Detail                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Frozen contracts**    | `DEFAULT_SPEC_PATTERNS` (extend only), wiki layout, `CATEGORY_LABELS`, HTML title escaping                               |
| **Stack**               | TypeScript 5.8 strict, Node ≥ 20, ESM; minimal runtime deps (commander, fast-glob, gray-matter, marked, chalk)           |
| **Security**            | Path validation on `--project`/`--output`; writes only under resolved output dir; no secrets in logs                     |
| **Output mode**         | Static markdown + HTML only for MVP (decision: 2026-07-12)                                                               |
| **Brownfield baseline** | v0.1 scaffold has working `list`/`generate`, 15 tests, ~99% coverage; gaps: logger, slug collisions, `IMPLEMENTATION.md` |

---

## Risks and Mitigations

| Risk                                         | Severity | Mitigation                                                             |
| -------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Slug collisions corrupt wiki                 | High     | Phase 3.4 fix before npm publish                                       |
| Format fragmentation accelerates             | Medium   | Extend-only patterns; POST-MVP config overrides                        |
| Competing AGENTS.md tools absorb aggregation | Medium   | Differentiate on cross-framework scan; ship `llms.txt` export POST-MVP |
| Monorepo nested AGENTS.md missed             | Medium   | POST-MVP `**/AGENTS.md`; document `--patterns` workaround              |
| marked XSS via embedded HTML                 | Low      | Trusted local specs; document; sanitize POST-MVP                       |
| HARNESS §4 gaps stale vs code                | Low      | `project-context.md` is authoritative for brownfield state             |

---

## Assumptions (Fast Path)

Tagged `[ASSUMPTION]` where inferred without owner confirmation:

1. **[ASSUMPTION]** MVP primary persona remains Solo Cursor/AI agent developer; no pivot to team-first without owner input
2. **[ASSUMPTION]** Formal npm publish (`npx specwiki`) is POST-MVP Phase 4.2; MVP validation uses local `npm link` / `npm run dev`
3. **[ASSUMPTION]** Re-run habit rate (≥50%) is a reasonable MVP proxy for value; no telemetry until POST-MVP
4. **[ASSUMPTION]** `_bmad-output/**` discovery deferred to POST-MVP; default patterns sufficient for Persona A repos today
5. **[ASSUMPTION]** HARNESS Phases 1–2 retrofit tests are complete or near-complete per `project-context.md`; remaining MVP work concentrates on Phase 3 (logger, slug collisions, quality gate) and Phase 0 (`IMPLEMENTATION.md`)

---

## Downstream Handoff

| Next step                  | Carry-forward                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **PRD (step-04)**          | MVP features = list + generate + patterns + quality gate; defer team/CI/serve to POST-MVP roadmap |
| **Architecture (step-05)** | Discovery module is core IP; frozen contracts in §12; logger in `src/core/`                       |
| **Epics (step-06)**        | Map HARNESS Phases 0–3 to MVP epics; Phase 4+ to distribution epics                               |
| **Readiness (step-07)**    | Dogfood wiki on specwiki repo; validate fixture trees for BMAD/OpenSpec/Cursor layouts            |

---

## References

- `project-context.md` — brownfield status, tech stack, frozen contracts
- `research/domain-research.md` — ecosystem positioning, Persona A decision
- `research/technical-research.md` — format landscape, CLI patterns, static output decision
- `HARNESS.md` §1, §4, §9, §13 — orientation, feature spec, build phases, deliverables
- `README.md` — user-facing commands and output contract
- `decisions.md` — logged discovery decisions
