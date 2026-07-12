# specwiki Discovery — Decisions

Subagent-resolved questions and arbitrator outcomes. No owner input was solicited during discovery.

## Decisions

### 2026-07-12 — MVP output mode: static files only

**Decision:** MVP ships static markdown + HTML output (`wiki/` layout). No bundled `specwiki serve` or local dev server.

**Rationale:**
- Brownfield v0.1 already generates browsable `wiki/html/*.html`; users can open files directly or use any static server
- Aligns with HARNESS §12 frozen wiki layout and §0.9 "no network by default" trust boundary
- Matches CLI peer pattern (ripgrep, Prettier, TypeDoc default to file output)
- Avoids new dependencies, HTTP security surface, and e2e/browser test scope (HARNESS §0.2.1)
- `specwiki serve` deferred to POST-MVP using Node built-in `http` on `127.0.0.1` only

**Source:** `research/technical-research.md` §7

### 2026-07-12 — MVP primary persona: solo Cursor/AI agent developers

**Decision:** MVP optimizes for Persona A — solo developers using Cursor, Claude Code, or similar AI coding agents on 1–3 active repos. Personas B (small teams), C (OSS maintainers), and D (enterprise) are POST-MVP expansion targets.

**Rationale:**
- v0.1 CLI (`list`, `generate`) matches local solo workflow with no auth, CI, or publishing
- Highest pain frequency: solo users accumulate scattered rules/skills fastest
- Shortest time-to-value validates core hypothesis (<60s to browsable wiki)
- Natural expansion path: solo users become tech leads and OSS maintainers once CI/publish ship

**Source:** `research/domain-research.md` §9; formalized in `product-brief.md`

### 2026-07-12 — MVP scope boundary: HARNESS Phases 0–3 vs Phase 4+

**Decision:** MVP completes at HARNESS Phase 3 (structured logger, slug collisions, quality gate, `IMPLEMENTATION.md` through Phase 3). POST-MVP begins at Phase 4 (`--patterns`/config, npm publish, CI) and expansion features (`serve`, watch, `llms.txt`, semantic enrichment).

**Rationale:**
- Brownfield v0.1 already delivers core discover → parse → wiki loop; remaining gaps are hardening not greenfield
- Phase 3 deliverables map directly to §13 deliverables checklist
- Distribution and configurability (Phase 4) unlock Personas B/C but are not required to prove synthesis value for Persona A
- Aligns product brief feature tables with implementation harness phases

**Source:** `product-brief.md`; `HARNESS.md` §9, §13

### 2026-07-12 — Logging woven into every story (no logging epic)

**Decision:** Remove standalone E5 "Verbose Pipeline Diagnostics" epic. `Logger.ts` moves to **E1 S1.3**. Discover/parse/output/command logging ACs are mandatory in **every feature story** (E2–E7, POST-MVP E8–E15) as §0.8 acceptance criteria alongside quality measures. No deferred "logging retrofit" pass.

**Rationale:**
- Owner: logging is essential part of every feature, not a separate deliverable
- Aligns with HARNESS §0.8 ("as important as tests")
- Vertical slices stay complete when merged — each story is shippable with observability
- Avoids E5 blocking E2–E4 and artificial "logger first, logs later" sequencing

**Source:** Owner directive; `HARNESS.md` §0.10 updated

### 2026-07-12 — Story slicing: vertical slices + INVEST

**Decision:** All epics and stories use **vertical slicing** and **INVEST** per HARNESS §0.10. Stories deliver thin end-to-end user value (discover → parse → output → command as needed). Horizontal module epics (E2 Discovery, E3 Parsing, E4 Output) are replaced by user-journey epics (List, Generate MD, Generate HTML, Verbose, Trustworthy output).

**Rationale:**
- Horizontal layering delays demonstrable value until unrelated modules also ship
- INVEST keeps stories owner-reviewable in one §0.3 checkpoint
- Brownfield §9 module bullets remain for coverage traceability; vertical epics take precedence for sprint planning
- Aligns with solo-dev persona: each slice maps to a CLI capability Alex can run

**Source:** Owner directive; `HARNESS.md` §0.10; `epics/epics-and-stories.md` restructure

<!-- Append entries as: ### YYYY-MM-DD — Decision title ... -->

## Conflicts resolved

### 2026-07-12 — FR-031 dogfood scope vs default patterns (readiness step-07)

**Conflict:** Epics S6.3 and PRD success metrics implied `specwiki list` on the specwiki repo root would discover ≥ 5 files including HARNESS, README, `.agents/skills/`, and `_bmad-output/`. Runtime verification: repo root returns **zero** matches under current `DEFAULT_SPEC_PATTERNS` (234 skills live under `.agents/skills/`, not `.cursor/skills/`; HARNESS/README not in pattern list; `_bmad-output/` deferred POST-MVP).

**Resolution:** Dogfood MVP validation uses `tests/fixtures/sample-project/` (10 specs) as primary benchmark. Self-repo full indexing is POST-MVP FR-006. Patched `prd/prd.md` FR-031 and success-metrics row; patched `epics/epics-and-stories.md` S6.3 acceptance criteria.

**QA lead verdict:** Planning artifacts now consistent with code and PRD POST-MVP assumptions. No change to frozen `DEFAULT_SPEC_PATTERNS` in readiness pass.
