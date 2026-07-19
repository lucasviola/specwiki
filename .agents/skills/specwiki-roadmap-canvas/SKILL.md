---
name: specwiki-roadmap-canvas
description: >-
  Load the current specwiki roadmap from sprint-status and planning artifacts,
  then render it as a Cursor canvas. Use when the user asks for the roadmap,
  sprint overview, project plan, or backlog in a canvas, or says "show my
  roadmap".
---

# specwiki Roadmap Canvas

**Goal:** Produce an up-to-date, interactive roadmap canvas from live project artifacts — not a stale snapshot.

**Prerequisites:** Read the [canvas skill](/Users/lucas/.cursor/skills-cursor/canvas/SKILL.md) before writing any `.canvas.tsx` file.

## Conventions

- `{project-root}` = workspace root (specwiki repo)
- Canvas output path: `~/.cursor/projects/<workspace-slug>/canvases/current-roadmap.canvas.tsx`
  - For this repo: `/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/current-roadmap.canvas.tsx`
- Always **overwrite** `current-roadmap.canvas.tsx` on each run so the canvas stays current.

## Workflow

### Step 1 — Load authoritative data

Read these files in full:

| Source        | Path                                                                                  | Purpose                                            |
| ------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Sprint status | `{project-root}/_bmad-output/implementation-artifacts/sprint-status.yaml`             | **Source of truth** for epic/story status          |
| Post-MVP plan | `{project-root}/_bmad-output/planning-artifacts/discovery/POST-MVP-ROADMAP.md`        | Phases A–G, themes, future bets, critical path     |
| Epics index   | `{project-root}/_bmad-output/planning-artifacts/discovery/epics/epics-and-stories.md` | Story titles when sprint-status keys are slug-only |

Also read `{project-root}/_bmad/bmm/config.yaml` for `user_name` and `communication_language`.

### Step 2 — Parse sprint-status.yaml

From `development_status`:

- **Epic keys:** `epic-N` → status (`done` | `in-progress` | `backlog`)
- **Story keys:** `N-M-slug` → status (`done` | `in-progress` | `review` | `ready-for-dev` | `backlog` | `superseded`)
- **Retrospectives:** `epic-N-retrospective` — ignore for canvas counts
- Read `last_updated`, `mvp_status`, `mvp_closed` from the file header/body

**Include in canvas:**

- All epics where status is `in-progress` or `backlog` (show full story breakdown)
- All stories with status `in-progress`, `review`, `ready-for-dev`, or `backlog` across any epic
- Recently completed epics (status `done`) as a compact summary stat only

**Exclude from "remaining work" lists:**

- Stories/epics with status `done` or `superseded`

**Status display mapping:**

| sprint-status   | Canvas label  | Pill tone |
| --------------- | ------------- | --------- |
| `in-progress`   | In progress   | warning   |
| `review`        | In review     | warning   |
| `ready-for-dev` | Ready for dev | info      |
| `backlog`       | Backlog       | neutral   |

### Step 3 — Enrich with planning context

Use [reference.md](reference.md) for epic titles, POST-MVP phase mapping, and theme assignment.

Derive from POST-MVP-ROADMAP.md:

- Phase cards (A–G) with done/active/backlog status inferred from underlying epic completion
- Future bets table (Bet 1–8)
- Critical-path callout (Distribution → security → semver → CI/DX)

When a story title is unclear from the slug, resolve it from `epics-and-stories.md` or the matching `epic-N-*.md` file under `implementation-artifacts/`.

### Step 4 — Write the canvas

Create `current-roadmap.canvas.tsx` following canvas skill rules:

- Import **only** from `cursor/canvas`
- Embed all data inline (no fetch)
- Default-export one component
- Use `useHostTheme()` for colors — no hardcoded hex
- No gradients, box-shadows, or emojis

**Required sections** (omit any section that would be empty):

1. **Header** — "Current roadmap", `last_updated` date pill, one-line scope note (post-MVP focus; MVP closed date if present)
2. **Summary stats** — remaining stories, in progress, in review, ready for dev, backlog (Grid of `Stat`)
3. **Progress bar** — `UsageBar` with done / active / ready / backlog segments across all tracked stories
4. **Critical path callout** — `Callout` summarizing the next 3–5 highest-priority deliverables from live status
5. **Active epics** — `CollapsibleSection` per in-progress epic, story rows inside (default open)
6. **Ready queue** — table or list of all `ready-for-dev` stories, grouped by epic
7. **Phases A–G** — phase cards from POST-MVP roadmap, status derived from epic completion
8. **Recommended sequence** — `Table` with priority, epic, deliverable, status (from live data)
9. **Future bets** — table from POST-MVP-ROADMAP.md (only if bets exist in source)
10. **Footer** — source files and generation timestamp

Reuse layout patterns from the existing [post-mvp-roadmap.canvas.tsx](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/post-mvp-roadmap.canvas.tsx) where they fit, but **always regenerate data from Step 1** — never copy stale inline arrays from the old canvas.

### Step 5 — Introduce the canvas

In chat, link the canvas with a markdown file link to its absolute path:

`[Current roadmap](/Users/lucas/.cursor/projects/Users-lucas-Projects-specwiki/canvases/current-roadmap.canvas.tsx)`

Tell the user they can open it beside the chat. One sentence on what changed vs prior run if updating an existing canvas.

## Quality checks

Before finishing:

- [ ] Every in-progress/review/ready/backlog story in sprint-status appears in the canvas
- [ ] Counts in stats match parsed data
- [ ] Canvas TypeScript check reports no errors
- [ ] No empty sections or placeholder content
- [ ] Slop check from canvas skill passes (no gradients, shadows, emoji, wall of identical cards)

## Examples

**User:** "show my roadmap in a canvas"
→ Run full workflow; write `current-roadmap.canvas.tsx`; link it.

**User:** "refresh the roadmap canvas"
→ Re-read sprint-status.yaml; overwrite canvas; note any status changes in chat.

**User:** "what's on the roadmap?"
→ If they did not ask for a canvas, answer in chat only. If they said "canvas" or "visual", use this skill.
