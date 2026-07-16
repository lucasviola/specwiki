---
baseline_commit: d83abb9
supersedes: story/20-1-landing-page-narrative branch (v1 implementation, status was review)
---

# Story 20.1: Landing-Page Narrative and Brand Treatment (v2)

Status: review

## Story

As a prospective user,
I want a distinctive, information-rich landing page that explains how SpecWiki makes AI knowledge useful to humans,
so that I can understand the problem it solves, see it working, and install it in under a minute.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Open `site/index.html` in a browser → hero states "Make AI knowledge useful to humans." with the three-block narrative, quick-start terminal, and agent prompt → scroll through problem, how-it-works, live spec→wiki example, and facts sections → primary CTA links to the GitHub repository.

**Binds:** E20 S20.1 | **Depends:** Canonical brand kit in `docs/brand/BRAND.md` | **CTA destination:** `https://github.com/lucasviola/specwiki` (owner-confirmed 2026-07-16; npm package not yet published — swap to npm page after 1.0.0 ships)

### Why v2

The v1 page (branch `story/20-1-landing-page-narrative`) satisfied the epic ACs but was too basic: hero + three paragraphs + one CTA, very little information. Owner direction for v2 (2026-07-16):

1. **Stand out.** Design reference: [mempalaceofficial.com](https://mempalaceofficial.com/) — also an AI tool. Editorial, dense, numbered sections, monospace accents, terminal-styled code blocks. SpecWiki's page must feel equally deliberate, not like a default template.
2. **Keep the v1 narrative copy** — owner explicitly likes it (verbatim blocks below).
3. **Hero must include** a quick-start code snippet (from README) and a copy-pasteable prompt for an AI agent to install specwiki.
4. **Dedicated problem section** — what's wrong with AI specs today and how specwiki fixes it.
5. **Live example section** — a spec→wiki walkthrough using the `examples/` folder.
6. **Mine the README** for other supportable facts (what-it-finds table, output layout, self-contained HTML, tech stack).

## Page Structure (owner-specified)

### Section 1 — Hero (catchy, information-dense)

- `h1` with the exact value proposition: **"Make AI knowledge useful to humans."** (epic AC, verbatim, unchanged)
- The three narrative blocks, kept **verbatim** from v1 (owner-approved copy):

> **Knowledge written for machines**
> AI-era projects accumulate knowledge fast — agent rules, spec-driven development files, generated plans — scattered across dot-folders and conventions built for tools, not teammates. That knowledge is hard for people to find and understand.
>
> **One command, a real wiki**
> specwiki scans your project for that knowledge and generates a navigable wiki from it: categorized pages, an index, and a browsable HTML view with search — no server, no lock-in, straight from the files already in your repo.
>
> **Understanding people can share**
> The result is shared, usable understanding: reviewers, stakeholders, and new teammates browse the same trustworthy view of what the project knows about itself — without spelunking through config folders.

- **Quick-start terminal block** (styled like a terminal window, MemPalace-style), copy from README "For users":

```bash
# Try without installing
npx specwiki generate && npx specwiki open

# Or install globally
npm install -g specwiki
```

- **Agent install prompt** — a second copyable block labeled for AI agents ("or paste this into your agent"), e.g.:

```text
Install specwiki in this repo: run `npx specwiki generate && npx specwiki open`,
then summarize the generated wiki index for me.
```

- Primary CTA: "View source on GitHub" → `https://github.com/lucasviola/specwiki`.

### Section 2 — The problem

Explain the current issue with AI specs and how specwiki solves it. Source material (all supportable from README/epics):

- Problem framing: every AI tool invents its own convention — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/**`, `_bmad-output/**`, `openspec/**`, `.kiro/specs/**`, `.github/copilot-instructions.md` — knowledge that agents read but humans never browse. It rots invisibly in dot-folders; reviewers and new teammates can't find it, and nobody trusts what they can't see.
- Solution framing: specwiki discovers all of it with one command and synthesizes a categorized, searchable wiki. Use the README "What it finds" table (sources × patterns) as a visual element here — it is concrete proof of coverage.

### Section 3 — How it works

Short mechanism strip (discover → parse → generate → open), MemPalace "four pieces" style. Supportable facts from README:

- **Discover:** fast-glob scan of known agent/spec conventions plus all project markdown; ignores `node_modules`, `dist`, `wiki`, etc.
- **Generate:** categorized markdown pages + index + browsable HTML with client-side search (lunr), highlight.js code blocks, Wikimedia-inspired design tokens.
- **Self-contained:** bundled CSS/JS, system fonts, `file://`-safe — no server, no CDN, no lock-in.
- **Agent-friendly out too:** `--json` machine-readable output and `--emit-llms-txt` manifest.

### Section 4 — Live example: spec → wiki

A concrete before/after walkthrough using `examples/agent-harness-parcel` (the simplest example: `README.md` + `AGENTS.md` + `CLAUDE.md`):

- **Left/before:** a file-tree panel showing the scattered inputs (`README.md`, `AGENTS.md`, `CLAUDE.md` — "the three root files many AI tools read first").
- **Command strip** between them (from `examples/README.md`):

```bash
npx specwiki generate --project examples/agent-harness-parcel
npx specwiki open --project examples/agent-harness-parcel
```

- **Right/after:** a static mock of the generated wiki (index with category groups, page links, search box) rendered as an HTML/CSS panel — **not** an iframe or live embed; the page must stay static and dependency-free.
- Link to the [`examples/`](https://github.com/lucasviola/specwiki/tree/main/examples) folder on GitHub for the other two demos (BMAD research, article research).

### Section 5 — Facts strip + final CTA

- Output layout (from README): `wiki/index.md`, one page per spec, `wiki/html/` browsable tree, optional `llms.txt`.
- Node.js 20+, MIT licensed, TypeScript, zero-config by default.
- Repeat CTA (GitHub) + footer: GitHub link · MIT License.

## Acceptance Criteria

### Functional

1. Hero uses the exact value proposition verbatim: **"Make AI knowledge useful to humans."**
2. Hero section contains the three v1 narrative blocks verbatim (headings and body text exactly as quoted above).
3. Hero contains the quick-start snippet (`npx specwiki generate && npx specwiki open` and `npm install -g specwiki`) in a terminal-styled block, and a distinct copy-pasteable agent-install prompt block.
4. A problem section explains why AI specs are hard for humans today (scattered tool conventions, dot-folders) and how specwiki solves it, including the sources/patterns coverage from the README "What it finds" table.
5. A how-it-works section presents discover → generate → open with the self-contained/no-server/no-lock-in facts.
6. A live-example section shows the spec→wiki workflow for `examples/agent-harness-parcel`: input file tree, the real generate/open commands from `examples/README.md`, and a static mock of the resulting wiki index; it links to the examples folder on GitHub.
7. Primary CTA links to `https://github.com/lucasviola/specwiki`; no npm-page CTA until the package is published.
8. Canonical `[[specwiki]]` wordmark is visible in the header and follows all variant, color, typography, casing, and clear-space rules in `docs/brand/BRAND.md` (lowercase `[[specwiki]]`, monospace 700, brackets in primary accent, ≥ `1em` clear space).
9. Logo has meaningful accessible text; decorative duplicates (bracket spans) are hidden from assistive technology; "Spec Wiki" title case never appears in product chrome.
10. All product claims on the page are supportable from the README or epics file — no invented metrics, testimonials, or unshipped features.

### Design (stand-out treatment)

11. The page is a distinctive editorial design in the spirit of mempalaceofficial.com — **dark-first** (dark theme is the default presentation), numbered/labeled sections, monospace accents, generous whitespace, terminal-window styling on code blocks — while using **only** canonical BRAND.md color tokens (dark set as default: `#eaecf0` / `#6b8fe8` / `#16181c`; light set may back a `prefers-color-scheme: light` override). Neutral shades derived for surfaces/borders must be visibly consistent with the token palette.
12. No web fonts, no CDN assets, no client-side JavaScript required for content, navigation, or CTAs (copy-to-clipboard enhancement, if any, must degrade gracefully). Page stays `file://`-safe.

### Logging & diagnostics (§0.8)

13. Static marketing asset outside the CLI runtime — no `src/` code paths change; no new structured log events required; existing CLI logging untouched.

### Quality measures

14. Automated tests verify: verbatim value proposition, verbatim narrative blocks, quick-start commands, agent prompt block, GitHub CTA, example commands, wordmark markup/casing, brand tokens in CSS, and absence of "Spec Wiki" title case.
15. The complete HARNESS §0.2 quality gate passes; CLI package behavior and frozen generated-wiki contracts remain unchanged; `site/` stays out of the npm tarball.

## Tasks / Subtasks

- [x] RED: extend/rewrite `tests/site/landing.test.ts` for all v2 content ACs (AC: 1–10, 14)
  - [x] Verbatim hero value prop + three narrative blocks (whitespace-normalized — Prettier wraps HTML text, see v1 debug log)
  - [x] Quick-start commands, agent prompt block, GitHub CTA href
  - [x] Example section: `--project examples/agent-harness-parcel` commands present
  - [x] Wordmark structure, `aria-hidden` brackets, accessible name, no "Spec Wiki"
  - [x] CSS uses canonical brand tokens; dark set is the default (`:root`)
- [x] GREEN: rebuild `site/index.html` with the five-section structure (AC: 1–10)
- [x] GREEN: rebuild `site/assets/landing.css` — dark-first editorial treatment, terminal-block styling, static wiki-mock panel (AC: 11–12)
- [x] Fix carried-over v1 review finding: wordmark home link must use `href="index.html"`, not `href="/"` (breaks under `file://` and subdirectory hosting)
- [x] REFACTOR: confirm no `src/` changes, `npm pack --dry-run` excludes `site/`
- [x] Update `IMPLEMENTATION.md`; run full quality gate, §0.2.5 code review, §0.2.6 QA analysis

## Dev Notes

### Prior art — v1 on branch `story/20-1-landing-page-narrative`

- v1 delivered `site/index.html`, `site/assets/landing.css`, `tests/site/landing.test.ts` (12 tests, gate green). **This story supersedes it**; reuse the test-file pattern (read HTML/CSS as text, assert content) and brand-token CSS scaffolding, but the page itself is a full redesign — do not just append sections to the v1 markup.
- Carried-over open review item (Medium): `href="/"` on the wordmark link → use `index.html`.
- v1 debug learnings: narrative-phrase assertions need whitespace normalization (Prettier wraps HTML text across lines); run `prettier --write` on new HTML before the format gate.
- Decide with the owner at implementation time whether to build on that branch or recreate on a fresh branch from `main` (v1 branch also touches `IMPLEMENTATION.md` and `sprint-status.yaml`).

### Design direction (MemPalace reference, translated to specwiki)

- MemPalace traits worth borrowing: numbered section labels (`i`, `ii`, … or `01`–`05`) with small-caps kickers; a strong single-statement hero; verbatim-content panels styled as artifacts (their "drawer/pointer" pair maps to our "scattered specs / generated wiki" pair); a closing terminal block as the CTA moment; restrained two-tone palette with one accent.
- specwiki translation: monospace kickers and section numbers in `--color-primary`; body in system sans; code/terminal blocks in the brand monospace stack; the wiki-mock panel in Section 4 is the visual centerpiece — make it read instantly as "a real wiki came out of these three files."
- Dark-first: default `:root` uses the BRAND.md dark tokens; optional light override via `prefers-color-scheme: light`. This inverts v1 (light-first) deliberately — marketing surface, owner wants it to stand out. The header wordmark must use the dark-surface variant colors by default.
- Derived neutrals (panel backgrounds, borders, muted text) are permitted where BRAND.md has no token, but must stay in the same families (e.g. lightened/darkened `#16181c` surfaces, translucent `#eaecf0` text) — the brand-review AC checks that the _canonical_ tokens are present and used for wordmark, accents, and base text/background.

### Content sourcing (keep claims supportable)

- Quick start, what-it-finds table, output tree, self-contained HTML facts, tech stack, Node 20+, MIT: `README.md`.
- Example commands and framing ("the three root files many AI tools read first"): `examples/README.md`, `examples/agent-harness-parcel/README.md`.
- Wiki-mock panel content: derive from what `specwiki generate --project examples/agent-harness-parcel` actually produces (run it locally to check page titles/categories) — but embed as static HTML, no generated files copied into `site/`.
- Do not claim npm availability, stars, users, performance numbers, or hosting (S20.3 scope).

### Testing Requirements

- `tests/site/landing.test.ts` reads `site/index.html` + `site/assets/landing.css` as text; Vitest coverage `include` is `src/**` only, so site files don't affect thresholds.
- Full §0.2 gate: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Project Structure Notes

- REWRITE: `site/index.html`, `site/assets/landing.css`, `tests/site/landing.test.ts`
- UPDATE: `IMPLEMENTATION.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
- No changes to `src/`, npm `files` allowlist, default patterns, or generated-wiki output contracts.
- Responsive/a11y hardening (320px, WCAG AA audit, keyboard focus) remains S20.2 scope; still write semantic HTML (landmarks, single `h1`, ordered headings) now.
- Hosting/deployment remains S20.3 scope.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` — E20 and S20.1]
- [Source: `docs/brand/BRAND.md` — wordmark, color tokens, typography, usage notes]
- [Source: `README.md` — install, what-it-finds, output, tech stack]
- [Source: `examples/README.md`, `examples/agent-harness-parcel/*` — live example content]
- [Source: branch `story/20-1-landing-page-narrative` — v1 implementation and review findings]
- [Design reference: https://mempalaceofficial.com/ — owner-cited, 2026-07-16]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]

## Dev Agent Record

### Agent Model Used

Fable 5 (Cursor), 2026-07-16.

### Debug Log References

- RED confirmed: 26 new tests failed with `ENOENT site/index.html` (fresh recreation on `main`, not the v1 branch — v1 files never merged, so failure mode is missing files rather than failing assertions).
- One GREEN iteration: `&nbsp;` in the hero h1 broke the verbatim value-prop assertion; removed the entity, text normalization in the test also unescapes `&amp;`/`&lt;`/`&gt;` for the terminal blocks.
- Verified real generated output for the wiki mock by running `generate --project examples/agent-harness-parcel` locally: 3 pages, category "Project Root", page titles "Agent Instructions" / "Claude Instructions" / "Readme".
- `npm pack --dry-run` lists no `site/` or `tests/` entries (`files` allowlist is `dist`, `README.md`, `LICENSE`).

### Completion Notes List

- Built the v2 landing page as a fresh implementation on `main` (v1 branch `story/20-1-landing-page-narrative` superseded, per story frontmatter) — five sections: hero (verbatim value prop + three v1 narrative blocks + quick-start terminal + agent-prompt block + GitHub CTA), problem (scattered conventions + full README what-it-finds table), how-it-works (discover/generate/open/agent-friendly steps), live example (file tree → command strip → static wiki-mock panel, linked to GitHub examples), facts strip (output tree, Node 20+, TypeScript, zero-config, MIT) + closing CTA and footer.
- Dark-first CSS: `:root` carries canonical BRAND.md dark tokens (`#eaecf0`/`#6b8fe8`/`#16181c`); light set backs a `prefers-color-scheme: light` override; derived neutrals stay in-family. Editorial treatment: monospace numbered kickers in `--color-primary`, terminal-window chrome on code blocks, no web fonts/CDN/JS.
- Fixed carried-over v1 review finding: wordmark home link uses `href="index.html"`.
- Static asset only — no `src/` changes, no new structured log events (AC 13); `site/` stays out of the npm tarball (AC 15).
- ✅ Resolved review finding [Medium]: wiki mock now shows the `Main Page` portal heading the real generated index renders.
- ✅ Resolved review finding [Medium]: example link targets the `examples/agent-harness-parcel` subfolder.
- ✅ Resolved review finding [Medium]: section 04 states the "from the specwiki repo root" prerequisite. All three guarded by new tests (29 landing tests total).

### File List

- `site/index.html` (new)
- `site/assets/landing.css` (new)
- `tests/site/landing.test.ts` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/20-1-landing-page-narrative-and-brand-treatment.md` (modified)
- `IMPLEMENTATION.md` (modified)

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-16
**Review outcome:** Changes Requested (3 Medium findings, all triaged Patch)
**Reviewer model:** gpt-5.6-sol-medium (Bugbot subagent)

### Action Items

- [x] [Medium][Patch] Wiki-mock heading: real generated index renders `Main Page` as the portal h1 before the README-derived `Parcel Path (mock)` heading; mock shows only the latter (`site/index.html` wiki-mock panel) — fixed 2026-07-16, owner-approved
- [x] [Medium][Patch] Example link labeled `examples/agent-harness-parcel` points at the parent `examples` tree, not the subfolder (`site/index.html` section 04) — fixed 2026-07-16, owner-approved
- [x] [Medium][Patch] Section 04 commands use a repo-root-relative `--project` path but never state the "from the specwiki repo root" prerequisite (`site/index.html` section 04) — fixed 2026-07-16, owner-approved

### Review Findings

| Severity | Location                          | Finding                                                                        | Triage |
| -------- | --------------------------------- | ------------------------------------------------------------------------------ | ------ |
| Medium   | `site/index.html` wiki-mock panel | Mock omits the `Main Page` portal heading the real generated index shows       | Patch  |
| Medium   | `site/index.html` section 04      | Link text `examples/agent-harness-parcel` targets the parent `examples` folder | Patch  |
| Medium   | `site/index.html` section 04      | Example commands assume the specwiki repo root without saying so               | Patch  |

## QA Manual Validation

<!-- Populated after HARNESS §0.2.6 QA analysis subagent. -->

**QA model:** gpt-5.6-sol-medium (generalPurpose subagent, read-only)
**Review date:** 2026-07-16

### AC coverage

All 15 ACs mapped: ACs 1–9, 11 (token half), 12, and 14 are covered by named tests in `tests/site/landing.test.ts` (26 tests). AC 10 (supportable claims), AC 11 (visual distinctiveness), AC 13 (no `src/` change), and AC 15 (gate + tarball) rest on manual checks — automated claims check only rejects metric/testimonial patterns.

### Regression risks

- CLI/runtime risk low: no `src/`, dependency, script, or `files` allowlist changes; `site/` excluded from the tarball by the explicit allowlist.
- New tests depend on `site/` existing at the repo root; renaming the folder breaks them.
- `eslint.config.js` now ignores `examples/**` (pre-existing owner edit carried in this working tree) — future lint regressions in examples go unnoticed.

### Gaps

- No real-browser validation of layout, responsive overflow, dark/light rendering, or `file://` loading (visual review is manual; 320px/WCAG hardening is S20.2 scope).
- `1em` clear-space assertion checks CSS text, not measured geometry.
- Several tests search the whole document, not the intended section; coverage-table test samples patterns rather than checking all ten rows.
- No-script test rejects external scripts only; inline JS would pass (none present).

### Manual validation steps

1. `open site/index.html` — page loads over `file://` with five numbered sections, dark theme by default, terminal-styled code blocks, static wiki-mock panel, and working GitHub links
2. `npm test -- tests/site/landing.test.ts` — all 26 landing-page tests pass
3. `npm pack --dry-run` — tarball lists `dist/`, `README.md`, `LICENSE` only; no `site/` or `tests/` entries
4. `git status --short` — no `src/` files among the changes
5. `npm test` — full suite passes (399 tests), frozen generated-wiki contracts intact
6. In the browser, toggle macOS System Settings → Appearance to Light — page re-renders with the light token set (`#202122` text on `#ffffff`)

## Change Log

- 2026-07-16: Story rewritten (v2) per owner direction — stand-out MemPalace-style treatment, hero with verbatim v1 narrative + quick start + agent prompt, problem section, how-it-works, live spec→wiki example from `examples/`, facts strip. Supersedes v1 on branch `story/20-1-landing-page-narrative`.
- 2026-07-16: v2 implemented on `main` — new `site/index.html`, `site/assets/landing.css`, `tests/site/landing.test.ts` (26 tests); v1 `href="/"` review finding fixed; full §0.2 gate green (399 tests); §0.2.5 review found 3 Medium Patch items (pending owner decision); status → review.
- 2026-07-16: Addressed code review findings — 3 items resolved with owner approval (Main Page portal heading in wiki mock, subfolder example link, repo-root prerequisite note); 3 new guard tests (29 landing tests, 402 total); gate re-run green; §0.2.5 re-review clean.
