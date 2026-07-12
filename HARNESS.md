# specwiki — Build Harness

You are building **a CLI that transforms AI specs in any project into structured, wiki-like documentation**. The tool scans for agent instructions, spec-driven development files, and AI-generated specs, then emits a browsable markdown wiki with optional HTML output.

**MVP in progress.** Active work is governed by **`IMPLEMENTATION.md`** (create this file before Phase 0 if missing — phases below were drafted from README and current code).

Read every section before writing a single line. This document is the ground truth for architecture and acceptance.

> **These rules are non-negotiable and must never be bypassed:**
>
> - **One task at a time** — never implement an entire phase (or multiple bullets) in a
>   single turn. Stop after each bullet for owner review and commit (§0.3–§0.4).
> - Follow Test-Driven Development on every task (§0.1).
> - Run the full quality gate after every task (§0.2). **Do not** run e2e/browser tests
>   or record demo videos unless the owner explicitly asks (§0.2.1).
> - **Stop and ask for confirmation** after every task — do not start the next task until
>   the owner approves the checkpoint **and** the commit is on the branch (§0.3).
> - **Update project logs** after every task (§0.4). Skipping this is as serious as
>   skipping tests.
> - **Minimal comments** — do not annotate every function or variable; comment only where
>   logic is genuinely hard to follow (§0.6).
> - **Keep code clean** — small focused diffs, clear naming, no dead code or drive-by
>   changes; match existing project style (§0.7).
> - **Structured logging (§0.8)** — every feature ships with useful, safe debug logs.
>   File I/O, discovery, parsing, and error paths must be instrumented.
>   Skipping logging is as serious as skipping tests.
> - **Security (§0.9)** — treat user-supplied paths as untrusted; validate inputs,
>   never write outside the resolved output directory, and never leak secrets in logs
>   or error messages.

---

## 0. Working rules (mandatory — never bypass)

These rules govern **every individual task** inside every build phase. A "task" is one
bullet point inside a phase (e.g. HARNESS §9 Phase 2 bullet: `parseSpecFile`). Apply the
full workflow below to each one, no exceptions.

**If the owner says "move on to phase N", interpret that as permission to start the
_first bullet only_ of that phase — not the whole phase. After that bullet, stop at the
§0.3 checkpoint and wait again.**

### 0.0 Agent discipline — read before every turn

Before writing or changing any code, confirm you are working on **exactly one** §9 or
§9A bullet.
If you are tempted to implement multiple systems, wire the entry point, and add tests in
one go — **stop**. That violates this harness.

At the end of every task turn, your message must be a §0.3 checkpoint (not a phase
summary). Do not mark a phase "complete" until every bullet has its own checkpoint,
commit, and project log entry.

### 0.0.1 Model selection

This project has **no mandated model split**. Use whichever model the owner has active in
Cursor for all work — implementation, tests, docs, and commits.

Do not switch models mid-task for harness compliance; there is none here. If the owner
asks for a specific model on a turn, follow that instruction.

### 0.1 Test-Driven Development

Use strict Red → Green → Refactor for every piece of logic:

1. **Red** — Write the failing test(s) first. The test must fail for the right reason
   before you write any implementation code. Confirm the failure before proceeding.
2. **Green** — Write the minimal implementation that makes the tests pass. No gold-plating.
3. **Refactor** — Clean up duplication and naming. Tests must still pass after refactoring.

Rules that follow from this:

- Every function in `src/discover/`, `src/parse/`, `src/output/`, `src/config/`, and `src/commands/` must have at least one test before its implementation exists (or a documented reason why not).
- CLI wiring in `src/cli.ts` that cannot be unit-tested must have a documented manual test step written as a comment above the function.
- Never skip the Red step. A test written after the implementation it tests is not TDD.
- If a task has no testable logic (e.g. scaffolding files with no behaviour), write a
  placeholder test file with a `todo()` test and note it as "TDD pending".

**Code coverage requirement — 90% minimum, enforced via `npm run coverage`.**

Configure your test runner with coverage thresholds. Example (Vitest + v8):

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
  exclude: ['src/cli.ts', 'tests/**', '*.config.*'],
}
```

Add a `coverage` script to `package.json` and include it in the §0.2 quality gate.
Adjust thresholds and exclusions to match the project.

**UI rendering tests — required alongside logic tests (when applicable).**

For HTML output, verify rendered structure and escaping — not pixel equality. Test the _intent_ of rendering (correct tags, escaped titles, TOC links).

### 0.2 Quality gate — run after every task

After finishing a task (Red → Green → Refactor complete), run **all** of the following
commands in order. Do not proceed to the next task until all pass.

```bash
npm run test        # all tests must pass
npm run lint        # zero errors, zero warnings
npm run format      # zero errors, zero warnings
npm run coverage    # coverage must be at least 90%
npm run typecheck   # TypeScript strict check — 0 errors
npm run build       # tsc compile — exits 0
```

If any command fails: fix it before moving on. Do not accumulate broken state across
tasks.

#### 0.2.1 E2E / browser tests — owner opt-in only (default: skip)

**By default, do not:**

- run e2e or browser test commands
- create or extend files under `e2e/` (or equivalent)
- record or present demo videos

Unit/integration tests in the primary test runner are the default validation path. E2e is
slow; the owner will say explicitly when they want browser tests or a demo recording.

When the owner **does** request e2e work:

1. **Assertion specs** — Keep a smoke spec green. Add or extend feature specs when the
   task introduces browser-testable behaviour.
2. **Demo spec** — Update the demo spec so the scripted run **showcases the behaviour
   built in this task** (not a generic smoke test). Keep it stable.
3. **Record video** — Run the project's demo recording command. Output goes to a
   gitignored artifacts directory.
4. **Present to owner** — In the §0.3 checkpoint, include a **Demo video** section with
   the repo path and a one-line description of what the recording shows.

**Video files are local artifacts only — never commit them.**

- Output lives in gitignored directories (`e2e/artifacts/`, `test-results/`, etc.).
- Do not `git add` video files. Commit only spec/helper changes.

### 0.3 Code review checkpoint — after every task

After the quality gate passes, **stop and ask the owner for a code review** before
starting the next task. Do this even if the next task feels trivial.

Format your checkpoint message exactly like this:

```
## Code review checkpoint — [Phase N, Task: <task name>]

### What was built
<2–4 bullet points describing what was implemented>

### Tests written
<list every new test file / test case added in this task>

### Logging (§0.8)
- [ ] New/changed paths instrumented with structured logs
- [ ] File I/O / discovery / error paths logged where this bullet touches them
- [ ] No sensitive data in log payloads (tokens, passwords, emails)

### Security (§0.9)
- [ ] User-supplied paths resolved and validated (no traversal outside project)
- [ ] Output writes confined to resolved output directory
- [ ] HTML escaping preserved for user-controlled titles and content

### Quality gate
- [x] npm run test  — N tests passed
- [x] npm run lint  — 0 errors, 0 warnings
- [x] npm run format  — passed
- [x] npm run coverage  — all thresholds met (≥ 90%)
- [x] npm run typecheck  — 0 errors
- [x] npm run build  — exited 0

### IMPLEMENTATION.md updated
- [x] Relevant checklist checkbox(es) marked complete
- [x] Build log row appended (§0.4)
- [x] Project status / test count refreshed

### Suggested commit message
```

<type>(<scope>): <imperative summary under 72 chars>

<optional body: what and why, not how; wrap at 72 chars>

```

### Ready to proceed?
Waiting for your review and approval before starting the next task.
```

Do not suggest more than one commit per task. Do not commit automatically — wait for
explicit owner approval.

**Do not start the next §9 bullet until:**

1. The owner replies with approval (e.g. "LGTM", "proceed", or approves the commit), **and**
2. The suggested commit for this task is on the branch (owner commits, or explicitly asks
   you to commit).

If the owner approves the code but has not committed yet, **wait** — do not begin the
next task.

### 0.4 Project logs — mandatory after every task

**Primary spec tasks (§9):** log in **`IMPLEMENTATION.md`**.

Update the correct file in the **same turn** as the §0.3 checkpoint, before asking to
proceed.

**After every task, do all three:**

1. **Check boxes** — In the progression checklist, mark the bullet complete. Add a short
   inline note if behaviour is partial.

2. **Refresh project status** (top of the spec file):
   - `**Last updated:**` — today's date
   - `**Current position:**` — phase + **next single bullet** (not "phase complete" until
     every bullet in that phase has been reviewed and committed)
   - `**Test count:**` — output of the test command (e.g. `156 passing · 4 todo`)
   - Deliverables table — add a row or update `Reference` with the commit hash once
     committed

3. **Append one row to the build log:**

```markdown
| YYYY-MM-DD | [Phase ID — task name] | `<type>(<scope>): summary` | `<hash or uncommitted>` | N tests |
```

**Never** mark an entire phase complete in one log entry. One row per bullet.

#### 0.4.1 HARNESS → spec document mapping

| HARNESS phase                   | Primary spec section      |
| ------------------------------- | ------------------------- |
| Phase 0 — Scaffold & tooling    | §0 — Project setup        |
| Phase 1 — Discovery             | §1 — Spec discovery       |
| Phase 2 — Parsing & wiki output | §2 — Parse and generate   |
| Phase 3 — Test infrastructure   | §3 — Testing              |
| Phase 4 — Logging & CLI polish  | §4 — Observability and UX |

When multiple documents use the word "Phase N", **always disambiguate**: "HARNESS Phase N"
vs "IMPLEMENTATION Phase N".

### 0.5 Anti-patterns — never again

The following are **hard failures** against this harness:

| Anti-pattern                                                     | Why it is forbidden                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| Implementing a full HARNESS phase in one agent turn              | Skips TDD checkpoints, review, and commits per bullet  |
| Marking "Phase N complete" without per-task commits              | Owner cannot review or bisect history                  |
| Changing code without updating the project log                   | Breaks traceability and owner visibility               |
| Proceeding after checkpoint without owner approval               | Owner loses control of merge order                     |
| Committing without being asked                                   | §0.3 — owner commits or explicitly delegates           |
| Batch-updating status only at the end of a phase                 | Build log must grow one row per task                   |
| Running e2e tests or recording demo videos without owner request | Wastes time; violates §0.2.1 owner opt-in policy       |
| Committing gitignored artifacts (videos, build output, secrets)  | Pollutes repo; may leak sensitive data                 |
| Drive-by refactors or unrelated file churn in a task             | Violates §0.7 scope; obscures review and bisect        |
| Leaving dead imports, unused helpers, or stale comments          | Codebase rots between tasks                            |
| Shipping a feature without structured logs (§0.8)                | Owner cannot debug failures in QA or production        |
| Logging passwords, tokens, JWTs, emails, or secrets              | Security violation — use IDs and sanitized fields only |
| Writing wiki output outside the resolved `--output` directory    | Path traversal / data loss risk                        |
| Committing `.env`, API keys, or real credentials                 | Secrets leak — use `.env.example` placeholders only    |

If you already violated this (e.g. built an entire phase at once), **do not pretend it was
compliant**. Log it in the build log as a single retrospective block, then **resume strict
one-bullet workflow** starting with the first unreviewed commit split the owner wants.

### 0.6 Comments — minimal by default

Code should be self-explanatory through naming and structure. **Do not** add comments on
every function, type, constant, or variable.

**Add a comment only when:**

- The logic is genuinely non-obvious (e.g. category derivation rules, slug collision handling).
- A value must not be changed and that constraint is not visible from the name alone
  (e.g. frozen glob patterns in `DEFAULT_SPEC_PATTERNS`).
- CLI code cannot be unit-tested and needs a documented manual test step (§0.1).

**Do not add:**

- File headers that restate the filename or HARNESS phase.
- JSDoc on every exported function "for documentation's sake".
- Comments that paraphrase what the next line of code already says.

Prefer deleting stale comments over leaving them wrong after a refactor.

### 0.7 Code cleanliness — non-negotiable

Clean, readable code is as important as passing tests. Every change should leave the
codebase **easier to read and maintain**, not just "working".

**Always:**

- **Minimize scope** — change only what the current bullet requires. No drive-by
  refactors, renames, or formatting churn in unrelated files.
- **Match existing conventions** — read surrounding code first; mirror its naming, types,
  module layout, and abstraction level. New code should look like it belongs.
- **Prefer clarity over cleverness** — explicit names, straightforward control flow, and
  small functions beat dense one-liners or premature abstractions.
- **KISS over DRY** — keep code simple and easy to follow first. A little duplication
  is fine if extracting a shared helper would obscure intent, couple unrelated modules,
  or produce a one-off abstraction. Deduplicate only when reuse clearly reduces
  complexity.
- **Delete dead code** — remove unused imports, variables, helpers, and commented-out
  blocks in the same turn; do not leave "just in case" leftovers.
- **Finish the refactor step** — TDD's Green pass is not done until duplication and
  naming are cleaned up and tests still pass (§0.1).
- **Respect the quality gate** — lint, formatter, and type checks must pass with zero
  warnings before checkpoint (§0.2).

**Avoid:**

- One-line helpers that exist only to wrap a single call.
- Extra error handling or fallbacks for impossible or extremely unlikely cases.
- Forced abstractions whose only purpose is DRY — especially generic helpers used once
  or twice with slightly different semantics.
- Shipping a "quick fix" that spreads the same pattern three different ways.

If you touch a file, leave it **cleaner than you found it** within the scope of the
task — but never expand scope just to polish unrelated code.

### 0.8 Structured logging — **mandatory on every feature**

Structured logging is **as important as tests and the quality gate**. Every bullet must
add or extend logs in the code paths it touches. Do not ship a feature and plan to "add
logging later."

**Why:** When something breaks during owner review or in CI, logs are the first tool for
diagnosis. A feature without logs is incomplete.

#### What to log

| Category      | Log when                                           | Example event names                                  |
| ------------- | -------------------------------------------------- | ---------------------------------------------------- |
| **Discovery** | Glob scan start, match count, ignored paths        | `discover.start`, `discover.match`, `discover.empty` |
| **Parsing**   | Each file read, frontmatter parse, section extract | `parse.file`, `parse.error`                          |
| **Output**    | Directory creation, file writes, HTML generation   | `output.write`, `output.error`                       |
| **CLI**       | Command invoked, options resolved, exit reason     | `cli.command`, `cli.complete`, `cli.error`           |

Log **decisions and outcomes**, not hot-path noise. Respect `--verbose` — detailed logs only when verbose is set unless the event is an error.

#### CLI logger

Use the project's structured logger module — do not scatter ad-hoc `console.log` through business logic.

<!-- TODO(owner): confirm logger path once src/core/Logger.ts is created -->

```typescript
import { log } from "./core/Logger.js";

log.info("discover.start", { projectRoot, patternCount });
log.error("parse.error", { path, message });
```

**Include useful debugging context** alongside every log:

- Resolved absolute paths (project root, output dir)
- File counts and category breakdowns
- Duration for scan and generate operations
- Error messages — never full file contents

**Enable in development:** `--verbose` flag gates detailed logs; errors always log.

Instrument at minimum:

- `discoverSpecs` — pattern set, match count, categories
- `parseSpecFile` — read failures, frontmatter overrides
- `writeWiki` / `writeHtmlWiki` — paths written, mkdir failures
- `generateWiki` / `listSpecs` — command lifecycle

#### Per-task checklist

Before the §0.3 checkpoint, confirm:

- [ ] New/changed code paths have `log.*` calls at decision points and error handlers
- [ ] File I/O and discovery paths introduced by this bullet are logged
- [ ] Log payloads contain fields useful for debugging without sensitive data
- [ ] No secrets or full spec bodies appear in log payloads
- [ ] Logger is a no-op when verbose is disabled on hot paths — no expensive string formatting

#### Anti-pattern

| Anti-pattern                                               | Why it is forbidden                         |
| ---------------------------------------------------------- | ------------------------------------------- |
| Shipping a feature with zero new logs                      | Violates §0.8 — owner cannot debug failures |
| `console.log` instead of structured logger in core modules | Inconsistent, not toggleable                |
| Logging full spec file contents                            | Noise and potential secret leakage          |

### 0.9 Security guidelines — **mandatory on every feature**

This CLI reads arbitrary project directories and writes wiki output to disk. Treat all
user-supplied paths as untrusted.

#### Trust boundary

```
User shell (untrusted)           specwiki CLI (trusted)           Filesystem
────────────────────             ─────────────────────            ──────────
--project / --output paths       Resolve to absolute paths        Read specs only
Arbitrary repo contents            Ignore node_modules/dist/wiki    Write only to output dir
                                   Escape HTML in generated pages   No network by default
```

**Hard rule:** Never follow symlinks outside the resolved project root for writes. Output
files must land only under the resolved `--output` directory.

#### Path handling

- Resolve `--project` and `--output` with `path.resolve` from the user's cwd.
- Reject or safely handle path traversal in output slugs (no `..` segments in written paths).
- Do not execute code from discovered spec files — parse as text only.

#### HTML output safety

- Escape titles and user content in HTML wrappers (`escapeHtml` in `wiki.ts`).
- Never inject raw markdown HTML without going through `marked` + wrapper escaping for titles.
- User-controlled strings in CLI output use chalk only — not shell interpolation.

#### Per-task security checklist

Before the §0.3 checkpoint, confirm (when the bullet touches I/O):

- [ ] User-supplied paths resolved and validated
- [ ] Write paths confined to resolved output directory
- [ ] HTML escaping preserved for new template fields
- [ ] Tests cover at least one malicious or edge-case path input

---

## 1. Orientation

|                           |                                                |
| ------------------------- | ---------------------------------------------- |
| **Repo root**             | `/Users/lucas/Projects/specwiki`               |
| **Reference / prototype** | none — greenfield CLI (v0.1.0 scaffold exists) |
| **Primary spec**          | `IMPLEMENTATION.md` — read it in full          |
| **Output dir**            | `src/`                                         |

Behavioural ground truth: **README.md** (user-facing commands and output layout) plus
existing `src/` modules. Do **not** break working `list` / `generate` behaviour unless this
document explicitly overrides it.

---

## 2. Tech stack

| Layer      | Choice                                     |
| ---------- | ------------------------------------------ |
| Language   | TypeScript 5.8 strict (`NodeNext` modules) |
| Build      | `tsc` → `dist/`                            |
| Runtime    | Node.js ≥ 20                               |
| CLI        | Commander 13                               |
| Discovery  | fast-glob 3                                |
| Parsing    | gray-matter + marked 15                    |
| Testing    | Vitest · `@vitest/coverage-v8`             |
| Linting    | ESLint 9 · `typescript-eslint`             |
| Formatting | Prettier 3                                 |
| Deployment | npm package (`bin: specwiki`)              |

Do **not** add runtime dependencies that are not needed. Prefer the smallest dependency
graph that ships a working product.

---

## 3. Directory layout

Current structure (target for MVP):

```
specwiki/
├── src/
│   ├── cli.ts                 # Commander entry (bin target)
│   ├── types.ts               # Shared interfaces
│   ├── commands/
│   │   └── generate.ts        # generate + list commands
│   ├── config/
│   │   └── patterns.ts        # DEFAULT_SPEC_PATTERNS, CATEGORY_LABELS
│   ├── discover/
│   │   └── specs.ts           # Glob discovery, category/title derivation
│   ├── parse/
│   │   └── markdown.ts        # Frontmatter, sections, HTML render
│   └── output/
│       └── wiki.ts            # Wiki page build + md/html write
├── tests/                     # (to add) mirrors src/ modules
├── dist/                      # tsc output (gitignored)
├── wiki/                      # generated output (gitignored)
├── package.json
├── tsconfig.json
├── README.md
├── IMPLEMENTATION.md          # (to create) primary build spec
└── HARNESS.md                 # this file
```

---

## 4. Domain / feature specification

Authoritative behaviour extract. If anything conflicts, **`IMPLEMENTATION.md`** wins once
it exists.

### Core user flows

1. **`specwiki list`** — Scan `--project` (default cwd) with `DEFAULT_SPEC_PATTERNS`, group
   results by category, print paths to stdout. Exit cleanly when zero matches (yellow tip).
2. **`specwiki generate`** — Discover → parse each file → build wiki pages → write
   `{output}/index.md`, `{output}/{slug}.md`, and `{output}/html/*.html`. Print summary with
   file counts.

### Discovery rules

- Patterns defined in `src/config/patterns.ts` (`DEFAULT_SPEC_PATTERNS`).
- Ignore: `node_modules/`, `dist/`, `wiki/`, `.specwiki/`.
- Categories derived from path prefix (`deriveCategory` in `discover/specs.ts`).
- Titles derived from basename with special cases for `SKILL`, `AGENTS`, `SPEC`, etc.

### Parsing rules

- Read file as UTF-8; parse YAML frontmatter via gray-matter.
- Title: frontmatter `title` → else derived title from discovery.
- Description: first non-heading paragraph, capped at 300 chars.
- Sections: markdown headings `#`–`######` with slugified anchors.
- Preserve full body as `rawContent` in wiki pages.

### Wiki output contract

```
wiki/
├── index.md          # Categorized link index
├── {slug}.md         # One page per spec (TOC + source path + raw content)
└── html/
    ├── index.html
    └── {slug}.html   # Minimal styled HTML, nav back to index
```

- Slugs: relative path → lowercase, `/` → `-`, strip extension.
- Index groups pages by category using `CATEGORY_LABELS`.

### CLI options

| Flag            | Command  | Default         | Purpose                        |
| --------------- | -------- | --------------- | ------------------------------ |
| `-p, --project` | both     | `process.cwd()` | Root to scan                   |
| `-o, --output`  | generate | `wiki`          | Output dir relative to project |
| `-v, --verbose` | generate | off             | Detailed scan/write logging    |

### Invariants (do not change without approval)

- `DEFAULT_SPEC_PATTERNS` glob list (extend only via explicit bullet).
- Output directory layout (`index.md` + per-spec pages + `html/` subtree).
- Category label map in `CATEGORY_LABELS`.

### Known gaps (MVP targets)

- No automated tests or Vitest config.
- No structured logger — verbose mode uses raw `console.log`.
- No lint/format scripts.
- No custom patterns file (`--config`) — patterns hard-coded only.
- Slug collisions from different paths not handled.

---

## 9. Build phases

<!-- TODO(owner): phases drafted from README and current code — replace with IMPLEMENTATION.md plan -->

Work through these in order. Apply the full §0 workflow (TDD → quality gate → §0.3
checkpoint → owner approval → commit → §0.4 project log update) to **every bullet point**
inside every phase before moving to the next bullet.

**One bullet = one agent turn = one commit = one build-log row.**

### Phase 0 — Scaffold & spec

- 0.1: Create `IMPLEMENTATION.md` with progression checklist, build log, and status header
- 0.2: Add Vitest, ESLint, and Prettier devDependencies with config files
- 0.3: Add `package.json` scripts: `test`, `test:run`, `coverage`, `lint`, `fmt`
- 0.4: Create `tests/` directory with placeholder structure mirroring `src/`

**Gate:** `npm run typecheck` and `npm run build` pass; `IMPLEMENTATION.md` exists; test runner executes (even zero tests).

### Phase 1 — Discovery (retrofit tests)

- 1.1: `deriveCategory` — unit tests + edge cases for all path prefixes
- 1.2: `deriveTitle` — unit tests including SKILL/AGENTS/SPEC basename rules
- 1.3: `discoverSpecs` — integration tests with fixture directory tree
- 1.4: Structured logging in `discover/specs.ts` (§0.8)

**Gate:** Discovery module ≥ 90% coverage; `specwiki list` behaviour unchanged.

### Phase 2 — Parsing & wiki output (retrofit tests)

- 2.1: `extractSections` / `extractDescription` — unit tests
- 2.2: `parseSpecFile` — fixture tests with frontmatter variants
- 2.3: `pageSlug` / `buildPageContent` / `buildIndex` — unit tests
- 2.4: `renderMarkdown` / `escapeHtml` / `wrapHtml` — HTML safety tests
- 2.5: `writeWiki` / `writeHtmlWiki` — temp-dir integration tests
- 2.6: Structured logging in parse and output modules

**Gate:** Parse + output modules ≥ 90% coverage; generated wiki matches README output contract.

### Phase 3 — Commands & CLI polish

- 3.1: Extract `src/core/Logger.ts` — verbose-gated structured logger
- 3.2: Wire logger through `commands/generate.ts`; reduce raw console usage
- 3.3: `generateWiki` / `listSpecs` — command-level tests with mocked I/O
- 3.4: Handle slug collisions (disambiguate duplicate slugs)
- 3.5: Full §0.2 quality gate (test, coverage, lint, fmt, typecheck, build)

**Gate:** All §0.2 commands pass; coverage ≥ 90% repo-wide; README commands verified manually.

### Phase 4 — MVP hardening (optional pre-release)

- 4.1: `--patterns` or config file override for custom glob sets
- 4.2: npm publish prep (`files` field, prepublish script)
- 4.3: CI workflow (GitHub Actions) running full quality gate

**Gate:** Package installs and runs via `npx specwiki` on a clean machine.

**Start here:** Phase 0, bullet 0.1 (or first incomplete bullet if retrofitting existing code).

---

## 10. Test file layout

**Coverage target:** 90% lines, functions, branches, statements (enforced via §0.2 once Vitest is added).

<!-- TODO(owner): create these files in Phase 0–2 -->

```
tests/
  discover/
    specs.test.ts          # deriveCategory, deriveTitle, discoverSpecs
  parse/
    markdown.test.ts       # sections, frontmatter, renderMarkdown
  output/
    wiki.test.ts           # slug, index, writeWiki, HTML escape
  commands/
    generate.test.ts       # generateWiki, listSpecs integration
  fixtures/
    sample-project/        # Minimal tree with AGENTS.md, .cursor/rules/, etc.
```

**Exclusions from coverage:** `src/cli.ts` (thin Commander wiring), config files, `tests/**`.

---

## 11. Known issues in reference code to fix

| #   | Issue                                            | Fix                                                   |
| --- | ------------------------------------------------ | ----------------------------------------------------- |
| 1   | Duplicate relative paths produce identical slugs | Disambiguate with hash or path suffix (Phase 3.4)     |
| 2   | No tests for existing v0.1.0 modules             | Retrofit via Phases 1–2 without behaviour regressions |
| 3   | Verbose logging uses raw console                 | Replace with structured logger (Phase 3.1)            |

---

## 12. What not to change

Frozen contracts:

- Default glob patterns in `DEFAULT_SPEC_PATTERNS` (extend, do not remove, without approval)
- Wiki output layout: `index.md`, `{slug}.md`, `html/index.html`, `html/{slug}.html`
- Category derivation rules for known prefixes (`.cursor/rules/`, `specs/`, etc.)
- HTML title escaping in `wrapHtml`
- Gitignore entries for `wiki/`, `dist/`, `node_modules/`

**What is allowed to change:** CLI messaging, log format, internal module splits, test fixtures, dev tooling.

**Hard rules:** No writes outside resolved `--output` directory; no new runtime deps without justification.

---

## 13. Deliverables checklist

When MVP is complete, the following must all be true:

### Functionality

- [ ] `specwiki list` discovers and groups specs per README table
- [ ] `specwiki generate` writes markdown + HTML wiki per README layout
- [ ] `--project`, `--output`, and `--verbose` flags work as documented
- [ ] Zero-spec projects exit cleanly with helpful message

### Meta / persistence

- [ ] `IMPLEMENTATION.md` build log complete through Phase 3
- [ ] `HARNESS.md` §0.2 lists all quality-gate scripts

### Code quality

- [ ] All §0.2 quality gate commands pass
- [ ] Coverage meets §0.1 threshold (90%)
- [ ] Comments follow §0.6
- [ ] Code cleanliness follows §0.7
- [ ] Structured logging follows §0.8
- [ ] Path/HTML safety follows §0.9

---

## 14. Quick-start commands

```bash
# from repo root
npm install
npm run dev list
npm run dev generate -- --verbose
npm run build
npm run typecheck
npm run test
npm run lint
npm run format
npm run coverage
npm start list
```
