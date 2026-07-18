# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-07-17

### Added

- Path-based navigation grouping in the HTML wiki sidebar
- Richer Agent Skills navigation from the BMad catalog (titles and hierarchy)
- Nested multi-page Agent Skills under phase groups
- Collapsible nested nav subgroups for denser category trees

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

[Unreleased]: https://github.com/lucasviola/specwiki/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/lucasviola/specwiki/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/lucasviola/specwiki/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/lucasviola/specwiki/releases/tag/v1.0.0
