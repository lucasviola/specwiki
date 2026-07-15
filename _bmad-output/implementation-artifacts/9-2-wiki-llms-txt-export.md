---
baseline_commit: 9d9f0ff918d9ac5ede13924b87ab5f3e97b268cd
---

# Story 9.2: wiki/llms.txt export

Status: review

## Story

As an AI agent or automation author,
I want `specwiki generate` to optionally emit an `llms.txt` manifest,
so that I can navigate the generated wiki through a compact, category-grouped machine-readable index.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `node --import tsx/esm src/cli.ts generate --emit-llms-txt --project tests/fixtures/sample-project --output /tmp/specwiki-llms-qa` writes `/tmp/specwiki-llms-qa/llms.txt`, beginning with `# Spec Wiki`, with category headings and links to generated wiki pages.

1. `specwiki generate --emit-llms-txt` preserves the existing discovery → parse → markdown/HTML generation pipeline and additionally writes `{output}/llms.txt`. Without the flag, no `llms.txt` file is written and all current command behavior remains unchanged.
2. The export follows the llms.txt Markdown convention: its first line is `# Spec Wiki`; it includes a concise blockquote identifying it as a generated index; it contains one `## <category label>` section per category that has generated pages, sorted by the existing human-facing category label; and each page is a list item in the form `- [<title>](<slug>.md): <description>`. The link is a wiki-relative Markdown path and descriptions are omitted rather than rendered as `undefined` or empty punctuation when unavailable.
3. The manifest includes every generated `WikiPage` once, preserves page order within each category from `buildWiki()`, and uses page `title`, `slug`, `category`, and `description` rather than rereading source files or scanning the output directory.
4. The `llms.txt` filename and write are confined to the resolved output directory using the existing output path-confinement guard. Directory/write failures propagate through the existing generate error and exit-code contract.
5. With `--verbose`, exactly one safe `output.write` event is emitted for `llms.txt`; it includes only `relativePath: "llms.txt"` and no source body, frontmatter, absolute source paths, or secrets.
6. Tests prove flag wiring, default-off behavior, deterministic category/page ordering, description omission, full page coverage, output path confinement/error behavior, and the verbose diagnostic. README documents the flag and output. No browser/e2e tests or new runtime dependencies.
7. The full HARNESS §0.2 quality gate passes with ≥90% coverage thresholds maintained for touched modules.

## Tasks / Subtasks

- [x] Deliver the opt-in llms.txt export vertical slice (AC: 1–7)
  - [x] Write failing focused output and command/CLI tests first, including ordering, missing descriptions, default-off behavior, confinement/error propagation, and verbose diagnostics.
  - [x] Add a focused output module that builds and safely writes the manifest from `WikiPage[]`, then invoke it only after the existing wiki writes when `emitLlmsTxt` is true.
  - [x] Add `--emit-llms-txt` to the `generate` Commander command and the shared generation options without changing `list`, `open`, or `init`.
  - [x] Document the opt-in flag and generated artifact in README.
  - [x] Run all six quality-gate commands, manually validate the demo path, and update `IMPLEMENTATION.md`.

## Dev Notes

### Product and scope

- E9 S9.2 satisfies FR-017 as an opt-in export. `--json` (S9.1) and an `llms-full.txt` concatenated-content export are out of scope.
- The project-local manifest is a generated wiki index, not a public web-hosted root file, so it uses safe wiki-relative links (`<slug>.md`) rather than inventing a deployment base URL. It must still follow the llms.txt structure: H1, summary blockquote, category H2s, and Markdown file lists.
- Category headings use `CATEGORY_LABELS[category] ?? category`, matching index presentation. Categories sort by label; `buildWiki()` page order is preserved inside every category.

### Current implementation intelligence

- `src/cli.ts` owns Commander flag wiring. `generate` forwards options to `generateWiki`; `list`, `open`, and `init` must not receive this new flag.
- `src/commands/generate.ts` orchestrates discovery, parsing, `buildWiki`, `writeWiki`, and `writeHtmlWiki`. Add the optional export after those writes. Its error boundary already emits `cli.error` and preserves CLI exit contracts.
- `src/output/wiki.ts` exports `assertPathConfined`, `buildWiki`, and writers. The new manifest code belongs in a focused `src/output/llms.ts` module that receives `WikiPage[]`, uses `CATEGORY_LABELS`, and uses `assertPathConfined` before writing.
- `WikiPage` already has `slug`, `title`, `category`, `sourcePath`, and `description`. Do not parse or scan a second time.
- `log.info("output.write", { relativePath: "llms.txt" })` is the established verbose-gated write event. On errors, log `output.error` with only the safe relative filename and error message.

### Architecture, security, and regression guardrails

- Preserve module direction: `cli.ts → commands/generate.ts → output/llms.ts`. Keep formatting and file I/O out of discovery and parsing.
- Do not alter frozen discovery patterns, category derivation, existing wiki output layout, HTML escaping, or slug collision behavior.
- Confine all writes to the resolved output directory through `assertPathConfined`. Do not allow category names, titles, or slugs to affect the output filename.
- Do not log raw markdown/source content, frontmatter, secrets, or absolute source paths.
- Existing uncommitted S9.1 and E19 changes are owner work in this shared checkout. Preserve them and change only files needed by S9.2.

### Testing requirements

- Follow strict TDD: add tests, observe their failure before production implementation, then implement minimally and refactor green.
- Add unit/integration coverage under `tests/output/` for formatting, deterministic grouping, description omission, safety/error behavior, and write logging. Add command tests under `tests/commands/generate.test.ts` and CLI integration tests in `tests/cli.test.ts` only where needed for flag/default behavior.
- Test rendered intent, not pixel output. Do not add browser/e2e tests.
- Run `npm run test`, `npm run lint`, `npm run format`, `npm run coverage`, `npm run typecheck`, and `npm run build`.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E9 — Agent Interoperability`]
- [Source: `_bmad-output/planning-artifacts/discovery/prd/prd.md#FR-017`]
- [Source: `_bmad-output/planning-artifacts/discovery/architecture/ARCHITECTURE-SPINE.md`]
- [Source: `https://llmstxt.org/` — H1, summary, H2 file-list convention]
- [Source: `src/cli.ts`, `src/commands/generate.ts`, `src/output/wiki.ts`]
- [Source: `HARNESS.md#0.1`, `#0.2`, `#0.8`, `#0.9`]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Terra

### Debug Log References

- Story context created 2026-07-15 from E9 planning, FR-017, current command/output code, prior S9.1 implementation, and llmstxt.org format guidance.
- Red: focused output tests initially failed because `src/output/llms.ts` did not exist; command integration then failed because the `emitLlmsTxt` option was not yet wired.
- Green: output, command, and spawned-CLI tests verify the opt-in manifest, category and page ordering, missing descriptions, safe error logging, and default-off behavior.
- Quality gate: 352 tests pass; coverage is 95.83% statements/lines and 90.10% branches.
- Manual validation: the direct CLI demo generated a category-grouped `llms.txt` and emitted the safe verbose `output.write` event.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Added an opt-in `generate --emit-llms-txt` export using existing generated `WikiPage` metadata.
- Added safe output confinement and structured `output.write` / `output.error` diagnostics for the manifest.
- Documented the flag and artifact, while leaving default generate output unchanged.

### File List

- _bmad-output/implementation-artifacts/9-2-wiki-llms-txt-export.md
- src/types.ts
- src/cli.ts
- src/commands/generate.ts
- src/output/llms.ts
- tests/output/llms.test.ts
- tests/commands/generate.test.ts
- tests/cli.test.ts
- README.md
- IMPLEMENTATION.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-07-15 — Created E9 S9.2 implementation story and developer guardrails.
- 2026-07-15 — Added opt-in `--emit-llms-txt` manifest generation with focused output, command, and CLI coverage.

## QA Manual Validation

**QA model:** claude-sonnet-5-thinking-high  
**Review date:** 2026-07-15

### AC coverage

- AC1–3: output, command, and CLI tests cover opt-in wiring, default-off behavior, category ordering, page ordering, and description omission.
- AC4–5: output tests cover the existing confinement guard, write-failure propagation, safe `output.error`, and verbose `output.write`.
- AC6–7: README documents the flag; no dependencies or browser tests were added; full quality gate passed with 352 tests and 90.10% branches.

### Regression risks

- `--emit-llms-txt` is additive and isolated to `generate`; future category-sort changes could diverge from the markdown index if only one implementation is updated.
- When output is the project root, the generated `llms.txt` can overwrite a discovered root source `llms.txt`; this is tracked as a review Patch item below.

### Gaps

- Tests assert the `llms.txt` write event is present but do not count it explicitly.
- Tests do not independently count all rendered page links against the input page count.

### Manual validation steps

1. `npm test` — expect all suites to pass, including `tests/output/llms.test.ts`, command coverage, and CLI integration coverage.
2. `npm run coverage` — expect all global coverage thresholds to pass at or above 90%.
3. `npm run lint && npm run format && npm run typecheck && npm run build` — expect all commands to exit 0.
4. `node --import tsx/esm src/cli.ts generate --emit-llms-txt --project tests/fixtures/sample-project --output /tmp/specwiki-llms-qa` — expect normal generate output and `/tmp/specwiki-llms-qa/llms.txt`.
5. `cat /tmp/specwiki-llms-qa/llms.txt` — expect `# Spec Wiki`, the generated-index blockquote, category headings sorted by label, and local Markdown page links.
6. `node --import tsx/esm src/cli.ts generate --project tests/fixtures/sample-project --output /tmp/specwiki-llms-off-qa && test -f /tmp/specwiki-llms-off-qa/llms.txt && echo FOUND || echo NOT_FOUND` — expect `NOT_FOUND`, proving the export is opt-in.
7. `node --import tsx/esm src/cli.ts generate --emit-llms-txt --verbose --project tests/fixtures/sample-project --output /tmp/specwiki-llms-qa2 >/dev/null 2>/tmp/specwiki-llms-err && rg '"relativePath":"llms.txt"' /tmp/specwiki-llms-err` — expect one safe `output.write` log for `llms.txt`.
8. `rm -rf /tmp/specwiki-llms-qa /tmp/specwiki-llms-off-qa /tmp/specwiki-llms-qa2 /tmp/specwiki-llms-err` — removes temporary validation artifacts.

## Senior Developer Review (AI)

**Review date:** 2026-07-15  
**Review outcome:** Changes Requested  
**Reviewer model:** claude-sonnet-5-thinking-high

### Action Items

- [ ] [Medium][Patch] `src/output/llms.ts`: flatten single-newline descriptions so every generated manifest entry remains a single Markdown list-item line.
- [ ] [Medium][Patch] `src/commands/generate.ts`: reject or otherwise prevent `--emit-llms-txt --output .` from overwriting a discovered root `llms.txt` source file.

### Review Findings

- `page.description` can contain single newlines and is currently appended verbatim, which can split one llms.txt list item across lines.
- A root `llms.txt` is discoverable; using project root as output with the export enabled writes over that source after reading it.
