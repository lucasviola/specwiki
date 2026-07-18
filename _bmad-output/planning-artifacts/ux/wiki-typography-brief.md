# Wiki Typography System — UX Brief

**Status:** approved for Epic 24  
**Created:** 2026-07-18  
**Session:** Sally typography UX research  
**Interactive canvas:** [typography-ux-research.canvas.tsx](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/typography-ux-research.canvas.tsx)  
**Visual mockup:** [`docs/design/typography-mockup.html`](../../../docs/design/typography-mockup.html)

## Problem

Epic 16 delivered Vector-inspired **layout** (header, rails, infobox, TOC, breadcrumbs) and Epic 19 delivered **reading measure**, responsive navigation, and theme tokens. Typography remains **unfinished**: article headings inherit browser defaults on a 14px root; chrome uses five untokenized rem sizes; wiki body uses Helvetica while landing uses system sans; `--font-family-heading-main` and `--font-family-system-sans` from `wikimedia-ui-base` are unused.

Alex reads long BMAD stories where the TOC depth does not match visual heading depth. Sam scans 11px uppercase subgroup labels in a dense nav ladder. Jordan moves from the 16px landing page to a 14px wiki that feels like a different product.

## Owner decisions (2026-07-18)

| Decision              | Choice                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| Body size             | **Keep 14px** globally — Vector density for nav + TOC + article chrome |
| Wide reading bump     | **Optional** — 15–16px inside 70ch track at ≥1200px only (defer to P2) |
| Heading serif         | **h1–h2** use `--font-family-heading-main`; h3–h6 sans with weight     |
| Body sans             | Switch to `--font-family-system-sans`                                  |
| Monospace             | Align wiki with `BRAND.md`: `ui-monospace` first                       |
| Web fonts             | **Out of scope** — system fonts only (`file://` contract)              |
| Landing page          | **Separate scale** — document intentional divergence from wiki         |
| Codex token migration | Defer unless bundled with token work (P3)                              |

## Design principle

**Content voice vs chrome density:** article headings carry editorial hierarchy (serif + explicit scale); navigation chrome stays compact and tokenized. Do not import landing hero clamp typography into the wiki shell.

## Proposed type scale (wiki)

| Token                 | Size    | Usage                          |
| --------------------- | ------- | ------------------------------ |
| `--font-size-caption` | 11px    | Nav counts, badges             |
| `--font-size-ui-sm`   | 12px    | Nav links, TOC links, search   |
| `--font-size-ui`      | 13px    | Breadcrumbs, category headings |
| `--font-size-body`    | 14px    | Article body                   |
| `--font-size-h6`–h1   | 14–32px | Article headings (see mockup)  |

Full table and surface specs: open the canvas linked above.

## Phased stories (Epic 24)

1. **S24.1** — Article type scale and heading serif
2. **S24.2** — Type tokens and chrome alignment
3. **S24.3** — Typography specification doc

## Rejected patterns

- CDN or `@font-face` web fonts
- Global 16px body bump (breaks chrome density)
- Landing marketing clamp scale inside wiki nav/search
- Per-category custom typefaces

## Success criteria (qualitative)

- “Feels like a wiki” on a long BMAD story — h2/h3 scannable without reading text
- Nav labels legible at 1280px without squinting
- Wordmark mono matches `BRAND.md` SVG
- Landing → wiki transition acceptable (documented, not identical)

## Reference

Side-by-side mockup: `open docs/design/typography-mockup.html`
