# specwiki Discovery — Assumptions

Inferred facts not confirmed by the owner. Tag downstream docs with `[ASSUMPTION]` where used.

## Log

### 2026-07-12 — [ASSUMPTION] HARNESS known-gaps partially stale

HARNESS §4 lists "no automated tests" and "no Vitest config" as gaps, but the brownfield codebase now has 15 passing tests, Vitest 3.x config, ESLint, and Prettier. Discovery treats HARNESS gaps as aspirational checklist items; actual code state (per `project-context.md`) takes precedence for MVP planning.

### 2026-07-12 — [ASSUMPTION] MVP validation via npm link, not npx publish

Formal `npx specwiki` distribution is POST-MVP Phase 4.2. MVP success metrics and dogfood validation assume local `npm link` / `npm run dev` install path.

### 2026-07-12 — [ASSUMPTION] Re-run habit as value proxy without telemetry

Product brief targets ≥50% re-run rate after initial generate as a success signal, but MVP has no download/usage telemetry. Validate via dogfood and early adopter feedback.

### 2026-07-12 — [ASSUMPTION] Remaining MVP work concentrates on Phase 3

Per `project-context.md`, Phases 0–2 tooling and tests largely exist. MVP completion focus: `IMPLEMENTATION.md` (Phase 0.1), structured logger (3.1–3.2), slug collisions (3.4), quality gate (3.5).

### 2026-07-12 — [ASSUMPTION] _bmad-output discovery deferred to POST-MVP

Default `DEFAULT_SPEC_PATTERNS` omit `_bmad-output/**`; sufficient for Persona A repos using Cursor/OpenSpec layouts. BMAD output indexing is POST-MVP Epic A.

<!-- Append entries as: ### YYYY-MM-DD — [ASSUMPTION] Title ... -->
