# Epic 26 — HTML Media Assets Rendering

## Goal

Render **images and other static media** in the generated HTML wiki — local project files (SVG, PNG) and **README-style CDN badges** (shields.io, GitHub Actions) — so wiki pages look like their source markdown while staying compatible with the Vector-inspired skin, dark mode, and the static `file://` browsing model.

**Audience:** Alex (README and long-form reader), Sam (index portal with badges and wordmarks), maintainers dogfooding the specwiki repo README.

**POC branch:** `fix/html-media-assets` — local asset copy to `html/media/`, path rewriting, per-segment readme intro rendering, theme-aware wordmark CSS. **This epic formalizes, extends, and lands that work.**

**Builds on:** **E16 S16.1–S16.3** (Mustache renderer, `.mw-parser-output`, bundled CSS), **E8 S8.4** (README index intros with per-source paths), **E19 S19.1** (dark/light theme), **E24 S24.1–S24.2** (typography tokens). **Informs:** future ADR on generate-time network exceptions (revisits NFR-012 for opt-in remote mirroring).

---

## Problem statement

Today, markdown and HTML `<img>` references in discovered specs — especially root and folder `README.md` files — render with **broken relative paths** in `wiki/html/` because assets are not copied and `src` attributes are not rewritten. README files commonly mix:

| Asset kind                 | Example in repo README                              | Current gap                                           |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Local SVG wordmark         | `docs/brand/specwiki-wordmark-light.svg`            | Broken `src` in generated HTML                        |
| Local PNG diagram          | `./docs/assets/architecture.png`                    | Not copied into output tree                           |
| CDN badge (SVG)            | `https://img.shields.io/badge/version-1.1.1-blue`   | Either broken offline or requires browse-time network |
| CDN badge (GitHub Actions) | `https://github.com/.../workflows/ci.yml/badge.svg` | Same                                                  |

The POC on `fix/html-media-assets` solves **local** assets. This epic completes **CDN handling**, **presentation CSS**, and an **extensible resolver** for future formats (GIF, WebP, inline data URIs policy, etc.).

---

## Owner decisions (proposed — confirm before S26.3)

| Topic                   | Recommendation                                                                          | Rationale                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Local assets            | Always copy into `html/media/{project-relative-path}`                                   | Preserves ADR-0004 static output; works offline via `file://`                |
| Remote CDN default      | **Passthrough** — preserve `https://` `src` unchanged                                   | NFR-012: no network I/O in `generate` by default                             |
| Remote CDN opt-in       | `--mirror-remote-media` (or config flag) fetches allowlisted hosts at generate time     | True offline wiki when owner opts in; explicit network exception             |
| Allowlist (mirror mode) | `img.shields.io`, `shields.io`, `github.com` (badge paths), `raw.githubusercontent.com` | Matches README badge patterns; extend via config later                       |
| Supported MIME (v1)     | `image/svg+xml`, `image/png`                                                            | README wordmarks + badges; reject executables                                |
| Markdown output         | Unchanged — media rewriting is **HTML-only**                                            | Frozen `wiki/*.md` contract (NFR-013 extend-only)                            |
| HTML `<img>` in README  | Supported via post-render rewrite pass                                                  | Root README uses raw HTML wordmarks + badge row                              |
| Theme wordmarks         | CSS class pair `.specwiki-wordmark-light` / `-dark` toggled by E19 theme                | Matches `docs/brand/BRAND.md` dual-variant kit                               |
| Extensibility           | `MediaSource` strategy interface behind `MediaAssetResolver`                            | Future stories add WebP, GIF, video poster frames without rewriting pipeline |

---

## Architecture sketch

```
Markdown / HTML img refs
        │
        ▼
 renderMarkdownHtml()  ──► rewriteMarkdownImageSyntax()  (local paths → register)
        │                      rewriteHtml()               (HTML img tags)
        ▼
 MediaAssetResolver.registerAsset()
        │
        ├── LocalFileSource     → copy from projectRoot → html/media/...
        ├── RemoteUrlSource     → passthrough OR mirror (opt-in)
        └── (future sources)    → DataUriSource, etc.
        ▼
 copyAssets() / mirrorRemoteAssets()  at end of writeHtmlWiki()
        │
        ▼
 Bundled specwiki.css styles img in .mw-parser-output + .specwiki-portal-intro
```

**Output layout (extend-only):**

```
wiki/html/
  index.html
  {slug}.html
  assets/           # existing CSS/JS
  media/            # NEW — mirrored local + optional remote assets
    docs/brand/specwiki-wordmark-light.svg
    docs/assets/logo.svg
    remote/         # optional — hashed filenames when mirroring CDN
      a1b2c3d4.svg
```

**Security (HARNESS §0.9):**

- Local copy: existing `assertRealpathConfinedUnder` + `assertConfinedUnder` (E5, E21)
- Remote mirror: HTTPS only, host allowlist, max bytes, timeout, no auth headers, validate content-type, sanitize SVG if inlined (or store as file only)
- Never fetch non-image content types; log `output.error` on failure, leave passthrough URL if mirror fails

---

## Stories

| Story | Summary                                         | Depends      | Status  |
| ----- | ----------------------------------------------- | ------------ | ------- |
| S26.1 | Local media asset resolver and HTML integration | E16, E8 S8.4 | backlog |
| S26.2 | Wiki media presentation and theme-aware assets  | S26.1        | backlog |
| S26.3 | Remote CDN media (passthrough + opt-in mirror)  | S26.1        | backlog |
| S26.4 | Extensible media pipeline and ADR               | S26.1–S26.3  | backlog |

---

## Story outlines

### S26.1 — Local media asset resolver and HTML integration

**As** Alex viewing a generated wiki,  
**I want** local SVG and PNG images from project-relative paths to display correctly,  
**so that** README wordmarks, diagrams, and inline markdown images work when I open `wiki/html/` via `file://`.

**Demo path:** Merge POC from `fix/html-media-assets` → `npm run dev generate -- --project tests/fixtures/sample-project --output /tmp/specwiki-media26` → open index — root intro logo at `media/docs/assets/logo.svg` renders; article pages with `![alt](./path.png)` show copied assets.

**Depends:** E16 S16.1–S16.3, E8 S8.4 (readme segments with `sourcePath`) | **NFR:** NFR-003, NFR-007, NFR-012, NFR-013 | **AD:** ADR-0001 (path confinement)

**Functional (summary):**

- Land `src/output/html/media-assets.ts`: `MediaAssetResolver`, `resolveProjectRelativePath`, `isLocalAssetSrc`, `renderMarkdownHtml`
- Copy registered local assets to `{output}/html/media/{project-relative-path}` during `writeHtmlWiki`
- Rewrite markdown `![alt](path)` and HTML `<img src="...">` to `media/...` relative URLs
- Thread `mediaResolver` through `HtmlRenderer` for index portal intros (per-segment `sourcePath`), root intro, and article bodies
- Extend `CategoryReadmeIntro` to segment list with `sourcePath` (POC shape)
- Reject traversal (`../`), absolute paths, `data:`, and remote URLs in local resolver
- Missing asset: log `output.error`, leave broken `src` or omit copy (document chosen behavior in tests)
- Markdown wiki output unchanged

**Logging & diagnostics (§0.8):**

- `output.write` for each copied media file (verbose)
- `output.media` with `sourcePath` + output relative path (verbose)
- `output.error` on copy/confined-path failure (always)

**Quality measures:**

- Unit tests: `tests/output/html/media-assets.test.ts` (path resolution, rewrite, copy, bracket-heavy alt text)
- Integration test: `tests/output/wiki.test.ts` — README intro copies logo into `html/media/`
- Full §0.2 gate; ≥90% coverage on `media-assets.ts`

**POC reference files:** `media-assets.ts`, `wiki.ts`, `renderer.ts`, `readme-index.ts`, `types.ts`, fixture `docs/assets/logo.svg`

---

### S26.2 — Wiki media presentation and theme-aware assets

**As** Sam browsing the wiki index,  
**I want** images styled consistently with the Wikipedia-inspired layout and dark mode,  
**so that** wordmarks, badges, and inline diagrams feel native to the skin rather than raw browser defaults.

**Demo path:** Generate on specwiki self-repo (or fixture with dual wordmarks) → index portal shows light/dark wordmark swap with theme toggle; article images respect 70ch measure and do not overflow mobile layout.

**Depends:** S26.1, E19 S19.1 (theme), E24 S24.2 (type tokens)

**Functional (summary):**

- Add `.mw-parser-output img` rules: `max-width: 100%`, `height: auto`, optional `display: block` + vertical rhythm via existing spacing tokens
- Portal intro scope (`.specwiki-portal-intro img`): centered badge rows, sensible max-height for wordmarks (~220px width from README pattern)
- Theme-aware wordmark classes (POC): `.specwiki-wordmark-light` / `.specwiki-wordmark-dark` with `:root[data-theme]` + `prefers-color-scheme` fallbacks matching E19 pre-paint script
- Preserve `alt` text; decorative duplicates may use `hidden` + CSS override (README pattern)
- Responsive: images inside `.mw-parser-output` tables/code blocks inherit existing overflow rules (E19 S19.2)
- CSS snapshot tests in `tests/output/wiki.test.ts` assert key selectors present in bundled `specwiki.css`
- No new runtime JS; no `fetch()` in generated pages

**Quality measures:**

- Visual regression via CSS text assertions (selector + property presence)
- Manual check: theme toggle swaps wordmark on index portal
- No regression to E24 heading scale or E19 responsive nav

---

### S26.3 — Remote CDN media (passthrough + opt-in mirror)

**As** Alex reading a README-derived wiki page,  
**I want** shields.io and GitHub Actions badge images to render,  
**so that** the generated wiki matches the source README badge row without manual asset copying.

**Demo path:** Fixture README with `[![CI](https://github.com/.../badge.svg)](...)` and shields.io version badge → **default generate:** HTML retains HTTPS `src` (online browse works); **`--mirror-remote-media`:** badges copied under `html/media/remote/` and `src` rewritten for offline `file://`.

**Depends:** S26.1 | **NFR:** NFR-012 (default passthrough preserves no-network generate)

**Functional (summary):**

- Detect remote `src` in markdown images and HTML `<img>` (`https://`, `//`)
- **Default:** passthrough unchanged (document browse-time network requirement for badges)
- **Opt-in `--mirror-remote-media`:** fetch allowlisted HTTPS hosts; store under `html/media/remote/{hash}.{ext}`; rewrite `src` to relative path
- Allowlist: `img.shields.io`, `shields.io`, `github.com`, `raw.githubusercontent.com` (configurable constant; extensible)
- Limits: max file size (e.g. 1 MiB), request timeout, content-type allowlist (`image/svg+xml`, `image/png`)
- Failed mirror: log `output.error`, fall back to passthrough URL
- CLI flag wired through `generate` command; documented in README security/output section
- Tests use mocked `fetch` — no live network in CI

**Logging & diagnostics (§0.8):**

- `output.media.remote` with host, bytes, outcome (verbose)
- `output.error` on disallowed host, timeout, or invalid content-type (always)

**Quality measures:**

- Unit tests with fetch mock: allowlist, rewrite, fallback, size limit
- Integration test: passthrough mode produces unchanged shields URL; mirror mode produces local file
- Document NFR-012 exception explicitly in flag help text

---

### S26.4 — Extensible media pipeline and ADR

**As** a contributor adding a new media type or source,  
**I want** a documented resolver extension point,  
**so that** future formats (WebP, GIF, inline policy) ship without redesigning HTML generation.

**Demo path:** Read `docs/adr/00XX-media-asset-pipeline.md` — describes `MediaSource` interface, local vs remote phases, NFR-012 boundary, and frozen output contract.

**Depends:** S26.1–S26.3

**Functional (summary):**

- Refactor `MediaAssetResolver` to delegate to pluggable `MediaSource` handlers (local file, remote URL) if not already structured in S26.1/S26.3
- Add ADR: media pipeline decision — copy-local-always, remote passthrough default, mirror opt-in, MIME v1 scope, SVG handling policy
- Update `ARCHITECTURE-SPINE.md` cross-link (one paragraph, no spine rewrite)
- Add `IMPLEMENTATION.md` build log row on epic completion
- Optional: `specwiki.config.js` hook shape documented but not implemented (future)

**Quality measures:**

- ADR reviewed for consistency with ADR-0001, ADR-0004, NFR-012
- No behavior change beyond refactor clarity; existing S26.1–S26.3 tests remain green

---

## Requirements & constraints

- **Frozen contracts:** `wiki/index.md`, `wiki/{slug}.md`, `wiki/html/{slug}.html` paths unchanged (NFR-013 extend-only)
- **Static output:** media files are disk artifacts under `html/media/` — no bundled server (ADR-0004)
- **Browse model:** default generate remains offline-capable for **local** media; remote badges need network at view time unless mirror flag used
- **No client `fetch()`:** generated HTML must not add runtime network JS (E19/E23 precedent)
- **Path confinement:** all local copies respect project root and output dir guards (E5, E21)
- **Markdown unchanged:** media pipeline applies to HTML render path only
- **Design fit:** use Wikimedia semantic color/spacing tokens (E16, E19, E24); no hard-coded light-theme image borders
- **Dogfood target:** specwiki repo root `README.md` — dual wordmarks + shields.io + GitHub Actions badges render correctly after epic

---

## Cross-story dependencies

| Upstream  | Relationship                                                                  |
| --------- | ----------------------------------------------------------------------------- |
| E16 S16.1 | Mustache renderer, `specwiki.css` bundle pipeline                             |
| E16 S16.3 | `.mw-parser-output` content scope for img CSS                                 |
| E8 S8.4   | README index intros; per-segment `sourcePath` for correct relative resolution |
| E19 S19.1 | Theme init script; wordmark light/dark CSS must compose                       |
| E19 S19.2 | Mobile overflow; images must not break 320px layout                           |
| E24 S24.2 | Typography tokens; img captions/alt remain at body scale                      |
| E21 S21.1 | Output confined to project root — `html/media/` stays under `--output`        |
| ADR-0004  | Static files only; media copy is generate-time filesystem write               |
| NFR-012   | Default no network; S26.3 mirror is explicit opt-in                           |

---

## Epic gate

- [ ] S26.1 — Local SVG/PNG copy + path rewrite; POC merged; integration tests green
- [ ] S26.2 — Theme wordmarks + `.mw-parser-output img` presentation CSS
- [ ] S26.3 — CDN passthrough default; opt-in mirror with allowlist + tests (mocked fetch)
- [ ] S26.4 — ADR published; resolver extension point documented
- [ ] Dogfood: `npm run dev generate -- --project . --output /tmp/specwiki-self` — root README wordmarks and badges render on index
- [ ] Full HARNESS §0.2 quality gate on epic completion

---

## Open items (non-blocking)

- **S26.5 candidate** — Config-file allowlist for additional CDN hosts (not CLI flag only)
- **SVG sanitization** — strip script/foreignObject if SVG inlined; file-copy-only may suffice for v1
- **GIF / WebP** — add MIME handlers via `MediaSource` registry
- **Markdown `![]()` title attributes** — passthrough if present in GFM
- **Lazy loading** — `loading="lazy"` on article images (HTML attribute only; no JS)
- **Search index** — media alt text in lunr index (E16 S16.4 extension)

## POC provenance

| Artifact                                 | Role                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Branch `fix/html-media-assets`           | Working local media resolver + tests                                      |
| Commit `8c2126e`                         | `fix(output): copy markdown image assets into generated HTML wiki`        |
| `tests/output/html/media-assets.test.ts` | Path rewrite, copy, external URL passthrough, missing asset error         |
| `tests/output/wiki.test.ts`              | End-to-end README intro logo copy                                         |
| Root `README.md`                         | Dual wordmark HTML + shields.io/GitHub badge row — primary dogfood target |
