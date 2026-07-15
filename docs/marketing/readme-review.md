# README publication review — [[specwiki]]

**Reviewer:** Sally (UX Designer)  
**Date:** 2026-07-15  
**Scope:** `README.md` against publication checklist for first npm release  
**Inputs:** `README.md`, `package.json`, product brief, `docs/brand/BRAND.md`

---

## Executive summary

The README is technically accurate in its **Usage** section but misaligned for publication: the **Install** section leads with contributor setup (`npm install`, `npm link`) while Usage already shows `npx specwiki`. A first-time visitor cannot tell how to try the tool without cloning the repo. The opening lacks a problem statement and the canonical `[[specwiki]]` wordmark. Feature coverage (JSON, llms.txt, open) is strong once readers scroll past Install.

**Publication readiness:** Not ready until blockers are resolved. Estimated effort: one focused rewrite of Install + opening (~30 minutes).

---

## Checklist results

| Area             | Status      | Notes                                                                                              |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| First impression | **Fail**    | No problem/solution above the fold; title is plain `specwiki`, not `[[specwiki]]` wordmark         |
| Install          | **Fail**    | Dev install is primary; no `npx specwiki` or `npm install -g specwiki`; Node ≥20 not stated        |
| Quick start      | **Partial** | Usage has full command set but no 3-step consumer path before the full reference                   |
| Features         | **Pass**    | Discovery table accurate; JSON, llms.txt, open documented                                          |
| Output           | **Pass**    | `wiki/` tree matches actual generate output                                                        |
| Contributor      | **Partial** | Development section exists but lacks `npm run setup-hooks`; no clear separation from consumer path |
| Trust            | **Partial** | MIT license present; no Node engine badge; no CI badge (optional pre-publish)                      |
| npm page         | **Partial** | Opening line close to `package.json` description but could align exactly                           |

---

## Findings by severity

### Blocker

1. **Install section contradicts Usage**
   - **Issue:** Install shows `npm install` → `npm run build` → `npm link`. Usage shows `npx specwiki`. A consumer following Install cannot run the documented commands.
   - **Fix:** Add **Install for users** first with `npx specwiki` (no install) and `npm install -g specwiki`. Move clone/build/link under **Development**.

2. **No value proposition in first screen**
   - **Issue:** Opens with a generic tagline; does not answer "why would I use this?"
   - **Fix:** Lead with JTBD hook and one-liner from product brief (see rewrite suggestions).

3. **Node.js requirement invisible**
   - **Issue:** `package.json` requires Node ≥20; README never mentions it.
   - **Fix:** State `Node.js 20+` in Install section.

### Should-fix

4. **Missing consumer quick-start**
   - **Issue:** Full Usage block is excellent reference but overwhelming for first run.
   - **Fix:** Add **Quick start** with three commands: `list` → `generate` → `open`.

5. **Wordmark not used**
   - **Issue:** Brand guide requires `[[specwiki]]` text wordmark in product chrome; README uses plain `specwiki` as H1.
   - **Fix:** Use `[[specwiki]]` in title and first mention per `docs/brand/BRAND.md`.

6. **Contributor hooks undocumented**
   - **Issue:** S13.1 removed consumer `prepare` hook; contributors need `npm run setup-hooks` after clone.
   - **Fix:** Add to Development section.

7. **Opening misaligned with npm description**
   - **Issue:** `package.json` says "Transform AI specs into structured wiki-like documentation"; README says "Transform AI specs in any project into structured, wiki-like documentation."
   - **Fix:** Align opening sentence with description field for npm page consistency.

### Nice-to-have

8. **Trust badges**
   - **Suggestion:** Add shields for license (MIT), Node engine (≥20), and CI (once green on `main`). Defer npm version badge until first publish.

9. **"Why [[specwiki]]?" section**
   - **Suggestion:** Short bullet list of pain points (scattered rules, context loss, cross-tool duplication) from product brief — helps HN/Reddit visitors who land from README.

10. **`specwiki init` command**
    - **Suggestion:** CLI ships `init` for config scaffolding; optional one-liner in Development or advanced usage — not required for consumer quick-start.

11. **Link to brand assets**
    - **Suggestion:** For contributors writing docs, link `docs/brand/BRAND.md` from Development section.

---

## Concrete rewrite suggestions

### Suggested opening (replaces lines 1–5)

```markdown
# [[specwiki]]

Transform AI specs into structured wiki-like documentation.

**One command → categorized wiki from scattered agent specs.**

[[specwiki]] discovers AI agent instructions, spec-driven development artifacts, and framework outputs scattered across a repository, then synthesizes them into a categorized, browsable wiki (markdown + HTML). It discovers and synthesizes — it does not author specs, run agents, or host documentation.

**Requires Node.js 20+.** MIT licensed.
```

### Suggested Install section (consumer first)

````markdown
## Install

### For users

```bash
# Try without installing
npx specwiki list

# Or install globally
npm install -g specwiki
```
````

### For contributors

Clone this repo, then:

```bash
npm install
npm run build
npm run setup-hooks   # optional: install git hooks
npm link              # optional: use `specwiki` globally from source
```

````

### Suggested Quick start (new section before Usage)

```markdown
## Quick start

```bash
npx specwiki list      # preview what will be indexed
npx specwiki generate  # write wiki/ (markdown + HTML)
npx specwiki open      # open the HTML wiki in your browser
````

```

### Suggested Development section additions

- Document `npm run setup-hooks` explicitly.
- Keep quality-gate commands optional (`npm test`, etc.) — do not make them part of consumer story.

---

## Approval gate

The following blockers and should-fix items were applied in `README.md` as part of story S13.3 implementation:

- [x] Blocker 1 — consumer Install path
- [x] Blocker 2 — value proposition above the fold
- [x] Blocker 3 — Node.js 20+ visible
- [x] Should-fix 4 — quick-start section
- [x] Should-fix 5 — `[[specwiki]]` wordmark
- [x] Should-fix 6 — `setup-hooks` in Development
- [x] Should-fix 7 — npm description alignment

Nice-to-have items 8–11 remain optional for post-publish polish.

---

## References

- Product brief: `_bmad-output/planning-artifacts/discovery/product-brief.md`
- Brand guide: `docs/brand/BRAND.md`
- S13.1 package contract: `_bmad-output/implementation-artifacts/13-1-npm-publish-preparation.md`
```
