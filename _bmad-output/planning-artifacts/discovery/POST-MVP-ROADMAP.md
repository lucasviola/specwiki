# specwiki — POST-MVP Roadmap

**Product:** specwiki — CLI documentation synthesizer for AI agent specs  
**Status:** Discovery complete (step-09)  
**Created:** 2026-07-12  
**MVP boundary:** HARNESS Phases 0–3 complete per `MVP-ROADMAP.md` and PRD §MVP Scope  
**Primary expansion path:** Persona A (solo) → Persona B (team CI) → Persona C (OSS publish) → Persona D (enterprise, out of scope)

---

## Executive summary

MVP proves that a solo Cursor/AI agent developer can run `specwiki generate` on a brownfield repo and understand the full landscape of agent instructions in under 60 seconds — zero-config, local, static markdown + HTML output. POST-MVP extends specwiki from a **personal readability tool** into the **readability layer for the spec-driven development ecosystem**: configurable discovery, machine-readable exports, team CI workflows, npm distribution, semantic framework enrichment, and optional IDE embedding.

POST-MVP is sequenced in seven phases (A–G) across four themes — **extensibility**, **distribution**, **UX**, and **ecosystem** — mapped to six POST-MVP epics (E7–E12) and HARNESS Phase 4 bullets. The critical path is: **config + extended patterns → agent interoperability → distribution/CI → developer experience loop → semantic enrichment → ecosystem export/intelligence → IDE integration (speculative)**.

Rough total effort after MVP: **~4–6 implementation sprints** for Phases A–F (shippable milestones); Phase G is an explicit future bet requiring a separate artifact.

**Success criteria for POST-MVP v1 (Phases A–C):**

- `npx specwiki` works on a clean Node ≥ 20 machine
- BMAD-heavy repos discover `_bmad-output/` and nested `AGENTS.md` without custom flags
- Tech leads can run `specwiki generate --check` in CI to enforce wiki freshness
- `wiki/llms.txt` and `--json` enable agent/script consumers

---

## Themes

### Extensibility

Make specwiki adapt to monorepos, org-specific layouts, and custom category rules without forking. Centered on `specwiki.config.js`, `--patterns`, plugin hooks, and extend-only `DEFAULT_SPEC_PATTERNS` mutations.

| Capability                                                                         | Epic        | Phase |
| ---------------------------------------------------------------------------------- | ----------- | ----- |
| `--patterns` CLI flag                                                              | E7 / S7.1   | A     |
| `specwiki.config.js` / `.json` loader                                              | E7 / S7.2   | A     |
| Extended default patterns (`**/AGENTS.md`, `_bmad-output/**`, `.agents/skills/**`) | E7 / S7.3   | A     |
| Plugin / extension API                                                             | E11 / S11.3 | F     |
| Custom category rules via config                                                   | E11         | F     |

### Distribution

Unlock Personas B (small teams) and C (OSS maintainers) with npm publish, package-level CI, consumer CI freshness checks, and SSG scaffold export for GitHub Pages.

| Capability                                   | Epic        | Phase |
| -------------------------------------------- | ----------- | ----- |
| npm publish (`npx specwiki`)                 | E10 / S10.1 | C     |
| GitHub Actions quality gate                  | E10 / S10.2 | C     |
| `generate --check` (consumer CI)             | E8 / S8.1   | C     |
| `specwiki export --format vitepress\|mkdocs` | E10 / S10.3 | F     |

### UX

Reduce friction for frequent rule editors and improve browsing beyond opening static HTML files.

| Capability                               | Epic        | Phase          |
| ---------------------------------------- | ----------- | -------------- |
| Wikipedia-style HTML wiki skin           | E16         | UX (post-MVP)  |
| `generate --watch` debounced rebuild     | E11 / S11.1 | D              |
| `specwiki serve` localhost static server | E11 / S11.2 | D              |
| Cursor/VS Code wiki panel                | E15 / S15.1 | G (future bet) |

### Ecosystem

Deepen integration with the SDD/agent instruction landscape: machine-readable outputs, framework-specific metadata, drift detection, and MCP manifest indexing.

| Capability                                                          | Epic           | Phase |
| ------------------------------------------------------------------- | -------------- | ----- |
| `--json` output for list/generate                                   | E7 / S7.4      | B     |
| `wiki/llms.txt` export                                              | E7 / S7.5      | B     |
| Cursor rule badges, OpenSpec change-set grouping, BMAD kernel cards | E9 / S9.1–S9.3 | E     |
| Duplicate instruction drift detection                               | E11 / S11.1    | F     |
| MCP manifest indexing                                               | E11 / S11.2    | F     |

---

## Sequenced phases (POST-MVP Phase A, B, C…)

Phases are ordered for **persona unlock** and **technical dependency**. Each phase delivers a shippable increment; later phases do not block earlier releases.

---

### Phase A: Configurability & Extended Discovery

**Epics / stories:** E7 — S7.1 (`--patterns`), S7.2 (config loader), S7.3 (extended default patterns)  
**Functional requirements:** FR-005, FR-006, FR-035  
**HARNESS mapping:** Phase 4.1 (partial — flag + config; extended patterns beyond harness minimum)

**Why deferred from MVP:**

- MVP hypothesis requires **zero-config** proof: default `DEFAULT_SPEC_PATTERNS` must work for ≥80% of BMAD/OpenSpec/Cursor sample repos before configurability is added
- Monorepo nested `AGENTS.md` and `_bmad-output/**` indexing increases discovery surface and category complexity without validating core synthesis for Persona A
- Config API design (precedence cascade, schema) needs stable MVP discover/parse/output contracts first

**Dependencies on MVP:**

- E2 discovery module hardened (FR-001–FR-004) with ≥90% coverage
- E5 slug collision fix (FR-014) — extended patterns increase collision probability
- Frozen contracts (NFR-013): `DEFAULT_SPEC_PATTERNS` extend-only; config adds/overrides, never silently removes
- `src/config/` module boundary ratified in `ARCHITECTURE-SPINE.md`

**Rough effort:** **M** (1 sprint)

**Definition of done:**

- `specwiki list --patterns "custom/**/*.md"` discovers files defaults miss
- `specwiki.config.js` in project root loads with precedence: CLI > env > config > defaults
- Default patterns extended to include `**/AGENTS.md`, `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md`, `**/README.md` (with owner approval per NFR-013)
- Fixture tests cover BMAD output tree, nested AGENTS.md, and README discovery
- Folder and root `README.md` content used as category index introductions on `wiki/index.md` and `wiki/html/index.html` (FR-035)
- specwiki repo self-dogfood discovers `.agents/skills/` and `_bmad-output/` paths (closes FR-006 gap from FR-031 readiness patch)
- Full §0.2 quality gate passes

---

### Phase B: Agent Interoperability

**Epics / stories:** E7 — S7.4 (`--json`), S7.5 (`wiki/llms.txt`)  
**Functional requirements:** FR-017, FR-023

**Why deferred from MVP:**

- Persona A success is measured by **human-browsable** wiki (markdown + HTML), not machine consumption
- `--json` and `llms.txt` serve agent/script/CI consumers — secondary to proving discover → synthesize → browse loop
- `llms.txt` emit mode unresolved at PRD (opt-in `--emit-llms-txt` recommended first)

**Dependencies on MVP:**

- Stable `generate` stdout summary contract (FR-016)
- Phase A extended discovery (recommended — richer `llms.txt` content from BMAD/OpenSpec paths)
- `extractDescription()` and category grouping from parse/output modules

**Rough effort:** **S** (0.5 sprint)

**Definition of done:**

- `specwiki list --json` emits stable-field JSON: `{ categories: [{ name, files: [{ relativePath, title, category }] }] }`
- `specwiki generate --json` emits summary JSON with `specCount`, `outputDir`, `pages[]`
- `specwiki generate --emit-llms-txt` writes `wiki/llms.txt` grouped by category with descriptions
- JSON field names documented; snapshot tests lock schema
- Human text output unchanged when flags absent

---

### Phase C: Distribution & Team Adoption

**Epics / stories:** E10 — S10.1 (npm publish), S10.2 (CI workflow); E8 — S8.1 (`generate --check`)  
**Functional requirements:** FR-024, FR-027, FR-028  
**HARNESS mapping:** Phase 4.2, 4.3

**Why deferred from MVP:**

- MVP validates via `npm link` / local install; formal `npx specwiki` requires package hygiene (`files` field, prepublish gate) not needed to prove synthesis
- Package-level CI is maintainer infrastructure, not end-user value for Persona A
- `generate --check` depends on stable, deterministic generate output — MVP hardening (slug collisions, logger) must land first
- PRD anti-metric: do not optimize npm download volume before Phase 4.2

**Dependencies on MVP:**

- E5 S5.4 slug collision disambiguation (PRD risk: **blocker for npm publish**)
- E5 S5.5 full §0.2 quality gate green
- E6 S6.4 §13 deliverables checklist complete
- Phase A config stable enough for published package defaults

**Rough effort:** **M** (1 sprint)

**Definition of done:**

- `npx specwiki list` works on clean Node ≥ 20 machine after `npm publish`
- `prepublishOnly` runs full §0.2 gate; `files` field includes only `dist/` and required assets
- `.github/workflows/ci.yml` runs gate on push/PR
- `specwiki generate --check` exits 0 when wiki fresh, 1 when stale or missing; dry-run only (no writes)
- README documents consumer CI snippet for Persona B
- **HARNESS Phase 4 gate met:** package installs and runs via `npx specwiki`

**Persona unlock:** Persona B (tech lead) — async onboarding via committed/regenerated wiki; Persona C (OSS maintainer) — installable package.

---

### Phase D: Developer Experience Loop

**Epics / stories:** E8 — S8.2 (`generate --watch`), S8.3 (`specwiki serve`)  
**Functional requirements:** FR-025, FR-026

**Why deferred from MVP:**

- Decision 2026-07-12: **MVP output mode is static files only** — users open `wiki/html/index.html` directly or use `npx serve` / `python -m http.server`
- Manual re-run after rule edits is sufficient to validate MVP re-run habit hypothesis
- Watch mode and bundled server add file-watcher complexity, HTTP security surface, and integration test scope (HARNESS §0.2.1 skips browser/e2e by default)
- `serve` uses Node built-in `http` on `127.0.0.1` only — additive, not blocking distribution

**Dependencies on MVP:**

- Deterministic generate pipeline (no duplicated logic in watch path)
- NFR-012 preserved: no network I/O in `list`/`generate` by default; `serve` is opt-in command
- Phase C distribution (recommended) — published package users benefit most from DX polish

**Rough effort:** **M** (1 sprint)

**Definition of done:**

- `specwiki generate --watch` debounces spec file changes and rebuilds wiki; Ctrl+C exits 0
- `specwiki serve [--port]` binds `127.0.0.1` only; serves resolved `--output` with path traversal checks
- README documents `watch` + `serve` pairing for live editing workflow
- Tests cover debounce trigger (mocked fs events) and localhost binding

---

### Phase E: Semantic Enrichment

**Epics / stories:** E9 — S9.1 (Cursor rule badges), S9.2 (OpenSpec change-set grouping), S9.3 (BMAD SPEC kernel cards)  
**Functional requirements:** FR-010

**Why deferred from MVP:**

- Technical research: format heterogeneity is the product problem; MVP treats all inputs as **markdown-with-frontmatter** with path-based categories
- Semantic parsing (OpenSpec deltas, BMAD five-field kernels, Cursor activation modes) requires framework-specific parsers — high complexity, low MVP urgency
- Raw content preservation (FR-009) is MVP invariant; enrichment must be additive badges/cards above body, not transformation
- OpenSpec change-set grouping and BMAD kernel cards need Phase A fixtures (`_bmad-output/`, `openspec/changes/`)

**Dependencies on MVP:**

- FR-009 raw body preservation contract
- Phase A extended discovery for `_bmad-output/**/SPEC.md` and OpenSpec change trees
- Optional: remark AST pipeline (technical research §4.3) if frontmatter validation exceeds gray-matter

**Rough effort:** **L** (1.5–2 sprints)

**Definition of done:**

- Cursor `.mdc` pages show `globs`, `alwaysApply`, `description` badges above raw body
- OpenSpec index groups entries by `openspec/changes/{name}/` when detectable
- BMAD SPEC.md pages render five-field kernel summary card (Why, Capabilities, Constraints, Non-goals, Success signal)
- Non-framework categories unaffected; regression tests on `sample-project/` fixture
- Enrichment is display-only — no semantic rewrite of stored wiki body

---

### Phase F: Ecosystem Export & Quality Intelligence

**Epics / stories:** E10 — S10.3 (SSG export); E11 — S11.1 (drift detection), S11.2 (MCP indexing), S11.3 (plugin API)  
**Functional requirements:** FR-018, FR-029; PRD deferred items (plugins, MCP)

**Why deferred from MVP:**

- SSG export (`vitepress|mkdocs`) is convenience for Persona C — users can point SSG at `wiki/` manually today
- Drift detection requires content hashing and known duplicate pairs (`AGENTS.md` vs `CLAUDE.md`) — value add, not synthesis proof
- Plugin API premature before config loader API stabilizes (epics note: **S7.2 before S11.3**)
- MCP manifest indexing is ecosystem trend (domain research §6.7) but not core to wiki generation

**Dependencies on MVP:**

- Phase A S7.2 config loader (required for S11.3 plugins)
- Phase C distribution (OSS maintainers are primary SSG export users)
- Phase E semantic parsers (optional enrichment for MCP wiki pages)

**Rough effort:** **M–L** (1–1.5 sprints)

**Definition of done:**

- `specwiki export --format vitepress|mkdocs` scaffolds minimal config pointing at `wiki/` without modifying wiki output
- Verbose output or wiki metadata warns when duplicate instruction files (e.g. `AGENTS.md` / `CLAUDE.md`) content-hash diverges
- `.cursor/mcp.json` discovered and indexed under `mcp-config` category
- `specwiki.config.js` supports `plugins` array with documented hooks: `deriveCategory`, `deriveTitle`, `afterParse`
- Example plugin in `examples/` directory

---

### Phase G: IDE Integration (Future Bet — see §Future bets)

**Epics / stories:** E12 — S12.1 (Cursor/VS Code wiki panel)  
**Functional requirements:** None in current PRD (explicitly POST-MVP deferred)

**Why deferred from MVP:**

- Separate artifact (editor extension) with marketplace publishing, activation lifecycle, and preview panel — outside CLI scope
- Core `specwiki` package must remain zero new runtime deps; extension is independent npm package
- IDE APIs evolve rapidly (Cursor 2.4+ skills migration); CLI wiki output must stabilize first

**Dependencies on MVP:**

- All prior phases recommended; Phase D `serve`/`watch` informs extension refresh UX
- Generated `wiki/` layout frozen per NFR-013

**Rough effort:** **L** (2+ sprints, separate repo or workspace)

---

## HARNESS §9 Phase 4+ mapping

| HARNESS bullet                               | POST-MVP phase | Epic / story      | FR             | Notes                                                |
| -------------------------------------------- | -------------- | ----------------- | -------------- | ---------------------------------------------------- |
| **4.1** `--patterns` or config file override | Phase A        | E7 / S7.1, S7.2   | FR-005         | Harness minimum; roadmap adds S7.3 extended defaults |
| **4.1+** Extended `DEFAULT_SPEC_PATTERNS`    | Phase A        | E7 / S7.3         | FR-006         | Beyond harness 4.1 text; PRD POST-MVP scope          |
| **4.2** npm publish prep                     | Phase C        | E10 / S10.1       | FR-027         | Blocked on MVP slug fix (Phase 3.4)                  |
| **4.3** CI workflow (GitHub Actions)         | Phase C        | E10 / S10.2       | FR-028         | Package-level gate, not consumer `--check`           |
| —                                            | Phase B        | E7 / S7.4, S7.5   | FR-023, FR-017 | Not in HARNESS §9; expansion epic                    |
| —                                            | Phase C        | E8 / S8.1         | FR-024         | Consumer CI freshness                                |
| —                                            | Phase D        | E8 / S8.2, S8.3   | FR-025, FR-026 | Deferred per static-output decision                  |
| —                                            | Phase E        | E9 / S9.1–S9.3    | FR-010         | Semantic enrichment                                  |
| —                                            | Phase F        | E10 / S10.3       | FR-018         | SSG scaffold                                         |
| —                                            | Phase F        | E11 / S11.1–S11.3 | FR-029         | Quality intelligence + plugins                       |
| —                                            | Phase G        | E12 / S12.1       | —              | IDE extension; outside HARNESS                       |

**HARNESS Phase 4 gate:** Met at end of Phase C when `npx specwiki` works on a clean machine.

**Relationship to MVP roadmap:** MVP delivers HARNESS Phases 0–3 (E1–E6). POST-MVP Phase A begins HARNESS Phase 4.1; Phases B–G extend beyond harness text per PRD POST-MVP scope and research recommendations.

---

## Research-backed opportunities (from step 2)

Sourced from `research/technical-research.md` and `research/domain-research.md`.

### High-confidence (Phases A–C)

| Opportunity                             | Research source                                       | Rationale                                                                                      |
| --------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **`**/AGENTS.md` discovery**            | Technical §1.2 — OpenAI repo has 88+ nested AGENTS.md | Monorepo instruction proliferation (arxiv 2510.21413); MVP misses nested files                 |
| **`_bmad-output/**` indexing**          | Technical §1.7, Domain §1.2                           | BMAD 40k+ stars; framework output is high-value discovery target; specwiki dogfoods BMAD       |
| **`wiki/llms.txt` generation**          | Technical §1.8, §6.2 Epic A                           | llms.txt is AAIF-adjacent agent index standard; specwiki as producer differentiates from Dewey |
| **`--json` for agent/script consumers** | Technical §3.6 — crouton-kit CLI design               | CLIs now serve LLM agents; stable JSON schema enables automation                               |
| **Config precedence cascade**           | Technical §3.5 — TypeDoc `--showConfig` pattern       | ESLint/TypeDoc precedent; flags > env > config > defaults                                      |
| **npm publish + CI**                    | Domain §7 priority 1, §5.3                            | Unlocks Personas B/C; domain research ranks first by value × feasibility                       |

### Medium-confidence (Phases D–E)

| Opportunity                        | Research source                               | Rationale                                                                     |
| ---------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| **`generate --check`**             | Technical §3.1 — Prettier `--check` precedent | Team persona needs CI freshness without write side effects                    |
| **`generate --watch`**             | Technical §3.2 — TypeDoc `--watch`            | Solo dev retention; pairs with serve for live editing                         |
| **`specwiki serve` on 127.0.0.1**  | Technical §4.6, Decision static-only MVP      | Node built-in `http`; zero deps; POST-MVP additive                            |
| **Cursor rule frontmatter badges** | Technical §1.4                                | `globs`/`alwaysApply`/`description` explain rule scope at a glance            |
| **OpenSpec change-set grouping**   | Technical §1.6                                | `openspec/changes/{name}/` cluster links proposal → design → tasks → specs    |
| **BMAD SPEC kernel cards**         | Technical §1.3, §1.7                          | Five-field kernel + `companions:` links are machine contracts worth surfacing |

### Exploratory (Phase F–G)

| Opportunity                         | Research source      | Rationale                                                                                     |
| ----------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| **SSG export scaffold**             | Technical §2.3       | Users can manually point VitePress/MkDocs at `wiki/`; scaffold reduces friction for Persona C |
| **Spec drift detection**            | Domain §3.4, §7      | Cross-tool duplication (`AGENTS.md` + `CLAUDE.md`) is common pain; diff surfacing adds value  |
| **MCP manifest indexing**           | Domain §6.7          | `.cursor/mcp.json` proliferation; document agent tool wiring in wiki                          |
| **Plugin API**                      | Technical §5.1, §6.1 | Org-specific category rules; defer until config API stable                                    |
| **remark AST pipeline**             | Technical §4.3       | Only if semantic enrichment exceeds gray-matter; marked stays for MVP/early POST-MVP          |
| **OpenSpec Stores cross-repo scan** | Domain §1.3, §7      | Enterprise/team scope; depends on OpenSpec Stores beta maturity                               |

### Competitive positioning (informs prioritization, not phase order)

Research confirms **no direct competitor** with identical scope. Closest adjacent tools:

- **Dewey** — expects controlled `docs/` tree; specwiki scans heterogeneous layouts (Technical §2.2)
- **Ruler** — writes agent context; complementary aggregator (Technical §2.2)
- **SSGs** — require manual nav; not discovery-aware (Technical §2.3)

POST-MVP `llms.txt` + cross-framework discovery depth is the strategic moat (Domain §10, Product brief §Competitive Differentiation).

---

## Assumptions

Tagged `[ASSUMPTION]` — see also `assumptions.md`.

1. **[ASSUMPTION]** MVP completes successfully (HARNESS Phases 0–3, §13 checklist) before POST-MVP Phase A begins. POST-MVP sequencing assumes slug collisions, structured logger, and 90% coverage are MVP-delivered.

2. **[ASSUMPTION]** `llms.txt` ships opt-in via `--emit-llms-txt` first; default-on after validation (PRD open question).

3. **[ASSUMPTION]** Extended default patterns (S7.3) require explicit owner approval per NFR-013 frozen contracts — discovery loop cannot auto-extend without sign-off during implementation.

4. **[ASSUMPTION]** Phase C (npm publish) is the minimum viable POST-MVP release for external users; Phases A–B can ship as pre-release betas to early adopters via git install.

5. **[ASSUMPTION]** No telemetry until post-Phase C; adoption metrics for Personas B/C inferred from GitHub issues, npm downloads, and CI snippet usage.

6. **[ASSUMPTION]** `specwiki serve` and `generate --watch` do not require E2E browser tests per HARNESS §0.2.1; HTTP integration tests with mocked requests suffice.

7. **[ASSUMPTION]** Semantic enrichment (Phase E) does not require new runtime dependencies if gray-matter + regex parsers suffice; remark pipeline deferred unless frontmatter validation blocks progress.

8. **[ASSUMPTION]** IDE extension (Phase G) ships as a **separate package** — not bundled in `specwiki` npm tarball.

9. **[ASSUMPTION]** Persona D (enterprise multi-repo, auth, dashboards) remains out of scope through Phase F; no POST-MVP phase currently addresses it.

---

## Future bets (explicitly speculative)

These items are **not sequenced** in Phases A–F. They depend on ecosystem maturity, user demand signals, or technology not yet stable enough to plan.

### Bet 1: Cursor/VS Code wiki panel (Phase G / E12)

**Hypothesis:** Solo developers will prefer in-IDE wiki navigation over switching to browser or markdown preview.

**Evidence needed:** MVP/POST-MVP Phases A–D complete; ≥10 user requests for IDE integration; stable `wiki/` layout consumed by extension for 2+ release cycles.

**Risk:** Cursor API churn; extension maintenance burden; splits focus from CLI core.

**If validated:** Separate `specwiki-vscode` package; marketplace publish; generate-on-save command.

---

### Bet 2: Semantic search / AI Q&A over unified index

**Hypothesis:** "What rules apply to authentication?" is answerable via embeddings over generated wiki.

**Evidence needed:** Wiki page count per repo exceeds browsable threshold (e.g. >50 specs); user requests exceed TOC navigation.

**Risk:** Requires optional LLM provider, network I/O (violates NFR-012 default), privacy concerns for local specs.

**If validated:** Opt-in `specwiki query` with local embeddings (e.g. sqlite-vec) or external API flag.

---

### Bet 3: OpenSpec Stores cross-repo discovery

**Hypothesis:** Teams store specs in external repos (OpenSpec Stores beta); specwiki should aggregate across repo boundaries.

**Evidence needed:** OpenSpec Stores GA with documented filesystem/API layout; Persona B demand.

**Risk:** Auth, network, versioning across repos — enterprise scope creep toward Persona D.

**If validated:** `specwiki scan --stores <url>` POST-MVP Phase H (new); depends on OpenSpec contract stability.

---

### Bet 4: Hosted wiki SaaS

**Hypothesis:** Teams want managed hosting without committing `wiki/` to git.

**Evidence needed:** Sustained npm downloads; Persona B requests; competitor moves (Dewey hosted offering).

**Risk:** Fundamental product pivot from "zero SaaS" positioning (Product brief §Differentiation pillar 2).

**If validated:** Separate product decision; CLI remains local-first; SaaS syncs from `generate --json` output.

---

### Bet 5: Real-time spec validation / enforcement

**Hypothesis:** Teams want specwiki to **lint** agent instructions (not just aggregate).

**Evidence needed:** Drift detection (S11.1) usage; overlap with Dewey audit rubric demand.

**Risk:** Scope collision with SDD frameworks (OpenSpec, BMAD); specwiki becomes authoring tool.

**If validated:** `specwiki audit` command with read-only rubric scoring; never writes specs.

---

### Bet 6: Body HTML sanitization (`rehype-sanitize`)

**Hypothesis:** Untrusted spec sources (external contributors) require sanitization beyond title `escapeHtml`.

**Evidence needed:** XSS concern reports; `--allow-html` flag request; OSS repos with contributor PRs to spec files.

**Risk:** New dependencies (remark/rehype chain ~2 MB); performance regression vs marked.

**If validated:** Opt-in `--sanitize-html` using pipeline in technical research §4.4.

---

## Cross-references

| Artifact                         | Relationship                                              |
| -------------------------------- | --------------------------------------------------------- |
| `MVP-ROADMAP.md`                 | MVP Phases 0–3 complete → POST-MVP Phase A begins         |
| `prd/prd.md`                     | POST-MVP FR-005–FR-029; persona expansion path            |
| `epics/epics-and-stories.md`     | E7–E12 stories with acceptance criteria                   |
| `HARNESS.md` §9 Phase 4          | 4.1–4.3 mapped in §HARNESS mapping above                  |
| `product-brief.md`               | POST-MVP feature table; competitive moat                  |
| `research/technical-research.md` | Format landscape, CLI patterns, static output decision    |
| `research/domain-research.md`    | Ecosystem positioning, persona decisions, trend analysis  |
| `readiness/readiness-report.md`  | FR-031 dogfood scope; MVP ready-with-caveats              |
| `decisions.md`                   | Static output, persona, scope boundary, FR-031 resolution |
| `assumptions.md`                 | `[ASSUMPTION]` tags referenced in §Assumptions            |

---

## Phase summary table

| Phase | Name                                 | Epics                        | Effort | Persona unlock        | Key gate                          |
| ----- | ------------------------------------ | ---------------------------- | ------ | --------------------- | --------------------------------- |
| **A** | Configurability & Extended Discovery | E7 (S7.1–S7.3)               | M      | A+ (BMAD-heavy repos) | Extended patterns + config loader |
| **B** | Agent Interoperability               | E7 (S7.4–S7.5)               | S      | A+ (agent consumers)  | `--json` + `llms.txt`             |
| **C** | Distribution & Team Adoption         | E10 (S10.1–S10.2), E8 (S8.1) | M      | B, C                  | `npx specwiki` + `--check`        |
| **D** | Developer Experience Loop            | E8 (S8.2–S8.3)               | M      | A (retention)         | `watch` + `serve`                 |
| **E** | Semantic Enrichment                  | E9 (S9.1–S9.3)               | L      | A, B                  | Framework badges/cards            |
| **F** | Ecosystem Export & Intelligence      | E10 (S10.3), E11             | M–L    | C, B                  | SSG + drift + plugins             |
| **G** | IDE Integration (bet)                | E12                          | L      | A                     | Marketplace extension             |

**Total POST-MVP stories:** 16 (S7.1–S12.1) across 6 epics (E7–E12), excluding MVP E1–E6 (24 stories).

---

_Discovery loop complete (step-10). See [MVP-ROADMAP.md](MVP-ROADMAP.md), [prd/prd.md](prd/prd.md), [epics/epics-and-stories.md](epics/epics-and-stories.md)._
