---
name: specwiki-daily-summary
description: >-
  Summarize specwiki work done today (or a given date) from git history,
  sprint status, and story artifacts. Use when the user asks for a daily
  summary, today's progress, what was done today, end-of-day recap, or
  "summary of the day so far".
---

# specwiki Daily Summary

**Goal:** Produce an accurate, readable recap of work completed today — not a generic status report.

## Conventions

- `{project-root}` = workspace root (specwiki repo)
- Default date: **today** from `user_info` (respect the user's timezone when choosing calendar day)
- Override date when the user says e.g. "yesterday" or gives an explicit date (`YYYY-MM-DD`)

## Workflow

### Step 1 — Gather data (parallel)

Run these in parallel:

```bash
# Commits for the target date (adjust DATE)
DATE=$(date +%Y-%m-%d)   # or user-specified date
git log --since="${DATE} 00:00:00" --until="${DATE} 23:59:59" --format="%h %ad %s" --date=format:"%H:%M"
git log --since="${DATE} 00:00:00" --until="${DATE} 23:59:59" --format="%h|%s"

# Working tree
git status --short

# Optional one-shot gather script
bash {project-root}/.agents/skills/specwiki-daily-summary/scripts/gather-daily-data.sh {project-root} "${DATE}"
```

Also read:

| Source          | Path                                                                      | Purpose                           |
| --------------- | ------------------------------------------------------------------------- | --------------------------------- |
| Sprint status   | `{project-root}/_bmad-output/implementation-artifacts/sprint-status.yaml` | Epic/story states, `last_updated` |
| Package version | `{project-root}/package.json`                                             | Current release version           |
| Deferred work   | `{project-root}/_bmad-output/implementation-artifacts/deferred-work.md`   | Only if commits touch it          |

For feature commits (`feat`, `fix`, major `docs`), run `git show --stat <hash>` to see scope. Do not stat every commit — focus on non-chore commits and version bumps.

### Step 2 — Map commits to stories

Parse commit subjects for story/epic hints:

- `(S21.6)`, `(E21 S21.3)`, `S16.5`, `epic-21`, `21-3-*` in messages or changed story filenames
- Story files under `_bmad-output/implementation-artifacts/` named `N-M-*.md`

Cross-check sprint-status.yaml so completed epics/stories match what landed in git today.

### Step 3 — Group and prioritize

Organize findings into:

1. **Shipped features / fixes** — user-visible or architectural changes (`feat`, `fix`, meaningful `docs`)
2. **Epic / sprint milestones** — epics marked done, stories moved to done/review
3. **Release activity** — version bumps, release docs, publish/security checklist work
4. **Planning & tooling** — new stories, skills, sprint maintenance commits
5. **In progress / uncommitted** — dirty working tree or stories still in `review` / `in-progress`

Deprioritize or collapse pure `chore(nofeature)` / sprint-metadata-only commits into one bullet unless they mark a milestone.

### Step 4 — Write the summary

Use this template (omit empty sections):

```markdown
## Daily summary — [Weekday, Month D, YYYY]

**[N commits]** from [HH:MM] to [HH:MM]. Repo at **vX.Y.Z**. Working tree: [clean | N uncommitted files].

---

### [Theme — e.g. Epic 16 completed]

[1–3 sentences on what shipped and why it matters.]

- [Concrete deliverable 1]
- [Concrete deliverable 2]

### [Theme — e.g. Epic 21 security]

| Story | Deliverable |
| ----- | ----------- |
| S21.x | …           |

### Tooling & planning

- …

---

### Sprint snapshot

- **Epic N:** [status]
- **Package:** vX.Y.Z
- **Open today:** [stories in review / in-progress if relevant]
```

**Style rules:**

- Lead with outcomes, not commit hashes
- Mention version numbers when they changed today
- Use tables only when comparing multiple stories in one epic
- Keep the whole summary scannable in under ~40 lines unless the day was unusually large (>20 meaningful commits)
- Do **not** run the HARNESS §0.3 checkpoint — this is a read-only recap skill

### Step 5 — Offer follow-ups (optional, one line max)

If useful, note one natural next action (e.g. "S21.3 is in review" or "Epic 21 has one backlog story left"). Do not list multiple suggestions.

## Date handling

| User says          | Use                                                                     |
| ------------------ | ----------------------------------------------------------------------- |
| "today" / "so far" | Calendar day from `user_info`                                           |
| "yesterday"        | Previous calendar day in user's timezone                                |
| "2026-07-18"       | That exact date                                                         |
| "this week"        | Expand scope: summarize Mon–today (or last 7 days) with day subheadings |

## Examples

**User:** "summary of the day so far"
→ Default to today; run workflow; return grouped summary.

**User:** "what did we ship yesterday?"
→ Use yesterday's date in git `--since` / `--until`.

**User:** "daily recap in a canvas"
→ Answer in chat using this skill first. Only open a canvas if the user explicitly asked for canvas/visual output.

**User:** "summary of the day" (no git repo / empty day)
→ Report no commits for the date, current sprint snapshot from sprint-status.yaml, and any uncommitted changes.

## Quality checks

Before finishing:

- [ ] Commit count and time range match `git log` output
- [ ] Version string matches `package.json` (not inferred from commits alone)
- [ ] Epic/story statuses match sprint-status.yaml
- [ ] Feature bullets reflect actual deliverables, not just commit subject lines
- [ ] Uncommitted work mentioned if `git status` is non-empty

## Additional resources

- Output section examples: [reference.md](reference.md)
