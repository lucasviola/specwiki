# Improvement Report — Agent Skills phase groups show duplicate names

**ID:** 23-IMP-1  
**Date:** 2026-07-17  
**Source:** Owner review of S23.2 dogfood (`Agent Skills` nav)  
**Epic:** E23 — Navigation Drawer Hierarchy  
**Related:** S23.2 (shipped), epic “Phase C polish” open item  
**Status:** scheduled as [S23.6](../23-6-agent-skills-phase-group-dedup.md) — review

---

## Observation

BMAD Output grouping feels right: **Implementation Stories** nest under **Epic N**, so related pages are hierarchical and distinct.

Agent Skills hybrid phase groups (e.g. **Analysis**, **Planning**) currently list **multiple nav links with the same display title**. That reads as a flat dump of duplicates, not a map of skills.

## Why it happens (current S23.2 behavior)

- Phase membership is by skill id (folder under `.agents/skills/`).
- L4 title is the CSV `display-name` (or agent TOML label) applied to **every** wiki page under that skill.
- A skill often contributes **more than one discovered page** (`SKILL.md`, extra markdown, multi-row CSV actions mapped to the same skill folder), so the phase group shows the same human name repeatedly.
- Unlike BMAD Output L3, hybrid Agent Skills groups are **intentionally flat** under each phase (no second level for skill folder / action).

## Desired direction

Improve Agent Skills so phase groups are as scannable as BMAD Output epics — **one clear entry per skill (or skill › action)**, not repeated identical titles.

### Candidate approaches (for later story design)

1. **Skill-folder L2 under phase** (mirrors Epic N): `Analysis → Brainstorm Project` with pages nested or singleton-promoted under the skill.
2. **One nav link per skill id** in each phase (prefer primary `SKILL.md`; drop or demote extras).
3. **Disambiguate L4 labels** when multiple pages share a skill: append action / menu-code / filename (ties to Phase C “menu-code badges” / description subtitles).
4. **Multi-row CSV as children**: parent = skill display-name; children = per-row `display-name` / action (Create Story vs Validate Story).

Prefer infer-only (no required SKILL.md frontmatter edits), max depth 2 inside the category, and existing singleton-promotion rules.

## Acceptance sketch (when scheduled)

- [x] Under a phase group with multi-file / multi-row skills, the drawer does not show indistinguishable duplicate titles
- [x] Mental model stays: Your team → SDLC phases → Core / Deprecated / Uncatalogued
- [x] BMAD Output epic nesting behavior remains unchanged
- [x] Dogfood on `--project .` shows distinct, scannable Agent Skills entries
- [x] Unit/renderer coverage for the chosen disambiguation / nesting rule

## Non-goals

- Merging Agent Skills with Cursor Skills
- Nested `<details>` disclosure UI (see 23-IMP-2 / S23.3)
- Changing Markdown wiki structure or discovery paths

## Suggested scheduling

New follow-up story after S23.2 (e.g. **S23.6** or fold into Phase C polish), or refine S23.2 behavior before treating Agent Skills UX as done. Owner to prioritize vs S23.3–S23.5.
