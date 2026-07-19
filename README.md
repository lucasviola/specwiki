<div align="center">

<img src="docs/brand/specwiki-wordmark-light.svg" alt="[[specwiki]]" width="220">

<br><br>

[![CI](https://github.com/lucasviola/specwiki/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasviola/specwiki/actions/workflows/ci.yml)
[![version](https://img.shields.io/badge/version-1.1.3-blue)](package.json)
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
npx @lucasviola/specwiki generate && npx @lucasviola/specwiki open

# Or install globally (then use the `specwiki` command)
npm install -g @lucasviola/specwiki
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

### For maintainers (npm publish prep)

**Full pre-publish security checklist:** [docs/RELEASING.md](docs/RELEASING.md) — numbered steps for 2FA, secret hygiene, tarball review, `verify-package`, `prepublishOnly`, audit, and `publish:package --dry-run` before `--confirm`.

Quick reference (see RELEASING.md for the complete checklist):

```bash
npm run verify-package   # pack tarball, clean-install, run specwiki --help
npm run prepublishOnly   # full quality gate + production dependency audit (also runs automatically on npm publish)
npm run audit            # production dependency audit only (high/critical CVEs fail)
npm run publish:package -- --dry-run   # preview registry upload
npm run publish:package -- --confirm   # publish after all checks pass
```

**Dependency audit policy:** `prepublishOnly` runs `npm audit --audit-level=high --omit=dev` after the test/lint/build gate. Only **production** dependencies block publish; high and critical CVEs fail the release. **DevDependencies** are audited separately during development (`npm audit` without `--omit=dev`) and are not part of the publish gate.

**Time-bounded audit exceptions:** If a false positive or accepted risk blocks publish, open a GitHub issue describing the advisory, why it is safe to ship, and an **expiry date** when the exception must be re-evaluated. Record the issue URL in the release notes or PR. Preferred unblock paths are upgrading or patching the dependency so `npm run audit` passes again. If maintainers approve shipping before a fix is available, the explicit escape hatch is `npm publish --ignore-scripts` (skips `prepublishOnly`, including the audit gate) — use only with team agreement and a tracked issue; do not bypass locally without maintainer consensus.

Publishing to the npm registry is an explicit maintainer action after the [RELEASING.md](docs/RELEASING.md) checklist passes. Requires **Node.js 20+** and npm maintainer access to the `@lucasviola/specwiki` package. This repository does not automate registry credentials or release versioning.

## Usage

Use `npx @lucasviola/specwiki …` without a global install, or `specwiki …` after `npm install -g @lucasviola/specwiki`.

```bash
# List spec files found in the current project
npx @lucasviola/specwiki list

# Generate wiki documentation
npx @lucasviola/specwiki generate

# Scan a different project
npx @lucasviola/specwiki generate --project /path/to/repo

# Custom output directory (must stay inside --project)
npx @lucasviola/specwiki generate --output .specwiki

# Verbose mode
npx @lucasviola/specwiki generate --verbose

# Machine-readable discovery results for scripts and AI agents
npx @lucasviola/specwiki list --json

# Machine-readable generation summary (stdout is one JSON document)
npx @lucasviola/specwiki generate --json

# Generate an llms.txt manifest grouped by wiki category
npx @lucasviola/specwiki generate --emit-llms-txt

# Verify committed wiki output is up to date (CI-friendly; no writes)
npx @lucasviola/specwiki generate --check

# Keep JSON stdout clean while sending verbose diagnostics to stderr
npx @lucasviola/specwiki list --json --verbose

# Open the HTML wiki in your default browser (run generate first)
npx @lucasviola/specwiki open

# Open a wiki written to a custom output directory
npx @lucasviola/specwiki open --output .specwiki

# Open a wiki in a different project
npx @lucasviola/specwiki open --project /path/to/repo
```

`specwiki open` resolves `{project}/{output}/html/index.html` (same `--project` and `--output` defaults as `generate`) and launches it with your OS default browser. Both commands require `--output` to stay within `--project` (symlinks that escape the project are rejected). If the wiki has not been generated yet, it exits with a message suggesting you run `specwiki generate` first.

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

### CI freshness check

Use `generate --check` in CI to fail when the committed wiki is out of date. The command
runs the same discovery and generation pipeline into a temporary directory, compares
markdown and HTML output (including bundled assets) against your resolved `--output`
directory, and performs **no writes** to the target path. Exit code **0** means fresh;
exit code **1** means stale, missing, or extra generated files. Respects `--no-search`
and `--emit-llms-txt` the same as a normal generate.

```yaml
- name: Verify wiki is up to date
  run: npx @lucasviola/specwiki generate --check
```

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

## Security

[[specwiki]] is a local CLI — it does not open network ports or run code on `npm install`. Treat these boundaries as part of the threat model:

### Trusted projects only

Run `specwiki` only on repositories you trust. The tool reads markdown from your project and writes a wiki under `--output` inside `--project`.

- **`specwiki.config.js` executes arbitrary Node.js** when present. A malicious config runs with your user privileges. Prefer `specwiki.config.json` when you do not need programmatic patterns.
- **Spec markdown is rendered as HTML** for the wiki skin. Raw HTML in `.md` / `.mdc` files is passed through to generated pages (trusted-local-content model). Opening `wiki/html/` in a browser can run scripts embedded in spec files.
- **`specwiki open` launches a local file** in your default browser via `open` / `xdg-open` / `cmd start` — no shell interpolation of paths.

### Path safety

- **`--output` must stay within `--project`** for both `generate` and `open`. Symlinked output directories that resolve outside the project are rejected.
- **Discovery patterns cannot target parent directories** (`..` and absolute paths are rejected).
- **Wiki file writes are confined** to the resolved output directory; slug-based path traversal is blocked.
- **Config files must live in the project root** and cannot escape via symlinks.

### npm package surface

- The published tarball includes only `dist/`, `README.md`, and `LICENSE` (verified by `npm run verify-package`).
- No `postinstall` or `prepare` scripts run on consumer installs.
- `prepublishOnly` runs the full test/lint/build quality gate and a production dependency audit before publish.

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities privately.

## Development

```bash
npm run dev list
npm run dev generate -- --verbose
npm run dev open -- --project tests/fixtures/sample-project --output wiki
npm run build
npm run typecheck
npm test
```

See [CHANGELOG.md](CHANGELOG.md) for release history. When shipping user-facing changes, add a bullet under `[Unreleased]` there.

## License

MIT
