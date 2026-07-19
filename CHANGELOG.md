# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.3] - 2026-07-19

### Added

- `SECURITY.md` with private vulnerability reporting via GitHub Security Advisories
- Stderr trust warning when `specwiki.config.js` is loaded (arbitrary code execution reminder)
- Production dependency audit gate in `prepublishOnly` (`npm audit --audit-level=high --omit=dev`)
- Maintainer pre-publish security checklist in `docs/RELEASING.md` (2FA, secrets, tarball review, verify-package, dry-run)

### Changed

- README maintainer section links to `docs/RELEASING.md` for the full npm publish checklist

## [1.1.2] - 2026-07-19

### Fixed

- HTML wiki inline markdown links now resolve to the correct generated `.html` pages when browsing locally via `file://` (cross-references no longer point at raw `.md` paths under `html/`)

### Added

- Verbose `output.link-unresolved` diagnostic when a relative spec link cannot be mapped during HTML generation
- Per-folder README segment link resolution when multiple folder READMEs merge into one category intro on the index page

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
