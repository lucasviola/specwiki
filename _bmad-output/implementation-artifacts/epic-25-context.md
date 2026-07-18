# Epic 25 Context: Architecture Decision Records

## Goal

Document specwiki's **architectural decisions** in `docs/adr/` so contributors and agents are not misled by a stale `ARCHITECTURE-SPINE.md`. The spine captured MVP invariants (July 2026); the codebase has since shipped Mustache HTML (E16), config loading (E8), BMAD nav enrichment (E23), path hardening (E5/E21), and a separate landing site (E20) — without durable decision records for several reversals.

Epic 25 is **documentation-first**. Only S25.1 touches product code (`CATEGORY_LABELS` extend-only). Remaining stories produce Markdown ADRs and spine cross-links.

## Stories

1. **S25.1 — ADR scaffolding, template, and wiki category.** Create `docs/adr/`, MADR template, index, and wiki discovery category.
2. **S25.2 — Foundational ADRs.** Write ADR-0001, 0003, 0004, 0007, 0009 (path confinement, config trust, static output, CLI contract, dependency budget).
3. **S25.3 — Retroactive ADRs.** Write ADR-0002, 0005, 0006, 0008, 0010 (HTML stack, slug hash, BMAD nav, lunr search, landing site boundary).
4. **S25.4 — Architecture spine sync.** Mark superseded AD-6/AD-11; link ADRs; refresh brownfield status.
5. **S25.5 — Pre-build ADRs for E11/E12.** Write ADR-0011 (watch/serve) and ADR-0012 (semantic enrichment / plugin ceiling) before those epics implement.

## Requirements & Constraints

- ADRs live under `docs/adr/`, not `_bmad-output/`.
- Filename pattern: `NNNN-kebab-title.md`; status vocabulary: proposed → accepted → deprecated → superseded by ADR-NNNN.
- One architectural decision per file.
- S25.1 `CATEGORY_LABELS` change is extend-only (AD-2).
- Doc stories do not require HARNESS §0.2 code gate unless `src/` changes.
- ADR content must reference actual modules — no generic platitudes.

## Technical Decisions

- **Index:** `docs/adr/index.md` is the human entry point; optional auto-index later.
- **Template:** MADR sections — Context, Decision, Consequences, References.
- **Spine sync:** Supersede, do not delete, stale AD-* entries; add `superseded by ADR-NNNN` inline.
- **Pre-build gate:** E11 and E12 story implementation should not start until ADR-0011/0012 are `accepted` (owner may waive explicitly).

## Cross-Story Dependencies

- **S25.2 and S25.3** depend on **S25.1** scaffold.
- **S25.4** depends on **S25.2 and S25.3** so spine links target real files.
- **S25.5** depends on **S25.4** so ADR-0004/0006 context is stable before E11/E12 ADRs.

## Cross-Epic Dependencies

- **E11** — informed by ADR-0011 (serve/watch design).
- **E12** — informed by ADR-0012 (enrichment scope vs plugins).
- **E21 S21.4** — config.js warning should align with ADR-0003 wording.

## Artifacts

- Canvas: `~/.cursor/projects/Users-lucas-Projects-specwiki/canvases/specwiki-adr-backlog.canvas.tsx`
- Spine: `_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md`
- Epic: `_bmad-output/implementation-artifacts/epic-25-architecture-decision-records.md`
