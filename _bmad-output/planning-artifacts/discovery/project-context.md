---
project_name: specwiki
user_name: Lucas
date: '2026-07-12'
sections_completed:
  - technology_stack
  - critical_implementation_rules
  - brownfield_status
  - frozen_contracts
existing_patterns_found: 12
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Technology | Version / constraint |
| ----- | ---------- | -------------------- |
| Runtime | Node.js | ≥ 20 (`engines.node`) |
| Language | TypeScript | 5.8.x, strict mode |
| Module system | ESM | `"type": "module"`; imports use `.js` extension |
| CLI framework | Commander | ^13.1.0 |
| Glob discovery | fast-glob | ^3.3.3 |
| Frontmatter | gray-matter | ^4.0.3 |
| Markdown → HTML | marked | ^15.0.7 |
| Terminal output | chalk | ^5.4.1 |
| Test runner | Vitest | ^3.0.9 with @vitest/coverage-v8 |
| Lint / format | ESLint 9 + Prettier 3 | Flat config (`eslint.config.js`) |
| Dev runner | tsx | ^4.19.3 (`npm run dev`) |
| Build | tsc | Output to `dist/`; bin entry `dist/cli.js` |

**Scripts (quality gate):** `test`, `coverage`, `lint`, `format`, `typecheck`, `build`

---

## Brownfield Status (v0.1.0 scaffold)

**Implemented and working:**

- `specwiki list` and `specwiki generate` commands (`src/cli.ts`, `src/commands/generate.ts`)
- Discovery module with category/title derivation (`src/discover/specs.ts`)
- Markdown parsing with frontmatter and section extraction (`src/parse/markdown.ts`)
- Wiki output: markdown pages, categorized index, HTML subtree (`src/output/wiki.ts`)
- Default glob patterns and category labels (`src/config/patterns.ts`)
- Test suite: 15 tests across 5 files; ~99% line coverage (thresholds 90%)
- Vitest config with coverage thresholds; ESLint + Prettier configured

**Still open (HARNESS §4, §11 — verify before planning):**

| Gap | Status |
| --- | ------ |
| `IMPLEMENTATION.md` build log | **Missing** — create in Phase 0 |
| Structured logger (`src/core/Logger.ts`) | **Missing** — verbose uses raw `console.log` |
| Slug collision handling | **Missing** — duplicate paths → identical slugs |
| Custom patterns / `--config` | **Missing** — patterns hard-coded in `DEFAULT_SPEC_PATTERNS` |
| Path traversal safety on `--output` | **Verify** — must not write outside resolved output dir (§0.9) |

**HARNESS §4 "Known gaps" is partially stale:** tests, Vitest, lint, and format tooling now exist. Cross-check HARNESS before treating "no tests" as true.

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript / ESM)

- Use **strict TypeScript**; run `npm run typecheck` before committing.
- ESM imports: always include `.js` extension in relative imports (e.g. `from "./specs.js"`).
- `src/types.ts` holds shared interfaces — extend here before duplicating types.
- `src/cli.ts` is thin Commander wiring; excluded from coverage — document manual test steps in comments if behaviour changes.
- Prefer `async/await` over raw Promise chains; use `node:fs/promises`, `node:path`.

### Module Boundaries

```
src/
  cli.ts           # Entry point — Commander only
  commands/        # Orchestration (generate, list)
  discover/        # Glob scan, category/title derivation
  parse/           # Frontmatter, sections, markdown render
  output/          # Wiki build, file write, HTML wrap
  config/          # DEFAULT_SPEC_PATTERNS, CATEGORY_LABELS
  types.ts         # Shared interfaces
```

Do not add runtime dependencies without justification (HARNESS §12).

### Discovery Rules

- Patterns come from `DEFAULT_SPEC_PATTERNS` in `src/config/patterns.ts` — **extend only, do not remove** without explicit approval.
- `fast-glob` ignores: `node_modules`, `dist`, `wiki`, `.specwiki`.
- Category derivation is prefix-based (`deriveCategory`) — order of checks matters; test all path prefixes.
- Title derivation (`deriveTitle`): special cases for `SKILL`, `AGENTS`, `SPEC`, `CLAUDE`, `GEMINI` basenames.
- Results sorted by category then `relativePath`.

### Parsing Rules

- `gray-matter` extracts frontmatter; `title` frontmatter overrides derived title.
- Section anchors use `slugify` (lowercase, strip non-word, spaces → hyphens).
- `extractDescription` takes first non-heading paragraph, max 300 chars.
- `renderMarkdown` uses `marked.parse` with `{ async: false }`.

### Output Rules

- **Wiki layout (frozen):** `wiki/index.md`, `wiki/{slug}.md`, `wiki/html/index.html`, `wiki/html/{slug}.html`
- Slug: relative path → lowercase, `/` → `-`, strip `.md`/`.mdc`/`.txt` extension.
- Index groups by category using `CATEGORY_LABELS` (sorted by label).
- Each page: title, source path blockquote, optional description, TOC from sections, raw content.
- HTML: `wrapHtml` must **escape title** via `escapeHtml` (§12 frozen contract).
- Writes only under resolved `path.resolve(projectRoot, outputDir)` — never escape output directory.

### Testing Rules

- **TDD:** Red → Green → Refactor for every logic change (HARNESS §0.1).
- Test files mirror `src/` under `tests/`; fixtures in `tests/fixtures/sample-project/`.
- Coverage thresholds: 90% lines/functions/branches/statements (enforced in `vitest.config.ts`).
- Excluded from coverage: `src/cli.ts`, `tests/**`, config files.
- HTML tests: verify structure and escaping intent, not pixel equality.
- Run full quality gate after every task: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Code Quality & Style

- Minimal comments — only where logic is genuinely hard to follow (HARNESS §0.6).
- Small focused diffs; match existing naming (camelCase functions, kebab-case test files).
- No dead code or drive-by refactors.
- Prettier check via `npm run format`; write via `npm run format:write`.

### Development Workflow (implementation loop)

- **Vertical slices + INVEST (HARNESS §0.10)** — stories deliver thin end-to-end user value
- **Logging woven in (HARNESS §0.8)** — every story AC includes diagnostics; no logging epic
- **One story = one §0.3 checkpoint** — epics are user journeys (List, Generate MD, Generate HTML, etc.)
- **One bullet = one task = one commit** (HARNESS §9) — discovery loop overrides checkpoints with subagent escalation.
- Update `IMPLEMENTATION.md` build log after each implementation task (when file exists).
- Do not run e2e/browser tests unless owner explicitly requests (HARNESS §0.2.1).

### Security Rules (§0.9)

- Treat `--project` and `--output` as untrusted paths; resolve and validate before I/O.
- Never write outside the resolved output directory.
- Never log secrets or full file contents in verbose mode.
- HTML output must escape user-derived titles and content appropriately.

### Critical Don't-Miss Rules

1. **Do not change frozen contracts** (§12): default globs, wiki layout, category rules, HTML title escaping.
2. **Slug collisions** are a known bug — different paths can produce identical slugs; fix in Phase 3.4 style work.
3. **Branch coverage** in `discover/specs.ts` (87.5%) and `output/wiki.ts` (82.6%) — add tests when touching those modules.
4. **`types.ts` shows 0% coverage** — interface-only file; expected exclusion behaviour.
5. **Verbose logging is not structured** — replacing with `Logger.ts` is MVP Phase 3 work, not optional polish.

---

## Frozen Contracts (do not change without POST-MVP rationale)

- `DEFAULT_SPEC_PATTERNS` glob list
- Wiki output directory layout
- `CATEGORY_LABELS` map and category derivation prefix rules
- `escapeHtml` in `wrapHtml` for HTML titles
- Gitignore entries for `wiki/`, `dist/`, `node_modules/`

---

## Extension Points (POST-MVP)

- `--config` or `--patterns` for custom glob overrides (HARNESS Phase 4.1)
- npm publish + CI workflow (Phase 4.2–4.3)
- Watch mode, plugins — not in current codebase
