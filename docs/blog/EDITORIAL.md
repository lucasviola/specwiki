# specwiki blog — editorial guide

**Audience:** Lucas (publisher) and future maintainers after 1.0.  
**Public surface:** [specwiki.ai/blog](https://specwiki.ai/blog/)  
**Source:** Markdown in `site/blog/*.md` — HTML is build output only.

This blog is **publisher voice** for [[specwiki]]. It explains why the tool exists, what changed, and where it sits in the SDD stack. It is not a second README, not a duplicate install guide, and never hosts user-generated wikis.

---

## Content lanes

Every post must set `lane` in frontmatter to one of:

| Lane                | Frontmatter value | Reader job                 | Write when…                                                                                                                                   |
| ------------------- | ----------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Field Notes**     | `field-notes`     | “Should I try this today?” | You have a workflow pain or observation before pitching the product. Lead with the problem you grepped for, not the feature list.             |
| **Release Stories** | `release-story`   | “What changed and why?”    | A version ships. Wrap the narrative around [CHANGELOG.md](../../CHANGELOG.md) — link to anchors; do not paste the whole changelog into prose. |
| **Ecosystem**       | `ecosystem`       | “Where does specwiki fit?” | You explain BMAD, Cursor rules, OpenSpec, or other SDD tools relative to specwiki — context, not competitive dunking.                         |

**Index grouping:** The build groups posts under these lane headings, newest first within each lane.

**Canonical example:** `site/blog/2026-07-20-seed-post.md` — Field Note tone, default hero, one inline image.

---

## Voice and tone

Follow the same guardrails as [launch copy](../marketing/launch-copy.md) and [brand](../brand/BRAND.md):

- **Developer-credible and concise** — write for someone who already greps their repo for `AGENTS.md` and `.cursor/rules`.
- **No unsupported superlatives** — avoid “best”, “revolutionary”, “game-changing”, and similar hype without evidence.
- **Messaging guardrails:** specwiki **discovers and synthesizes** specs into a wiki; it does not author specs, run agents, or host documentation platforms.
- **Publisher vs user output:** Generated wikis belong to the reader’s project. This blog is editorial — never blur the two surfaces.
- Use the `[[specwiki]]` wordmark in prose when referring to the product name.

**Audience field:** Set `audience` to `alex`, `jordan`, `sam`, or `all` (see personas in [market research](../marketing/market-research.md)). Default to `all` unless the post is narrowly scoped.

---

## Cross-linking rules

| Do                                                                                                 | Don’t                                                      |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Link to [CHANGELOG.md](../../CHANGELOG.md) anchors from Release Stories                            | Duplicate install steps from the [README](../../README.md) |
| Link to [ADRs](../adr/index.md) from Ecosystem posts when a decision matters                       | Turn a blog post into a full reference doc                 |
| Link to specwiki.ai, GitHub, and stable public URLs                                                | Add blog chrome to generated wiki output (`src/output/`)   |
| Keep optional `related:` paths in frontmatter for human/editor use (not validated by the v1 build) | Hotlink remote images (`http(s):`) — build fails by design |

**Comments and syndication (v1):** No comments widget, no RSS feed, no analytics. Readers find GitHub Issues/Discussions on their own.

---

## Cadence and authorship

- **Target cadence:** About **biweekly** — enough to stay current without noise. Skip a cycle rather than ship filler.
- **Authorship until 1.0:** **Lucas-only.** Guest or community posts wait until after the launch trilogy (S28.6) and a deliberate owner decision.
- **Workflow:** Copy [`site/blog/_template.md`](../../site/blog/_template.md) → rename to `YYYY-MM-DD-your-slug.md` → write in a PR like any other change. No `npm run new:post` in v1.

---

## Images

Image bytes live under `site/blog/media/` and copy to `dist/landing-site/blog/media/` at build time. See S28.10 for pipeline details.

### Hero (index card + post header)

Optional frontmatter:

```yaml
hero: media/YYYY-MM-DD-your-slug/hero.svg
heroAlt: "Meaningful description of the hero image"
```

- Omit `hero` to use the default brand hero (`media/default-hero.svg`). Default hero is decorative on cards (`alt=""`); the linked title names the post.
- When `hero` is set, **`heroAlt` is required** — non-empty string, not a number or object.
- Path must stay under `media/` — no `http(s):`, no leading `/`, no `..` segments. Missing files fail the build.

### Inline body images

```markdown
![Annotated wiki sidebar](media/YYYY-MM-DD-your-slug/example.svg)
```

- Use relative `media/...` paths only. Remote URLs fail the build.
- Every body image needs **meaningful alt text** in the markdown `![alt](path)` syntax.
- Prefer SVG or PNG in-repo; keep assets small and PR-reviewable.

### Layout notes

- Heroes render on index cards (first visual in the card link) and on post pages (after the title, before body).
- Body images inherit longform styles from `site/assets/blog.css` (~65ch measure preserved).

---

## Frontmatter checklist

Required fields (build fails if missing or invalid):

```yaml
---
title: "Human title"
date: "YYYY-MM-DD"
author: Lucas
lane: field-notes # field-notes | release-story | ecosystem
summary: "One sentence — OG description and index card."
audience: all # alex | jordan | sam | all
---
```

Use **quoted** dates so YAML does not rewrite them. The `summary` becomes `<meta name="description">` and Open Graph text — keep it one honest sentence suitable for social preview.

Optional: `hero`, `heroAlt`, `related:` (internal link list).

Full authoring template: [`site/blog/_template.md`](../../site/blog/_template.md).

---

## Pre-publish checklist

1. `lane` and `audience` enums valid; `summary` reads well out of context.
2. Voice matches guardrails above — no hype, no README duplication.
3. Images: local `media/` paths only; alt text present where required.
4. `npm run build:site` succeeds; open `dist/landing-site/blog/index.html` and the post HTML locally.
5. Post appears under the correct lane on the index.
6. After merge + deploy, verify on production per [specwiki.ai hosting](../hosting/specwiki-ai.md).

---

## Related docs

- Epic spec: [`epic-28-specwiki-blog.md`](../../_bmad-output/implementation-artifacts/epic-28-specwiki-blog.md)
- Party-mode proposal: [`huddles/2026-07-19-specwiki-blog-proposal.md`](../../huddles/2026-07-19-specwiki-blog-proposal.md)
- Image assets story: [`28-10-blog-image-assets-hero-and-inline.md`](../../_bmad-output/implementation-artifacts/28-10-blog-image-assets-hero-and-inline.md)
