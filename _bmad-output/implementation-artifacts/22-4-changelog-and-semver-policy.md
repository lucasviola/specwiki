---
baseline_commit: HEAD
---

# Story 22.4: CHANGELOG and SemVer policy

Status: done

## Story

As an open-source user and contributor,
I want a changelog and documented semver rules,
so that I know what changed in each release and how maintainers decide version bumps.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** `CHANGELOG.md` exists at repo root with `[Unreleased]` and `[1.0.0]` sections; `docs/SEMVER.md` documents bump rules for this CLI library.

**Binds:** E22 | **Depends:** none (can run in parallel with S22.1–S22.3)

## Acceptance Criteria

1. **`CHANGELOG.md`** at repo root following [Keep a Changelog](https://keepachangelog.com/) format:
   - `[Unreleased]` section at top
   - `[1.0.0] - YYYY-MM-DD` with first-release summary (CLI commands, discovery, markdown+HTML wiki, search, init/open, JSON/llms.txt)
   - Link format compatible with GitHub Releases copy-paste
2. **`docs/SEMVER.md`** documenting:
   - PATCH / MINOR / MAJOR rules for `@lucasviola/specwiki` (CLI surface + output contract)
   - Pre-release tags (`1.1.0-rc.1` + `npm publish --tag next`) as optional
   - Rule: no version bumps in feature PRs
   - Rule: contributors add bullets under `[Unreleased]`; maintainers finalize on release
3. **README link** to `CHANGELOG.md` (Contributing or Development section — full CONTRIBUTING.md comes in S22.5).
4. **Contract test:** `CHANGELOG.md` exists and contains `[1.0.0]` heading.
5. **Scope boundary:** No version bump scripts, no publish — content only.
6. **Quality measures:** Editorial accuracy against shipped CLI; spot-check commands in changelog match `specwiki --help`.

## Tasks / Subtasks

- [ ] Create `CHANGELOG.md` with `[Unreleased]` and `[1.0.0]`
- [ ] Create `docs/SEMVER.md` from epic policy table
- [ ] Add README link to CHANGELOG
- [ ] Add contract test for CHANGELOG presence
- [ ] Owner review of 1.0.0 release notes accuracy

## Dev Notes

### 1.0.0 content guidance

Summarize shipped capabilities — do not list every story ID:

- Cross-framework spec discovery (Cursor, BMAD, OpenSpec, AGENTS.md, etc.)
- Commands: `list`, `generate`, `open`, `init`
- Markdown + HTML wiki with search, dark mode, responsive layout
- JSON machine output and `llms.txt` export
- Node.js ≥20, MIT license

Pre-1.0 history is captured as the initial release note, not as fake 0.x npm versions.

## QA Manual Validation

1. Open `CHANGELOG.md` — `[1.0.0]` section present with accurate feature summary
2. Open `docs/SEMVER.md` — PATCH/MINOR/MAJOR rules match epic-22 policy
3. `npm test -- tests/package/` — CHANGELOG contract test passes
