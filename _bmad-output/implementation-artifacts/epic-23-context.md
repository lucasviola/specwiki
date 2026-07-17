# Epic 23 Context: Navigation Drawer Hierarchy

## Goal

Extend the HTML wiki navigation drawer with **intra-category hierarchy** so users browsing large categories (especially Agent Skills and BMAD Output) see human-meaningful subgroups instead of flat filesystem-ordered link lists. Epic 23 builds directly on E19 S19.5 category-level collapse and preserves all offline, `file://`-safe, no-storage navigation contracts.

The governing requirements remain FR-032 (Mustache renderer and assets), FR-033 (navigation chrome), and FR-034 (search). Epic 23 proposes extending FR-033 with **subgroup disclosure** inside category groups. This is presentation-only — no changes to discovery, parsing, category derivation at the top level, or generated page locations.

## Stories

1. **S23.1 — Nav Grouping Module and Path Baseline.** Introduce `nav-grouping.ts` with path-segment subgroups, 2-level depth cap, folder label map, and singleton flattening for all categories.
2. **S23.2 — BMad Catalog Enrichment.** When `_bmad/_config/bmad-help.csv` and skill `customize.toml` files exist, group Agent Skills with **Your team** pinned first, then SDLC phase buckets; use CSV display names and agent persona labels.
3. **S23.3 — Nested Disclosure UI.** Nested native `<details>` inside category groups in shared Mustache templates; route-aware expand of active subgroup; subgroup count badges and CSS tokens.
4. **S23.4 — Index Portal Parity.** Main index category sections mirror drawer subgroup structure with subgroup anchors.
5. **S23.5 — Search Subgroup Grouping.** Search index and client group results by `Category › Subgroup` aligned with nav keys.

## Requirements & Constraints

- Preserve frozen output layout and Markdown wiki; HTML-only enhancement.
- Preserve relative inter-page links and direct `file://` browsing. No server, CDN, `fetch()`, telemetry, or nav persistence in storage.
- **Infer only** — no required edits to skill frontmatter; optional BMad files when present.
- Keep user-controlled titles and labels in escaped Mustache or safe DOM-text positions.
- Reuse single `.category-nav` DOM on desktop and mobile (E19 S19.2).
- Maintain WCAG-oriented keyboard access and no-JS native disclosure behavior.
- Follow TDD, 90% coverage on `src/output/html/`, and six-command quality gate.

## Technical Decisions

- Grouping logic lives in `src/output/html/nav-grouping.ts`; `renderer.ts` builds view models only.
- `loadNavGroupingContext(projectRoot)` runs once per HTML generation in `writeHtmlWiki`.
- **Max nesting depth:** 2 levels inside a category (owner decision 2026-07-17).
- **Agent Skills axis:** hybrid — Your team first, then SDLC phase (owner decision).
- **Singleton subgroups:** hidden — single-page groups promote to parent direct links.
- BMAD Output uses L3 rules: Planning/Implementation/Epic context; epic prefix `NN-M-` in filenames.
- Search documents gain `subgroupLabel` and composite `searchGroupLabel` for S23.5.

## UX & Interaction Patterns

Category nav remains: collapsible top-level groups with page counts (S19.5). Inside an expanded category, **subgroups** use the same disclosure pattern. Index default: multi-page subgroups start collapsed. Article default: active category and active subgroup open. Single-page subgroups render as direct links without a wrapper. Index portal and search use the same subgroup labels as the drawer.

**Planning artifact:** [nav-drawer-hierarchy-brief.md](../planning-artifacts/ux/nav-drawer-hierarchy-brief.md)  
**Interactive canvas:** [nav-drawer-hierarchy.canvas.tsx](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/nav-drawer-hierarchy.canvas.tsx)

## Cross-Story Dependencies

E16 S16.2 provides category rail and breadcrumb semantics. E19 S19.2 drawer shell constrains S23.3 overlay behavior. E19 S19.4 search client consumed by S23.5. E19 S19.5 category `<details>` is the outer shell; S23.3 nests inside it. S23.2 depends on S23.1 module shape. S23.4 depends on S23.3 templates. S23.5 depends on S23.1 label resolution and S19.4 search UI.
