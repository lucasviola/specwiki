# Epic 21 — NPM Security Hardening & Publish Safety

## Goal

Harden **specwiki** for safe publication to npm so end users who `npm install -g specwiki` or `npx specwiki` are not exposed to path escape, unexpected code execution, or undocumented trust boundaries. This epic captures findings from the 2026-07-16 security analysis (pre-publish review) and the remaining maintainer actions required before the first public registry release.

**Audience:** npm consumers (Personas A–C), maintainers cutting releases, and contributors reviewing security-sensitive CLI paths.

**Dependency:** Complements **E13 — Distribution & Publish**. Complete **E21** (or explicitly accept residual risk) before **S13.4 — Version 1.0.0 release** and the first `npm publish`.

**Threat model summary:** specwiki is a local CLI with no network service and no install-time scripts. Residual risk is (1) malicious **project content** when users run the CLI on untrusted repos, (2) **dependency supply chain**, and (3) **maintainer publish hygiene**.

---

## Security analysis findings (source)

| ID    | Severity | Finding                                                                       | Epic story                                    |
| ----- | -------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| SEC-1 | Medium   | `generate --output` could escape `--project` (unlike `open`)                  | S21.1 ✅ done                                 |
| SEC-2 | Medium   | `specwiki.config.js` executes arbitrary Node.js on load                       | S21.4                                         |
| SEC-3 | Medium   | Raw HTML in markdown renders into generated wiki (XSS when opened in browser) | S21.2 ✅ documented; S21.7 optional hardening |
| SEC-4 | Low      | `--project` can point anywhere on disk (expected; must be documented)         | S21.2 ✅ done                                 |
| SEC-5 | Low      | Dependency supply-chain risk; audit on each release                           | S21.5                                         |
| SEC-6 | Info     | Strong tarball allowlist, no `postinstall`/`prepare`, `check-secrets` hook    | S21.6 (verify + document)                     |
| SEC-7 | Info     | `open` uses `execFile`; search UI uses safe DOM text APIs                     | Covered by existing tests; no new story       |
| SEC-8 | Info     | Search index JSON escapes `<` before inline embedding                         | Covered by existing tests; no new story       |

**npm publish recommendations from analysis:**

1. ~~Confine `generate --output` to project root~~ → S21.1 ✅
2. ~~README security section~~ → S21.2 ✅
3. Keep `npm run verify-package` on every release path → S21.6
4. Enable npm 2FA on maintainer account → S21.6 (ops)
5. Consider opt-in `--sanitize-html` for untrusted specs → S21.7 (post-MVP bet)

---

## Stories

| Story | Summary                                         | Status  |
| ----- | ----------------------------------------------- | ------- |
| S21.1 | Generate output confined to project root        | done    |
| S21.2 | README security section for npm users           | done    |
| S21.3 | SECURITY.md and vulnerability reporting policy  | backlog |
| S21.4 | Trust warning when loading `specwiki.config.js` | backlog |
| S21.5 | Release-time dependency audit gate              | backlog |
| S21.6 | Maintainer npm publish security checklist       | backlog |
| S21.7 | Opt-in HTML sanitization (`--sanitize-html`)    | backlog |

---

## Requirements & Constraints

- Follow HARNESS §0.9 on every code story: path validation, safe logging, HTML escaping at template boundaries.
- Do not add `postinstall`, `prepare`, or other consumer install hooks.
- Published tarball must remain limited to `dist/`, `README.md`, and `LICENSE` (`verify-package` contract).
- Security documentation must be accurate for the **trusted local project** model — do not over-promise sandboxing.
- `specwiki.config.js` dynamic import is a feature; mitigation is warning + docs, not removal, unless owner decides otherwise.
- HTML body sanitization (S21.7) is opt-in only; default remains trusted-local-content (AD-6).

---

## Technical decisions

- **S21.1:** Shared `src/core/paths.ts` with `resolveOutputWithinProject()`; used by `generate` and `open`; symlink checks via `realpath`.
- **S21.4:** Emit one stderr warning (structured `config.warn` or user-visible yellow line) when `.js` config is loaded; never log config contents.
- **S21.5:** Add `npm audit --audit-level=high` (or equivalent) to `prepublishOnly` or `release:check`; fail on high/critical; document exceptions.
- **S21.7:** If validated, use `rehype-sanitize` pipeline per POST-MVP-ROADMAP Bet 6; off by default.

---

## Cross-epic dependencies

- **E13 S13.1** — npm publish prep (`verify-package`, `prepublishOnly`) — in progress; S21.6 extends maintainer docs.
- **E13 S13.4** — first semver release — blocked until S21.3, S21.5, S21.6 are done or waived by owner.
- **E16 S16.3** — trusted-local HTML body model (AD-6) — S21.7 is the escape hatch for untrusted sources.
- **POST-MVP-ROADMAP Bet 6** — body HTML sanitization — maps to S21.7.

---

## Epic gate (ready for first npm publish)

- [x] S21.1 — `generate` and `open` both reject `--output` outside `--project` (including symlinks)
- [x] S21.2 — README documents trusted-project model, config.js RCE, markdown XSS, path safety, npm surface
- [ ] S21.3 — `SECURITY.md` at repo root with private reporting instructions
- [ ] S21.4 — Users see explicit warning when `specwiki.config.js` is executed
- [ ] S21.5 — Release gate fails on high/critical `npm audit` findings
- [ ] S21.6 — `docs/RELEASING.md` (or equivalent) lists 2FA, `verify-package`, `publish:package --dry-run`, and pre-publish checklist
- [ ] S21.7 — deferred unless untrusted-spec demand exists (optional for v1.0.0)
