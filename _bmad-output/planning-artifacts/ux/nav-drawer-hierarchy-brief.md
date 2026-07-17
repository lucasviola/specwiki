# Navigation Drawer Hierarchy — UX Brief

**Status:** approved for Epic 23  
**Created:** 2026-07-17  
**Session:** navigation drawer hierarchy brainstorm  
**Interactive canvas:** [nav-drawer-hierarchy.canvas.tsx](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/nav-drawer-hierarchy.canvas.tsx)

## Problem

Epic 19 S19.5 solved **category-level** collapse (Agent Skills, BMAD Output, etc.). Inside large categories, pages remain a **flat filesystem-ordered list** — e.g. 176 links under Agent Skills with no human-readable sub-structure.

## Owner decisions (2026-07-17)

| Decision          | Choice                                                     |
| ----------------- | ---------------------------------------------------------- |
| Scope             | All wiki categories (not skills-only)                      |
| Metadata          | Infer only — no new skill frontmatter                      |
| Agent Skills axis | **Hybrid:** Your team pinned first, then SDLC phase groups |
| Max nesting depth | **2 levels** inside a category                             |
| Singleton groups  | Hide wrapper — promote single-page groups to direct links  |
| Skills categories | Keep Agent Skills and Cursor Skills separate               |

## Design principle

**Layered inference:** universal path-segment baseline (L0) plus category-specific enrichers where metadata already exists.

| Layer | Signal                                                  | Applies to     |
| ----- | ------------------------------------------------------- | -------------- |
| L0    | Path tree                                               | All categories |
| L1    | `bmad-help.csv`                                         | Agent Skills   |
| L2    | `customize.toml` `[agent]` / `[workflow]`               | Agent Skills   |
| L3    | Epic/story prefixes, planning vs implementation folders | BMAD Output    |
| L4    | CSV display names, agent title/icon                     | Labels only    |

## Recommended UI

Nested native `<details>` (extends S19.5): category → subgroup (→ optional sub-subgroup) → page links. Route-aware defaults expand the active category and subgroup. Count badges at both levels. Index portal mirrors drawer structure. Search groups by `Category › Subgroup`.

## Phased stories (Epic 23)

1. **S23.1** — Nav grouping module + path-segment baseline
2. **S23.2** — BMad catalog enrichment (CSV + TOML)
3. **S23.3** — Nested disclosure templates + CSS
4. **S23.4** — Index portal parity + subgroup anchors
5. **S23.5** — Search result grouping by subgroup

## Rejected patterns (from S19.5 UX research)

- Flyout submenus
- Search-only wayfinding as primary fix
- Truncate-with-"show more" as primary fix

## Reference

Full brainstorm with examples, trade-offs, and drawer preview: open the canvas linked above.
