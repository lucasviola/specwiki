---
date: 2026-07-20
topic: Epic 28 blog image assets — Sally + Winston + Paige
roster:
  - Sally (UX Designer)
  - Winston (System Architect)
  - Paige (Technical Writer)
  - Party mode roundtable (orchestrator)
related:
  - _bmad-output/implementation-artifacts/epic-28-specwiki-blog.md
  - _bmad-output/implementation-artifacts/28-10-blog-image-assets-hero-and-inline.md
  - huddles/2026-07-19-specwiki-blog-proposal.md
status: story-created
---

# Huddle — blog image assets (next Epic 28 slice)

## Problem

Blog index/post pages from S28.1–S28.2 are text-only. Readers need visual anchors; writers need a PR-friendly way to add heroes and inline images without a CMS.

## Decisions

1. **One story (S28.10)** — hero + inline share the asset pipeline; do not split into two v1 stories
2. **Storage:** `site/blog/media/` → copied to `dist/landing-site/blog/media/` at build time
3. **Optional frontmatter:** `hero` + required `heroAlt`; omit → `media/default-hero.svg`
4. **Default is layout integrity** — every card/post fills the hero slot
5. **No hotlinking** — remote image URLs fail the build
6. **S28.8 stays deferred** for sitemap + absolute `og:image`; can reuse `hero` later
7. **Sequence:** S28.10 before polishing S28.4 seed/editorial

## Dissent (productive)

| Voice   | Push                                        | Resolution                                     |
| ------- | ------------------------------------------- | ---------------------------------------------- |
| Sally   | Index heroes before body images             | Same story — both surfaces required            |
| Winston | Asset copy/path validation is the real work | Copy inside `buildBlog`; fail on missing paths |
| Paige   | Alt + template docs before pretty boxes     | `_template.md` in S28.10; EDITORIAL in S28.4   |

## Artifacts

- Story: `_bmad-output/implementation-artifacts/28-10-blog-image-assets-hero-and-inline.md`
- Epic: `_bmad-output/implementation-artifacts/epic-28-specwiki-blog.md` (S28.10 added)
- Sprint: `28-10-blog-image-assets-hero-and-inline: ready-for-dev`

## Next step

`dev this story 28-10` (or `dev-story` against the story file).
