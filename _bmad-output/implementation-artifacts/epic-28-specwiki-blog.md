# Epic 28 — specwiki Blog (specwiki.ai/blog)

## Goal

Ship a **publisher-owned editorial blog** at `specwiki.ai/blog` for current and future [[specwiki]] users — distinct from README (reference), CHANGELOG (semver audit trail), and generated wikis (user project output).

**Audience:** Alex (solo Cursor dev), Jordan (team lead), Sam (OSS maintainer) — see content lanes below.

**JTBD:** _“Tell me why I should care today, what changed, and how this fits the SDD ecosystem — without reading my repo’s wiki.”_

**Dependency:** **E20** (specwiki.ai hosting) — complete.

**Party-mode synthesis:** [`huddles/2026-07-19-specwiki-blog-proposal.md`](../../huddles/2026-07-19-specwiki-blog-proposal.md) (Sally + Winston + Paige).

---

## Owner decisions (locked)

| Topic       | Decision                                                                        |
| ----------- | ------------------------------------------------------------------------------- |
| RSS         | **Out of scope** for this epic — defer to a future story                        |
| Authoring   | **Markdown-in-PR** — copy `site/blog/_template.md`; no `npm run new:post` in v1 |
| Comments    | **No comments UI** in v1 — readers find GitHub Issues/Discussions on their own  |
| Analytics   | **Analytics-free** initially — defer instrumentation                            |
| Guest posts | **Lucas-only** until 1.0; revisit after launch trilogy                          |
| Wiki footer | **No** blog link in generated wiki chrome (publisher surface only)              |
| Renderer    | Extend landing build — **not** wiki Mustache skin                               |

---

## v1 scope

| In v1                                                        | Deferred                                        |
| ------------------------------------------------------------ | ----------------------------------------------- |
| Markdown posts in `site/blog/*.md`                           | RSS feed (`/blog/rss.xml`)                      |
| Build pipeline → static HTML under `dist/landing-site/blog/` | Email subscribe (Buttondown, etc.)              |
| Blog index grouped by content lane                           | Per-post GitHub Discussions footer              |
| Post pages with OG meta from frontmatter `summary`           | Privacy analytics (Plausible/Fathom)            |
| Landing-family header + **Blog** nav link                    | `npm run new:post` scaffold                     |
| Longform typography (~65ch), not wiki skin                   | Guest/community posts                           |
| Frontmatter + link validation tests in CI                    | Full launch trilogy (separate content story)    |
| Optional hero + default + inline `media/` images             | Social `og:image` absolute URLs + `sitemap.xml` |
| Seed post + editorial conventions doc                        |                                                 |
| README + launch-copy cross-links                             |                                                 |

### Content lanes (editorial IA)

| Lane                | Reader job                 | Example                               |
| ------------------- | -------------------------- | ------------------------------------- |
| **Field Notes**     | “Should I try this today?” | _I grepped my repo for Cursor rules…_ |
| **Release Stories** | “What changed and why?”    | Narrative wrapper around CHANGELOG    |
| **Ecosystem**       | “Where does specwiki fit?” | _Where BMAD ends and specwiki begins_ |

**Launch trilogy** (content, post-epic or S28.5): Field Note → Release Story → Ecosystem — see huddle.

---

## Architecture spine (Winston)

### Invariants

1. **Posts are source; HTML is build output.** `site/blog/**/*.md` in repo; generated pages under `dist/landing-site/blog/` at deploy time only.
2. **Same deploy pipeline as landing.** Extend `scripts/build-landing-site.mjs` (or a `build-blog.mjs` invoked from it) — GitHub Pages via existing `deploy-site.yml`.
3. **Landing visual family, not wiki skin.** Reuse wordmark, `#3366cc` brackets, header chrome; dedicated longform CSS — no Vector infobox / sidebar layout.
4. **Reuse existing markdown stack.** `gray-matter` + `marked` (already in repo) for frontmatter and body — no CMS, no new runtime deps for site visitors.
5. **Brand guardrail:** Blog is publisher voice; never host user-generated wikis or become a docs platform.

### URL scheme

| Surface    | URL                                                |
| ---------- | -------------------------------------------------- |
| Blog index | `https://specwiki.ai/blog/` (or `blog/index.html`) |
| Post       | `https://specwiki.ai/blog/{slug}.html`             |
| Source     | `site/blog/{date}-{slug}.md`                       |

### Post frontmatter (required)

```yaml
---
title: "Human title"
date: YYYY-MM-DD
author: Lucas
lane: field-notes | release-story | ecosystem
summary: "One sentence — OG description and index card."
audience: alex | jordan | sam | all
---
```

Optional: `related:` list (CHANGELOG anchors, ADR paths) — validated as internal links where resolvable.

Optional images (S28.10):

```yaml
hero: media/<path-under-media> # optional; default → media/default-hero.svg
heroAlt: "Required when hero set"
```

Inline body: `![alt](media/...)` — assets under `site/blog/media/`, copied to `dist/landing-site/blog/media/` at build time.

### Build flow

```text
site/blog/*.md
        ↓
scripts/build-landing-site.mjs  (+ blog render step)
        ↓
dist/landing-site/blog/index.html
dist/landing-site/blog/{slug}.html
        ↓
GitHub Pages → specwiki.ai/blog/
```

---

## Stories

| Story  | Summary                                      | v1?   | Depends | Status         |
| ------ | -------------------------------------------- | ----- | ------- | -------------- |
| S28.1  | Blog build pipeline + frontmatter validation | ✓     | E20     | done           |
| S28.2  | Blog index, post layout, and longform CSS    | ✓     | S28.1   | done           |
| S28.3  | Landing nav integration + deploy/CI tests    | ✓     | S28.2   | done (in code) |
| S28.10 | Blog image assets (hero + inline)            | ✓     | S28.2   | ready-for-dev  |
| S28.4  | Seed post + editorial conventions            | ✓     | S28.10  | backlog        |
| S28.5  | README and launch-copy discovery links       | ✓     | S28.3   | backlog        |
| S28.6  | Launch trilogy posts (editorial)             | defer | S28.4   | backlog        |
| S28.7  | RSS syndication                              | defer | S28.1   | backlog        |
| S28.8  | sitemap.xml + per-post OG images             | defer | S28.10  | backlog        |
| S28.9  | Email subscribe CTA                          | defer | S28.3   | backlog        |

**Recommended next PR:** S28.10 — image assets (hero + inline) before polishing S28.4 seed/editorial.

---

### S28.1 — Blog build pipeline + frontmatter validation

**As** a maintainer, **I want** markdown blog posts in the repo to compile into static HTML on site build, **so that** publishing is a PR review like any other change.

**Demo path:** Add `site/blog/2026-07-20-seed-post.md` → `npm run build:site` → `dist/landing-site/blog/2026-07-20-seed-post.html` exists with title and body rendered.

**Functional:**

- [ ] Add `site/blog/_template.md` with documented frontmatter schema (not published).
- [ ] Extend `scripts/build-landing-site.mjs` (or extract `scripts/build-blog.mjs` called from it) to:
  - Parse `site/blog/*.md` (exclude `_`-prefixed files)
  - Derive URL slug from filename (`{date}-{slug}.md` → `{date}-{slug}.html`)
  - Render markdown body via `marked`; escape titles in `<title>` and headings
- [ ] Fail build on missing/invalid required frontmatter (`title`, `date`, `author`, `lane`, `summary`, `audience`)
- [ ] Validate `lane` and `audience` enums
- [ ] Wire blog build into `npm run build:site` and `.github/workflows/deploy-site.yml`

**Quality measures:**

- [ ] `tests/scripts/build-landing-site.test.ts` (or `tests/scripts/build-blog.test.ts`): valid post builds; invalid frontmatter fails with actionable message
- [ ] No new production npm dependencies; blog build uses existing `gray-matter` + `marked`
- [ ] Generated blog HTML not committed to repo

---

### S28.2 — Blog index, post layout, and longform CSS

**As** a blog reader, **I want** an index and readable post pages that match specwiki.ai branding, **so that** long posts feel intentional — not like my project’s generated wiki.

**Demo path:** `open dist/landing-site/blog/index.html` → posts grouped by lane, newest first → click a card → post page with ~65ch measure, wordmark header, back link to index.

**Functional:**

- [ ] Generate `blog/index.html` from post metadata: lane sections (**Field Notes**, **Release Stories**, **Ecosystem**), reverse chronological within lane
- [ ] Shared post layout template: landing-family header (`[[specwiki]]` wordmark, **Blog** + GitHub nav), article `<main>`, post title, date, author, lane badge
- [ ] Add `site/assets/blog.css` — longform typography, index cards, lane labels; link from blog pages only (do not regress landing.css)
- [ ] `<meta name="description">` and Open Graph `og:title` / `og:description` from frontmatter `summary`
- [ ] Post footer: link back to blog index and specwiki.ai home — **no** comments widget

**Quality measures:**

- [ ] Visual cousin of landing page per `docs/brand/BRAND.md` tokens — explicitly **not** wiki Vector layout
- [ ] `tests/site/blog.test.ts`: index lists seed post; post page contains title, summary meta, lane
- [ ] Keyboard-accessible nav; skip link on blog pages

---

### S28.10 — Blog image assets (hero + inline)

**As** a blog reader, **I want** visual anchors on the index and in posts, **so that** scanning and longform reading feel intentional.

**As** a publisher, **I want** optional hero frontmatter and markdown images backed by repo files, **so that** imagery stays PR-reviewable.

**Story file:** [`28-10-blog-image-assets-hero-and-inline.md`](./28-10-blog-image-assets-hero-and-inline.md)

**Demo path:** Custom or default hero on index cards → post page hero + inline `media/` image → missing path fails build.

**Functional (summary):**

- [ ] `site/blog/media/` copied to `dist/landing-site/blog/media/`; `.md` still not published
- [ ] Optional `hero` + required `heroAlt`; default `media/default-hero.svg` when omitted
- [ ] Index card + post page hero slots; inline markdown images validated (local only)
- [ ] `blog.css` hero/body image styles; `_template.md` authoring notes
- [ ] Tests for default/custom/missing/remote rejection

**Out of scope:** `og:image` absolute URLs + sitemap → S28.8; full `EDITORIAL.md` → S28.4.

---

### S28.3 — Landing nav integration + deploy/CI tests

**As** a landing-page visitor, **I want** a **Blog** link in the site header, **so that** I can discover posts without guessing the URL.

**Demo path:** `open dist/landing-site/index.html` → header shows **Blog** → navigates to `blog/index.html` → **Blog** state visible on blog pages.

**Functional:**

- [ ] Add **Blog** link to `site/index.html` header nav (between wordmark area and GitHub)
- [ ] Blog pages use relative `../index.html` (or equivalent) for home; `index.html` for blog index
- [ ] Update `docs/hosting/specwiki-ai.md`: `/blog/` in post-deploy verification checklist
- [ ] Extend `tests/site/deploy-workflow.test.ts` and `tests/site/landing.test.ts` for Blog nav presence

**Quality measures:**

- [ ] No absolute-root `href="/` in blog or landing links (GitHub Pages / custom domain safe)
- [ ] `npm test -- tests/site/` passes including new blog tests

---

### S28.4 — Seed post + editorial conventions

**As** Lucas (publisher), **I want** one real post and a short editorial guide, **so that** the blog launches with voice and template — not an empty index.

**Depends:** S28.10 (so seed/editorial can document and demonstrate image conventions).

**Demo path:** Read `docs/blog/EDITORIAL.md` → copy `_template.md` → seed post live at `/blog/` after deploy.

**Functional:**

- [ ] Add `docs/blog/EDITORIAL.md`: content lanes, voice (developer-credible, no unsupported superlatives), cross-linking rules (blog → CHANGELOG/ADRs; never duplicate install docs), biweekly cadence note, Lucas-only until 1.0, **Images** section (hero + `media/` + alt rules from S28.10)
- [ ] Ship one seed post in `site/blog/` (Field Note tone preferred — workflow pain before product pitch); prefer exercising hero/inline images
- [ ] Post passes S28.1/S28.10 validation and appears on index under correct lane

**Quality measures:**

- [ ] Seed post `summary` suitable for OG/social preview
- [ ] Brand guardrails from `docs/marketing/launch-copy.md` respected in copy

---

### S28.5 — README and launch-copy discovery links

**As** a prospective user reading the repo or marketing copy, **I want** a clear link to the blog, **so that** I find updates without searching specwiki.ai.

**Demo path:** README → blog URL → `specwiki.ai/blog/` loads.

**Functional:**

- [ ] README: one line under Install or Community pointing to `https://specwiki.ai/blog/`
- [ ] `docs/marketing/launch-copy.md`: add blog URL placeholder for Reddit/LinkedIn/HN variants
- [ ] **Do not** add blog link to generated wiki footer or `src/output/` templates

**Quality measures:**

- [ ] Link uses `https://specwiki.ai/blog/` (stable public URL)

---

### S28.6 — Launch trilogy posts (editorial) — **deferred**

**Trigger:** S28.4 seed post + S28.5 links shipped; owner ready to promote.

**As** a reader evaluating specwiki, **I want** the three-post launch sequence, **so that** I move from curiosity → understanding → ecosystem context.

**Posts (order matters):**

1. Field Note — _I grepped my repo for Cursor rules…_
2. Release Story — _What's new in 1.x_ (narrative + CHANGELOG link)
3. Ecosystem — _Where BMAD ends and specwiki begins_

---

### S28.7 — RSS syndication — **deferred**

**Trigger:** Owner requests feed; at least 3 posts published.

**Out of scope per owner decision (2026-07-20).**

---

### S28.8 — sitemap.xml + per-post OG images — **deferred**

**Trigger:** SEO/discovery push after launch trilogy; or analytics story unblocked.

**Note:** Content heroes from S28.10 (`hero` / default) are the natural source for absolute `og:image` URLs when this story opens — do not rebuild a parallel image system.

---

### S28.9 — Email subscribe CTA — **deferred**

**Trigger:** 3+ posts and proof of readership; Buttondown or similar chosen.

---

## Epic gate (v1)

- [ ] `https://specwiki.ai/blog/` serves an index with lane grouping and at least one post.
- [ ] Landing header **Blog** link works on production and PR previews.
- [ ] Posts authored as markdown in `site/blog/`; HTML generated at build time only.
- [ ] Longform blog pages visually distinct from generated wiki skin.
- [ ] CI validates frontmatter and blog build on every site deploy.
- [ ] README points to the blog; wiki output unchanged (no blog chrome).
- [ ] **No RSS** endpoint shipped in v1.

---

## Cross-epic notes

- **E20:** Extends public surface at `specwiki.ai`; no change to `src/output/` wiki contract.
- **E27:** Complementary conversion path (live hero example); blog links can reference live demo when shipped.
- **E22 / E13:** Release Story posts should cross-link CHANGELOG when 1.0.0 lands.
- **E25:** Ecosystem posts may link ADRs; editorial guide references `docs/adr/`.

---

## Decisions log

| Date       | Decision                                                                | By                                 |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------- |
| 2026-07-19 | Blog proposed — markdown-in-repo, landing pipeline, three content lanes | Party mode (Sally, Winston, Paige) |
| 2026-07-20 | **No RSS** in v1                                                        | Lucas                              |
| 2026-07-20 | Markdown-in-PR authoring; no `new:post` script                          | Lucas                              |
| 2026-07-20 | No comments UI; analytics-free                                          | Lucas                              |
| 2026-07-20 | Epic 28 created                                                         | Lucas                              |
| 2026-07-20 | S28.10 added — hero + inline images as next slice (one story)           | Party mode (Sally, Winston, Paige) |
