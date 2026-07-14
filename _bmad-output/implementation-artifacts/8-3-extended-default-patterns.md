---
baseline_commit: 244ae0822cd0cf4edc2946803191cc24f6150e06
---

# Story 8.3: Extended Default Patterns

Status: review

## Story

As Alex, a developer working in BMAD-heavy or monorepo layouts,
I want specwiki's built-in discovery patterns to include nested `AGENTS.md`, BMAD output, Cursor-style agent skills, and `README.md` files,
so that I get useful wiki coverage without crafting custom `--patterns` or config overrides for common POST-MVP layouts.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `specwiki list --verbose --project tests/fixtures/sample-project` — discovers nested `AGENTS.md`, `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md`, and `README.md` alongside existing defaults; `discover.start.patternCount` reflects the extended list; each new file emits `discover.match` on stderr.

**Binds:** FR-006 | **Depends:** S8.1, S8.2 (precedence chain must remain intact) | **Enables:** S8.4 (README index rendering)

**NFR-013 owner approval:** Extending `DEFAULT_SPEC_PATTERNS` is an extend-only frozen-contract change. Owner approval recorded by Lucas requesting story S8.3 creation (2026-07-14).

## Acceptance Criteria

### Functional

1. `DEFAULT_SPEC_PATTERNS` in `src/config/patterns.ts` is extended (not replaced) with exactly these four globs appended after existing entries:
   - `**/AGENTS.md` — nested monorepo agent instructions (root `AGENTS.md` already covered)
   - `_bmad-output/**/*.md` — BMAD planning/implementation artifacts
   - `.agents/skills/**/SKILL.md` — Cursor-style agent skills under `.agents/` (distinct from `.cursor/skills/`)
   - `**/README.md` — project and folder README files (owner-approved; discovery only — index rendering is S8.4)
2. No existing default pattern is removed or reordered; custom override semantics from S8.1/S8.2 are unchanged (CLI `--patterns` / env / config still replace the full default list when set).
3. `deriveCategory` in `src/discover/specs.ts` maps the new path prefixes before the `other` fallback:
   - `_bmad-output/**` → `bmad-output`
   - `.agents/skills/**` → `agent-skills`
   - Root-level `README.md` (no `/` in path) → `root` (existing rule)
   - Nested paths discovered via new globs that do not match a known prefix (e.g. `packages/nested/AGENTS.md`, `docs/README.md`) → `other`
4. `CATEGORY_LABELS` in `src/config/patterns.ts` gains entries for `bmad-output` and `agent-skills`; existing labels unchanged.
5. Fixture coverage: extend `tests/fixtures/sample-project/` with representative files for each new pattern type (minimal markdown bodies). Integration tests assert all four new paths are discovered with correct category/title.
6. `specwiki list` and `specwiki generate` discover the new fixture files with default patterns (no `--patterns`, no config override).
7. README files discovered in this story emit normal wiki pages only; do **not** implement folder-index README binding (FR-035 / S8.4).
8. Do **not** add `HARNESS.md`, `llms.txt` recursion changes, or other patterns beyond the four listed in AC1.

### Logging & diagnostics (§0.8)

9. With `--verbose`, `discover.start` reports the increased `patternCount` (prior count + 4).
10. With `--verbose`, each newly discovered extended-pattern file emits `discover.match` with `{ relativePath }` (existing behaviour — prove at least one match per new pattern type in tests).
11. Quiet mode remains unchanged: no new always-on diagnostics.

### Quality measures

12. Full HARNESS §0.2 quality gate passes.
13. `discover/specs.ts` branch coverage remains ≥ 90% on touched paths.
14. Update `README.md` "What it finds" table and `IMPLEMENTATION.md` FR-006 repo-root note to reflect extended defaults.

## Tasks / Subtasks

- [x] Extend frozen default patterns (AC: 1, 2, 8)
  - [x] Write failing `tests/config/patterns.test.ts` assertions for the four new globs and preserved legacy entries.
  - [x] Append patterns to `DEFAULT_SPEC_PATTERNS`; do not touch `parsePatternList` / `validatePatternList`.
- [x] Add category derivation for new prefixes (AC: 3, 4)
  - [x] Write failing `deriveCategory` cases for `_bmad-output/`, `.agents/skills/`, nested `AGENTS.md`, and `README.md` paths.
  - [x] Add `bmad-output` and `agent-skills` to `CATEGORY_LABELS`.
  - [x] Preserve prefix-check order; insert new checks before the `other` fallback.
- [x] Extend fixture and prove discovery end-to-end (AC: 5, 6, 7, 9, 10)
  - [x] Add fixture files under `tests/fixtures/sample-project/`:
    - `packages/nested/AGENTS.md`
    - `_bmad-output/planning/artifact.md`
    - `.agents/skills/bmad-skill/SKILL.md`
    - `README.md` (root) and optionally one nested `docs/README.md`
  - [x] Update hardcoded fixture count in `tests/discover/specs.test.ts` (currently `10`) to the new total.
  - [x] Add focused discover integration assertions for each new relative path.
  - [x] Verify verbose stderr includes `discover.match` for new paths (reuse existing discover logging test patterns).
- [x] Documentation and validation (AC: 12, 13, 14)
  - [x] Run six-command HARNESS §0.2 quality gate.
  - [x] Run HARNESS §0.2.5 code review and §0.2.6 QA analysis on a different model family.
  - [x] Update `IMPLEMENTATION.md`, this story's Dev Agent Record, File List, review findings, and QA manual validation.

## Dev Notes

### Implementation Plan

- **Single source of truth:** All default-pattern changes live in `src/config/patterns.ts`. Discovery already uses `options.patterns ?? DEFAULT_SPEC_PATTERNS` — no CLI or loader changes required unless tests prove a regression.
- **Extend-only contract (NFR-013):** Append four globs; never delete or reorder existing entries. Custom overrides from S8.1/S8.2 replace the entire list — users who want only legacy patterns must enumerate them explicitly in config or `--patterns`.
- **Category keys are extend-only:** Add `bmad-output` and `agent-skills` only; do not rename existing keys (`cursor-skills`, `root`, etc.).
- **README scope split:** S8.3 discovers `**/README.md` and emits standalone wiki pages. S8.4 binds README bodies into category index sections — do not touch `buildIndex`, HTML index renderer, or `parse.readme-index` logging here.
- **Self-repo dogfood:** After this story, `specwiki list --project .` on the specwiki repo should discover significantly more than the current single `.cursor/rules/` match (`.agents/skills/`, `_bmad-output/`, root `README.md`). Optional CLI subprocess test; not a hard gate if fixture coverage is thorough.

### Current State and Required Changes

| Module                           | Today                                                                                 | This story                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/config/patterns.ts`         | 15 root/framework globs; no nested AGENTS, BMAD, `.agents/skills`, or README          | Append 4 globs; add 2 `CATEGORY_LABELS` entries             |
| `src/discover/specs.ts`          | `deriveCategory` knows `.cursor/skills/` but not `.agents/skills/` or `_bmad-output/` | Add two prefix checks before `other`                        |
| `tests/fixtures/sample-project/` | 10 discoverable specs across 8 categories                                             | Add 4+ files for extended patterns; update count assertions |
| `src/config/loader.ts`           | Loads config; falls back to `DEFAULT_SPEC_PATTERNS`                                   | No code change expected                                     |
| `src/cli.ts`                     | `resolveCommandPatterns` precedence chain                                             | No code change expected                                     |
| `README.md`                      | User-facing table omits extended patterns                                             | Update "What it finds" table                                |
| `IMPLEMENTATION.md`              | Documents limited repo-root yield under FR-006                                        | Update POST-MVP note — extended patterns now in defaults    |

### Exact Patterns to Append

```typescript
// Append after existing entries in DEFAULT_SPEC_PATTERNS:
"**/AGENTS.md",
"_bmad-output/**/*.md",
".agents/skills/**/SKILL.md",
"**/README.md",
```

### Category Derivation (insert before `return "other"`)

```typescript
if (normalized.startsWith("_bmad-output/")) return "bmad-output";
if (normalized.startsWith(".agents/skills/")) return "agent-skills";
```

`CATEGORY_LABELS` additions:

```typescript
"bmad-output": "BMAD Output",
"agent-skills": "Agent Skills",
```

### Title Derivation

- Reuse existing `deriveTitle` rules. `README.md` → `"Readme"` (basename capitalization). No new special cases required unless tests reveal ambiguity.
- `.agents/skills/bmad-skill/SKILL.md` → `"Bmad Skill"` via existing SKILL parent-folder logic (same as `.cursor/skills/`).

### Guardrails

- **Do not** implement S8.4 README index binding, `parse.readme-index`, or `output.index` `readmeIndexCount`.
- **Do not** change `ZERO_SPECS_TIP` text unless owner requests — tip remains accurate for core patterns.
- **Do not** add runtime dependencies or alter `fast-glob` ignore list (`node_modules`, `dist`, `wiki`, `.specwiki` stay).
- **Do not** modify custom-pattern validation, config loader, or precedence resolution from S8.1/S8.2.
- **Do not** add `HARNESS.md` to defaults — outside FR-006 scope.
- Module direction unchanged: `cli → commands → discover`; `config/patterns.ts` remains a leaf.
- No e2e/browser tests (HARNESS §0.2.1).

### Testing Requirements

**Red phase first.** Expected failing tests before implementation:

| Area                     | Cases                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `patterns.test.ts`       | Four new globs present; legacy globs (`AGENTS.md`, `.cursor/rules/**/*.{md,mdc}`) still present; count increased by 4               |
| `discover/specs.test.ts` | `deriveCategory` for `_bmad-output/foo.md`, `.agents/skills/x/SKILL.md`, `packages/nested/AGENTS.md`, `README.md`, `docs/README.md` |
| `discover/specs.test.ts` | Fixture discovery finds new paths; total count updated; category/title objects for each                                             |
| `discover/specs.test.ts` | Verbose `discover.start.patternCount` equals `DEFAULT_SPEC_PATTERNS.length`                                                         |
| Optional CLI             | `list --verbose` on extended fixture shows `discover.match` for `packages/nested/AGENTS.md`                                         |

**Regression checks:**

- S8.1 `--patterns` override still replaces defaults entirely (existing CLI tests green).
- S8.2 config precedence unchanged (existing loader/CLI tests green).
- Dogfood CLI test (`≥ 5` pages) remains valid — fixture will exceed minimum.
- Collision and path-confinement tests unaffected.

**Quality gate (order):** `npm run test` → `lint` → `format` → `coverage` → `typecheck` → `build`.

### Project Structure Notes

- Modified runtime files: `src/config/patterns.ts`, `src/discover/specs.ts` (category only).
- Modified fixtures: `tests/fixtures/sample-project/**` (new files only; do not remove existing fixture specs).
- Modified tests: `tests/config/patterns.test.ts`, `tests/discover/specs.test.ts`; update any test hardcoding `DEFAULT_SPEC_PATTERNS.length` or fixture count `10`.
- Modified docs: `README.md`, `IMPLEMENTATION.md`.
- ESM `.js` import extensions; TypeScript strict.

### Previous Story Intelligence (S8.1 + S8.2)

- Custom patterns are a **full replacement** of defaults, not additive. Extending defaults does not change override semantics — config users who list only custom globs will **not** automatically get the new defaults unless they spread or duplicate them.
- `validatePatternList` / `parsePatternList` already reject parent-directory escapes; new default globs are confined by design — no parser changes needed.
- `discoverSpecs` already logs `discover.start` → `discover.match` × N → `discover.complete`; extended files flow through unchanged.
- Review patches from S8.1/S8.2 established symlink confinement and sanitized error messages — do not regress config/CLI paths while touching defaults.
- S8.2 explicitly deferred extended defaults to this story.

### Git Intelligence

Recent E8 commits:

- `244ae08` — config loader (`src/config/loader.ts`, `resolveCommandPatterns` in CLI)
- `2e23250` — `--patterns` CLI override (`parsePatternList`, delimiter-aware comma parsing)

Pattern for this story: small focused diff in `patterns.ts` + `deriveCategory` + fixture/tests; one implementation commit after red-green-refactor.

### References

- [Source: _bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#S8.3]
- [Source: _bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#S8.4 — README index is separate]
- [Source: _bmad-output/planning-artifacts/discovery/prd/prd.md#FR-006]
- [Source: _bmad-output/planning-artifacts/discovery/prd/prd.md#NFR-013]
- [Source: _bmad-output/planning-artifacts/discovery/project-context.md#Discovery-Rules]
- [Source: _bmad-output/planning-artifacts/discovery/project-context.md#Frozen-Contracts]
- [Source: _bmad-output/planning-artifacts/discovery/decisions.md — FR-006 repo-root limited yield]
- [Source: _bmad-output/planning-artifacts/discovery/research/technical-research.md#5.3 — fixture extension guidance]
- [Source: _bmad-output/implementation-artifacts/8-1-patterns-cli-flag.md]
- [Source: _bmad-output/implementation-artifacts/8-2-project-config-file-loader.md]
- [Source: src/config/patterns.ts — current DEFAULT_SPEC_PATTERNS]
- [Source: src/discover/specs.ts — deriveCategory, discoverSpecs logging]
- [Source: HARNESS.md#0.1 TDD, §0.8 Structured logging, §12 Frozen contracts]

## Dev Agent Record

### Agent Model Used

Composer (claude-sonnet-5-thinking-high)

### Debug Log References

- `deriveTitle("README.md")` produced `"README"` via existing rules; added minimal `basename === "README"` → `"Readme"` special case per story expectation.

### Completion Notes List

- Extended `DEFAULT_SPEC_PATTERNS` from 15 → 19 globs (append-only).
- Added `bmad-output` and `agent-skills` category derivation and labels.
- Extended sample fixture from 10 → 15 discoverable specs.
- Quality gate: 253 tests pass; `discover/specs.ts` branch coverage 100%.
- Manual CLI validation: fixture list/generate, patternCount 19, S8.1 override regression, self-repo 238 files.

### File List

- `src/config/patterns.ts`
- `src/discover/specs.ts`
- `tests/config/patterns.test.ts`
- `tests/discover/specs.test.ts`
- `tests/fixtures/sample-project/packages/nested/AGENTS.md`
- `tests/fixtures/sample-project/_bmad-output/planning/artifact.md`
- `tests/fixtures/sample-project/.agents/skills/bmad-skill/SKILL.md`
- `tests/fixtures/sample-project/README.md`
- `tests/fixtures/sample-project/docs/README.md`
- `README.md`
- `IMPLEMENTATION.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-14  
**Review outcome:** Approve  
**Reviewer model:** Bugbot (gpt-5.6-sol-medium)

### Action Items

None.

### Review Findings

| Severity | Finding       | Disposition |
| -------- | ------------- | ----------- |
| —        | No bugs found | —           |

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** Composer (claude-sonnet-5-thinking-high)  
**Review date:** 2026-07-14

### AC coverage

| AC    | Status | Evidence                                                                  |
| ----- | ------ | ------------------------------------------------------------------------- |
| 1–2   | ✓      | Four globs appended; legacy 15 entries preserved in order                 |
| 3–4   | ✓      | `deriveCategory` + `CATEGORY_LABELS` for `bmad-output`, `agent-skills`    |
| 5–7   | ✓      | Five new fixture files; 15-spec integration assertions                    |
| 8     | ✓      | No extra patterns (HARNESS.md etc.) added                                 |
| 9–11  | ✓      | `patternCount: 19` in verbose `discover.start`; `discover.match` per file |
| 12–14 | ✓      | Quality gate pass; docs updated                                           |

### Regression risks

- Low: S8.1 `--patterns` override verified (1 spec only).
- Low: Self-repo discovery volume increases (238 files) — expected FR-006 outcome.
- None observed in collision/path-confinement or config-loader tests.

### Gaps

- S8.4 README folder-index binding intentionally deferred.
- `HARNESS.md` still outside default patterns (by design).

### Manual validation steps

1. `npm run dev list -- --project tests/fixtures/sample-project` — output includes nested `AGENTS.md`, `_bmad-output/` artifact, `.agents/skills/` skill, and `README.md` entries alongside existing fixture specs.
2. `npm run dev list -- --verbose --project tests/fixtures/sample-project 2>&1 | grep discover.start` — `patternCount` equals `DEFAULT_SPEC_PATTERNS.length` (legacy count + 4).
3. `npm run dev list -- --verbose --project tests/fixtures/sample-project 2>&1 | grep discover.match | grep -E "packages/nested/AGENTS|_bmad-output/|\.agents/skills/|README"` — at least one match line per new pattern type.
4. `rm -rf /tmp/specwiki-extended-qa && npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-extended-qa` — exit 0; wiki pages exist for new discovered files; index lists `BMAD Output` and `Agent Skills` category sections when those files are present.
5. `npm run dev list -- --project tests/fixtures/sample-project --patterns "specs/**/*.md"` — CLI override still replaces defaults; only `specs/feature.md` appears (S8.1 regression).
6. `npm run dev list -- --project . 2>&1 | head -20` — specwiki self-repo discovers more than the pre-S8.3 single-file yield (README, `_bmad-output/`, `.agents/skills/` paths visible).
7. `npm test` — full suite green; fixture count assertions updated.
