---
baseline_commit: 0d0b95f689f731bed4c58fdd70fef22a2efcafe5
---

# Story 23.3: Nested Disclosure UI (Collapsible Nav Subgroups)

Status: review

<!-- Owner confirmation: improvements/23-imp-2-collapsible-nav-subgroups.md maps here. -->

## Story

As Alex on mobile or desktop,
I want subgroups to collapse like categories do today,
so that I can scan group headings before expanding to page links.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23-s233` — open a page under a multi-page subgroup (e.g. Cursor Skills › Team A or BMAD Output › Implementation Stories › Epic N); that subgroup chain is expanded; sibling subgroups stay collapsed. Toggle subgroup summaries open/closed without JS storage.

**Binds:** FR-033 (subgroup disclosure extension) | **Depends:** S23.1 (S23.2 optional for richer Agent Skills labels) | **NFR:** NFR-003, NFR-007, NFR-011–NFR-013 | **AD:** AD-4, AD-6, AD-11

## Acceptance Criteria

### Functional

1. **Nested native `<details>`** for multi-page subgroups (`NavSubgroup.collapsible === true`) inside category nav on both `index.mustache` and `article.mustache` (shared `.category-nav` tree — desktop sidebar and mobile drawer).
2. **Depth ≤ 2:** L1 and L2 subgroups both use disclosure chrome when collapsible; structure matches existing `subgroups` / nested `subgroups` view model from S23.1.
3. **Route-aware open state (consume existing VM flags):**
   - Article: subgroup (and parent if depth-2) containing the active page render with `open`; other multi-page subgroups closed.
   - Index: multi-page subgroups render closed by default (`open` false).
   - Category-level S19.5 `open` / `collapsible` / active behavior unchanged.
4. **Count badges** on collapsible subgroup summaries using existing `.category-nav-count` (or subgroup-scoped equivalent) with `aria-label="{{pageCount}} pages"`.
5. **Non-collapsible subgroups** (if any remain after singleton promotion): keep static label + page list — no empty disclosure wrapper.
6. **CSS:** subgroup disclosure uses semantic tokens (chevron via `summary::before`, muted labels, nested indent/border). Prefer-reduced-motion disables subgroup chevron transition too. No new client JS assets for nav state.
7. **Preserve:** S19.2 drawer (`inert`, Escape, scroll lock), S19.4 search overlay precedence, `file://` / no `fetch` / no nav `localStorage`/`sessionStorage`, Mustache-escaped labels, frozen HTML paths, Markdown/discovery/slugs unchanged.
8. **No change** to `nav-grouping.ts` inference rules beyond what templates need (flags already exist). No S23.4 index portal subgroup anchors; no S23.5 search grouping.

### Logging & diagnostics (§0.8)

9. Reuse existing verbose `output.write` coverage; no new log event type for disclosure chrome.
10. Default client assets emit no new console spam; do not log secrets or full page bodies.

### Quality measures

11. Renderer/CSS tests assert nested `<details class="category-nav-subgroup-group">` (or agreed class), `open` on active chain for articles, closed on index, count badges, and chevron/token CSS presence.
12. Existing S19.5 category disclosure tests and S23.1/S23.2 grouping tests stay green.
13. Complete HARNESS §0.2 quality gate; `src/output/html/` coverage ≥ 90% on touched paths.

## Tasks / Subtasks

- [x] Nested subgroup disclosure vertical slice (AC: 1–13)
  - [x] RED: replace/extend renderer tests — nested `<details>` for collapsible subgroups; index closed; article active chain open; count badges; CSS tokens/chevrons.
  - [x] GREEN: update `index.mustache` + `article.mustache` subgroup blocks to nested `<details>`/`<summary>` wired to `collapsible`/`open`/`pageCount`/`key`.
  - [x] GREEN: update `specwiki.css` for subgroup disclosure (summary flex, chevron, nested open state, reduced-motion).
  - [x] GREEN: keep non-collapsible fallback; do not break flat categories or S19.5 category `<details>`.
  - [x] REFACTOR: shared markup patterns only; no new runtime deps; no nav storage; no discovery/slug/Markdown changes.
  - [x] Update `IMPLEMENTATION.md`, sprint-status, story File List; run full quality gate + §0.2.5/§0.2.6.

## Dev Notes

### Product intent (23-IMP-2)

Owner dogfood of S23.2: category collapse works, but **subgroups are static headings**. Want expand/collapse for e.g. Analysis / Implementation Stories › Epic 23 while browsing. This story **is** that work — not a parallel feature.

### Current state (post S23.1 / S23.2)

- `NavSubgroup` already has `collapsible`, `open`, `pageCount`, `key`, `label`, `pages`, optional nested `subgroups`.
- Templates render static `<span class="category-nav-subgroup-label">` + lists.
- Test `renders static subgroup headings in nav without nested details` must be **replaced** with nested-disclosure assertions.
- S19.5 note “Do not nest disclosures” is **superseded** by Epic 23 for subgroup nesting.

### Suggested markup (guide)

```html
<li class="category-nav-subgroup">
  <details class="category-nav-subgroup-group" data-subgroup="{{key}}" open?>
    <summary class="category-nav-subgroup-summary">
      <span class="category-nav-subgroup-label">{{label}}</span>
      <span class="category-nav-count" aria-label="N pages">N</span>
    </summary>
    <ul class="category-nav-subgroup-pages">
      …pages + nested subgroup li…
    </ul>
  </details>
</li>
```

Nested L2: add `category-nav-subgroup-nested` on the inner `li` (preserve today’s nesting class).

### Out of scope

| Defer            | Work                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| S23.4            | Index portal subgroup anchors / portal parity beyond drawer nav already on index |
| S23.5            | Search `subgroupLabel` grouping                                                  |
| 23-IMP-1 / S23.6 | Agent Skills duplicate title dedup (separate)                                    |
| Never            | Flyouts, truncate-primary, nav open-state persistence                            |

### Testing

- Primary: `tests/output/html/renderer.test.ts` HTML assertions + CSS string checks.
- Smoke: sample-project generate still shows subgroup labels (now inside summaries).
- Keep `nav-grouping.test.ts` green (VM already correct).

### Project structure

| Action       | Path                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| UPDATE       | `src/output/html/templates/index.mustache`                                            |
| UPDATE       | `src/output/html/templates/article.mustache`                                          |
| UPDATE       | `src/output/html/assets/specwiki.css`                                                 |
| UPDATE       | `tests/output/html/renderer.test.ts`                                                  |
| UPDATE       | `tests/output/wiki.test.ts` / `tests/commands/generate.test.ts` if assertions break   |
| UPDATE       | `IMPLEMENTATION.md`, `sprint-status.yaml`, this story file                            |
| DO NOT TOUCH | discovery, Markdown writer, search-index, nav-grouping inference (unless tiny VM fix) |

### References

- [Source: `improvements/23-imp-2-collapsible-nav-subgroups.md`]
- [Source: `epic-23-navigation-drawer-hierarchy.md` — S23.3]
- [Source: `19-5-collapsible-category-navigation.md` — category disclosure contracts]
- [Source: `nav-drawer-hierarchy-brief.md`]

## QA Manual Validation

1. `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-nav23-s233` — HTML wiki writes successfully.
2. `grep -n 'category-nav-subgroup-group' /tmp/specwiki-nav23-s233/wiki/html/index.html | head` — nested subgroup `<details>` present on index; multi-page subgroups lack `open` by default.
3. Open an article under a nested subgroup (e.g. a Cursor Skills page under Team A, or a BMAD story page) — active category open; active subgroup (and parent if depth-2) open; siblings closed.
4. In browser/`file://`: click subgroup summary — expands/collapses; reload does not persist open state; desktop sidebar and mobile drawer share the same tree.
5. `npm test -- tests/output/html/renderer.test.ts -t "subgroup"` — disclosure tests pass.

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Debug Log References

### Completion Notes List

- Implemented nested native `<details>` for L1/L2 collapsible subgroups via Mustache partials shared by index + article templates (desktop sidebar + mobile drawer).
- Wired existing `collapsible` / `open` / `pageCount` / `key` VM flags; index closed by default; article opens active subgroup chain.
- CSS chevrons + count badges + prefers-reduced-motion; recursive `copy-html-assets` so `templates/partials/` lands in dist.
- Quality gate: 510 tests; lint/format/coverage (`src/output/html` 96.68%)/typecheck/build green.
- Addresses 23-IMP-2 owner dogfood request (maps to this story).

### File List

- `src/output/html/templates/partials/nav-subgroup.mustache` (new)
- `src/output/html/templates/partials/nav-subgroup-nested.mustache` (new)
- `src/output/html/templates/index.mustache`
- `src/output/html/templates/article.mustache`
- `src/output/html/renderer.ts`
- `src/output/html/assets/specwiki.css`
- `scripts/copy-html-assets.mjs`
- `tests/output/html/renderer.test.ts`
- `tests/scripts/copy-html-assets.test.ts`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/23-3-nested-disclosure-ui.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/epic-23-navigation-drawer-hierarchy.md`
- `_bmad-output/implementation-artifacts/improvements/23-imp-2-collapsible-nav-subgroups.md`

### Change Log

- 2026-07-17: Story created from epic S23.3 + 23-IMP-2 owner confirmation; status in-progress.
- 2026-07-17: Nested disclosure UI implemented; status → review; §0.2.5/§0.2.6 recorded.

## Senior Developer Review (AI)

- **Date:** 2026-07-17
- **Outcome:** Changes Requested (1 Patch)
- **Reviewer model:** claude-sonnet-5-thinking-high (Bugbot)
- **QA model:** claude-sonnet-5-thinking-high (generalPurpose)

### Action Items

- [ ] [Patch][Med] Escape `data-subgroup` key — use Mustache `{{key}}` (or sanitize) instead of `{{{key}}}` in both nav-subgroup partials; update renderer tests for escaped `/` (`&#x2F;`). Aligns with `data-category="{{key}}"`.
