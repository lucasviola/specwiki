# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2026-07-18

### Added

- Wiki typography system (Epic 24): explicit article heading scale with serif h1–h2 and sans h3–h6 under a clear size hierarchy
- Tokenized chrome font sizes for navigation, search, breadcrumbs, table of contents, and infobox surfaces
- System sans body text at 14px Vector-style reading density; BRAND-aligned monospace stack for the wordmark and inline code

### Changed

- Generated HTML wiki typography is now documented in `docs/brand/BRAND.md` (type scale, chrome surface map, and intentional landing-vs-wiki divergence)

## [1.1.0] - 2026-07-18

### Added

- Path-based navigation grouping in the HTML wiki sidebar
- Richer Agent Skills navigation from the BMad catalog (titles and hierarchy)
- Nested multi-page Agent Skills under phase groups
- Collapsible nested nav subgroups for denser category trees
- Article breadcrumbs now include the same subgroup path as the navigation drawer (e.g. `Main Page › Cursor Skills › Team A › Skill`)
- Explicit `aria-current="page"` only on the final breadcrumb segment

## [1.0.2] - 2026-07-17

### Added

- Fixed layout shift on content

### Fixed

- Escape `data-subgroup` keys in nav disclosure partials to avoid broken HTML attributes

## [1.0.1] - 2026-07-17

### Fixed

- Bind CLI `--version` to `package.json` so the published package reports the correct semver

### Changed

- Landing site polish (hero copy, quick-start copy button, layout CSS)

## [1.0.0] - 2026-07-16

First public release of [`@lucasviola/specwiki`](https://www.npmjs.com/package/@lucasviola/specwiki).

### Added

- CLI commands: `list`, `generate`, `open`, and `init`
- Cross-framework spec discovery (Cursor rules/skills, BMAD, OpenSpec, AGENTS.md, READMEs, and broad markdown by default)
- Markdown and HTML wiki output with search, dark mode, responsive navigation, and collapsible categories
- Machine-readable JSON output and opt-in `llms.txt` export
- Project config file support and `--patterns` override
- Output path confinement and related npm-safety guards for `generate` / `open`
- Requires Node.js 20+; MIT licensed
