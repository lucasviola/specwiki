# specwiki — Technical Research

**Date:** 2026-07-12  
**Author:** Discovery loop (CLI/Node.js architect subagent)  
**Status:** Complete  
**Scope:** Brownfield v0.1 scaffold; MVP + POST-MVP architecture inputs

---

## Executive Summary

specwiki occupies a narrow but growing niche: **read-only aggregation of AI-facing specification artifacts** scattered across a repository into a single, browsable wiki. The v0.1 scaffold already implements the core loop — glob discovery → markdown parse → static wiki output — with 15 tests and ~99% coverage. The landscape is fragmented: AGENTS.md is becoming an open standard (AAIF-stewarded), Cursor rules/skills use YAML frontmatter with activation semantics, OpenSpec and BMAD use structured folder conventions, and llms.txt provides an agent-oriented index format. No direct competitor does exactly what specwiki does; adjacent tools either **generate** agent context (Dewey, Ruler, agents-md) or **host** documentation (Docusaurus, VitePress, MkDocs).

**Key findings:**

1. **Format heterogeneity is the product problem.** specwiki should treat all inputs as markdown-with-optional-frontmatter, enrich metadata from path conventions, and defer semantic parsing of framework-specific structures (OpenSpec deltas, BMAD kernels) to POST-MVP.
2. **Static output is sufficient for MVP.** The brownfield already emits `wiki/index.md`, per-spec pages, and `wiki/html/*.html`. A bundled dev server adds dependency weight, security surface, and scope creep without unlocking the core value proposition.
3. **CLI UX should follow ripgrep/TypeDoc patterns:** fast default path, `--verbose` for diagnostics, exit code 0 on empty discovery (with helpful tip), `--json` POST-MVP, configuration via `specwiki.config.{js,json}` POST-MVP.
4. **Keep marked + gray-matter for MVP;** add `rehype-sanitize` only if raw HTML passthrough is enabled POST-MVP. Current `escapeHtml` on titles is correct; body content via `marked` is acceptable for trusted local spec files.
5. **Highest-value POST-MVP extensions:** `llms.txt` export, nested `AGENTS.md` discovery, `--config` pattern overrides, slug collision fix (already planned Phase 3.4), watch mode, and optional `specwiki serve`.

---

## 1. Spec File Format Landscape

### 1.1 Taxonomy

AI spec artifacts fall into four families that specwiki must handle:

| Family | Examples | Structure | Agent consumption |
| ------ | -------- | --------- | ----------------- |
| **Root instruction files** | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `llms.txt` | Plain markdown; optional YAML frontmatter | Loaded by agent at session start; nearest-wins in monorepos |
| **IDE rule/skill files** | `.cursor/rules/*.mdc`, `.cursor/skills/**/SKILL.md` | YAML frontmatter + markdown body; activation metadata | Scoped by globs, description relevance, or manual @-mention |
| **Spec-driven dev trees** | `specs/`, `openspec/`, `.kiro/specs/`, `requirements/` | Folder conventions + structured headings | Read by agents during planning/implementation phases |
| **Framework output artifacts** | `_bmad-output/**/SPEC.md`, `_bmad-output/planning-artifacts/**` | Kernel + companions + memlogs | Machine contracts for downstream agent skills |

specwiki's current `DEFAULT_SPEC_PATTERNS` in `src/config/patterns.ts` covers families 1–3 well. Family 4 (BMAD `_bmad-output/`) is **not yet discovered** — a deliberate gap worth addressing POST-MVP.

### 1.2 AGENTS.md (open standard)

**Source:** [agents.md](https://agents.md/) — stewarded by the Agentic AI Foundation (AAIF), donated by OpenAI alongside MCP.

**Format characteristics:**

- Plain markdown; no required schema
- Placed at repo root; **nested AGENTS.md** supported in monorepos (nearest file wins)
- Typical sections: build commands, test instructions, code style, security, PR conventions
- Optional YAML frontmatter per [MDA frontmatter-agents-md schema](https://github.com/sno-ai/mda/blob/main/spec/v1.0/06-targets/agents-md.md): `name`, `description`, `license`, `compatibility`, `metadata`
- Vendor-agnostic: Cursor, Codex, Jules, Factory, Amp, and others read it natively

**specwiki implications:**

- Already discovered via `"AGENTS.md"` pattern; title derived as "Agent Instructions"
- **Gap:** nested `**/AGENTS.md` not in default patterns — monorepos with 88+ AGENTS.md files (per OpenAI repo example) would be missed
- **POST-MVP:** add `"**/AGENTS.md"` with deduplication; surface parent path in index; consider "nearest root" grouping

### 1.3 SPEC.md (project vs framework)

Two distinct meanings collide:

| Variant | Location | Purpose | Frontmatter |
| ------- | -------- | ------- | ----------- |
| **Project SPEC.md** | Repo root | Feature/work-order template: what to build, acceptance criteria | Informal |
| **BMAD SPEC.md** | `{output_folder}/specs/spec-{slug}/SPEC.md` | Five-field kernel: Why, Capabilities, Constraints, Non-goals, Success signal | `companions:`, `sources:` arrays |

BMAD explicitly warns that product `SPEC.md` with `Status: implementation-ready` is **not** authorization to edit source — Quick Dev requires a separate execution spec ([issue #2433](https://github.com/bmad-code-org/BMAD-METHOD/issues/2433)). specwiki should display these faithfully but not conflate them.

**specwiki implications:**

- Root `SPEC.md` discovered; title "Project Specification"
- `_bmad-output/**/SPEC.md` not in patterns — recommend POST-MVP addition under category `bmad-specs`
- Parse `companions:` frontmatter in BMAD specs to generate "Related documents" links in wiki pages

### 1.4 Cursor Rules (`.mdc`)

**Source:** [Cursor Rules docs](https://cursor.com/docs/rules)

**Format:**

```markdown
---
description: "When this rule applies"
alwaysApply: false
globs: "**/*.ts"
---

Rule body in markdown.
```

**Activation modes (from frontmatter combination):**

| Mode | `alwaysApply` | `globs` | `description` |
| ---- | ------------- | ------- | --------------- |
| Always | `true` | — | — |
| Auto-attached | `false` | set | — |
| Agent-requested | `false` | — | set |
| Manual | `false` | — | — |

Plain `.md` files in `.cursor/rules/` are **ignored** by Cursor (no frontmatter). specwiki correctly includes both `.md` and `.mdc`.

**specwiki implications:**

- Extract and display frontmatter metadata on wiki pages (description, globs, alwaysApply) — POST-MVP enrichment
- Category `cursor-rules` already derived from path prefix
- Legacy `.cursorrules` (single file) is deprecated; low priority

### 1.5 Cursor Skills (`SKILL.md`)

**Source:** [Cursor Skills docs](https://cursor.com/docs/skills)

**Format:**

```markdown
---
name: my-skill          # required; must match parent folder
description: ...        # required
paths: "**/*.tsx"       # optional scope
disable-model-invocation: false
---

# Skill Title
Instructions...
```

**Discovery locations:** `.cursor/skills/`, `.agents/skills/`, `~/.cursor/skills/` (global), plus Claude/Codex compat paths. Nested category folders supported (e.g., `.cursor/skills/shipping/deploy-staging/SKILL.md`).

**specwiki implications:**

- Pattern `.cursor/skills/**/SKILL.md` is correct
- Title derivation from parent folder name (e.g., `my-skill` → "My Skill") matches convention
- **POST-MVP:** also scan `.agents/skills/**/SKILL.md` (already in BMAD installs)

### 1.6 OpenSpec

**Source:** [openspec.dev](https://openspec.dev/), [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)

**Directory layout:**

```
openspec/
├── specs/                    # Source of truth (current behavior)
│   └── {domain}/
│       └── spec.md
├── changes/                  # Proposed modifications
│   └── {change-name}/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/            # Delta specs
│           └── {domain}/
│               └── spec.md
└── config.yaml               # Optional
```

**Semantic structures within spec files:**

- `## Purpose` — domain description
- `### Requirement:` — behaviors with RFC 2119 keywords (SHALL, MUST)
- `#### Scenario:` — GIVEN/WHEN/THEN examples
- Delta sections: `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`

**specwiki implications:**

- `openspec/**/*.{md,mdc}` pattern captures all artifacts
- Category `openspec` groups them; no semantic parsing needed for MVP
- **POST-MVP:** optional "change set" grouping by `openspec/changes/{name}/` parent folder; link proposal → specs → tasks → design as a navigable cluster

### 1.7 BMAD Method

**Source:** [BMAD docs](https://docs.bmad-method.org/), [bmad-spec SKILL](https://github.com/bmad-code-org/bmad-method/blob/main/src/core-skills/bmad-spec/SKILL.md)

**Artifact layout (v6.7+):**

```
{output_folder}/
├── specs/spec-{slug}/
│   ├── SPEC.md           # Five-field kernel (derived, not hand-edited)
│   ├── glossary.md       # Optional companions
│   └── .memlog.md        # Append-only decision log
├── planning-artifacts/
│   ├── prd/
│   ├── ux-designs/
│   └── research/
└── implementation-artifacts/
```

**SPEC.md kernel fields:** Why, Capabilities (with stable `CAP-N` IDs), Constraints, Non-goals, Success signal. Companions listed in frontmatter `companions:` array.

**specwiki implications:**

- High-value discovery targets: `_bmad-output/**/*.md`, `.agents/skills/**/SKILL.md`
- Category derivation: `_bmad-output/planning-artifacts/` → `bmad-planning`, `_bmad-output/specs/` → `bmad-specs`
- Display `.memlog.md` entries chronologically on spec index pages — POST-MVP
- specwiki itself uses BMAD discovery loop; dogfooding validates patterns

### 1.8 llms.txt

**Source:** [llmstxt.org](https://llmstxt.org/)

**Format (machine-readable index):**

```markdown
# Project Name

> Short summary in blockquote.

## Documentation
- [Page name](https://example.com/docs/page): Notes

## Optional
- [Changelog](...): Lower priority
```

Designed for LLM context windows; companion `llms-full.txt` concatenates full content. VitePress and Docusaurus plugins exist for generation.

**specwiki implications:**

- `llms.txt` already in `DEFAULT_SPEC_PATTERNS` as root file
- **POST-MVP high value:** emit `wiki/llms.txt` from generated index (specwiki as producer, not just consumer)
- Map categories to llms.txt H2 sections; use descriptions from `extractDescription()`

### 1.9 Other formats in the wild

| Format | Location | Notes |
| ------ | -------- | ----- |
| `CLAUDE.md` | Root | Claude Code native; symlinked to AGENTS.md in many repos |
| `GEMINI.md` | Root | Gemini CLI context file |
| `.github/copilot-instructions.md` | `.github/` | GitHub Copilot repo instructions |
| `.kiro/specs/**` | Kiro IDE | Discovered; category `kiro` |
| `docs/plans/**`, `requirements/**` | Various | Planning/requirements trees |
| `.ruler/**` | Ruler-managed | Source for distributed AGENTS.md; not end-agent artifact |
| `HARNESS.md`, `IMPLEMENTATION.md` | Project root | Build harness / implementation logs; agent-facing |

---

## 2. Competing and Alternative Tools

### 2.1 Positioning matrix

specwiki is a **read-only aggregator and renderer**, not a spec authoring framework or full documentation platform.

| Tool | Direction | Overlap with specwiki | Differentiation |
| ---- | --------- | --------------------- | --------------- |
| **specwiki** | Scan → aggregate → static wiki | — | Zero-config discovery across heterogeneous AI spec layouts |
| **Dewey** | Docs → agent artifacts (+ optional site) | Scans docs, generates AGENTS.md/llms.txt | Authoring/audit focus; optional static site scaffold |
| **Ruler** | `.ruler/` → distribute to agents | Reads/writes AGENTS.md, rules, skills | Multi-agent config sync; not a wiki |
| **agents-md** | Fragments → compose AGENTS.md | Markdown composition | Writes agent context; doesn't aggregate existing specs |
| **OpenSpec CLI** | `/opsx:propose` → change artifacts | Markdown specs in `openspec/` | Creates and manages specs; doesn't cross-framework aggregate |
| **BMAD skills** | Intent → SPEC.md/PRD/UX | Produces `_bmad-output/` artifacts | Planning pipeline; not a universal scanner |
| **Docusaurus** | Markdown/MDX → React site | HTML output | Full SSG; requires config, build pipeline, React |
| **VitePress** | Markdown → Vue site | HTML output | Full SSG; Vue ecosystem; local search |
| **MkDocs** | Markdown → static site | HTML output | Python; Material theme in maintenance mode (Nov 2025) |
| **TypeDoc** | TypeScript → API docs | CLI generate pattern | Code-structure-driven; not spec-file-driven |

### 2.2 Closest competitors (detailed)

**Dewey** ([dewey.arach.dev](https://dewey.arach.dev/)) — Most conceptually adjacent. Commands: `dewey init`, `dewey generate`, `dewey audit`, `dewey create` (optional site). Generates AGENTS.md, llms.txt, docs.json, and `/agent/` retrieval endpoints. Audit scores agent-readiness on a 100-point rubric. **Gap vs specwiki:** Dewey expects a `docs/` source tree you control; specwiki scans whatever already exists (`.cursor/rules/`, `openspec/`, etc.) without requiring migration.

**Ruler** ([github.com/intellectronica/ruler](https://github.com/intellectronica/ruler)) — `ruler apply` distributes `.ruler/` config to 30+ agent platforms. Writes AGENTS.md, MCP configs, skills. **Complementary, not competitive:** teams may use Ruler to generate specs that specwiki then aggregates into a wiki.

**agents-md** ([github.com/ivawzh/agents-md](https://github.com/ivawzh/agents-md)) — `npx agents-md compose` builds AGENTS.md from `**/agents-md/**/*.md` fragments. Solves composition, not discovery across Cursor/OpenSpec/BMAD.

### 2.3 Static site generators (alternative HTML strategy)

If specwiki's HTML output proves insufficient, users can point an SSG at the generated `wiki/` directory:

| SSG | Integration effort | Fit |
| --- | ------------------ | --- |
| VitePress | Low — markdown in, default theme | Good for Vue teams; local search built-in |
| Docusaurus | Medium — may need sidebar config | Good for React teams; versioning/i18n |
| MkDocs | Low — `mkdocs.yml` + `docs_dir: wiki` | Good for Python teams; Material maintenance concern |

**Recommendation:** specwiki should not bundle an SSG for MVP. The minimal inline HTML in `wrapHtml()` satisfies "open and read" without a build step. POST-MVP `specwiki export --format vitepress` could scaffold config.

### 2.4 White space specwiki owns

No tool currently offers:

1. **Cross-framework discovery** in a single pass (AGENTS.md + Cursor rules + OpenSpec + BMAD + Copilot instructions)
2. **Category-aware index** derived from path conventions (not user-authored nav)
3. **Zero-config** `npx specwiki generate` in any repo
4. **Dual output** (markdown wiki for agents + HTML for humans) from one command

---

## 3. CLI UX Patterns

### 3.1 Reference tools and applicable patterns

| Tool | Pattern | specwiki application |
| ---- | ------- | -------------------- |
| **ripgrep** | Fast default; `rg -l` (list); `--json` for machines; exit 0 on no match | `list` ≈ `rg -l`; empty discovery exits 0 with tip (already implemented) |
| **eslint** | Config cascade; `--fix` vs check; clear error format | POST-MVP: `specwiki.config.js` cascade; `generate --check` for CI |
| **prettier** | `--check` vs write; exit 1 on drift | POST-MVP: `generate --check` exits 1 if wiki stale |
| **TypeDoc** | `typedoc --watch`; `--showConfig`; log levels | POST-MVP: `generate --watch`; `--show-config` |
| **Prettier/Ripgrep** | Respect `NO_COLOR`; no output when piped | Use `chalk` with TTY check; `--no-color` flag |

### 3.2 Command shape (current and recommended)

**MVP (keep):**

```
specwiki list   [--project <path>]
specwiki generate [--project <path>] [--output <dir>] [--verbose]
```

**POST-MVP extensions:**

```
specwiki generate --check          # exit 1 if output differs from fresh generation
specwiki generate --watch          # rebuild on spec file changes
specwiki generate --json           # machine-readable summary to stdout
specwiki serve [--port 3000]       # local static server for wiki/html/
specwiki init                      # scaffold specwiki.config.js
```

### 3.3 Exit codes

Follow [CLI Guidelines](https://clig.dev/) and [Node.js CLI best practices](https://github.com/lirantal/nodejs-cli-apps-best-practices):

| Code | Meaning | When |
| ---- | ------- | ---- |
| 0 | Success | Wiki generated; list printed; zero specs found (with tip) |
| 1 | Runtime failure | I/O error, parse failure, write failure |
| 2 | Usage error | Invalid flags, path outside project, traversal attempt |

**Note:** v0.1 does not yet set explicit `process.exit()` codes on failure — MVP Phase 3 should add this.

### 3.4 Output streams

| Stream | Content |
| ------ | ------- |
| **stdout** | Results: file list, generation summary, `--json` payload |
| **stderr** | Diagnostics: `--verbose` logs, errors, warnings |

Structured logger (`src/core/Logger.ts`, HARNESS §0.8) should write verbose events to stderr, not stdout.

### 3.5 Configuration precedence (POST-MVP)

Recommended order (flags > env > project config > defaults):

1. CLI flags (`--project`, `--output`, `--patterns`)
2. Environment (`SPECWIKI_PROJECT`, `SPECWIKI_OUTPUT`, `NO_COLOR`, `DEBUG`)
3. Project config (`specwiki.config.js`, `specwiki.config.json`, or `.specwikerc`)
4. Built-in `DEFAULT_SPEC_PATTERNS`, `CATEGORY_LABELS`

TypeDoc's `--showConfig` pattern is worth copying for debugging.

### 3.6 Human vs agent consumers

Per [crouton-kit CLI design skill](https://github.com/crouton-labs/crouton-kit/blob/main/plugins/authoring/skills/cli-design/SKILL.md), CLIs now serve LLM agents too. `--help` text is the agent's tool description. specwiki should:

- Include copy-paste examples in `--help` output
- Support `--json` for `list` and `generate` (POST-MVP) with stable field names
- Never prompt interactively (no TTY prompts in MVP)
- Keep `--verbose` logs structured: `{ event, path, count, durationMs }`

---

## 4. Node.js Tooling Recommendations

### 4.1 Current stack assessment

| Package | Version | Role | Verdict |
| ------- | ------- | ---- | ------- |
| `commander` | ^13.1 | CLI framework | Keep — thin wiring in `src/cli.ts` |
| `fast-glob` | ^3.3.3 | Discovery | Keep — performant; dotfile support; ignore patterns |
| `gray-matter` | ^4.0.3 | Frontmatter | Keep — handles `.mdc` YAML blocks |
| `marked` | ^15.0.7 | MD→HTML | Keep for MVP — zero deps, 441 KB install |
| `chalk` | ^5.4.1 | Terminal color | Keep — add TTY guard |
| `vitest` | ^3.0.9 | Testing | Keep — 90% thresholds enforced |

HARNESS §12 rule: no new runtime deps without justification. Current graph is minimal (5 runtime packages).

### 4.2 Glob discovery

**Keep `fast-glob`** over Node 20+ `fs.glob` because:

- Mature ignore/onlyFiles/dot options already wired in `discoverSpecs()`
- Consistent behavior across Node 20–22
- Pattern array support matches `DEFAULT_SPEC_PATTERNS` structure

**Recommended ignore list (extend POST-MVP):**

```typescript
ignore: [
  "**/node_modules/**",
  "**/dist/**",
  "**/wiki/**",
  "**/.specwiki/**",
  "**/.git/**",        // POST-MVP
  "**/coverage/**",    // POST-MVP
]
```

**Symlink policy:** Do not follow symlinks outside `projectRoot` (HARNESS §0.9). fast-glob's `followSymbolicLinks: false` (default) is correct.

### 4.3 Markdown parsing

**MVP: keep custom section extractor + gray-matter**

The v0.1 approach — `gray-matter` for frontmatter, regex for headings, `extractDescription()` for first paragraph — is appropriate for aggregation. Full AST parsing is unnecessary until semantic transforms (OpenSpec requirement extraction, BMAD kernel fields) are needed.

**POST-MVP AST option:** `remark` + `remark-frontmatter` + `unist-util-visit` if:

- Frontmatter types must be validated per-schema (Cursor `.mdc`, BMAD SPEC.md)
- Wiki pages need cross-linking between spec references
- `llms.txt` generation needs structured section manipulation

**Benchmark context** ([web-markdown-benchmark](https://github.com/Princesseuh/web-markdown-benchmark)): marked is 15× faster than remark for simple MD→HTML; remark pulls 59 transitive deps (~2 MB). For a CLI that renders once per generate, marked wins.

### 4.4 HTML safety

**Current implementation** (`src/output/wiki.ts`, `src/parse/markdown.ts`):

- `escapeHtml()` on page titles in `<title>` — correct
- Body via `marked.parse()` — renders raw HTML embedded in markdown
- Inline CSS in `wrapHtml()` — safe (static string)

**Threat model:** Spec files are local, version-controlled project artifacts — not untrusted user HTML from the internet. Risk is low for MVP. If specwiki later accepts `--include` paths outside the project or renders externally-sourced specs, upgrade path:

1. **Minimal (POST-MVP):** Configure `marked` to sanitize via `marked-gfm-heading-id` + custom renderer that escapes raw HTML
2. **Full:** Switch HTML pipeline to `remark` → `remark-rehype` → `rehype-raw` → `rehype-sanitize` (GitHub schema) → `rehype-stringify`

```typescript
// POST-MVP reference pipeline (do not add for MVP)
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const html = await unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeStringify)
  .process(markdown);
```

**Recommendation:** Stay with `marked` + title escaping for MVP. Add `rehype-sanitize` only when `--allow-html` flag is introduced (opt-in raw HTML passthrough). Document in README that generated HTML is for trusted local use.

### 4.5 Config file patterns

**POST-MVP `specwiki.config.js` (ESM):**

```javascript
/** @type {import('specwiki').Config} */
export default {
  patterns: [
    ...DEFAULT_SPEC_PATTERNS,
    "_bmad-output/**/*.md",
    "**/AGENTS.md",
  ],
  categories: {
    "bmad-planning": "BMAD Planning",
  },
  output: {
    dir: "wiki",
    emitLlmsTxt: true,
  },
};
```

Load via dynamic `import()` from project root. Support `specwiki.config.json` for non-JS projects. Cosmiconfig is the conventional loader but adds a dependency — a single `import(pathToFileURL(configPath))` is sufficient for MVP config support.

### 4.6 Dev server (deferred)

If POST-MVP `specwiki serve` is added:

- Use Node 20+ built-in `node:http` + `node:fs/promises` — no `serve` or `express` dependency
- Bind `127.0.0.1` only (not `0.0.0.0`) — local browsing, not network exposure
- Serve only the resolved `--output` directory with path traversal checks
- Print `http://127.0.0.1:{port}` to stdout; log requests to stderr in `--verbose`

---

## 5. MVP vs POST-MVP Technical Decisions

### 5.1 Decision table

| Decision | MVP | POST-MVP | Rationale |
| -------- | --- | -------- | --------- |
| Output mode | Static MD + HTML files | Optional `serve`, optional SSG export | Core value is generation, not hosting |
| Discovery patterns | `DEFAULT_SPEC_PATTERNS` frozen | `--config`, `--patterns`, `**/AGENTS.md` | Zero-config MVP; flexibility later |
| Semantic parsing | Path-based categories + heading TOC | OpenSpec/BMAD field extraction | Heterogeneity too high for MVP |
| Slug collisions | Known bug; fix in Phase 3.4 | Hash suffix disambiguation | Already in HARNESS plan |
| Structured logging | `Logger.ts` in Phase 3.1 | — | HARNESS §0.8 requirement |
| `--json` output | No | Yes | Agent/script consumers |
| `llms.txt` export | No (input only) | Generate from index | High agent value, low effort |
| Watch mode | No | `generate --watch` | TypeDoc precedent; CI doesn't need it |
| HTML sanitization | Title escape only | `rehype-sanitize` if `--allow-html` | Trusted local specs for MVP |
| npm publish | Phase 4.2 | CI workflow 4.3 | After MVP hardening |
| Plugins | No | Evaluate after config API stable | Avoid premature abstraction |

### 5.2 Custom config: MVP scope

**MVP:** Patterns hard-coded. Phase 4.1 adds `--patterns` flag (comma-separated globs) as minimum viable override — no config file loader yet.

**POST-MVP:** Full `specwiki.config.js` with pattern extensions, category label overrides, output options, ignore list customization.

**Do not** use cosmiconfig or YAML-heavy config in MVP — violates minimal-deps principle.

### 5.3 Wiki layout (frozen)

```
wiki/
├── index.md
├── {slug}.md
└── html/
    ├── index.html
    └── {slug}.html
```

Do not change without POST-MVP rationale. POST-MVP additions (not replacements):

- `wiki/llms.txt` — agent index
- `wiki/meta.json` — machine-readable manifest for `list --json`

### 5.4 Category derivation

Prefix-based `deriveCategory()` is the right MVP heuristic. POST-MVP enhancements:

- Read `category` from frontmatter (override path heuristic)
- Support config-defined prefix → category mappings
- Group OpenSpec changes by `openspec/changes/{name}/` parent

---

## 6. Architecture Extension Recommendations

### 6.1 MVP completion priorities (from research)

Ordered by impact on specwiki's unique value:

1. **Slug collision fix** (Phase 3.4) — data integrity
2. **Structured logger** (Phase 3.1) — operability per HARNESS
3. **Explicit exit codes** — scripting reliability
4. **`--patterns` flag** (Phase 4.1) — brownfield adaptability
5. **Path traversal hardening** on `--output` — security per §0.9

### 6.2 POST-MVP extensions (sequenced)

**Epic A — Agent interoperability**

- Generate `wiki/llms.txt` from index (category → H2 sections)
- `list --json` and `generate --json` output schemas
- Discover `**/AGENTS.md`, `.agents/skills/**/SKILL.md`, `_bmad-output/**/*.md`

**Epic B — Developer experience**

- `specwiki serve` (Node built-in HTTP, localhost only)
- `generate --watch` with debounced rebuild
- `generate --check` for CI freshness checks
- `specwiki.config.js` loader

**Epic C — Semantic enrichment**

- Cursor rule frontmatter display (description, globs, alwaysApply badge)
- OpenSpec change-set grouping (proposal/design/tasks/specs cluster pages)
- BMAD SPEC.md kernel field extraction (five-field summary card on wiki page)
- Cross-link detection: wiki pages link to other discovered specs when paths referenced

**Epic D — Ecosystem**

- `specwiki export --format vitepress|mkdocs` — scaffold SSG config
- npm publish + GitHub Actions quality gate (Phase 4.2–4.3)
- Pre-commit hook snippet in README

### 6.3 Module architecture (stable boundaries)

```
src/
  cli.ts              # Commander wiring only
  commands/           # list, generate, (serve), (init)
  discover/           # fast-glob, category/title derivation
  parse/              # gray-matter, sections, (semantic parsers POST-MVP)
  output/             # wiki build, md/html write, (llms.txt POST-MVP)
  config/             # patterns, labels, (config loader POST-MVP)
  core/               # Logger.ts
  types.ts            # Shared interfaces
```

Do not collapse discover + parse — discovery must stay testable without I/O parsing.

### 6.4 Testing strategy extensions

| Area | MVP | POST-MVP |
| ---- | --- | -------- |
| HTML escaping | Title escape tests (exist) | Body XSS fixtures if `--allow-html` |
| Config | — | Config loader precedence tests |
| Snapshots | Avoid | Golden files for `llms.txt` format |
| Fixtures | `sample-project/` (10 files) | Add BMAD, nested AGENTS.md, OpenSpec change set trees |

---

## 7. Recommendation: Static Output Only for MVP

### Decision

**MVP includes static markdown + HTML output only. No bundled local dev server.**

Record as `decisions.md` entry: *2026-07-12 — MVP output mode: static files only.*

### Rationale

1. **Brownfield already delivers browsable HTML.** `writeHtmlWiki()` produces self-contained pages with navigation (`← Back to index`). Users open `wiki/html/index.html` directly or use any static server (`npx serve`, `python -m http.server`) — no specwiki dependency required.

2. **Aligns with frozen contracts.** HARNESS §12 and `project-context.md` freeze the `wiki/` layout as markdown + `html/` subtree. A `serve` command is additive scope, not a course correction.

3. **Matches CLI category peers.** Ripgrep, Prettier, ESLint, and TypeDoc default to file output. TypeDoc's `--watch` is POST-MVP convenience, not core. specwiki is a transform tool, not a documentation host.

4. **Minimizes security and dependency surface.** HARNESS §0.9 trust boundary: "No network by default." A dev server introduces port binding, path traversal on HTTP requests, and CORS concerns — none of which advance the core discovery → wiki pipeline.

5. **Avoids e2e/browser test scope.** HARNESS §0.2.1 defaults to skipping browser tests. A `serve` command creates pressure to add HTTP integration tests and demo recordings.

6. **Low user friction for POST-MVP add.** `specwiki serve` can ship later using Node built-in `http` (zero new dependencies), binding `127.0.0.1` only. Users who want live reload pair `generate --watch` + `serve`.

### What MVP does include

- `specwiki generate` → `wiki/index.md`, `wiki/{slug}.md`, `wiki/html/*.html`
- Console summary with output paths (already implemented)
- Optional `--verbose` for scan/write diagnostics

### What MVP explicitly defers

- `specwiki serve` command
- Live reload / watch mode
- SSG scaffold export (VitePress, MkDocs)

### Mitigation for browsing UX

Document in README:

```bash
# Generate the wiki
specwiki generate

# Browse HTML (pick one)
open wiki/html/index.html
npx --yes serve wiki/html -l 3456
python -m http.server 3456 --directory wiki/html
```

---

## 8. Risks and Open Questions

| Risk | Severity | Mitigation |
| ---- | -------- | ---------- |
| Format fragmentation accelerates | Medium | Extend-only pattern list; config overrides POST-MVP |
| Slug collisions corrupt wiki | High | Phase 3.4 fix before npm publish |
| BMAD/OpenSpec semantic drift | Low | Treat as markdown for MVP; schema parsers optional later |
| Competing AGENTS.md tools absorb aggregation | Medium | Differentiate on cross-framework scan; ship `llms.txt` export |
| marked XSS via embedded HTML | Low | Trusted local specs; document; sanitize POST-MVP |
| Monorepo nested AGENTS.md missed | Medium | Add `**/AGENTS.md` POST-MVP; document workaround (--patterns) |

**Open question (resolved for MVP):** Static vs server → **static only** (§7).

**Open question (POST-MVP):** Whether to emit `llms.txt` by default or via `--emit-llms-txt` flag. Recommend opt-in first, then default-on after validation.

---

## Sources and References

### Standards and specifications

- [AGENTS.md open format](https://agents.md/) — AAIF-stewarded agent instruction standard
- [agents.md GitHub](https://github.com/openai/agents.md) — format examples and ecosystem
- [MDA frontmatter-agents-md schema](https://github.com/sno-ai/mda/blob/main/spec/v1.0/06-targets/agents-md.md) — optional YAML frontmatter contract
- [llms.txt specification](https://llmstxt.org/) — agent-oriented documentation index format
- [Cursor Rules documentation](https://cursor.com/docs/rules) — `.mdc` frontmatter and activation modes
- [Cursor Skills documentation](https://cursor.com/docs/skills) — `SKILL.md` format and discovery paths

### Frameworks and tools

- [OpenSpec](https://openspec.dev/) — spec-driven development framework
- [OpenSpec concepts](https://github.com/Fission-AI/OpenSpec/blob/HEAD/docs/concepts.md) — delta spec format
- [BMAD Method docs](https://docs.bmad-method.org/reference/core-tools/) — bmad-spec kernel and artifact layout
- [BMAD bmad-spec SKILL](https://github.com/bmad-code-org/bmad-method/blob/main/src/core-skills/bmad-spec/SKILL.md) — five-field SPEC.md contract
- [Dewey](https://dewey.arach.dev/) — agent-ready documentation toolkit
- [Ruler](https://github.com/intellectronica/ruler) — multi-agent config distribution
- [agents-md](https://github.com/ivawzh/agents-md) — composable AGENTS.md fragments

### CLI design

- [Command Line Interface Guidelines](https://clig.dev/) — exit codes, stdout/stderr, flags
- [Node.js CLI apps best practices](https://github.com/lirantal/nodejs-cli-apps-best-practices/) — debugging, exit codes, version
- [TypeDoc CLI options](https://typedoc.org/documents/Options.Other.html) — watch, showConfig, logLevel patterns
- [crouton-kit CLI design skill](https://github.com/crouton-labs/crouton-kit/blob/main/plugins/authoring/skills/cli-design/SKILL.md) — agent-friendly CLI principles

### Node.js markdown tooling

- [marked](https://marked.js.org/) — current specwiki HTML renderer
- [web-markdown-benchmark](https://github.com/Princesseuh/web-markdown-benchmark) — marked vs remark performance and install size
- [remark-rehype](https://github.com/remarkjs/remark-rehype) — MD→HTML with sanitization pipeline
- [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) — HTML sanitization (POST-MVP)

### Static site generators (context)

- [VitePress](https://vitepress.dev/) — Vue-powered docs SSG
- [Docusaurus](https://docusaurus.io/) — React-powered docs SSG
- [MkDocs](https://www.mkdocs.org/) — Python docs SSG
- [PkgPulse documentation frameworks 2026](https://www.pkgpulse.com/guides/best-documentation-frameworks-2026) — comparative overview

### specwiki internal

- `HARNESS.md` — build harness, frozen contracts, quality gate
- `_bmad-output/planning-artifacts/discovery/project-context.md` — brownfield status, tech stack
- `src/config/patterns.ts` — `DEFAULT_SPEC_PATTERNS`, `CATEGORY_LABELS`
- `src/discover/specs.ts` — category/title derivation
- `src/output/wiki.ts` — wiki layout, HTML generation, `escapeHtml`
- `README.md` — user-facing commands and output contract
