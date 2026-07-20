---
date: 2026-07-19
topic: specwiki blog — Sally + Winston + Paige brainstorm
roster:
  - Sally (UX Designer)
  - Winston (System Architect)
  - Paige (Technical Writer)
  - Party mode roundtable (orchestrator)
related:
  - _bmad-output/planning-artifacts/discovery/product-brief.md
  - docs/marketing/launch-copy.md
  - docs/marketing/market-research.md
  - docs/brand/BRAND.md
  - site/index.html
  - scripts/build-landing-site.mjs
status: epic-created
---

# Huddle — specwiki blog proposal

## Problem

[[specwiki]] needs a channel to share posts with current and future users — distinct from README (reference), CHANGELOG (semver audit trail), and generated wikis (user project output). The landing page at `specwiki.ai` exists; no editorial/blog surface yet.

## Party mode discussion

### Sally (UX)

Three reader personas need different content lanes:

| Persona                    | Need                                                            |
| -------------------------- | --------------------------------------------------------------- |
| **Alex** (solo Cursor dev) | Reason to try specwiki today — workflow pain, not product pitch |
| **Jordan** (team lead)     | Proof of maturity — CI patterns, onboarding with generated wiki |
| **Sam** (OSS maintainer)   | Copy-pasteable contributor guidance, community spotlights       |

**Proposed lanes:** Field Notes · Release Stories · Ecosystem

**UX constraints:**

- Visual cousin of landing page — same wordmark and `#3366cc` brackets — but longform reading measure (~65ch), not wiki Vector/infobox skin (avoid "is this my project's docs?" confusion)
- Header nav: add **Blog** next to GitHub on specwiki.ai
- README one-liner pointing to blog; **no** blog link in generated wiki footer (user's project, not publisher)
- RSS prominent on blog index; email subscribe deferred

**Launch trilogy (sequencing):**

1. Field Note — _"I grepped my repo for Cursor rules…"_
2. Release Story — _What's new in 1.x_ (narrative wrapper around CHANGELOG)
3. Ecosystem — _Where BMAD ends and specwiki begins_

### Winston (Architecture)

Extend existing static site pipeline — do not introduce a CMS or separate hosting.

```
site/
  blog/
    _template.md
    {date}-{slug}.md
scripts/build-landing-site.mjs  →  dist/landing-site/blog/
```

| Decision    | Choice                                              |
| ----------- | --------------------------------------------------- |
| Hosting     | GitHub Pages (`specwiki.ai`) — same deploy workflow |
| Authoring   | Markdown + YAML frontmatter in repo (PR review)     |
| Renderer    | Extend landing build — **not** wiki Mustache skin   |
| Syndication | RSS 2.0 at `/blog/rss.xml`                          |
| Email       | Phase 2 (Buttondown or similar)                     |
| Comments    | Link to GitHub Discussions per post — no Disqus v1  |

**Non-negotiables:** RSS; posts in repo; frontmatter + link validation tests in CI. Rule of Three before abstracting a "blog generator."

**Effort estimate (v1):** ~2–3 days for pipeline + index + RSS + nav + tests + one seed post.

### Paige (Content)

**Brand guardrail:** specwiki "does not host documentation." The blog is **publisher voice** — why the tool exists, how to use it well, SDD ecosystem context. Never host user-generated wikis or become a docs platform.

**Voice:** Developer-credible, Julia Evans register — short paragraphs, diagrams when they earn pixels, copy-paste code blocks. No unsupported superlatives per `docs/marketing/launch-copy.md`.

**Post template:**

```yaml
---
title: "Human title"
date: YYYY-MM-DD
author: Lucas
lane: field-notes | release-story | ecosystem
summary: "One sentence — RSS, OG, index card."
audience: alex | jordan | sam | all
related:
  - CHANGELOG#1.2.0
  - docs/adr/0010-...
---
```

**Cross-linking rules:** blog → CHANGELOG / ADRs / README for context; never duplicate install docs; Release Stories always link semver details in CHANGELOG.

**Cadence:** Biweekly (sustainable solo); weekly only around major releases.

**Ongoing pillars:**

- **Field Notes:** repo walkthroughs, `.cursor/rules/` audits, CI + `--check`, team onboarding
- **Release Stories:** feature rationale (link ADRs), migration notes, demo GIFs
- **Ecosystem:** AGENTS.md landscape, framework comparisons (factual), guest posts

## Decisions

1. **Purpose:** Editorial channel at `specwiki.ai/blog` for users and prospects — not user docs hosting
2. **Architecture:** Markdown-in-repo + extend `build-landing-site.mjs` + GitHub Pages
3. **Content IA:** Three lanes (Field Notes, Release Stories, Ecosystem) mapped to personas
4. **Visual:** Landing page family, longform typography — explicitly not wiki skin
5. **Syndication:** RSS v1; email v2; GitHub Discussions for comments
6. **Launch content:** Sally's trilogy before broad promotion

## Dissent / open questions

| Topic              | Options                                              | Owner decision pending |
| ------------------ | ---------------------------------------------------- | ---------------------- |
| Authoring friction | Pure markdown-in-PR vs `npm run new:post` scaffold   | Lucas                  |
| Guest posts        | Community authors in phase 2 vs Lucas-only until 1.0 | Lucas                  |
| Analytics          | Plausible/Fathom vs analytics-free initially         | Lucas                  |

## Phased rollout

| Phase                  | Scope                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **1 — Foundation**     | Blog build pipeline, index, RSS, header nav, 1 seed post, tests |
| **2 — Launch trilogy** | 3 posts per Sally's sequence; README + launch-copy links        |
| **3 — Discovery**      | OG images per post, sitemap.xml, privacy-respecting analytics   |
| **4 — Email**          | Buttondown + subscribe CTA on index                             |

## Success metrics (lightweight)

- Referrers to `/blog/*` (GitHub, social)
- `npx` install spikes within 48h of Field Note / Release Story
- Discussions citing blog posts

## Artifacts

- This huddle: `huddles/2026-07-19-specwiki-blog-proposal.md`
- Epic: `_bmad-output/implementation-artifacts/epic-28-specwiki-blog.md`
- Sprint status: `epic-28` in `sprint-status.yaml`

## Owner overrides (2026-07-20)

| Topic     | Huddle default          | Locked decision                 |
| --------- | ----------------------- | ------------------------------- |
| RSS       | v1                      | **Deferred** — S28.7            |
| Authoring | TBD                     | Markdown-in-PR (`_template.md`) |
| Comments  | GitHub Discussions link | **No comments UI** in v1        |
| Analytics | TBD                     | **Analytics-free** initially    |

## Next step

Create story file for S28.1 (`create the next story`) or `dev this story 28-1`.
