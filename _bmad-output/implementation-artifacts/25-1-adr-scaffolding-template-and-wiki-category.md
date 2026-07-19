---
baseline_commit: e4a607d
---

# Story 25.1: ADR Scaffolding, Template, and Wiki Category

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a contributor documenting architecture,
I want a standard ADR folder, template, and index,
so that every decision follows the same structure and appears in the generated wiki.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** After scaffold — `docs/adr/index.md` lists ADRs; `npm run dev generate -- --project . --output /tmp/specwiki-adr25` includes an **Architecture Decisions** category with at least the index page.

**Binds:** Epic 25 owner decisions (location, numbering, status vocabulary) | **Depends:** — (first story in E25) | **Enables:** S25.2, S25.3, S25.4, S25.5 | **Epic:** E25

## Acceptance Criteria

### Functional

1. Create `docs/adr/` with **`index.md`** containing:
   - Purpose of the ADR practice for specwiki (durable engineering record, complements `ARCHITECTURE-SPINE.md`)
   - Status lifecycle: `proposed → accepted → deprecated → superseded by ADR-NNNN`
   - Authoring norms: 4-digit zero-padded filenames (`0001-kebab-title.md`), one decision per file, never reuse IDs
   - When to write an ADR vs update the spine (spine = invariant summary; ADR = rationale, alternatives, consequences)
   - ADR index table with column headers (ID, Title, Status, Date) and a placeholder row or empty-state note — **no numbered ADR files yet** (those land in S25.2/S25.3)
   - Relative link to `template.md` and to `_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md`

2. Create **`docs/adr/template.md`** — MADR skeleton with these sections (headings only + brief placeholder guidance, not filled decision content):
   - `# ADR-NNNN: [Short title]`
   - **Status** (proposed | accepted | deprecated | superseded by ADR-NNNN)
   - **Date**
   - **Context**
   - **Decision**
   - **Consequences** (positive, negative, neutral)
   - **References** (file paths, spine IDs, related ADRs)

3. **`deriveCategory`** in `src/discover/specs.ts` maps `docs/adr/**` → category key `adr` **before** the `other` fallback. Prefix check must not steal paths from existing rules (`docs/specs/`, `docs/plans/`).

4. **`CATEGORY_LABELS`** in `src/config/patterns.ts` gains exactly one extend-only entry:

   ```typescript
   adr: "Architecture Decisions",
   ```

   Existing labels unchanged (AD-2 frozen contract).

5. **`CATEGORY_PATH_PREFIXES`** in `src/output/html/nav-grouping.ts` gains `adr: "docs/adr/"` for nav parity with `docs-specs` and `plans` (extend-only; no subgroup logic changes).

6. **`npm run dev generate -- --project . --output /tmp/specwiki-adr25`** on the specwiki repo discovers `docs/adr/index.md` (and `template.md`) under category **Architecture Decisions** on the HTML Main Page portal and in markdown index grouping.

7. **Out of scope for S25.1:**
   - No numbered ADR files (`0001-…md` through `0012-…md`) — S25.2/S25.3
   - No `ARCHITECTURE-SPINE.md` edits — S25.4
   - No `DEFAULT_SPEC_PATTERNS` changes — `**/*.{md,mdc}` already discovers `docs/adr/**/*.md`
   - No E11/E12 epic file cross-links — S25.5

### Logging & diagnostics (§0.8)

8. N/A for new log events — category derivation is silent. Existing `discover.match` verbose output covers new paths automatically.

### Quality measures

9. Full HARNESS §0.2 quality gate passes (touches `src/`).
10. `tests/discover/specs.test.ts` — `deriveCategory("docs/adr/index.md")` → `"adr"`; prefix-order regression cases preserved.
11. `tests/config/patterns.test.ts` — `CATEGORY_LABELS.adr === "Architecture Decisions"`.
12. `IMPLEMENTATION.md` build log updated with S25.1 row.

## Tasks / Subtasks

- [x] Read epic owner decisions and current `deriveCategory` / `CATEGORY_LABELS` before editing (AC: 3, 4)
  - [x] Confirm `docs/adr/` does not exist yet; no duplicate scaffold
- [x] Create `docs/adr/index.md` (AC: 1)
  - [x] Purpose, status flow, authoring norms, empty index table, spine link
- [x] Create `docs/adr/template.md` (AC: 2)
  - [x] MADR skeleton sections with placeholder guidance only
- [x] Extend category discovery (AC: 3, 4, 5)
  - [x] Write failing `deriveCategory` test for `docs/adr/index.md`
  - [x] Add `if (normalized.startsWith("docs/adr/")) return "adr";` before `other` fallback
  - [x] Add `adr: "Architecture Decisions"` to `CATEGORY_LABELS`
  - [x] Add `adr: "docs/adr/"` to `CATEGORY_PATH_PREFIXES`
  - [x] Write failing `patterns.test.ts` assertion for new label
- [x] Prove wiki grouping end-to-end (AC: 6)
  - [x] Generate on repo root; confirm **Architecture Decisions** category appears with index page
- [x] Documentation and validation (AC: 9–12)
  - [x] Run full HARNESS §0.2 quality gate
  - [x] Update `IMPLEMENTATION.md` build log

## Dev Notes

**Primary deliverables:** `docs/adr/index.md`, `docs/adr/template.md`  
**Code touch (minimal):** `src/discover/specs.ts`, `src/config/patterns.ts`, `src/output/html/nav-grouping.ts`, tests  
**Do not create:** numbered ADR content files, spine edits, README/CONTRIBUTING ADR policy (epic open item)

Epic 25 is **documentation-first**. S25.1 is the only story that touches product code — and only for wiki category discovery (extend-only frozen contracts per AD-2 / NFR-013).

### Critical: CATEGORY_LABELS alone is insufficient

The epic outline mentions `CATEGORY_LABELS` only. **`deriveCategory` must also map `docs/adr/` → `adr`** or ADR pages fall through to `"other"` and the demo path fails. Follow the S8.3 pattern: prefix check + label entry together.

### Current state (@ `e4a607d`)

| Module                   | Today                                                                            | S25.1 change                        |
| ------------------------ | -------------------------------------------------------------------------------- | ----------------------------------- |
| `docs/adr/`              | **Missing**                                                                      | Create `index.md` + `template.md`   |
| `deriveCategory`         | `docs/specs/` → `docs-specs`, `docs/plans/` → `plans`; `docs/adr/` → **`other`** | Add `docs/adr/` → `adr`             |
| `CATEGORY_LABELS`        | No `adr` key                                                                     | Add `adr: "Architecture Decisions"` |
| `CATEGORY_PATH_PREFIXES` | Has `docs-specs`, `plans`; no `adr`                                              | Add `adr: "docs/adr/"`              |
| `DEFAULT_SPEC_PATTERNS`  | Catch-all `**/*.{md,mdc}` discovers ADR paths                                    | **No change**                       |

### Exact code changes

**`src/discover/specs.ts`** — insert before `return "other"` (after `docs/plans/` check):

```typescript
if (normalized.startsWith("docs/adr/")) return "adr";
```

**`src/config/patterns.ts`** — append to `CATEGORY_LABELS`:

```typescript
adr: "Architecture Decisions",
```

**`src/output/html/nav-grouping.ts`** — append to `CATEGORY_PATH_PREFIXES`:

```typescript
adr: "docs/adr/",
```

### Suggested `docs/adr/index.md` outline

```markdown
# Architecture Decision Records

Brief purpose paragraph — durable decisions in `docs/adr/`; spine stays the invariant summary.

## Status lifecycle

proposed → accepted → deprecated → superseded by ADR-NNNN

## Authoring norms

- Filename: `NNNN-kebab-title.md` (4-digit, zero-padded; never reuse IDs)
- One architectural decision per file
- Write an ADR when a choice supersedes spine text or needs rationale/alternatives
- Update spine with a one-line supersession link in S25.4 — do not duplicate full ADR text in spine

## Index

| ID                              | Title | Status | Date |
| ------------------------------- | ----- | ------ | ---- |
| _No ADRs yet — see S25.2/S25.3_ |       |        |      |

## Template

Use [template.md](./template.md) when authoring a new ADR.

## Related

- [ARCHITECTURE-SPINE.md](../../_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md)
```

Adjust prose for clarity; keep table structure.

### Suggested `docs/adr/template.md` outline

```markdown
# ADR-NNNN: [Short title of decision]

## Status

proposed

## Date

YYYY-MM-DD

## Context

What is the issue or forcing function? Reference real modules and spine IDs.

## Decision

What is the change that we're proposing or have agreed to implement?

## Consequences

### Positive

- …

### Negative

- …

### Neutral

- …

## References

- [Source: path/to/module.ts]
- [Source: ARCHITECTURE-SPINE.md#AD-N]
- Related: ADR-NNNN (if any)
```

### Scope boundary (critical)

- **Do not** write ADR-0001 through ADR-0012 — S25.2, S25.3, S25.5
- **Do not** edit `ARCHITECTURE-SPINE.md` — S25.4
- **Do not** add `docs/adr/**/*.md` to `DEFAULT_SPEC_PATTERNS` — redundant with catch-all
- **Do not** rename or reorder existing `CATEGORY_LABELS` keys
- **Do not** change `deriveTitle` — `index.md` → "Index", `template.md` → "Template" via existing rules
- `template.md` **will** appear in the wiki — acceptable; it documents the authoring skeleton

### Testing requirements

**Red phase first.** Expected failing tests before implementation:

| Area                     | Cases                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discover/specs.test.ts` | `deriveCategory("docs/adr/index.md")` → `"adr"`; `deriveCategory("docs/adr/template.md")` → `"adr"`; prefix order: `docs/specs/` and `docs/plans/` unchanged |
| `patterns.test.ts`       | `CATEGORY_LABELS.adr === "Architecture Decisions"`                                                                                                           |
| Optional integration     | `generate` on repo root output contains category label "Architecture Decisions" (grep HTML or markdown index)                                                |

No fixture changes strictly required — scaffold lives in repo `docs/adr/`. If tests use `tests/fixtures/sample-project/` only, add minimal `docs/adr/index.md` there **or** assert against repo-root generate in an existing integration test pattern.

### Verification commands

```bash
npm test -- tests/discover/specs.test.ts -t "deriveCategory"
npm test -- tests/config/patterns.test.ts -t "maps categories"
npm run dev generate -- --project . --output /tmp/specwiki-adr25
rg -n "Architecture Decisions" /tmp/specwiki-adr25/html/index.html
rg -n "docs/adr/index" /tmp/specwiki-adr25/index.md
npm test && npm run coverage && npm run lint && npm run format && npm run typecheck && npm run build
```

### Project structure notes

```
docs/adr/
  index.md              # PRIMARY — ADR practice entry point
  template.md           # MADR skeleton for authors
src/discover/specs.ts   # deriveCategory prefix
src/config/patterns.ts  # CATEGORY_LABELS extend-only
src/output/html/nav-grouping.ts  # CATEGORY_PATH_PREFIXES parity
tests/discover/specs.test.ts
tests/config/patterns.test.ts
IMPLEMENTATION.md       # Build log row
```

### Epic 25 cross-story context (do not implement here)

| Story | Delivers                                       |
| ----- | ---------------------------------------------- |
| S25.2 | Foundational ADRs 0001, 0003, 0004, 0007, 0009 |
| S25.3 | Retroactive ADRs 0002, 0005, 0006, 0008, 0010  |
| S25.4 | Spine sync; AD-6/AD-11 superseded links        |
| S25.5 | Pre-build ADRs 0011, 0012 for E11/E12          |

S25.1 index table will be populated by S25.2/S25.3 — leave placeholder now.

### Owner decisions (locked — do not relitigate)

| Topic      | Decision                                                    |
| ---------- | ----------------------------------------------------------- |
| Location   | `docs/adr/` — not `_bmad-output/`                           |
| Numbering  | `0001-kebab-title.md`; never reuse IDs                      |
| Status     | `proposed → accepted → deprecated → superseded by ADR-NNNN` |
| Spine      | Invariant summary; ADRs hold rationale                      |
| Wiki label | **Architecture Decisions**                                  |

### References

- [Source: _bmad-output/implementation-artifacts/epic-25-architecture-decision-records.md#S25.1]
- [Source: _bmad-output/implementation-artifacts/epic-25-context.md]
- [Source: _bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md — AD-2, AD-3, AD-4]
- [Source: _bmad-output/implementation-artifacts/8-3-extended-default-patterns.md — deriveCategory + CATEGORY_LABELS pattern]
- [Source: src/discover/specs.ts — deriveCategory]
- [Source: src/config/patterns.ts — CATEGORY_LABELS]
- [Source: src/output/html/nav-grouping.ts — CATEGORY_PATH_PREFIXES]

### Git intelligence

Recent relevant commits:

- `e4a607d` — config file scan `*.md` in root (unrelated; baseline)
- `5b139c9` — E24 release; typography epic closed
- `50581c2` — S24.2 chrome tokens

No prior ADR scaffold exists. First story in epic — no previous-story intelligence.

## Dev Agent Record

### Agent Model Used

Composer

### Debug Log References

- E2E generate verified with project-root output (`.tmp-specwiki-adr25`) due to S21.1 output confinement; `/tmp/` rejected as expected.

### Completion Notes List

- Created `docs/adr/index.md` with purpose, status lifecycle, authoring norms, empty index table, template link, and spine link.
- Created `docs/adr/template.md` MADR skeleton with placeholder guidance only.
- Extended `deriveCategory`, `CATEGORY_LABELS`, and `CATEGORY_PATH_PREFIXES` for `adr` / Architecture Decisions (extend-only, AD-2 compliant).
- Added unit tests for category mapping and label; 520 tests pass; coverage 95.5%.
- Verified wiki generate shows Architecture Decisions category with index and template pages on HTML portal and markdown index.

### File List

- docs/adr/index.md (added)
- docs/adr/template.md (added)
- src/discover/specs.ts (modified)
- src/config/patterns.ts (modified)
- src/output/html/nav-grouping.ts (modified)
- tests/discover/specs.test.ts (modified)
- tests/config/patterns.test.ts (modified)
- IMPLEMENTATION.md (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)

### Change Log

- 2026-07-18 — S25.1 ADR scaffolding, template, and wiki category discovery (Composer)
- 2026-07-19 — Owner sign-off; story → done.

## Senior Developer Review (AI)

**Review date:** 2026-07-18  
**Review outcome:** Approve  
**Reviewer model:** Bugbot

### Action Items

- [ ] None

### Review Findings

Bugbot found no bugs on uncommitted S25.1 changes.

## QA Manual Validation

**QA model:** Composer  
**Review date:** 2026-07-18

### AC coverage

| AC   | Status | Notes                                                   |
| ---- | ------ | ------------------------------------------------------- |
| 1    | ✓      | index.md with purpose, lifecycle, norms, table, links   |
| 2    | ✓      | template.md MADR skeleton                               |
| 3    | ✓      | deriveCategory maps docs/adr/ → adr                     |
| 4    | ✓      | CATEGORY_LABELS.adr added extend-only                   |
| 5    | ✓      | CATEGORY_PATH_PREFIXES.adr added                        |
| 6    | ✓      | Generate shows Architecture Decisions with index        |
| 7    | ✓      | No numbered ADRs, spine edits, or pattern changes       |
| 8    | N/A    | No new log events                                       |
| 9–12 | ✓      | Quality gate green; tests and IMPLEMENTATION.md updated |

### Regression risks

- Low — extend-only category contract; existing docs/specs and docs/plans prefix order preserved by tests.
- `template.md` appears in wiki (expected per story scope).

### Gaps

- None identified for S25.1 scope.

### Manual validation steps

1. `ls docs/adr/` — `index.md` and `template.md` exist; no `0001-*.md` files yet.
2. `rg -n "Architecture Decisions|proposed → accepted" docs/adr/index.md` — authoring norms and lifecycle documented.
3. `npm test -- tests/discover/specs.test.ts -t "docs/adr"` — category maps to `adr`.
4. `npm run dev generate -- --project . --output .tmp-specwiki-adr25` — succeeds (project-root output required per S21.1).
5. `rg -n "Architecture Decisions" .tmp-specwiki-adr25/html/index.html` — category appears on Main Page portal.
6. `rg -n "docs/adr/index" .tmp-specwiki-adr25/index.md` — index page linked under Architecture Decisions.
7. Full quality gate — all six commands pass.
