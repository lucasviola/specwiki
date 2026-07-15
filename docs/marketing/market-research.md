# Market research — [[specwiki]] launch positioning

**Research date:** 2026-07-15  
**Topic:** Launch positioning for a CLI that discovers AI agent specs and generates a categorized wiki  
**Method:** Web search + synthesis with existing `domain-research.md` and `product-brief.md`  
**Researcher:** Market research workflow (bmad-market-research)

---

## Executive summary

The AI-assisted development ecosystem in 2026 produces **persistent instruction artifacts** faster than humans can navigate them. SDD frameworks (BMAD, OpenSpec, Kiro, GitHub Spec Kit) **author** specs; IDEs (Cursor, Claude Code, Copilot) **run** agents; conventions like AGENTS.md **standardize** cross-tool context. None of these provide a **cross-framework, zero-config unified view** of what already exists in a brownfield repo.

**[[specwiki]]** occupies the **documentation synthesis** niche: discover scattered agent-facing files, categorize them, emit markdown + HTML wiki locally. Primary audience is **Persona A** (solo Cursor/AI agent developers). Launch should emphasize the JTBD hook — _one command → categorized wiki from scattered agent specs_ — and strict messaging guardrails (discovers/synthesizes; does not author, run agents, or host).

---

## Target audience

### Primary — Persona A: Solo Cursor/AI Agent Developer ("Alex")

| Attribute   | Detail                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Profile     | Individual developer using Cursor, Claude Code, or Copilot on 1–3 active repos                               |
| Pain        | "Where are all my rules and specs?" after weeks of iterative AI-assisted work                                |
| Trigger     | Context loss between sessions; invisible duplication across `AGENTS.md`, `.cursor/rules/`, framework outputs |
| Environment | Local machine, Node.js ≥20, npm ecosystem                                                                    |
| Success     | `npx specwiki generate` → browse `wiki/html/` and see every instruction surface                              |

**Why primary for v0.1 launch:** Product is a local CLI with no auth, hosting, or team features. Shortest path to value = install → list → generate → open.

### Secondary — Persona B: Small team tech lead ("Jordan")

- Standardizes OpenSpec/BMAD; needs async onboarding for new hires.
- **Launch angle:** "Commit the generated wiki" / "share HTML locally" — defer CI regeneration messaging until E10 ships.
- **Channel fit:** LinkedIn, team Slack communities, Dev.to tutorials.

### Secondary — Persona C: OSS maintainer ("Sam")

- Documents contributor agent conventions (`AGENTS.md`, `.cursor/rules/`).
- **Launch angle:** "Contributors find agent rules without spelunking `.cursor/`."
- **Channel fit:** Hacker News Show HN, r/opensource, GitHub README cross-links.

---

## Competitive landscape

### Category 1: IDE rule browsers

| Alternative                                             | Strength                                                | Gap vs [[specwiki]]                                          |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| Cursor Rules UI ([docs](https://cursor.com/docs/rules)) | Native `.mdc` rules with glob scoping, activation modes | Single-tool; not exportable; no cross-framework view         |
| Claude Code `CLAUDE.md`                                 | Session-start context, nested files                     | Claude-specific; no aggregation across BMAD/OpenSpec outputs |
| Windsurf / Copilot instructions                         | Tool-native                                             | Siloed per vendor                                            |

**Gap [[specwiki]] fills:** Exportable, browsable wiki across Cursor rules, skills, root agent files, and framework outputs in one run.

### Category 2: SDD frameworks (spec authoring)

| Alternative                                        | Adoption signal                                                                                                                                                       | Gap vs [[specwiki]]                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Brownfield-first; delta specs; 20+ tool integrations ([DEV comparison](https://dev.to/willtorber/spec-kit-vs-bmad-vs-openspec-choosing-an-sdd-framework-in-2026-d3j)) | Creates and manages spec lifecycle; does not aggregate unrelated instruction surfaces |
| BMAD Method                                        | 40k+ GitHub stars; multi-agent workflows ([SDD guide](https://thebcms.com/blog/spec-driven-development))                                                              | Orchestration-first; produces `_bmad-output/` but no unified human index              |
| GitHub Spec Kit                                    | Model-agnostic SDD from GitHub                                                                                                                                        | Greenfield/spec-kit pipeline; not discovery of existing agent files                   |
| AWS Kiro                                           | Enterprise spec-first IDE                                                                                                                                             | `.kiro/specs/` per feature; no cross-framework aggregation                            |

**Positioning contrast:** Frameworks = **agreement layer before code**. [[specwiki]] = **readability layer after specs exist**.

### Category 3: Static site generators

| Alternative                   | Gap vs [[specwiki]]                                                            |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Docusaurus, MkDocs, VitePress | Require manual nav config; not discovery-aware of agent-spec directory layouts |
| GitHub Pages workflows        | Hosting-centric; setup friction for solo devs wanting a quick local view       |

**Differentiation:** Zero-config glob discovery with category-aware indexing from opinionated defaults (15+ patterns).

### Category 4: Agent-context authoring tools

| Alternative                                                                                                                                               | Gap vs [[specwiki]]                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| AGENTS.md convention ([Linux Foundation standard](https://dev.to/skojiocommunity/agentsmd-explained-one-file-for-claude-cursor-copilot-and-windsurf-7dl)) | Defines cross-tool project context; does not aggregate existing files into navigable wiki |
| Rule migration tools (rule-porter, etc.)                                                                                                                  | Convert between formats; do not synthesize browsable documentation                        |

### Category 5: Manual curation

- README indexes, Notion wikis, grep — high friction, stale within days.
- **[[specwiki]] wedge:** Regenerate after every rules change; deterministic output tree.

---

## Positioning statement

**For developers who use AI coding agents**, [[specwiki]] is a **CLI documentation synthesizer** that **discovers and unifies agent specs, rules, and skills into a browsable wiki**. Unlike SDD frameworks that create specs or IDEs that run agents, [[specwiki]] makes existing agent instructions human-navigable with one command.

### Core job-to-be-done

> One command → categorized wiki from scattered agent specs.

### Messaging guardrails

| Say                                      | Do not say                        |
| ---------------------------------------- | --------------------------------- |
| Discovers and synthesizes existing specs | Authors specs or runs agents      |
| Local CLI; markdown + HTML output        | Hosted docs platform              |
| Cross-framework zero-config discovery    | Replaces BMAD/OpenSpec/Cursor     |
| `list` → `generate` → `open` workflow    | "AI-powered documentation writer" |

### Differentiation pillars

1. **Cross-framework** — Cursor, AGENTS.md, OpenSpec, Kiro, BMAD output, Copilot, nested monorepo agents
2. **Zero-config** — opinionated default patterns; optional `specwiki.config.json` for overrides
3. **Dual output** — `wiki/*.md` for agents/git + `wiki/html/` for human browsing
4. **Local-first** — no account, no hosting, no network after `npx`

---

## Recommended launch channels

| Channel                                          | Audience fit                        | Rationale                                                                      | Priority                           |
| ------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| **Hacker News (Show HN)**                        | Persona A + C; technical evaluators | CLI tools with clear utility perform well; Show HN format signals "try it now" | **High**                           |
| **Reddit** r/cursor, r/LocalLLaMA, r/programming | Persona A                           | Pain point ("lost track of my rules") resonates; value-first posts required    | **High**                           |
| **X/Twitter**                                    | Indie dev / AI tooling followers    | Short hook + demo GIF potential; `#Cursor` `#AIcoding` `#CLI`                  | **Medium**                         |
| **LinkedIn**                                     | Persona B; professional narrative   | "Documentation debt from AI-assisted dev" story; less hype, more workflow      | **Medium**                         |
| **Dev.to**                                       | Tutorial-oriented developers        | Long-form "how I unified my agent specs" post; good for SEO                    | **Medium** (chosen as 5th channel) |
| Product Hunt                                     | Broader product audience            | Better after npm publish + landing page (E20); defer to post-launch            | Low (now)                          |

### Channel-specific notes

- **Reddit:** Lead with the problem and a `npx specwiki list` example output snippet. No link-dropping in post body on some subs — put repo link in comments when asked.
- **HN:** Title format: `Show HN: [[specwiki]] – CLI that turns scattered AI agent specs into a browsable wiki`. Be ready to answer "how is this different from OpenSpec/BMAD?"
- **LinkedIn:** Frame as workflow hygiene for AI-assisted solo devs, not "revolutionary AI."
- **X:** Thread-friendly: problem → 3 commands → screenshot of HTML wiki categories.
- **Dev.to:** Tutorial structure with real repo walkthrough; tag `ai`, `cli`, `documentation`, `cursor`.

---

## Launch timing considerations

- **npm publish (S13.1):** Launch copy should use `npx specwiki` only after package is live on registry. Pre-publish: "coming soon" or GitHub README install from source.
- **CI badge (S13.2):** Optional README trust signal once workflow is green on `main`.
- **Landing page (E20):** Out of scope; README + launch copy feed E20 later.

---

## Citations

1. Cursor Rules documentation — https://cursor.com/docs/rules
2. AGENTS.md ecosystem explainer (DEV Community, 2026) — https://dev.to/skojiocommunity/agentsmd-explained-one-file-for-claude-cursor-copilot-and-windsurf-7dl
3. AGENTS.md vs Cursor rules comparison — https://blog.buildbetter.ai/agents-md-vs-cursorrules-vs-claude-skills-2026-comparison/
4. Spec-Driven Development 2026 guide — https://thebcms.com/blog/spec-driven-development
5. OpenSpec vs BMAD vs Spec Kit (DEV Community) — https://dev.to/willtorber/spec-kit-vs-bmad-vs-openspec-choosing-an-sdd-framework-in-2026-d3j
6. SDD framework comparison (BMAD, SpecKit, OpenSpec) — https://daviddaniel.tech/research/papers/sdd-frameworks/frameworks-comparison
7. Internal: `_bmad-output/planning-artifacts/discovery/research/domain-research.md`
8. Internal: `_bmad-output/planning-artifacts/discovery/product-brief.md`
9. Internal: `docs/brand/BRAND.md`

---

## Research extensions (post-launch)

- Track npm download velocity and GitHub star correlation by channel.
- Survey early adopters: which discovery patterns mattered most?
- Revisit Product Hunt after E20 landing page ships.
