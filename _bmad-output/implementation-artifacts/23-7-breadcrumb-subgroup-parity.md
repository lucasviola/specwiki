---
baseline_commit: 34b6393a3245a3259f09e638a5afee44a23ded55
---

# Story 23.7: Breadcrumb Subgroup Parity

Status: ready-for-dev

**Source:** [23-IMP-3](./improvements/23-imp-3-breadcrumb-subgroup-parity.md)  
**Epic:** E23 — Navigation Drawer Hierarchy  
**Depends:** S23.1 (subgroup VM); benefits from S23.2/S23.6 labels when hybrid context is loaded  
**Soft-depends:** S23.4 (index subgroup anchors) — **not required to ship**; intermediate crumbs may be non-link until anchors exist

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As Alex reading an article,
I want breadcrumbs to show the same subgroup path as the navigation drawer,
so that my place in the wiki matches what I see in the navbar.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23-s237` — open a Cursor Skills page under Team A, or a BMAD Output story under Implementation Stories › Epic N. Breadcrumb must show category **and** subgroup ancestors before the page title (e.g. `Main Page › Cursor Skills › Team A › Skill A`), not just `Main Page › Category › Title`.

**Binds:** FR-033 (breadcrumb chrome extension) | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **AD:** AD-4, AD-6, AD-11

## Acceptance Criteria

### Functional

1. **Subgroup ancestors in trail:** For an article whose category nav places the page under one or more `NavSubgroup`s, breadcrumbs include those subgroup **labels** (L1, and L2 when present) between the category segment and the page-title segment. Order matches drawer ancestry (outer → inner).
2. **Respect grouping rules:** Trail only includes subgroups that actually wrap the page after S23.1 finalization (depth ≤ 2, singleton promotion). If the page is a direct category leaf (no subgroup wrapper), trail stays `Main Page › Category › Title` (current behavior).
3. **Label parity:** Subgroup crumb labels equal `NavSubgroup.label` from the same grouping pass used for drawer nav (path humanization and hybrid Agent Skills / S23.6 skill L2 labels). Do **not** re-derive labels from raw path segments in the breadcrumb builder.
4. **Segment roles:**
   - `Main Page` → link `index.html`
   - Category → keep today’s behavior (`index.html#category-{key}` when category visible on index; else plain label)
   - Subgroup ancestors → **plain text (no `href`)** in this story unless S23.4 subgroup anchors are already present and wired; do **not** invent portal anchors here
   - Page title → current page, no link
5. **`aria-current` fix (required):** Update `article.mustache` so only the **current page** segment gets `aria-current="page"`. Intermediate segments without `href` (category-when-hidden, subgroup labels) must be plain `<span>` **without** `aria-current`. Today’s `{{^href}}…aria-current…{{/href}}` is wrong once subgroup non-links exist — extend `BreadcrumbSegment` with an explicit `current` (or equivalent) flag.
6. **Mustache escaping:** All breadcrumb labels remain HTML-escaped (`{{label}}`). Preserve existing XSS tests for title/metadata crumbs.
7. **Preserve:** Drawer/disclosure (S23.3), search (S23.5), Markdown wiki, discovery, slugs, frozen HTML paths, `file://` / no `fetch` / no nav storage, no new client JS.

### Logging & diagnostics (§0.8)

8. No new log event type for breadcrumbs; reuse existing verbose `output.write` coverage only.
9. Do not log full page bodies or secrets.

### Quality measures

10. Renderer tests assert nested BMAD Output / Cursor Skills trails include subgroup labels; flat categories unchanged; only final segment has `aria-current="page"`.
11. Unit-test ancestry helper (prefer in `nav-grouping.test.ts`) for L1-only, L2 chain, and no-subgroup cases.
12. Existing breadcrumb escape / structure tests stay green; HARNESS §0.2 gate; `src/output/html/` coverage ≥ 90% on touched paths.

## Tasks / Subtasks

- [ ] Breadcrumb subgroup parity vertical slice (AC: 1–12)
  - [ ] RED: renderer tests — nested Cursor Skills / BMAD Output crumbs; flat category unchanged; `aria-current` only on final segment
  - [ ] RED: unit tests for ancestry helper (L1, L2, none)
  - [ ] GREEN: export helper from `nav-grouping.ts` (e.g. `resolveActiveSubgroupTrail`) that walks finalized `NavSubgroup[]` for active slug/sourcePath and returns ordered `{ key, label }[]`
  - [ ] GREEN: extend `buildBreadcrumbs` to insert subgroup segments after category; pass `navGroupingContext` / reuse subgroups already built for the active category (avoid a second divergent grouping pass when possible)
  - [ ] GREEN: fix `article.mustache` breadcrumb markup for explicit `current` flag
  - [ ] REFACTOR: no discovery/slug/Markdown changes; no S23.4 portal work; no S23.5 search changes
  - [ ] Update `IMPLEMENTATION.md`, sprint-status, 23-IMP-3 disposition, epic table; run quality gate + §0.2.5/§0.2.6

## Dev Notes

### Product intent (23-IMP-3)

Owner gap after drawer hierarchy shipped: navbar shows `Category › Subgroup › … › Page`, but article breadcrumbs still stop at category. This story closes that presentation gap only.

### Current state (post S23.3 / S23.6)

- `buildBreadcrumbs(page, categoryLabel, allPages)` in `renderer.ts` emits only Main → category → title.
- `renderArticle` already calls `buildNavCategories(..., page, renderOptions)` **before** breadcrumbs — active category’s `subgroups` are available; prefer deriving the trail from that VM (or an exported walker over the same tree) so labels cannot drift.
- Active-page matching already exists privately in `nav-grouping.ts` (`subgroupContainsActiveInChild` / slug + `sourcePath`). Extract/reuse rather than copying ad hoc string splits.
- Template bug to fix:

```mustache
{{#href}}<a href="{{href}}">{{label}}</a>{{/href}}
{{^href}}<span aria-current="page">{{label}}</span>{{/href}}
```

Once subgroup crumbs omit `href`, every non-link would falsely claim current page. Prefer:

```mustache
{{#href}}<a href="{{href}}">{{label}}</a>{{/href}}
{{^href}}{{#current}}<span aria-current="page">{{label}}</span>{{/current}}{{^current}}<span>{{label}}</span>{{/current}}{{/href}}
```

(or equivalent clear boolean on the segment).

### Suggested data shape

```ts
interface BreadcrumbSegment {
  label: string;
  href?: string;
  first: boolean;
  current?: boolean; // true only on final page-title segment
}
```

### Suggested ancestry algorithm

Given `subgroups: NavSubgroup[]` and active page identity (`slug` / `sourcePath`):

1. DFS/BFS: find the path of subgroups where each ancestor `open`/`contains` the active page (same match rules as drawer).
2. Return ordered list of `{ key, label }` for that path (length 0–2).
3. Do **not** include the page itself as a subgroup segment.

Keep the helper pure and unit-tested in `nav-grouping.ts`.

### S23.4 interaction (do not block)

| Now (this story)               | Later (S23.4+)                                            |
| ------------------------------ | --------------------------------------------------------- |
| Subgroup crumbs = plain labels | Optional `href` to `index.html#…` subgroup portal anchors |
| Category link unchanged        | Unchanged                                                 |

If S23.4 lands first, a tiny follow-up can add `href` using the agreed anchor scheme — out of scope unless anchors already exist in-tree when implementing.

### Out of scope

| Defer | Work                                                |
| ----- | --------------------------------------------------- |
| S23.4 | Index portal subgroup structure + inventing anchors |
| S23.5 | Search `subgroupLabel` / result grouping            |
| Never | Client-side breadcrumb state, flyouts, fetch        |

### Testing

- Primary: `tests/output/html/renderer.test.ts` HTML assertions on breadcrumb trail.
- Unit: `tests/output/html/nav-grouping.test.ts` for trail helper.
- Smoke: sample-project generate; inspect one nested article breadcrumb in browser/`file://`.
- Keep escape tests: `escapes a long final breadcrumb label`, script-injection cases.

### Project structure

| Action       | Path                                                                  |
| ------------ | --------------------------------------------------------------------- |
| UPDATE       | `src/output/html/nav-grouping.ts` (export ancestry helper)            |
| UPDATE       | `src/output/html/renderer.ts` (`buildBreadcrumbs` + segment flags)    |
| UPDATE       | `src/output/html/templates/article.mustache` (aria-current)           |
| UPDATE       | `tests/output/html/renderer.test.ts`                                  |
| UPDATE       | `tests/output/html/nav-grouping.test.ts`                              |
| UPDATE       | `IMPLEMENTATION.md`, `sprint-status.yaml`, this story, 23-IMP-3, epic |
| DO NOT TOUCH | discovery, Markdown writer, search-index, S23.4 portal templates      |

### Previous story intelligence

- S23.1–S23.3: grouping + nested `<details>`; VM flags `key`/`label`/`pages`/`subgroups` are the source of truth.
- S23.6: hybrid Agent Skills may add skill L2 under phase — breadcrumbs must show those labels when the active page sits under them.
- Review lesson (S23.3): prefer escaped Mustache `{{key}}` / `{{label}}` for attributes and text; never `{{{…}}}` for user-derived path keys.

### Git intelligence

Recent: nested disclosure (`6ec9910`), `data-subgroup` escape (`34b6393`), Agent Skills L2 dedup (`0d0b95f`). Pattern: thin renderer VM + logic in `nav-grouping.ts` + renderer HTML assertions.

### References

- [Source: `improvements/23-imp-3-breadcrumb-subgroup-parity.md`]
- [Source: `epic-23-navigation-drawer-hierarchy.md` — E16 S16.2 breadcrumb dependency; S23.4 anchors]
- [Source: `src/output/html/renderer.ts` — `buildBreadcrumbs`, `buildNavCategories`]
- [Source: `src/output/html/templates/article.mustache` — breadcrumb nav]
- [Source: FR-033 / NFR-003 — HTML structure + escape tests]

## QA Manual Validation

1. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23-s237` — HTML wiki writes successfully.
2. Open a nested article (Cursor Skills › Team A or BMAD Output › Implementation Stories › Epic N) — breadcrumb includes subgroup labels between category and title.
3. Open a flat-category article — breadcrumb remains `Main Page › Category › Title` (no empty/extra subgroup crumbs).
4. Inspect DOM: only the final breadcrumb `<span>` has `aria-current="page"`.
5. `npm test -- tests/output/html/renderer.test.ts -t "breadcrumb"` and `npm test -- tests/output/html/nav-grouping.test.ts -t "trail\|breadcrumb\|ancestry"` — pass.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-07-17: Story created from 23-IMP-3; status ready-for-dev.
