# specwiki brand assets

Canonical brand kit for the `[[specwiki]]` wordmark. Colors and typography match the generated HTML wiki header (`src/output/html/templates/layout.mustache` and `src/output/html/assets/specwiki.css`).

## Wordmark

The logo is a **text wordmark**, not an icon mark. Brackets use the primary accent; the name uses base text color.

| Variant | Use on                                               |
| ------- | ---------------------------------------------------- |
| Light   | White or light backgrounds (`#ffffff`, `#f8f9fa`, …) |
| Dark    | Dark backgrounds (`#16181c`, `#202328`, …)           |

### Light background

![[[specwiki]] wordmark on a light background](./specwiki-wordmark-light.svg)

<details>
<summary>Inline SVG (light)</summary>

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 28" width="132" height="28" role="img" aria-label="[[specwiki]]">
  <title>[[specwiki]] wordmark (light)</title>
  <text
    x="0"
    y="21"
    font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
    font-size="16"
    font-weight="700"
    letter-spacing="-0.32"
  >
    <tspan fill="#3366cc">[[</tspan><tspan fill="#202122">specwiki</tspan><tspan fill="#3366cc">]]</tspan>
  </text>
</svg>
```

</details>

### Dark background

<div style="background:#16181c;padding:1rem;border-radius:4px;display:inline-block">

![[[specwiki]] wordmark on a dark background](./specwiki-wordmark-dark.svg)

</div>

<details>
<summary>Inline SVG (dark)</summary>

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 28" width="132" height="28" role="img" aria-label="[[specwiki]]">
  <title>[[specwiki]] wordmark (dark)</title>
  <text
    x="0"
    y="21"
    font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
    font-size="16"
    font-weight="700"
    letter-spacing="-0.32"
  >
    <tspan fill="#6b8fe8">[[</tspan><tspan fill="#eaecf0">specwiki</tspan><tspan fill="#6b8fe8">]]</tspan>
  </text>
</svg>
```

</details>

## Standalone files

| File                                                           | Description                                   |
| -------------------------------------------------------------- | --------------------------------------------- |
| [`specwiki-wordmark-light.svg`](./specwiki-wordmark-light.svg) | Light-theme wordmark (transparent background) |
| [`specwiki-wordmark-dark.svg`](./specwiki-wordmark-dark.svg)   | Dark-theme wordmark (transparent background)  |

## Color tokens

Aligned with Wikimedia-inspired CSS custom properties in `specwiki.css`.

### Light theme

| Token                     | Hex       | Usage                      |
| ------------------------- | --------- | -------------------------- |
| `--color-base`            | `#202122` | Wordmark text (`specwiki`) |
| `--color-primary`         | `#3366cc` | Brackets (`[[` `]]`)       |
| `--background-color-base` | `#ffffff` | Page background            |

### Dark theme

| Token                     | Hex       | Usage                      |
| ------------------------- | --------- | -------------------------- |
| `--color-base`            | `#eaecf0` | Wordmark text (`specwiki`) |
| `--color-primary`         | `#6b8fe8` | Brackets (`[[` `]]`)       |
| `--background-color-base` | `#16181c` | Page background            |

## Typography

| Property       | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Font stack     | `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, system monospace |
| Weight         | 700 (bold)                                                                        |
| Size (header)  | `1rem` / 16px                                                                     |
| Letter spacing | `-0.02em`                                                                         |

No web fonts or CDN assets — system monospace only, matching the `file://`-safe HTML output contract.

## HTML wiki header (reference)

The generated wiki renders the wordmark as styled text:

```html
<a href="index.html" class="specwiki-logo">
  <span class="specwiki-logo-bracket">[[</span>specwiki<span
    class="specwiki-logo-bracket"
    >]]</span
  >
</a>
```

CSS classes:

- `.specwiki-logo` — base text color, monospace, bold, no underline
- `.specwiki-logo-bracket` — primary accent on `[[` and `]]`

## Wiki typography

Canonical type scale for the **generated HTML wiki** (`src/output/html/assets/specwiki.css`). System fonts only — no `@font-face`, CDN, or network assets (`file://` contract).

Article headings are scoped to `.specwiki-article-body .mw-parser-output` so portal and category intro blocks (also `.mw-parser-output`) do not inherit article title styling. Font families `--font-family-heading-main`, `--font-family-system-sans`, and weight tokens ship from bundled `wikimedia-ui-base` — reference by token name; do not duplicate stack definitions here.

### Type scale

| Token                 | Value     | px @16 | Role                                                 |
| --------------------- | --------- | ------ | ---------------------------------------------------- |
| `--font-size-caption` | 0.6875rem | 11     | Nav counts, search badges                            |
| `--font-size-ui-sm`   | 0.75rem   | 12     | Nav links, TOC links, search group headings          |
| `--font-size-ui`      | 0.8125rem | 13     | Breadcrumbs, category headings, infobox, TOC heading |
| `--font-size-body`    | 0.875rem  | 14     | Article body, default chrome inherit                 |
| `--font-size-h6`      | 0.875rem  | 14     | Minor section labels                                 |
| `--font-size-h5`      | 1rem      | 16     | Subsections                                          |
| `--font-size-h4`      | 1.125rem  | 18     | Section breaks                                       |
| `--font-size-h3`      | 1.375rem  | 22     | Major sections                                       |
| `--font-size-h2`      | 1.625rem  | 26     | Article sections (includes optional 1px bottom rule) |
| `--font-size-h1`      | 2rem      | 32     | Page title (serif)                                   |

### Font stacks

| Surface             | Stack / token                                                                 | Weight notes                |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| Wiki body           | `--font-family-system-sans` via `body.specwiki`                               | 14px body density           |
| Article h1–h2       | `--font-family-heading-main` (Linux Libertine / Georgia serif)                | 400                         |
| Article h3–h6       | `--font-family-system-sans`                                                   | 600                         |
| Portal Main Page h1 | `--font-family-heading-main` + `--font-size-h1` (`.specwiki-portal h1`)       | 400                         |
| Wordmark, code, pre | `--font-family-monospace-brand` (`ui-monospace` first — see wordmark section) | wordmark 700; code inherits |

Monospace brand stack (defined in `specwiki.css` `:root`):

```css
--font-family-monospace-brand:
  ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
  monospace;
```

### Chrome surface map

| Selector / surface                                 | Token(s) used                           |
| -------------------------------------------------- | --------------------------------------- |
| `.specwiki-search-group-heading`                   | `--font-size-ui-sm`, semi-bold (600)    |
| `.specwiki-search-category`                        | `--font-size-caption`                   |
| `.specwiki-search-snippet`                         | `--font-size-ui`                        |
| `.category-nav-heading`                            | `--font-size-ui`, semi-bold (600)       |
| `.category-nav-count`                              | `--font-size-caption`                   |
| `.category-nav-pages a`                            | `--font-size-ui-sm`                     |
| `.category-nav-subgroup-label`                     | `--font-size-caption`, semi-bold (600)  |
| `.category-nav-active .category-nav-heading`       | bold (700), not larger size             |
| `.breadcrumb`                                      | `--font-size-ui`                        |
| `.infobox`                                         | `--font-size-ui`                        |
| `.toc-heading`                                     | `--font-size-ui`, bold (700)            |
| `.toc-list a`                                      | `--font-size-ui-sm`                     |
| `.specwiki-article-body .mw-parser-output h1`–`h6` | respective `--font-size-h1`–`h6` tokens |

### Weight rhythm

Use semi-bold (`--font-weight-semi-bold`, 600) for category headings, subgroup labels, and search group headings. Reserve bold (`--font-weight-bold`, 700) for the active category heading (`.category-nav-active .category-nav-heading`) and the TOC heading (`.toc-heading`) only — active nav state uses weight, not a larger font size.

### Landing vs wiki

The marketing landing page (`site/assets/landing.css`, Epic 20) uses a **separate editorial scale**. Do not import landing hero clamp typography into wiki chrome or unify the scales without an explicit epic.

| Aspect            | Landing (`site/assets/landing.css`)     | Wiki (`specwiki.css`)                |
| ----------------- | --------------------------------------- | ------------------------------------ |
| Body base         | ~16px / `1rem`, system sans stack       | 14px `--font-size-body`, system sans |
| Hero h1           | `clamp(2.25rem, 6vw, 3.5rem)` marketing | 32px serif article title             |
| Design intent     | Editorial / marketing handoff           | Vector-density reading + nav chrome  |
| Modification rule | E20 scope — do not import into wiki     | E24 scope — document, do not unify   |

### Research and mockup

- UX brief: [`_bmad-output/planning-artifacts/ux/wiki-typography-brief.md`](../../_bmad-output/planning-artifacts/ux/wiki-typography-brief.md)
- Visual mockup: [`docs/design/typography-mockup.html`](../design/typography-mockup.html) (owner-approved 2026-07-18)
- Epic spec: [`_bmad-output/implementation-artifacts/epic-24-wiki-typography-system.md`](../../_bmad-output/implementation-artifacts/epic-24-wiki-typography-system.md)

### Known exceptions

These surfaces intentionally **do not** use the chrome `--font-size-*` ladder:

- `.specwiki-logo` — `font-size: 1rem` (16px); matches the wordmark SVG in the Typography section above
- `.infobox-title` — `font-size: 1rem`; optional serif polish deferred (Epic 24 open item)

## Usage notes

- Do not substitute “Spec Wiki” title case for the wordmark in product chrome.
- Keep brackets and name lowercase: `[[specwiki]]`.
- Prefer the SVG files for README badges and docs; use HTML spans inside the wiki renderer.
- Minimum clear space: one cap-height (`1em`) on all sides of the wordmark.
