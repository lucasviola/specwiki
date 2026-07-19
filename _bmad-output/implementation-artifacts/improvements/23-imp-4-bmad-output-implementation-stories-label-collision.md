# Bug Report — BMAD Output duplicate "Implementation Stories" subgroup labels

**ID:** 23-IMP-4  
**Date:** 2026-07-19  
**Source:** ADR-0010 review (Winston architect + Amelia dev)  
**Epic:** E23 — Navigation Drawer Hierarchy  
**Related:** ADR-0010, S23.1 (L3 BMAD Output enricher), `src/output/html/nav-grouping.ts`  
**Status:** open — not scheduled

---

## Summary

When a project has both epic-numbered story files and nested subdirectories under `_bmad-output/implementation-artifacts/`, the BMAD Output drawer can show **two sibling top-level `<details>` sections both titled "Implementation Stories"**.

## Reproduction

Present in this repo today:

- Story files: `_bmad-output/implementation-artifacts/{N}-{M}-*.md` → segment key `"implementation-stories"` → label **Implementation Stories** (via `FOLDER_LABELS`)
- Nested subdir: `_bmad-output/implementation-artifacts/improvements/*.md` → L0 fallback → segment key `"implementation-artifacts"` → **same label** (via `FOLDER_LABELS["implementation-artifacts"]`)

Because `rootChildren` is a `Map` keyed by raw segment string (not label), both keys coexist as separate subgroups with identical display titles.

## Root cause

`resolveBmadOutputSegments()` (`nav-grouping.ts:397-413`):

- Story files route to `["implementation-stories", "epic-N"]`
- Nested subdirs (non-story, `dirParts.length > 1`) delegate to `resolveL0Segments()`, yielding `["implementation-artifacts", …]`

`FOLDER_LABELS` maps both keys to `"Implementation Stories"`:

```typescript
"implementation-artifacts": "Implementation Stories",
"implementation-stories": "Implementation Stories",
```

Singleton promotion hides the collision for single-file nested dirs (e.g. `archive/notes.md`) but not for multi-file folders like `improvements/`.

## Expected behavior

One of:

1. Route nested non-story subdirs under `implementation-artifacts/` to `["other"]` (consistent with root non-story files at line 412), or
2. Give the L0 fallback segment a distinct label (e.g. "Other implementation files"), or
3. Dedupe or merge subgroups by display label before rendering

## Suggested fix (preferred)

Option 1 — minimal change, matches existing root-file behavior:

```typescript
if (dirParts.length > 1) {
  return ["other"]; // was: resolveL0Segments(normalized, "bmad-output")
}
```

## Test coverage needed

- [ ] Multi-file nested subdir under `implementation-artifacts/` (e.g. `improvements/`) alongside `{N}-{M}-` story files — assert distinct subgroup labels or merged tree
- [ ] Regression: singleton nested subdir still promotes correctly

## Acceptance sketch (when scheduled)

- [ ] BMAD Output drawer never shows two top-level subgroups with identical labels
- [ ] `tests/output/html/nav-grouping.test.ts` covers the `implementation-artifacts/improvements/` shape
- [ ] ADR-0010 L3 table row for nested subdirs updated to reflect fix

## References

- [ADR-0010](../../../docs/adr/0010-navigation-drawer-categorization-and-grouping.md)
- [Source: src/output/html/nav-grouping.ts — `resolveBmadOutputSegments`, `FOLDER_LABELS`]
