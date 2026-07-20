# Launch copy pack — [[specwiki]]

**Date:** 2026-07-15  
**Grounded in:** `docs/marketing/market-research.md`, product brief, `docs/brand/BRAND.md`  
**Status:** Draft — review before posting  
**Pre-publish note:** Replace `npm install -g specwiki` CTAs with GitHub clone instructions until S13.1 npm publish completes.

---

## Brand and tone checklist

- [x] Uses `[[specwiki]]` text wordmark (not "Spec Wiki")
- [x] Developer-credible, concise tone
- [x] No unsupported superlatives ("best", "revolutionary", "game-changing")
- [x] Messaging guardrails: discovers/synthesizes; does not author specs, run agents, or host docs
- [x] JTBD hook present: _one command → categorized wiki from scattered agent specs_
- [x] Blog discovery URL: `https://specwiki.ai/blog/` (publisher updates — use in Reddit, LinkedIn, and HN CTAs below)

---

## Reddit

### Audience

Solo developers on r/cursor, r/LocalLLaMA, r/programming who accumulate `.cursor/rules/`, `AGENTS.md`, and framework outputs faster than they can track them.

### Hook

I got tired of grepping for Cursor rules — so I built a CLI that turns every agent spec in a repo into a categorized wiki.

### Body

After a few months of AI-assisted development, my repos looked like this: `.cursor/rules/` everywhere, root `AGENTS.md`, BMAD outputs in `_bmad-output/`, OpenSpec folders I forgot I created. Agents read these one file at a time. I had no single view of "what did I tell the agents?"

[[specwiki]] is a local CLI that scans your project with opinionated defaults (Cursor rules, skills, AGENTS.md, openspec, kiro, copilot instructions, and more), groups what it finds by category, and writes a browsable wiki — markdown pages plus self-contained HTML.

```bash
npx specwiki list      # see what will be indexed
npx specwiki generate  # write wiki/
npx specwiki open      # open HTML in your browser
```

It discovers and synthesizes what already exists. It does not author specs, run agents, or host documentation. Think readability layer, not another SDD framework.

### CTA

Try `npx specwiki list` on a repo with Cursor rules and tell me what categories show up. Repo: [GitHub link]. MIT licensed, Node 20+.

**Blog (optional follow-up):** Field notes and release stories at `https://specwiki.ai/blog/` — link in a comment after the main post lands, not as the primary CTA.

### Constraints

- **r/cursor:** Value-first; avoid bare link posts. Put repo URL in a comment if the sub requires it.
- **r/programming:** Frame as tooling for a real workflow problem, not self-promo spam.
- **Length:** 200–400 words for main post; shorter variant below.

### Short variant (comment or cross-post)

```bash
npx specwiki list && npx specwiki generate && npx specwiki open
```

Three commands. Categorized wiki from scattered agent specs. Local CLI, no hosting.

### Hashtags / subreddit notes

- Subreddits: `r/cursor`, `r/LocalLLaMA`, `r/programming`, `r/commandline`
- No hashtag culture on Reddit; use descriptive title instead

---

## LinkedIn

### Audience

Professional developers and tech leads adopting AI coding tools; Persona A and B.

### Hook

Your AI agents know what's in `.cursor/rules/` — do you?

### Body

Spec-driven development and AI coding agents produce persistent instruction files faster than most of us can mentally track: Cursor rules and skills, `AGENTS.md`, OpenSpec folders, BMAD planning outputs, Copilot instructions. Each tool reads its slice during a session. Humans are left grepping.

I built [[specwiki]] — a CLI documentation synthesizer for this exact problem. One command discovers agent-facing specs across frameworks, categorizes them, and generates a local wiki (markdown + HTML). No docs platform, no framework migration, no hosting.

**Workflow:** `list` to preview → `generate` to write `wiki/` → `open` to browse in your browser.

[[specwiki]] does not replace OpenSpec or BMAD. It runs after they (or Cursor) have done their work, so you can see the full landscape of what your project expects agents to know.

### CTA

If you work with Cursor or similar agents, try `npx specwiki list` on your current repo. I'd welcome feedback from teams standardizing agent conventions.

**Blog:** Ongoing field notes and release stories at `https://specwiki.ai/blog/` — optional second paragraph or comment link after the install CTA.

### Constraints

- Professional tone; avoid hype adjectives
- 1–3 short paragraphs perform best in feed; expand in comments if needed
- Optional: attach screenshot of HTML wiki category index

### Hashtags

`#AIcoding` `#DeveloperTools` `#Cursor` `#OpenSource` `#CLI`

---

## Hacker News (Show HN)

### Audience

Technical evaluators, OSS maintainers, indie hackers (Persona A and C).

### Hook (title)

`Show HN: [[specwiki]] – CLI that turns scattered AI agent specs into a browsable wiki`

### Body (first comment — post immediately after submission)

Hi HN — I built [[specwiki]] because my repos accumulated agent instruction files faster than I could navigate them.

**Problem:** `.cursor/rules/`, `AGENTS.md`, OpenSpec, BMAD outputs, Copilot instructions — scattered, no unified human-readable index.

**What it does:** Zero-config discovery with opinionated globs → categorized markdown wiki + self-contained HTML. Local CLI, Node 20+, MIT.

```bash
npx specwiki list
npx specwiki generate
npx specwiki open
```

**What it is not:** Not an SDD framework (doesn't author specs). Not an IDE plugin (doesn't run agents). Not a docs host. Synthesis/readability layer only.

**Differentiation from OpenSpec/BMAD:** Those create and manage spec lifecycles. [[specwiki]] aggregates what already exists across tools into one browsable view.

Happy to answer questions on discovery patterns, HTML output, or how it handles slug collisions.

**Blog:** Publisher updates at `https://specwiki.ai/blog/` — mention in a follow-up comment if readers ask where to follow along after launch.

### CTA

Repo: [GitHub URL]. Feedback especially welcome on default discovery patterns — what should we scan out of the box?

### Constraints

- **Title format:** Must start with `Show HN:`
- **Be present** for first 2–3 hours to answer comments
- **No marketing fluff** — HN penalizes superlatives and vague claims
- Link to GitHub in comment, not always in title

---

## X / Twitter

### Audience

Indie dev and AI tooling community; short-form discovery.

### Hook (single tweet)

One command → categorized wiki from scattered agent specs.

[[specwiki]] discovers Cursor rules, AGENTS.md, OpenSpec, BMAD output & more — then writes markdown + HTML you can browse locally.

```bash
npx specwiki list && npx specwiki generate && npx specwiki open
```

### Body (thread — optional)

**1/** After months of AI-assisted dev I couldn't answer: "what did I tell the agents?" Rules in `.cursor/`, specs in `openspec/`, outputs in `_bmad-output/` — no unified view.

**2/** [[specwiki]] scans your repo with zero-config defaults, groups files by category, generates `wiki/` (md + HTML). Local CLI. No hosting. Node 20+.

**3/** It discovers and synthesizes — does not author specs or run agents. Readability layer for the SDD ecosystem.

**4/** Try it: `npx specwiki list` on your current project. MIT licensed. [GitHub link]

### CTA

`npx specwiki list` — see your categories in 10 seconds.

### Constraints

- Tweet 1: ≤280 chars (hook + one command block may need screenshot instead)
- Use screenshot or terminal recording for engagement
- Pin thread on launch day

### Hashtags

`#buildinpublic` `#Cursor` `#AIcoding` `#CLI` `#opensource`

---

## Dev.to (additional channel)

### Audience

Developers who prefer tutorial-style posts with code blocks; good long-tail SEO.

### Hook (title)

Turn scattered AI agent specs into a browsable wiki with one CLI

### Body

If you use Cursor, Claude Code, or Copilot, your repository probably has agent instruction files you forgot about: `.cursor/rules/*.mdc`, skills in `.cursor/skills/`, root `AGENTS.md`, maybe OpenSpec or BMAD outputs. Agents consume these one at a time. You grep when you need the big picture.

[[specwiki]] is a Node.js CLI that solves the navigation problem without adopting another framework or docs platform.

#### What [[specwiki]] does

- **Discovers** agent-facing files with 15+ default glob patterns
- **Categorizes** by source (Cursor Rules, OpenSpec, Project Root, etc.)
- **Synthesizes** a `wiki/` tree with index, per-spec pages, and HTML
- **Exports** optional `llms.txt` and JSON for automation

#### Quick start

```bash
npx specwiki list
npx specwiki generate
npx specwiki open
```

#### What it does not do

[[specwiki]] does not author specs, run agents, or host documentation. Run it after your SDD framework or IDE has produced files — it's the readability layer.

#### Example output

After `generate`, you get:

```
wiki/
├── index.md
├── html/index.html
└── *.md pages per discovered spec
```

### CTA

Clone or `npm install -g specwiki`, run `list` on a repo you actively develop with AI agents, and compare the category breakdown to what you expected. Issues and pattern suggestions welcome on GitHub.

### Constraints

- Dev.to favors 4–8 min read with headers and code blocks
- Add cover image (terminal screenshot or HTML wiki categories)
- Tags: `ai`, `cli`, `documentation`, `cursor`, `opensource`, `node`

### Hashtags

Dev.to uses tags, not hashtags — see Constraints above.

---

## Posting schedule suggestion

| Day              | Channel              | Action                                    |
| ---------------- | -------------------- | ----------------------------------------- |
| D0 (publish day) | HN Show HN           | Submit morning US ET; monitor comments 3h |
| D0               | X                    | Pin thread; post hook tweet               |
| D1               | Reddit r/cursor      | Value-first post after HN traction        |
| D2               | Dev.to               | Publish tutorial article                  |
| D3               | LinkedIn             | Professional narrative + screenshot       |
| D+7              | Reddit r/programming | Cross-post if initial feedback positive   |

---

## Pre-launch checklist

- [ ] npm package live (S13.1) — update all CTAs to confirmed `npx specwiki`
- [ ] README consumer install matches copy
- [ ] Screenshot/GIF of `wiki/html/` category index prepared
- [ ] GitHub repo URL confirmed in all CTAs
- [ ] Blog URL `https://specwiki.ai/blog/` confirmed in Reddit, LinkedIn, and HN variants
- [ ] Owner reviews tone and guardrails in each channel draft
