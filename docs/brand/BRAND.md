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

## Usage notes

- Do not substitute “Spec Wiki” title case for the wordmark in product chrome.
- Keep brackets and name lowercase: `[[specwiki]]`.
- Prefer the SVG files for README badges and docs; use HTML spans inside the wiki renderer.
- Minimum clear space: one cap-height (`1em`) on all sides of the wordmark.
