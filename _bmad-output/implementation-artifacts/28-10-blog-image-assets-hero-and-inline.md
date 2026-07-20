---
baseline_commit: 0d8e17b396e4d5a1f86bea2cb43ce489534d4110
---

# Story 28.10: Blog image assets (hero + inline)

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a blog reader,
I want visual anchors on the index and inside posts,
so that scanning headlines and reading longform feel intentional — not like a plain changelog dump.

As a publisher (Lucas),
I want optional hero frontmatter and markdown images backed by repo files,
so that adding imagery stays PR-reviewable with the same markdown-in-repo workflow.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Add `hero` + one body image on the seed post (or a fixture post) → `npm run build:site` → open `dist/landing-site/blog/index.html` → card shows hero → open post → hero + inline image render → remove `hero` from frontmatter → rebuild → default brand hero appears → point `hero` at a missing file → build fails with an actionable path.

**Binds:** E28 S28.10 | **Depends:** S28.1, S28.2 (done) | **Related:** S28.4 (editorial doc can absorb image conventions later); S28.8 (sitemap + OG — **out of scope** here)

## Acceptance Criteria

### Functional

1. **Media tree:** Blog image bytes live under `site/blog/media/` (site-wide default + optional per-post subfolders). Build copies that tree to `dist/landing-site/blog/media/`. Source `.md` posts are still **not** copied into `dist/`.
2. **Optional hero frontmatter:** Posts may set:
   ```yaml
   hero: media/<path-under-media>
   heroAlt: "Meaningful description"
   ```
   - `hero` is optional. When set, `heroAlt` is **required** (non-empty string).
   - `hero` must be a relative path under `media/` (no `http(s):`, no leading `/`, no `..` segments).
   - Build **fails** if the resolved file is missing on disk.
3. **Default hero:** When `hero` is omitted, index cards and post pages use `media/default-hero.svg` (committed under `site/blog/media/default-hero.svg`). Layout must not look “broken” or uneven vs posts that have a custom hero — every card/post has a hero slot filled.
4. **Index cards:** Each card link includes the resolved hero image **before** the title (first visual in `.blog-card-link`). Custom hero: use escaped `heroAlt`. Default hero: decorative (`alt=""`) because the linked title already names the post. No nested interactive elements inside the card `<a>`.
5. **Post pages:** Resolved hero renders **after** `<h1 class="blog-post-title">` and **before** `.blog-post-body`. Same alt rules as AC4.
6. **Inline body images:** Standard CommonMark/GFM images work, e.g. `![Annotated wiki sidebar](media/2026-07-20-seed-post/example.png)`. Relative `media/...` targets must exist or the build fails with the post source path + missing target. Disallow `..` and root-absolute local paths. **Do not** document or support hotlinked `http(s):` images in v1 (fail build if body markdown references remote image URLs).
7. **CSS:** `site/assets/blog.css` styles index heroes, post heroes, and `.blog-post-body img` (max-width 100%, height auto; optional figure spacing). Do **not** change `landing.css`. Preserve ~65ch longform measure and landing brand tokens.
8. **Writer docs:** Update `site/blog/_template.md` with hero fields, `media/` layout, alt rules, and inline image example. Do **not** create full `docs/blog/EDITORIAL.md` here (S28.4) — if that file already exists when implementing, add a short **Images** section.
9. **Seed / demo content:** Ensure at least one published post exercises the pipeline end-to-end: either the existing seed post gains a real `media/` asset + one inline image (hero optional to prove default, or set explicitly). Default hero SVG must ship in-repo so a post with no `hero` still builds.

### Quality measures

10. Tests cover: default hero when `hero` omitted; custom hero on index + post; missing hero file fails; missing inline local image fails; remote image URL fails; `hero` without `heroAlt` fails; media copied to dist and `.md` still absent; `blog.css` contains hero/body image rules; no `href="/` regressions on blog pages.
11. No new production npm dependencies. Reuse `gray-matter` + `marked` already in the blog build.
12. Core CLI / generated-wiki contracts unchanged (`src/` untouched).

### Out of scope (do not implement)

- `sitemap.xml`, per-post social OG image pipeline, absolute `og:image` URLs → **S28.8**
- Image CDN, compression, `srcset`, lightbox, captions-as-CMS, `npm run new:post`
- `EDITORIAL.md` full guide → **S28.4** (template notes only here)
- Landing header Blog nav → **S28.3** (already shipped in `site/index.html`; do not redo)

## Tasks / Subtasks

- [x] RED: extend `tests/scripts/build-blog.test.ts` (+ `tests/site/blog.test.ts` as needed) for ACs 1–7, 10 (AC: 1–7, 10)
  - [x] Default hero markup when frontmatter omits `hero`
  - [x] Custom `hero` + `heroAlt` on index card and post page (escaped attrs)
  - [x] Fail: missing hero file; missing `heroAlt`; path with `..` or `https://`
  - [x] Fail: missing local `media/` body image; fail: remote body image URL
  - [x] Full `build-landing-site` run: `blog/media/**` present in output; no `blog/*.md`
- [x] GREEN: media copy + validation + render + CSS + default SVG + template (+ seed assets) (AC: 1–9, 11–12)
  - [x] Prefer copying `media/` inside `buildBlog` (keeps `copySite` “skip blog md” intent) **or** selective copy in `build-landing-site.mjs` — pick one; document in File List
  - [x] Validate/resolve hero paths; inject markup in `renderIndexPage` / `renderPostPage`
  - [x] Scan rendered markdown (or pre-parse tokens) for `<img src>` / markdown image targets and validate
  - [x] Add `site/blog/media/default-hero.svg` (brand-intentional: `#3366cc` brackets / wordmark family — see BRAND.md)
  - [x] Update `_template.md`; update seed post with at least one inline image under `media/`
- [x] REFACTOR: keep exports testable (`validateFrontmatter` may grow optional-field checks; extract path helpers if needed)
- [x] Update `IMPLEMENTATION.md` + sprint-status when story completes; run full quality gate + §0.2.5 / §0.2.6

## Dev Notes

### Party-mode decisions (locked for this story)

Source: 2026-07-20 Sally + Winston + Paige roundtable (blog images).

| Topic        | Decision                                                                               |
| ------------ | -------------------------------------------------------------------------------------- |
| Story count  | **One** story (S28.10) — shared asset pipe; do not split hero vs inline                |
| Storage      | `site/blog/media/` → `dist/landing-site/blog/media/`                                   |
| Default      | Always fill hero slot; `media/default-hero.svg` when omitted                           |
| Hotlinking   | Unsupported — fail build on remote image URLs                                          |
| OG / sitemap | Stay in deferred **S28.8**                                                             |
| Sequencing   | Implement **before** polishing S28.4 seed/editorial so the seed can demonstrate images |

### Critical gotcha — `copySite` skips all of `blog/`

```41:51:scripts/build-landing-site.mjs
async function copySite(source, destination) {
  // ...
    if (entry.isDirectory() && entry.name === "blog") {
      continue;
    }
```

Today **nothing** under `site/blog/` reaches `dist/` except HTML written by `buildBlog`. Adding `site/blog/media/` without a copy step produces 404 images on GitHub Pages. **Must fix in this story.**

Recommended approach: in `buildBlog`, after writing HTML, recursively copy `path.join(sourceDir, "media")` → `path.join(outputDir, "media")` if it exists. Keeps markdown exclusion intact.

### Current render surfaces (UPDATE — do not redesign chrome)

**Index card** (`renderIndexPage`) — insert hero as first child inside `.blog-card-link`:

```html
<a class="blog-card-link" href="{slug}.html">
  <img class="blog-card-hero" src="media/..." alt="..." />
  <h3 class="blog-card-title">...</h3>
  <p class="blog-card-summary">...</p>
  <p class="blog-card-meta">...</p>
</a>
```

**Post page** (`renderPostPage`) — insert after title:

```html
<article class="blog-post">
  <p class="blog-meta">...</p>
  <h1 class="blog-post-title">...</h1>
  <img class="blog-post-hero" src="media/..." alt="..." />
  <div class="blog-post-body">...</div>
</article>
```

Preserve: skip link, landing-family header (Blog active), footer links (`index.html`, `../index.html`), `escapeHtml` on all frontmatter-derived attribute/text values, relative asset links (`../assets/blog.css` — never `/assets/`).

### Path & security rules (frontmatter + body)

Treat image paths as untrusted input:

- Allow only relative paths that normalize under `site/blog/media/` (or the build `sourceDir/media`).
- Reject: `http:`, `https:`, `//`, leading `/`, any `..` segment, backslashes, empty string.
- Escape `src` and `alt` with existing `escapeHtml` when emitting hero tags.
- Body images from `marked` already HTML-encode attributes; still **validate** the `src` targets before/after render so missing files fail the build.

### Default hero design constraints

- Commit a real SVG at `site/blog/media/default-hero.svg`.
- Brand-intentional (specwiki `#3366cc` brackets / wordmark family per `docs/brand/BRAND.md`) — not a flat gray placeholder.
- Keep file small (inline SVG, no binary photo required for default).
- Wide/landscape-friendly aspect for cards (e.g. ~16:9 or ~2:1 viewBox); CSS object-fit can crop.

### Inline image validation approach

Practical options (pick one; keep boring):

1. **Regex scan** of markdown source for `![...](url)` before `marked` — validate each URL.
2. **Post-render scan** of `htmlBody` for `<img src="...">` — validate each src.

Either is fine. Prefer failing with `site/blog/{file}.md: missing image 'media/...'` style messages (match existing frontmatter error tone).

Do **not** add a marked extension dependency.

### CSS guidance

Add to `site/assets/blog.css` only:

- `.blog-card-hero` — full width of card content area, consistent height or aspect-ratio, `object-fit: cover`, border-radius consistent with card
- `.blog-post-hero` — full measure width, spacing under title
- `.blog-post-body img` — `max-width: 100%; height: auto;`

Preserve existing focus/hover on `.blog-card-link`. Prefer `prefers-reduced-motion` if adding transitions (parity with landing).

### Frontmatter schema (after this story)

```yaml
---
title: "Human title"
date: "YYYY-MM-DD" # quoted — do not regress Date normalization
author: Lucas
lane: field-notes # field-notes | release-story | ecosystem
summary: "One sentence — OG description and index card."
audience: all # alex | jordan | sam | all
# optional:
hero: media/2026-07-20-seed-post/hero.svg
heroAlt: "Description of the hero image"
# related:
#   - CHANGELOG.md#anchor
---
```

Required fields stay required. `hero` / `heroAlt` are optional-as-a-pair (`hero` ⇒ `heroAlt` required).

### Testing Requirements

- Extend `tests/scripts/build-blog.test.ts` (temp dirs + inline fixtures — existing pattern).
- Extend `tests/site/blog.test.ts` for real `build:site` assertions against seed/default hero.
- Optionally assert media copy in `tests/scripts/build-landing-site.test.ts`.
- TDD: RED → GREEN → REFACTOR (HARNESS §0.1).
- Full §0.2 gate before review: `test`, `lint`, `format`, `coverage`, `typecheck`, `build`.

### Project Structure Notes

| Path                                | Action                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `scripts/build-blog.mjs`            | **UPDATE** — hero resolve/validate, media copy, index/post markup, body image validation |
| `scripts/build-landing-site.mjs`    | **UPDATE only if** copy logic lives here instead of `buildBlog`                          |
| `site/assets/blog.css`              | **UPDATE** — hero + body image styles                                                    |
| `site/blog/_template.md`            | **UPDATE** — document image authoring                                                    |
| `site/blog/media/default-hero.svg`  | **NEW**                                                                                  |
| `site/blog/media/<post-slug>/…`     | **NEW** — seed/demo assets                                                               |
| `site/blog/2026-07-20-seed-post.md` | **UPDATE** — inline image (+ optional hero)                                              |
| `tests/scripts/build-blog.test.ts`  | **UPDATE**                                                                               |
| `tests/site/blog.test.ts`           | **UPDATE**                                                                               |
| `src/**`                            | **DO NOT TOUCH**                                                                         |
| `site/assets/landing.css`           | **DO NOT TOUCH**                                                                         |

### Previous work intelligence (S28.1–S28.3)

- Pipeline: `gray-matter` + `marked` in `scripts/build-blog.mjs`; wired from `build-landing-site.mjs`.
- Dates: always quote `date: "YYYY-MM-DD"`; `normalizeDate` uses **local** calendar parts for `Date` objects — do not regress (`b3995c1`).
- Stale cleanup deletes orphaned `blog/*.html` on rebuild — media sync: simplest is overwrite/copy `media/` each build (no need to prune unknown files in v1 unless easy).
- Landing Blog nav already in `site/index.html` (`0d8e17b`); sprint-status may still list S28.3 as backlog — **do not redo nav**; optionally fix status when closing this story if owner agrees.
- Exports used by tests: `escapeHtml`, `validateFrontmatter`, `loadPosts`, `buildBlog` — keep stable or extend carefully.

### Git intelligence

Recent blog commits: `6fe660f` pipeline+layout; `b3995c1` date/stale HTML; `0d8e17b` landing Blog link. Follow the same test style (vitest + temp dirs + `execFileSync` for full site build).

### Anti-patterns (do not)

- Invent a CMS, image CDN, or sharp/imagemin pipeline
- Put blog images only under `site/assets/` without a media convention (breaks per-post grouping) — default **may** live in `media/default-hero.svg` only
- Use root-absolute URLs (`/blog/media/...`)
- Nest links inside the card `<a>`
- Emit unescaped frontmatter into `alt`/`src`
- Touch wiki Mustache skin / `src/output/`
- Scope-creep S28.8 (`og:image` absolute URLs, sitemap)

### References

- [Source: `_bmad-output/implementation-artifacts/epic-28-specwiki-blog.md`]
- [Source: `huddles/2026-07-20-blog-image-assets.md`]
- [Source: `scripts/build-blog.mjs`]
- [Source: `scripts/build-landing-site.mjs`]
- [Source: `site/assets/blog.css`]
- [Source: `site/blog/_template.md`]
- [Source: `docs/brand/BRAND.md`]
- [Source: `_bmad-output/planning-artifacts/discovery/project-context.md` — marked/gray-matter stack]
- [Source: `HARNESS.md` — §§0.1, 0.2, 0.8–0.10]

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Debug Log References

- Media copy lives in `buildBlog` via `fs.cp` of `sourceDir/media` → `outputDir/media` (not in `copySite`).
- Body image validation scans rendered HTML `<img src>` (catches inline, reference-style, and raw HTML).

### Completion Notes List

- Implemented optional `hero`/`heroAlt`, default brand hero, index/post hero markup, body image path validation, and media tree copy.
- Seed post demonstrates inline `media/2026-07-20-seed-post/example.svg` and default hero (no custom `hero` frontmatter).
- Exported `assertSafeMediaPath` for testable path rules; extended `validateFrontmatter` for heroAlt-required-when-hero-set.
- ✅ Resolved review finding [Medium]: post-render `<img src>` validation for reference-style and raw HTML images.
- ✅ Resolved review finding [Low]: reject non-string `heroAlt` when `hero` is set.
- Full §0.2 gate green: 604 tests; lint/format/coverage/typecheck/build pass.
- §0.8 N/A (static site build, consistent with S28.1–S28.3).

### File List

- `scripts/build-blog.mjs` — hero resolve/validate, body image scan, media copy, index/post hero markup
- `site/assets/blog.css` — `.blog-card-hero`, `.blog-post-hero`, `.blog-post-body img`
- `site/blog/media/default-hero.svg` — **NEW** brand default hero
- `site/blog/media/2026-07-20-seed-post/example.svg` — **NEW** seed inline asset
- `site/blog/2026-07-20-seed-post.md` — inline image (default hero)
- `site/blog/_template.md` — image authoring notes
- `tests/scripts/build-blog.test.ts` — unit/integration coverage for ACs
- `tests/site/blog.test.ts` — seed/default hero + CSS + href guards
- `IMPLEMENTATION.md` — S28.10 log entry
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story → review
- `_bmad-output/implementation-artifacts/28-10-blog-image-assets-hero-and-inline.md` — this story

### Change Log

- 2026-07-20: Implemented blog media pipeline (hero + inline); status → review.
- 2026-07-20: Addressed code review findings — 2 Patch items resolved (post-render img scan; string heroAlt).

## Senior Developer Review (AI)

<!-- Populated after HARNESS §0.2.5 automated code review. Do not mark Patch items [x] until owner approves fixes. -->

**Review date:** 2026-07-20  
**Review outcome:** Approve (2 patches applied; Bugbot re-review clean)  
**Reviewer model:** claude-sonnet-5-thinking-high (Bugbot) + GPT-5.6 Sol (QA)

### Action Items

- [x] [AI-Review][Patch] Post-render (or broader) body image validation so raw HTML `<img>` and reference-style images cannot bypass missing/remote checks (`scripts/build-blog.mjs`)
- [x] [AI-Review][Patch] Reject non-string `heroAlt` values (require non-empty string, not numbers/objects) in `validateFrontmatter`

### Review Findings

| Severity | Location                                        | Finding                                                                          | Triage                                              |
| -------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Medium   | `scripts/build-blog.mjs` (`validateBodyImages`) | Regex-only `![...](url)` scan misses raw HTML `<img>` and reference-style images | **Patch**                                           |
| Low      | `validateFrontmatter` heroAlt check             | Non-string `heroAlt` (e.g. number) is accepted                                   | **Patch**                                           |
| Info     | §0.8                                            | No structured logging on copy/validate paths                                     | **Reject** — static site; N/A per E28 prior stories |

## QA Manual Validation

**QA model:** GPT-5.6 Sol  
**Review date:** 2026-07-20

### AC coverage

| AC    | Status  | Evidence                                               |
| ----- | ------- | ------------------------------------------------------ |
| 1     | Covered | media copy + no `.md` in dist tests                    |
| 2     | Covered | hero path/alt tests; non-string heroAlt rejected       |
| 3–5   | Covered | default/custom hero markup tests                       |
| 6     | Covered | inline + reference-style + raw HTML img validation     |
| 7–9   | Covered | CSS/site tests + seed assets + template                |
| 10    | Partial | core cases covered; adversarial path matrix incomplete |
| 11–12 | Covered | no new deps; `src/` untouched                          |

### Regression risks

- Posts without `media/default-hero.svg` now fail builds.
- Remote inline images intentionally fail.
- Stale media in existing output dirs is not pruned (overwrite/copy only).
- Every card loads a hero image (page weight).

### Gaps

- No browser-level a11y/layout checks (manual steps cover visual/focus).

### Manual validation steps

1. `npm test -- tests/scripts/build-blog.test.ts tests/site/blog.test.ts` — blog tests pass
2. `npm run build:site` — succeeds; `dist/landing-site/blog/media/default-hero.svg` exists
3. `open dist/landing-site/blog/index.html` — every card shows a hero before its title; no broken images
4. `open dist/landing-site/blog/2026-07-20-seed-post.html` — default hero under title; inline SVG in body scales in column
5. Temporarily set `hero: media/does-not-exist.png` + `heroAlt: "x"` on seed post → `npm run build:site` — fails with actionable path; revert
6. Tab to a blog card — single focusable link; focus ring visible; no nested link traps
