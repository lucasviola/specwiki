---
date: 2026-07-19
topic: HTML inter-page link resolution
roster:
  - Winston (System Architect)
  - Amelia (Senior Software Engineer)
  - Party mode roundtable (orchestrator)
related:
  - _bmad-output/implementation-artifacts/16-5-html-inter-page-link-resolution.md
  - _bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md (S16.5)
status: closed
---

# Huddle — HTML inter-page link resolution

## Problem

Inline markdown links in generated HTML wiki pages do not navigate correctly under `file://` browsing. Navigation chrome (sidebar, breadcrumbs, index metadata) uses `{slug}.html`, but article body links pass through unchanged from `renderMarkdown()`.

**Reported examples:**

| Source                 | Link                                           | Broken behavior                                                      |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| `docs/adr/index.md:42` | `./template.md`                                | Resolves to missing `html/template.md`                               |
| `docs/adr/index.md:46` | `../../_bmad-output/.../ARCHITECTURE-SPINE.md` | Wrong path relative to flat `html/` output                           |
| `README.md:225`        | `CHANGELOG.md`                                 | Opens `file:///…/wiki/html/CHANGELOG.md` instead of `changelog.html` |

Dogfood generate (~657 pages) showed many raw `.md` hrefs in HTML body content.

## Technical discussion (Winston + Amelia)

**Root cause:** S16.2 AC #4 was implemented for chrome only, not inline markdown body links.

**Recommended approach:** `WikiLinkIndex` + `HtmlLinkResolver` module; custom `marked` link renderer; HTML-only wiring (markdown `wiki/*.md` unchanged).

**Design constraints:**

- Resolve relative hrefs from **source markdown path**, not `html/` output location
- O(1) lookup via Map built once at generate time
- Security: path confinement under `projectRoot`; block `javascript:` / `data:` schemes; no `file://` absolute hrefs
- Extensibility: optional `linkResolver` on `renderMarkdown()` for future exporters

## Party mode outcome

- **No new epic** — closes gap in existing E16 / S16.2
- **Story created:** S16.5 — HTML inter-page link resolution (`ready-for-dev`)
- Epic 16 reopened (`in-progress`) in sprint-status

## Decisions

1. Implement as **S16.5** under Epic 16 (not a standalone epic)
2. Phase 1: resolver + marked hook + HTML integration + tests
3. Phase 2 (deferred): `output.link-unresolved` styling, optional `check-links` command

## Artifacts

- Story: `_bmad-output/implementation-artifacts/16-5-html-inter-page-link-resolution.md`
- Epics index updated: S16.1–S16.5
- Sprint status: `16-5-html-inter-page-link-resolution: ready-for-dev`

## Next step

Implement S16.5 (`dev this story 16-5`).
