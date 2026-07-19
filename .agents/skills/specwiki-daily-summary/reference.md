# Daily summary — reference examples

## Example output (typical dev day)

```markdown
## Daily summary — Sunday, July 19, 2026

**12 commits** from 18:50 to 21:33. Repo at **v1.1.3**. Working tree: clean.

---

### Epic 16 completed — HTML wiki output

S16.5 (inter-page link resolution) shipped, closing Epic 16.

- New wiki-link-resolver maps markdown links to slug URLs in HTML output
- Renderer, parser, and wiki pipeline updated; broad test coverage added
- Released as **v1.1.2**

### Epic 21 — Security hardening

| Story | Deliverable                                       |
| ----- | ------------------------------------------------- |
| S21.3 | SECURITY.md vulnerability reporting policy        |
| S21.4 | Warning when specwiki.config.js runs project code |
| S21.5 | npm publish blocked on high/critical CVEs         |
| S21.6 | Maintainer checklist in docs/RELEASING.md         |

Version bumped to **v1.1.3** after security work.

### Tooling & planning

- Added specwiki-roadmap-canvas skill
- Sprint maintenance: synced artifacts for epics 13, 21, 22, 25

---

### Sprint snapshot

- **Epic 16:** done
- **Epic 21:** in progress (6/7 stories done; S21.3 in review)
- **Package:** v1.1.3
```

## Commit → story mapping hints

| Pattern in commit or path         | Maps to                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `21-3-security-md-*.md`           | Story S21.3                                              |
| `(S21.6)` or `S21.6` in subject   | Story S21.6                                              |
| `epic-16` / `S16.5`               | Epic 16 / Story S16.5                                    |
| `chore(release): bump version`    | Release line — read package.json for result              |
| `chore(docs): Sprint maintenance` | Metadata sync — list touched epic IDs only if meaningful |

## When to expand a commit with `git show --stat`

- Subject starts with `feat(` or `fix(`
- Subject mentions a story ID (S21.x, 16-5, etc.)
- Version bump commits (to capture what preceded the bump)

Skip `--stat` for:

- `chore(nofeature): Adds story for …` (planning only)
- Single-line sprint-status.yaml status flips with no src/ changes
