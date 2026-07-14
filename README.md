# specwiki

Transform AI specs in any project into structured, wiki-like documentation.

`specwiki` scans your codebase for agent instructions, spec-driven development files, and AI-generated specs — then builds a browsable wiki with an index, categorized pages, and optional HTML output.

## What it finds

Out of the box, specwiki discovers specs from:

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

```bash
npm install
npm run build
npm link   # optional: use `specwiki` globally
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
```

## Output

Running `specwiki generate` creates:

```
wiki/
├── index.md          # Landing page with categorized links
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

## Development

```bash
npm run dev list
npm run dev generate -- --verbose
npm run build
npm run typecheck
```

## License

MIT
