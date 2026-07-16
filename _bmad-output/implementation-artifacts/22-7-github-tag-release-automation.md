---
baseline_commit: HEAD
---

# Story 22.7: GitHub tag-triggered npm publish (optional)

Status: backlog

## Story

As a maintainer,
I want npm publish to run automatically when I push a version tag,
so that releases are reproducible from CI without manual registry commands on my laptop.

**INVEST:** I✓ N✓ V✓ E✓ S✓ T✓

**Demo path:** Push tag `v1.0.1` → GitHub Actions runs `release:check` and publishes to npm with provenance; manual `npm publish` from laptop is no longer required.

**Binds:** E22 | **Depends:** S22.6 (first manual release proven)

## Acceptance Criteria

1. **`.github/workflows/release.yml`** triggered on `push.tags: ['v*']`.
2. **Steps:** checkout → Node 20 → `npm ci` → `npm run release:check` → `npm publish --provenance --access public`.
3. **Secrets:** Uses `NPM_TOKEN` repository secret; workflow never logs token; document secret setup in `docs/RELEASING.md`.
4. **Tag validation:** Workflow extracts version from tag (`v1.0.1` → `1.0.1`) and fails if it does not match `package.json`.
5. **Contract test:** Workflow file exists; does not run on ordinary push/PR (only tags); no credentials in workflow YAML.
6. **Documentation:** Update `docs/RELEASING.md` with automated vs manual publish paths; manual path remains documented as fallback.
7. **Scope boundary:** Do not implement until S22.6 manual release succeeds and owner approves CI publishing.
8. **Quality measures:** Dry-run validation via workflow_dispatch or test tag on a fork before production use.

## Tasks / Subtasks

- [ ] Owner approves CI publishing approach
- [ ] Add `NPM_TOKEN` to repository secrets (ops — not in repo)
- [ ] Implement `.github/workflows/release.yml`
- [ ] Extend `tests/package/ci-workflow.test.ts` for release workflow contract
- [ ] Update `docs/RELEASING.md`
- [ ] Prove with patch release tag on fork or staging

## Dev Notes

### Why deferred

Manual publish (`publish:package -- --confirm`) is safer for the first release while npm maintainer 2FA, provenance, and token hygiene are validated (E21 S21.6).

### Provenance

npm provenance requires GitHub Actions OIDC or compatible CI — document prerequisites in RELEASING.md when enabling.

## QA Manual Validation

1. Push tag `v1.0.1-test` on fork — workflow runs release:check only (dry-run mode) without publishing
2. Production tag push — npm shows new version with provenance badge
3. Mismatch tag `v9.9.9` when package.json is `1.0.1` — workflow fails before publish
