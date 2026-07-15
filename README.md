<div align="center">

<img src="docs/brand/specwiki-wordmark-light.svg" alt="[[specwiki]]" width="220">

<br><br>

[![CI](https://img.shields.io/github/actions/workflow/status/lucas/specwiki/ci.yml?branch=main&label=CI&logo=githubactions&logoColor=white)](https://github.com/lucas/specwiki/actions/workflows/ci.yml)
[![version](https://img.shields.io/badge/version-0.1.0-blue)](package.json)
[![node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](package.json)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

Transform AI specs into structured wiki-like documentation.

**One command → categorized wiki from scattered agent specs.**

[[specwiki]] Your AI live documentation. A library that discovers AI agent instructions, spec-driven development artifacts, and general markdown files scattered across a repository and synthesizes them into a browsable wiki.

**Requires Node.js 20+.** MIT licensed.

## What it finds

Out of the box, [[specwiki]] discovers specs from:

| Source           | Patterns                                            |
| ---------------- | --------------------------------------------------- |
| Root agent files | `AGENTS.md`, `SPEC.md`, `CLAUDE.md`, `GEMINI.md`    |
| Cursor           | `.cursor/rules/**`, `.cursor/skills/**/SKILL.md`    |
| Spec frameworks  | `specs/**`, `openspec/**`, `.kiro/specs/**`         |
| Docs & plans     | `docs/specs/**`, `docs/plans/**`, `requirements/**` |
| GitHub Copilot   | `.github/copilot-instructions.md`                   |
| Monorepo agents  | `**/AGENTS.md` (nested packages)                    |
| BMAD output      | `_bmad-output/**/*.md`                              |
| Agent skills     | `.agents/skills/**/SKILL.md`                        |
| README files     | `**/README.md` (standalone wiki pages)              |
| All markdown     | `**/*.{md,mdc}` (any `.md` / `.mdc` in the project) |

Ignored directories: `node_modules`, `dist`, `wiki`, `.specwiki`, `.git`, `coverage`, `.venv`, `vendor`.

## Install

### For users

```bash
# Try without installing
npx specwiki generate && npx specwiki open

# Or install globally
npm install -g specwiki
```

#### Quick start

```bash
npm run build
npm link
specwiki init && specwiki generate && specwiki open
```

### For contributors

Clone this repo, then:

```bash
npm install
npm run build
npm run setup-hooks   # optional: install git hooks
npm link              # optional: use `specwiki` globally from source
```

## Usage

```bash
# List spec files found in the current project
npx specwiki list

# Generate wiki documentation
npx specwiki generate

# Scan a different project
npx specwiki generate --project /path/to/repo

# Custom output directory
npx specwiki generate --output .specwiki

# Verbose mode
npx specwiki generate --verbose

# Machine-readable discovery results for scripts and AI agents
npx specwiki list --json

# Machine-readable generation summary (stdout is one JSON document)
npx specwiki generate --json

# Generate an llms.txt manifest grouped by wiki category
npx specwiki generate --emit-llms-txt

# Keep JSON stdout clean while sending verbose diagnostics to stderr
npx specwiki list --json --verbose

# Open the HTML wiki in your default browser (run generate first)
npx specwiki open

# Open a wiki written to a custom output directory
npx specwiki open --output .specwiki

# Open a wiki in a different project
npx specwiki open --project /path/to/repo
```

`specwiki open` resolves `{project}/{output}/html/index.html` (same `--project` and `--output` defaults as `generate`) and launches it with your OS default browser. If the wiki has not been generated yet, it exits with a message suggesting you run `specwiki generate` first.

### JSON output

Use `--json` with `list` or `generate` when another program needs to consume the result.
`list --json` returns discovered files grouped by category; `generate --json` returns the
generated page count, resolved output directory, and page metadata. The JSON result is the
only CLI output on stdout. With `--verbose`, structured diagnostics including `output.json`
are written to stderr.

### llms.txt export

Use `generate --emit-llms-txt` to add `llms.txt` to the generated wiki root. The
opt-in manifest starts with a project summary, groups every generated page by category,
and links to its local Markdown wiki page with its description when available.

## Output

Running `specwiki generate` creates:

```
wiki/
├── index.md          # Landing page with categorized links
├── llms.txt          # Optional AI-oriented manifest (--emit-llms-txt)
├── agents.md         # One page per discovered spec
├── cursor-rules-*.md
└── html/
    ├── index.html    # Browsable HTML version
    └── *.html
```

Each wiki page includes:

- Title and source file path
- Auto-generated table of contents from headings
- Full spec content, preserved as markdown

## Tech stack

[[specwiki]] is a Node.js CLI written in **TypeScript**. It runs on **Node.js 20+** with no runtime beyond npm dependencies. It is supposed to be fast, deterministic and reliable.

| Layer     | Libraries                                                                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI       | [Commander](https://github.com/tj/commander.js), [chalk](https://github.com/chalk/chalk)                                                                                                                                                        |
| Discovery | [fast-glob](https://github.com/mrmlnc/fast-glob)                                                                                                                                                                                                |
| Parsing   | [gray-matter](https://github.com/jonschlinkert/gray-matter) (frontmatter), [marked](https://marked.js.org/) (GFM markdown)                                                                                                                      |
| HTML wiki | [Mustache](https://mustache.github.io/) templates, [highlight.js](https://highlightjs.org/) (code blocks), [lunr](https://lunrjs.com/) (client-side search), [Wikimedia UI Base](https://www.npmjs.com/package/wikimedia-ui-base) design tokens |

Generated HTML is **self-contained** — bundled CSS/JS, system fonts only, and `file://`-safe output so you can open `wiki/html/` locally without a server or CDN.

Contributor tooling: **Vitest** (tests + coverage), **ESLint**, **Prettier**, **tsx** (dev runner).

## Development

```bash
npm run dev list
npm run dev generate -- --verbose
npm run dev open -- --project tests/fixtures/sample-project --output /tmp/specwiki-qa
npm run build
npm run typecheck
npm test
```

## License

MIT
