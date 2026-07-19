---
baseline_commit: HEAD
---

# Story 22.5: Maintainer and contributor documentation

Status: done

## Story

As a contributor or maintainer,
I want clear documentation for setup, PR norms, and the release workflow,
so that I know what I can do and where to find publish steps without npm credentials in contributor docs.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** A new contributor reads `docs/CONTRIBUTING.md` and knows how to run the quality gate; a maintainer reads `docs/RELEASING.md` and can execute bump → check → tag → publish end-to-end.

**Binds:** E22 | **Depends:** S22.3, S22.4; coordinates with E21 S21.6

## Acceptance Criteria

1. **`docs/CONTRIBUTING.md`** covering:
   - Clone, `npm ci`, `npm run build`
   - Six-command HARNESS quality gate
   - `npm run setup-hooks`, `npm run dev`, targeted vitest
   - PR checklist: CI green, no drive-by version bumps, add CHANGELOG under `[Unreleased]` for user-facing changes
   - Explicit boundary: contributors cannot publish; pointer to `docs/RELEASING.md` for maintainers
   - No npm credentials, tokens, or `.npmrc` documentation
2. **`docs/RELEASING.md`** covering:
   - Prerequisites: npm maintainer access, Node ≥20, green CI on `main`
   - Pre-release checklist (CHANGELOG, `release:check`, optional audit)
   - Step-by-step: `release:version` → commit → `release:check` → `git tag vX.Y.Z` → `publish:package --dry-run` → `publish:package --confirm`
   - Post-publish: `npm view @lucasviola/specwiki version`, `npx @lucasviola/specwiki@latest --version`
   - README badge swap to npm shields.io URL after first publish
   - GitHub Release (paste CHANGELOG section); reference `docs/marketing/launch-copy.md`
   - Rollback policy: prefer `npm deprecate`; unpublish only within npm 72h window
   - Integrate E21 S21.6 publish security checklist (2FA, verify-package, dry-run) when available
3. **README updates:**
   - Links to CONTRIBUTING, RELEASING (maintainer note), CHANGELOG, SEMVER
   - Maintainer section references `docs/RELEASING.md` instead of inline tribal steps
4. **Contract test:** Both doc files exist; README contains links to CONTRIBUTING and CHANGELOG.
5. **Scope boundary:** Does not run `npm publish` or create GitHub Releases during implementation.
6. **Quality measures:** All documented commands are copy-pasteable and match current scripts.

## Tasks / Subtasks

- [ ] Create `docs/CONTRIBUTING.md`
- [ ] Create `docs/RELEASING.md` (coordinate with S21.6 checklist)
- [ ] Update README links and maintainer section
- [ ] Add doc existence contract tests
- [ ] Owner review for accuracy

## Dev Notes

### Documentation structure

```text
docs/
├── CONTRIBUTING.md    # all contributors
├── RELEASING.md       # maintainers only
├── SEMVER.md          # from S22.4
└── marketing/         # existing S13.3 artifacts — reference, don't duplicate
CHANGELOG.md           # repo root — from S22.4
```

### npm badge swap (document, implement in S22.6)

Pre-publish:

```markdown
[![version](https://img.shields.io/badge/version-1.0.0-blue)](package.json)
```

Post-publish:

```markdown
[![npm version](https://img.shields.io/npm/v/@lucasviola/specwiki)](https://www.npmjs.com/package/@lucasviola/specwiki)
```

## QA Manual Validation

1. Open `docs/CONTRIBUTING.md` — quality gate commands match `package.json` scripts
2. Open `docs/RELEASING.md` — full release path documented with `release:version`, `release:check`, `publish:package`
3. README links resolve to CONTRIBUTING, CHANGELOG, RELEASING
