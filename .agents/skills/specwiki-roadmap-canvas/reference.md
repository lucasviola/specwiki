# Roadmap canvas reference

## Epic titles (E8–E27)

| Epic | Title                              |
| ---- | ---------------------------------- |
| E8   | Config & extended discovery        |
| E9   | Agent interoperability             |
| E10  | CI freshness & consumer checks     |
| E11  | Developer experience loop          |
| E12  | Semantic framework enrichment      |
| E13  | npm publish & distribution         |
| E14  | Ecosystem export & intelligence    |
| E15  | IDE wiki panel (future bet)        |
| E16  | Wikipedia-style HTML wiki          |
| E17  | Broad discovery & init scaffold    |
| E19  | Responsive wiki UX                 |
| E20  | Landing page & specwiki.ai hosting |
| E21  | npm security hardening             |
| E22  | SemVer & release process           |
| E23  | Navigation drawer hierarchy        |
| E24  | Wiki typography system             |
| E25  | Architecture decision records      |
| E26  | HTML media assets                  |
| E27  | Live examples gallery              |

Epics E1–E7 are MVP (closed). Include in stats only as "MVP complete" context, not as active work.

## POST-MVP phase mapping

| Phase | Name                            | Epics                  |
| ----- | ------------------------------- | ---------------------- |
| A     | Config & extended discovery     | E8, E17                |
| B     | Agent interoperability          | E9                     |
| C     | Distribution & team adoption    | E10, E13, E20–E22, E21 |
| D     | Developer experience loop       | E11                    |
| E     | Semantic enrichment             | E12                    |
| F     | Ecosystem export & intelligence | E14                    |
| G     | IDE integration (future bet)    | E15                    |

**Phase status inference:**

- `done` — all mapped epics are `done` in sprint-status
- `active` — at least one mapped epic is `in-progress`, or phase C distribution work remains
- `backlog` — all mapped epics are `backlog` and none in-progress

Additional epics outside A–G (track separately under "Parallel tracks"):

| Track                | Epics         | Theme        |
| -------------------- | ------------- | ------------ |
| UX polish            | E19, E23, E24 | UX           |
| Security             | E21           | Distribution |
| Architecture         | E25           | Ecosystem    |
| Media                | E26           | UX           |
| Marketing / examples | E27           | Distribution |

## Theme assignment

Use when grouping remaining stories:

| Theme         | Epics                        |
| ------------- | ---------------------------- |
| Distribution  | E10, E13, E20, E21, E22, E27 |
| UX            | E11, E15, E19, E23, E24, E26 |
| Ecosystem     | E12, E14, E25                |
| Extensibility | E8, E14 (plugins)            |

## Critical path (default callout)

When sprint-status shows no owner override, prioritize:

1. **E13** — finish npm publish preparation (in-progress stories first)
2. **E21** — security gates before first public publish (S21.3–S21.6)
3. **E22** — semver tooling → 1.0.0 release (ready-for-dev queue)
4. **E10** — `generate --check` for consumer CI
5. **E23** — remaining nav/search parity stories
6. **E11** — watch + serve after package is live
7. **E25** — ADRs in review/backlog as architecture track

Adjust the callout if sprint-status shows a different active focus (e.g. E25 reviews blocking release).

## Future bets (POST-MVP-ROADMAP.md)

| Bet | Hypothesis                           | Epic tie-in |
| --- | ------------------------------------ | ----------- |
| 1   | Cursor/VS Code wiki panel            | E15 S15.1   |
| 2   | Semantic search / AI Q&A over index  | —           |
| 3   | OpenSpec Stores cross-repo discovery | —           |
| 4   | Hosted wiki SaaS                     | —           |
| 5   | Real-time spec validation / audit    | —           |
| 6   | Body HTML sanitization               | E21 S21.7   |
| 7   | MemPalace palace browse export       | —           |
| 8   | Obsidian vault export                | —           |

## Story title resolution

Sprint-status keys use slugs: `22-1-single-source-cli-version`.

Convert to display title:

1. Strip `{epic}-{story}-` prefix
2. Replace hyphens with spaces
3. Title-case unless acronym (CLI, ADR, npm, HTML, CI, SemVer)
4. Prefer exact title from `epics-and-stories.md` when available

Example: `25-2-foundational-adrs` → "Foundational ADRs"
