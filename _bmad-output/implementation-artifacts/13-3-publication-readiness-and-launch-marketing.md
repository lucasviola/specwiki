---
baseline_commit: 8519692
---

# Story 13.3: Publication readiness and launch marketing

Status: review

## Story

As an open-source maintainer preparing the first npm release,
I want a UX-led README review and channel-specific launch copy grounded in market research,
so that the public-facing package story is clear, credible, and ready to promote on Reddit, LinkedIn, and other developer channels.

## Acceptance Criteria

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓  
**Demo path:** Open `README.md` and `docs/marketing/launch-copy.md` — README passes the publication checklist; launch pack includes Reddit, LinkedIn, Hacker News, X/Twitter, and one additional channel; all copy aligns with product brief positioning and `docs/brand/BRAND.md`.

1. **UX README review (Sally):** Invoke the UX designer agent (`bmad-agent-ux-designer`) to review `README.md` against a publication checklist covering: value proposition in the first screen; consumer path (`npx specwiki`) vs contributor path (`git clone`, `npm install`, `npm run build`); Node.js ≥20; MIT license; command examples that match the shipped CLI; accurate feature list (discovery, generate, open, JSON, llms.txt); no dev-only install as the primary story. Produce `docs/marketing/readme-review.md` with findings grouped by severity (blocker / should-fix / nice-to-have) and concrete rewrite suggestions.
2. **README publication update:** Apply owner-approved README edits from the UX review. Preserve technical accuracy — every documented command must work against the built CLI. Distinguish **Install for users** (`npx specwiki` / `npm install -g specwiki`) from **Development** (clone + build). Do not remove contributor setup; demote it below the consumer path.
3. **Market research:** Invoke the market research workflow (`bmad-market-research`) with topic scoped to specwiki's launch niche: cross-framework AI spec discovery and wiki synthesis for solo developers. Web search is required. Produce `docs/marketing/market-research.md` covering: target audience (Persona A primary, Personas B/C secondary); competitive alternatives and gaps (IDE browsers, SDD frameworks, SSGs, manual README curation); positioning statement; recommended launch channels with rationale; messaging guardrails (specwiki discovers and synthesizes — it does not author specs, run agents, or host docs).
4. **Launch copy pack:** Generate `docs/marketing/launch-copy.md` with channel-specific drafts, each including headline/hook, body, CTA, and suggested hashtags or subreddit notes where relevant. Minimum channels: **Reddit**, **LinkedIn**, **Hacker News (Show HN)**, **X/Twitter**, plus **one** of Dev.to or Product Hunt. Copy must be grounded in market research and product brief; cite the core job-to-be-done ("one command → categorized wiki from scattered agent specs").
5. **Brand compliance:** All public-facing copy uses the canonical `[[specwiki]]` text wordmark per `docs/brand/BRAND.md`. Never "Spec Wiki" or icon substitutes. Tone: developer-credible, concise, no hype superlatives unsupported by product capabilities.
6. **Artifact layout:** All marketing deliverables live under `docs/marketing/`:
   - `readme-review.md` — UX findings report
   - `market-research.md` — research narrative with citations
   - `launch-copy.md` — channel variants with usage notes (length limits, posting etiquette)
7. **Scope boundary:** This story does not publish to npm, post to social platforms, create ad spend, configure analytics, or automate release marketing. E20 owns specwiki.ai landing page; S13.1 owns npm package contract. No application source changes unless README command examples require a one-line fix for accuracy (prefer README correction over code change).
8. **Verification:** Owner reviews all three marketing artifacts and the updated README. Spot-check documented commands: `npx specwiki --help`, `npx specwiki list --help`, `npx specwiki generate --help` match README examples.

## Tasks / Subtasks

- [x] UX README publication review (AC: 1)
  - [x] Load Sally (`bmad-agent-ux-designer`) with current `README.md`, `package.json`, product brief, and brand guide
  - [x] Run structured checklist review; write `docs/marketing/readme-review.md`
  - [x] Present blockers and should-fix items to owner for approval before editing README
- [x] Apply README publication updates (AC: 2, 8)
  - [x] Rewrite Install/Usage sections per approved UX findings
  - [x] Add or refine consumer quick-start (`npx specwiki list` → `npx specwiki generate` → `npx specwiki open`)
  - [x] Spot-check all command examples against built CLI
- [x] Market research for launch positioning (AC: 3)
  - [x] Run `bmad-market-research` scoped to AI spec discovery / SDD documentation synthesis niche
  - [x] Incorporate existing `domain-research.md` and `product-brief.md` — extend, do not duplicate blindly
  - [x] Write `docs/marketing/market-research.md` with citations
- [x] Generate launch copy pack (AC: 4, 5, 6)
  - [x] Draft channel-specific copy informed by research
  - [x] Include posting guidance (Reddit: value-first, no link-dropping; HN: Show HN format; LinkedIn: professional narrative)
  - [x] Write `docs/marketing/launch-copy.md`
- [x] Owner review and sign-off (AC: 7, 8)
  - [x] Owner approves README and marketing artifacts
  - [x] Update `IMPLEMENTATION.md` with story outcome and artifact paths

## Dev Notes

### Product and scope

- **Market-oriented story.** Primary deliverables are documentation and copy, not CLI features. Use BMad agent skills for structured UX and research workflows rather than ad-hoc prose.
- **Depends on S13.1** for the consumer npm contract (`npx specwiki`, `files` allowlist, no consumer `prepare` hook). If S13.1 README tasks overlap (consumer vs contributor install), reconcile rather than contradict.
- **Parallel with S13.2** is fine — CI workflow does not block marketing prep.
- **E20 gate** references npm publish + landing page; S13.3 prepares README and outbound copy that E20 and first npm release can reuse. Do not build specwiki.ai in this story.

### Current README gaps (from implementation intelligence)

- Install section describes local dev (`npm install`, `npm link`) but not consumer `npx specwiki` or global install — S13.1 AC 6 explicitly requires this distinction.
- Usage section already shows `npx specwiki` examples; Install section is misaligned with Usage.
- No badges (npm version, license, Node engine) — UX review should decide if badges add trust pre-publish vs post-publish. S13.2 adds `.github/workflows/ci.yml`; a CI badge is viable once the workflow is green on `main`.
- No "Why specwiki?" or problem statement above the fold — product brief has strong copy to adapt (see **Positioning copy blocks** below).
- License section exists (MIT) — keep.
- `package.json` description is `"Transform AI specs into structured wiki-like documentation"` — README opening line should align; npm page inherits this field.
- S13.1 moved git hooks to `npm run setup-hooks` (no consumer `prepare` hook). Contributor section must document `setup-hooks` explicitly; do not resurrect `prepare`-based hook setup in README.
- `docs/marketing/` does not exist yet — create the directory when writing the first artifact.

### Positioning copy blocks (from product brief — adapt, do not invent)

- **One-liner:** "specwiki discovers AI agent instructions, spec-driven development artifacts, and framework outputs scattered across a repository, then synthesizes them into a categorized, browsable wiki."
- **Vision:** "For developers who use AI coding agents, specwiki is a CLI documentation synthesizer that discovers and unifies agent specs, rules, and skills into a browsable wiki."
- **JTBD hook:** "One command → categorized wiki from scattered agent specs."
- **Messaging guardrails:** specwiki discovers and synthesizes — it does **not** author specs, run agents, or host documentation.
- **Differentiation:** cross-framework, zero-config discovery with category-aware indexing and dual output (markdown + HTML) from a single CLI command.

### UX review checklist (for Sally)

| Area             | Check                                                               |
| ---------------- | ------------------------------------------------------------------- |
| First impression | Problem + solution in ≤3 sentences; `[[specwiki]]` wordmark if used |
| Install          | Consumer path first; Node ≥20 visible                               |
| Quick start      | list → generate → open in ≤5 commands                               |
| Features         | Discovery table accurate; JSON/llms.txt documented                  |
| Output           | wiki/ tree matches actual generate output                           |
| Contributor      | Dev section separated; `npm run dev`, quality gate optional         |
| Trust            | License, no broken links, commands copy-pasteable                   |
| npm page         | Description alignment with `package.json` description field         |

### Market research focus areas

- **Persona A wedge:** Solo Cursor/AI agent developers with scattered rules and specs
- **Competitive set:** Cursor rule UI, BMAD/OpenSpec UIs, Docusaurus/MkDocs, agents.md ecosystem, manual README indexes
- **Differentiation:** Cross-framework zero-config discovery + dual markdown/HTML output + local CLI (no hosting)
- **Channel fit:** Reddit (r/cursor, r/LocalLLaMA, r/programming), HN Show HN, LinkedIn (indie dev / AI tooling), X (dev tool launches), Dev.to (tutorial-style intro post)
- **Sources to reuse:** `_bmad-output/planning-artifacts/discovery/research/domain-research.md`, `product-brief.md`

### Launch copy structure (per channel)

Each channel entry in `launch-copy.md` should include:

- **Audience** — who reads this channel
- **Hook** — one-line attention grabber
- **Body** — 2–4 short paragraphs or bullet narrative
- **CTA** — npm install, GitHub repo, or "try `npx specwiki list`"
- **Constraints** — character limits, subreddit rules, Show HN title format
- **Optional variants** — short (tweet) vs long (Reddit post)

### Previous story intelligence

**S13.1 (in-progress):** Package contract landed — `files` allowlists `dist/`, `README.md`, `LICENSE`; consumer `prepare` hook removed; `npm run setup-hooks` is contributor-only. README consumer-path update was deferred to Task 4 and overlaps this story — reconcile, do not contradict. `npm run verify-package` and `prepublishOnly` gate may land before or during S13.3; README should document `verify-package` for maintainers when available.

**S13.2 (review):** `.github/workflows/ci.yml` runs the six-command HARNESS gate on push/PR with Node 20.x. No application source changes. CI badge in README is optional pre-publish.

**Git context (8519692):** Recent E13 work: `64c69ee` package contract, `8519692` CI workflow. Marketing story should not revert package or CI files.

### Agent invocation guide

1. **Sally (UX):** Activate `bmad-agent-ux-designer`; provide README + checklist above; request structured findings report.
2. **Market research:** Activate `bmad-market-research`; topic: "Launch positioning for specwiki — CLI that discovers AI agent specs and generates a wiki"; goals: audience, competitors, channels, messaging guardrails.
3. **Optional prose polish:** `bmad-editorial-review-prose` on final README and launch copy if owner requests.

### Architecture, security, and regression guardrails

- No changes to `src/` unless a README command is provably wrong and cannot be fixed in docs.
- Do not add runtime dependencies.
- Marketing artifacts must not include secrets, tokens, or unreleased registry URLs unless owner confirms publish date.
- Preserve frozen CLI contracts — README documents existing commands only; no new flags.

### References

- [Source: `_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md#E13 — Distribution & Publish`]
- [Source: `_bmad-output/planning-artifacts/discovery/product-brief.md`]
- [Source: `_bmad-output/planning-artifacts/discovery/research/domain-research.md`]
- [Source: `docs/brand/BRAND.md`]
- [Source: `README.md`]
- [Source: `_bmad-output/implementation-artifacts/13-1-npm-publish-preparation.md` — consumer install AC]
- [Source: `.agents/skills/bmad-agent-ux-designer/SKILL.md`]
- [Source: `.agents/skills/bmad-market-research/SKILL.md`]

## Dev Agent Record

### Agent Model Used

Composer (dev-story implementation)

### Debug Log References

- 2026-07-15 — Story created from owner request: UX README review + market research + launch copy for E13.
- 2026-07-15 — UX review: 3 blockers, 4 should-fix, 4 nice-to-have; all blockers/should-fix applied to README.
- 2026-07-15 — Market research: web search on Cursor rules, AGENTS.md, SDD frameworks (OpenSpec, BMAD); extended domain-research.md.
- 2026-07-15 — CLI spot-check: `list --json`, `generate --json`, `generate --emit-llms-txt` flags match README.

### Implementation Plan

- Run Sally UX review → owner approval → README update → market research → launch copy pack → owner sign-off.

### Completion Notes List

- Created `docs/marketing/readme-review.md` with structured UX findings (blocker/should-fix/nice-to-have) and rewrite suggestions.
- Created `docs/marketing/market-research.md` with Persona A/B/C, competitive gaps, positioning, channel recommendations, and web citations.
- Created `docs/marketing/launch-copy.md` with Reddit, LinkedIn, Hacker News, X/Twitter, and Dev.to drafts plus posting guidance.
- Updated `README.md`: consumer install first, quick-start section, `[[specwiki]]` wordmark, Node 20+, `setup-hooks` in contributor path; aligned opening with `package.json` description.
- No `src/` changes — documentation-only story per scope boundary.
- Formal owner sign-off requested during review status.

### File List

- _bmad-output/implementation-artifacts/13-3-publication-readiness-and-launch-marketing.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- docs/marketing/readme-review.md
- docs/marketing/market-research.md
- docs/marketing/launch-copy.md
- README.md
- IMPLEMENTATION.md

### Change Log

- 2026-07-15 — Created E13 S13.3 story: publication readiness and launch marketing.
- 2026-07-15 — Enriched with S13.1/S13.2 intelligence, product-brief copy blocks, and baseline commit 8519692.
- 2026-07-15 — Implemented: UX readme review, market research, launch copy pack, README publication update; story → review.

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:**  
**Review outcome:**  
**Reviewer model:**

### Action Items

### Review Findings

## QA Manual Validation

1. Open `docs/marketing/readme-review.md` — confirm UX findings with severity labels and actionable suggestions.
2. Open `docs/marketing/market-research.md` — confirm audience, competitors, positioning, and channel recommendations with citations.
3. Open `docs/marketing/launch-copy.md` — confirm drafts for Reddit, LinkedIn, Hacker News, X/Twitter, and one additional channel.
4. Read updated `README.md` — consumer install appears before contributor setup; `npx specwiki` quick-start is copy-pasteable.
5. Run `npm run build && node dist/cli.js --help` — output matches README command names and descriptions.
