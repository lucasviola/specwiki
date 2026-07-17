# Improvement Report — Collapsible / expandable nav subgroups

**ID:** 23-IMP-2  
**Date:** 2026-07-17  
**Source:** Owner review of S23.2 dogfood (drawer hierarchy)  
**Epic:** E23 — Navigation Drawer Hierarchy  
**Related:** **S23.3** (already backlog — Nested disclosure UI)  
**Status:** logged — maps to existing story S23.3

---

## Observation

Category-level collapse/expand (E19 S19.5) works, but **subgroups are static headings** only. Owner wants to **collapse and expand subgroups** the same way (e.g. close **Analysis** / **Implementation Stories › Epic 23** while browsing).

## Current behavior (S23.1 / S23.2)

- Subgroups render as static labels + page lists inside an open category.
- Nested `<details>` / chevrons / count badges for subgroups were **explicitly deferred to S23.3**.
- Open/collapsed **view-model flags** (`collapsible`, `open`) already exist on `NavSubgroup` for route-aware defaults; templates do not yet wire nested disclosure.

## Desired direction

Enable progressive disclosure for **intra-category subgroups** (depth ≤ 2):

- User can expand/collapse each subgroup independently
- Active page’s ancestor subgroups open by default on article views
- Index defaults remain collapsed for multi-page subgroups (parity with category disclosure)
- Offline / `file://` safe — native `<details>`, no nav state in `localStorage`/`sessionStorage`

## Existing story mapping

| Field      | Value                                                  |
| ---------- | ------------------------------------------------------ |
| Story      | **S23.3 — Nested disclosure UI**                       |
| Sprint key | `23-3-nested-disclosure-ui` (currently `backlog`)      |
| Depends    | S23.1 (done/review), benefits from S23.2 hybrid labels |
| Unlocks    | S23.4 index portal parity                              |

This report is an **owner confirmation** that S23.3 is wanted from dogfood — not a separate parallel feature.

## Acceptance sketch (S23.3)

- [ ] Nested `<details>` (or equivalent) for subgroups in article + index nav
- [ ] CSS tokens / chevrons / optional page-count badges for subgroups
- [ ] Active route expands the correct subgroup chain; other subgroups stay closed
- [ ] Works in desktop sidebar and mobile drawer (same `.category-nav` tree)
- [ ] No new runtime deps; Mustache-escaped labels; renderer/CSS tests green

## Non-goals

- Flyout submenus or truncate-primary patterns (rejected in epic)
- Persisting open/closed state across reloads
- Fixing Agent Skills duplicate titles (see **23-IMP-1**)

## Suggested scheduling

Promote **S23.3** when ready for next E23 slice. No new story id required unless S23.3 scope is split.
