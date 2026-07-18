# Epic 25 — Architecture Decision Records

## Goal

Establish a **durable ADR practice** for specwiki so shipped architectural choices — especially those that supersede `ARCHITECTURE-SPINE.md` — are documented, discoverable, and linked from the spine. Close the drift between the July MVP spine (AD-6 HTML escaping, AD-11 dependency freeze) and the current codebase (Mustache renderer, nine runtime deps, BMAD nav enrichment, config loader RCE boundary).

**Audience:** Contributors implementing new CLI commands and output modules, maintainers reviewing security-sensitive paths, and future agents reading project context before E11/E12 work.

**Research artifacts:**

- [ADR backlog canvas](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/specwiki-adr-backlog.canvas.tsx)
- [`ARCHITECTURE-SPINE.md`](../planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md) — source AD-1…AD-11; several entries now stale
- [`decisions.md`](../planning-artifacts/discovery/decisions.md) — discovery-loop decisions; ADRs promote durable subsets

**Builds on:** **E5 S5.1–S5.2** (path confinement, slug collisions), **E8 S8.2** (config loader), **E16 S16.1–S16.4** (HTML stack), **E21 S21.1–S21.2** (security docs). **Unblocks informed design** for **E11** (watch/serve) and **E12** (semantic enrichment) via ADR-0011 and ADR-0012.

---

## Owner decisions (locked)

| Topic              | Decision                                                                           |
| ------------------ | ---------------------------------------------------------------------------------- |
| Location           | `docs/adr/` — durable engineering record, not `_bmad-output/`                      |
| Numbering          | 4-digit zero-padded filenames: `0001-kebab-title.md`; never reuse IDs              |
| Status vocabulary  | `proposed → accepted → deprecated → superseded by ADR-NNNN`                        |
| One decision/file  | Do not bundle unrelated decisions (e.g. HTML stack ≠ search index)                 |
| Spine relationship | Spine stays the invariant summary; ADRs hold rationale, alternatives, consequences |
| Wiki discovery     | Add `docs/adr/` category label so ADRs appear in generated wiki                    |
| Pre-build ADRs     | ADR-0011/0012 written **before** E11/E12 implementation starts                     |

---

## ADR backlog (12 candidates)

| ADR  | Title                                       | Write phase  | Blocks / informs       |
| ---- | ------------------------------------------- | ------------ | ---------------------- |
| 0001 | Path confinement & trust boundary model     | Foundational | All new FS I/O         |
| 0002 | HTML stack: Mustache + Wikimedia tokens     | Retroactive  | Supersedes AD-6, AD-11 |
| 0003 | Config loader execution model               | Foundational | E21 S21.4              |
| 0004 | Static-file-only output; no bundled server  | Foundational | E11 design             |
| 0005 | Slug collision via hash suffix              | Retroactive  | —                      |
| 0006 | BMAD-aware nav enrichment                   | Retroactive  | E12 scope              |
| 0007 | CLI dual-audience contract                  | Foundational | E9 `--json`            |
| 0008 | Client-side lunr search                     | Retroactive  | —                      |
| 0009 | Runtime dependency budget policy            | Foundational | Supersedes AD-11       |
| 0010 | Landing site as separate deployable         | Retroactive  | E20 boundary           |
| 0011 | Watch + serve design                        | Pre-build    | E11                    |
| 0012 | Semantic enrichment scope & plugin boundary | Pre-build    | E12                    |

---

## Stories

| Story | Summary                                          | Depends      | Status  |
| ----- | ------------------------------------------------ | ------------ | ------- |
| S25.1 | ADR scaffolding, template, and wiki category     | —            | backlog |
| S25.2 | Foundational ADRs (0001, 0003, 0004, 0007, 0009) | S25.1        | backlog |
| S25.3 | Retroactive ADRs (0002, 0005, 0006, 0008, 0010)  | S25.1        | backlog |
| S25.4 | Architecture spine sync and ADR cross-links      | S25.2–S25.3  | backlog |
| S25.5 | Pre-build ADRs for E11/E12 (0011, 0012)          | S25.1, S25.4 | backlog |

---

## Story outlines

### S25.1 — ADR scaffolding, template, and wiki category

**As** a contributor documenting architecture,  
**I want** a standard ADR folder, template, and index,  
**so that** every decision follows the same structure and appears in the generated wiki.

**Demo path:** After scaffold — `docs/adr/index.md` lists ADRs; `npm run dev generate -- --project . --output /tmp/specwiki-adr25` includes an **Architecture Decisions** category with at least the index page.

**Functional (summary):**

- Create `docs/adr/` with `index.md` (purpose, status flow, link table placeholder)
- Add `docs/adr/template.md` — MADR skeleton: Title, Status, Date, Context, Decision, Consequences, References
- Add `docs/adr/` entry to `CATEGORY_LABELS` in `config/patterns.ts` (extend-only per AD-2)
- Document ADR authoring norms in index (numbering, supersession, when to write vs update spine)
- No ADR content beyond index + template in this story

### S25.2 — Foundational ADRs (0001, 0003, 0004, 0007, 0009)

**As** a maintainer reviewing security or CLI changes,  
**I want** the five governing ADRs written and accepted,  
**so that** path safety, config trust, output boundaries, CLI contract, and dependency policy are explicit before more features land.

**Demo path:** Read `docs/adr/0001-…md` through `0009-…md` — each status `accepted`, references real modules (`core/paths.ts`, `config/loader.ts`, etc.).

**Depends:** S25.1

**Functional (summary):**

- **ADR-0001** — `core/paths.ts` as mandatory gateway; list known wrappers; note `config/loader.ts` inline check as debt
- **ADR-0003** — `.json` vs `.js` config; precedence chain; RCE trust boundary stated explicitly
- **ADR-0004** — static output only; `open` via OS browser; bounds E11
- **ADR-0007** — stdout/stderr split; exit 0/1/2; `--json` stability note
- **ADR-0009** — replace AD-11 freeze with budget + ADR justification rule; list current runtime deps
- Update `docs/adr/index.md` with links and one-line summaries for all five

### S25.3 — Retroactive ADRs (0002, 0005, 0006, 0008, 0010)

**As** a new contributor reading the architecture spine,  
**I want** retroactive ADRs for shipped migrations,  
**so that** I understand why `wrapHtml()` is gone, slugs hash on collision, and BMAD catalog reads exist in `output/html/`.

**Demo path:** Generate wiki on repo root or fixture — ADR pages render under Architecture Decisions; ADR-0002 references `src/output/html/renderer.ts`.

**Depends:** S25.1 (may parallel S25.2 after scaffold lands)

**Functional (summary):**

- **ADR-0002** — Mustache + wikimedia-ui-base + highlight.js + lunr; supersedes AD-6, AD-11; escaping model via Mustache `{{ }}` / `{{{ }}}`
- **ADR-0005** — hash suffix collision strategy; closes AD-5 brownfield gap
- **ADR-0006** — BMAD CSV/TOML catalog enrichment scope and fallback when absent
- **ADR-0008** — lunr index at generate time; `file://` constraint; scaling note
- **ADR-0010** — `site/` vs npm package build boundary (E20)
- Update index; mark ADR-0002 and ADR-0009 cross-supersession of AD-11

### S25.4 — Architecture spine sync and ADR cross-links

**As** an agent or developer starting from the spine,  
**I want** superseded spine entries linked to ADRs,  
**so that** I am not misled by stale AD-6/AD-11 wording.

**Demo path:** Open `ARCHITECTURE-SPINE.md` — AD-6 and AD-11 annotated `superseded by ADR-0002/0009`; AD-5 marked resolved with ADR-0005 link; capability map updated.

**Depends:** S25.2, S25.3

**Functional (summary):**

- Update `ARCHITECTURE-SPINE.md`: status/date bump; AD-5 collision row → done; AD-6/AD-11 → superseded with ADR links
- Add **ADR index** section or companion pointer to `docs/adr/index.md`
- Update brownfield ratification table to reflect E16/E23/E8 shipped state
- Optionally add one-line ADR references in `IMPLEMENTATION.md` epic gate section — only if a natural hook exists; no large rewrite

### S25.5 — Pre-build ADRs for E11/E12 (0011, 0012)

**As** the owner planning POST-MVP work,  
**I want** ADR-0011 and ADR-0012 accepted before E11/E12 stories start,  
**so that** watch/serve and semantic enrichment do not repeat ad-hoc framework integration.

**Demo path:** ADR-0011 documents debounce, `127.0.0.1`-only bind, no auth, chokidar vs `node:fs.watch` tradeoff; ADR-0012 defines plugin ceiling vs hard-coded enrichment.

**Depends:** S25.1, S25.4 (spine + ADR-0004/0006 context)

**Functional (summary):**

- **ADR-0011** — status `accepted` when owner approves; explicitly revisits ADR-0004 boundary for `serve` only
- **ADR-0012** — status `accepted` or `proposed` with owner sign-off; references ADR-0006 as precedent; defers or confirms plugin API from spine deferred table
- Link both from E11 and E12 epic files (cross-epic dependency notes only — no E11/E12 story changes required in this story)

---

## Requirements & constraints

- ADRs are **Markdown documentation** — no runtime code changes except S25.1 category label (extend-only)
- Follow MADR structure; keep each ADR readable in under ~150 lines
- Reference real file paths and spine IDs; avoid generic architecture prose
- Do not duplicate full content of README security section — ADR-0003 links to it
- S25.4 spine edits preserve AD-1…AD-4, AD-7, AD-8, AD-9, AD-10 invariant wording where still accurate
- Quality gate on S25.1 only if `config/patterns.ts` changes — run full gate then; doc-only stories skip code gate unless owner requests

---

## Cross-epic dependencies

- **E5** — path confinement and slug collision (ADR-0001, ADR-0005)
- **E8 S8.2** — config loader (ADR-0003)
- **E9** — JSON output (ADR-0007)
- **E11** — blocked on ADR-0011 acceptance for design clarity
- **E12** — blocked on ADR-0012 acceptance for scope ceiling
- **E16** — HTML stack (ADR-0002, ADR-0008)
- **E20** — landing site (ADR-0010)
- **E21 S21.4** — config.js warning aligns with ADR-0003 trust model
- **E23** — BMAD nav enrichment (ADR-0006)

---

## Epic gate

- [ ] S25.1 — `docs/adr/` scaffold, template, index, wiki category label
- [ ] S25.2 — Five foundational ADRs accepted and indexed
- [ ] S25.3 — Five retroactive ADRs accepted and indexed
- [ ] S25.4 — Spine updated; AD-6/AD-11 superseded links; AD-5 resolved
- [ ] S25.5 — ADR-0011 and ADR-0012 accepted; linked from E11/E12 epics
- [ ] Owner review of [ADR backlog canvas](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/specwiki-adr-backlog.canvas.tsx)

---

## Open items (non-blocking)

- **ADR-0013 candidate** — CI grep for raw `fs.*` outside `core/paths.ts` wrappers (follow-up from ADR-0001)
- **bmad-index-docs** — auto-regenerate `docs/adr/index.md` table when ADR count grows
- **CONTRIBUTING.md** — "when to write an ADR" section after epic completes
