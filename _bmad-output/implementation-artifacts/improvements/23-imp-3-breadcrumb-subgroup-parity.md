# Improvement Report — Breadcrumbs lag navbar subgroup path

**ID:** 23-IMP-3  
**Date:** 2026-07-17  
**Source:** Owner review after S23.1–S23.3 (drawer hierarchy live; breadcrumbs unchanged)  
**Epic:** E23 — Navigation Drawer Hierarchy  
**Related:** E16 S16.2 breadcrumbs; S23.1 subgroup VM; S23.4 index subgroup anchors (likely dependency for deep links)  
**Status:** scheduled as [S23.7](../23-7-breadcrumb-subgroup-parity.md) — review

---

## Observation

The navigation drawer now reflects path / catalog subgroups (e.g. **BMAD Output › Implementation Stories › Epic 19**, **Cursor Skills › Team A**, **Agent Skills › Analysis**). Article **breadcrumbs still stop at category**:

`Main Page › {Category} › {Page title}`

They do not include the subgroup chain the drawer uses, so location context on the article disagrees with the navbar.

## Why it happens (current behavior)

- `buildBreadcrumbs` in `renderer.ts` only emits: Main Page → category (optional `#category-…` on index) → page title.
- Subgroup labels / keys from `nav-grouping.ts` (`NavSubgroup`) are consumed by category nav templates only — not by the breadcrumb builder.
- Epic 23 stories S23.1–S23.3 / S23.5 cover drawer grouping, disclosure, and search; **breadcrumbs were never in scope**. S23.4 covers index portal subgroup parity + anchors, which breadcrumbs may want to link into.

## Desired direction

Breadcrumbs should follow the same mental model as the drawer path inside the category (depth ≤ 2), for example:

`Main Page › BMAD Output › Implementation Stories › Epic 19 › Story title`

or, with singleton promotion, omit levels the nav already flattens.

### Candidate approaches (for later story design)

1. **Reuse nav grouping ancestry** — given active page, walk the `NavSubgroup` chain that contains it; emit labels as intermediate segments.
2. **Link intermediate segments** — when S23.4 subgroup anchors exist on index, href to `index.html#…`; until then, plain-text (non-link) segments are acceptable.
3. **Keep last segment = page title** (current page, not a link) — preserve E16 pattern.

Prefer shared resolution with drawer labels (same VM / grouping context) so Agent Skills hybrid names and path folder labels stay consistent.

## Acceptance sketch (when scheduled)

- [x] Article breadcrumbs include subgroup ancestors that appear in the drawer for that page (respecting depth cap / singleton promotion)
- [x] Category-only trail remains correct when a page has no subgroups
- [x] Labels match drawer (`NavSubgroup.label` / hybrid enrichment), Mustache-escaped
- [x] Intermediate links use index subgroup anchors when available (S23.4); otherwise non-link labels _(plain-text in S23.7; S23.4 anchors deferred)_
- [x] Renderer tests cover nested BMAD Output / Cursor Skills paths and flat categories
- [x] No change to Markdown wiki, discovery, or slug paths

## Non-goals

- Persisting breadcrumb state or client-side routing
- Changing drawer disclosure / search grouping (S23.3 / S23.5)
- Replacing index portal work (S23.4) — only consume its anchors if present

## Suggested scheduling

**Scheduled:** [S23.7 — Breadcrumb subgroup parity](../23-7-breadcrumb-subgroup-parity.md) (`23-7-breadcrumb-subgroup-parity`, review). Ships with plain-text subgroup crumbs; optional deep-links after S23.4 anchors.
