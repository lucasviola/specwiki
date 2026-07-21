# Epic 27 — Live Hero Example (specwiki.ai/examples)

## Goal

**Conversion first:** replace the landing page's static fake wiki mock with **one live, browsable generated wiki** so visitors trust specwiki before installing — in under ten seconds, no clone, no iframe.

**Audience:** Prospective users on specwiki.ai evaluating whether to run `npx @lucasviola/specwiki` on their own repo.

**JTBD:** _“Show me the real output — then I'll try it on my project.”_

**Owner decision (2026-07-18):** **Conversion over breadth.** Ship one killer example above the fold; defer the five-demo gallery until live proof moves installs or engagement.

**Hero example:** `examples/agent-harness-parcel/` — already the landing-page story, minimal three-file harness, fastest path to “spec → wiki.”

**Dependency:** **E20** (specwiki.ai hosting) — complete.

**Party-mode synthesis (2026-07-18):** John’s thin-slice wins. Sally’s no-iframe rule stands. Paige’s manifest-as-source-of-truth applies to hero metadata only in v1. Amelia’s relative-path test and `npm run build` before generate remain mandatory.

---

## v1 scope (conversion)

| In v1                                              | Deferred                               |
| -------------------------------------------------- | -------------------------------------- |
| One live wiki at `/examples/agent-harness-parcel/` | Five-card gallery hub (S27.3)          |
| Landing §04 links to live wiki (primary CTA)       | Generate all five examples in CI       |
| Minimal manifest with hero entry                   | Cross-example switcher (S27.6)         |
| Build generates **hero only**                      | SEO hub pages for every framework      |
| GitHub link for other four examples                | Landing copy selling “five live demos” |

**Success signal (v1):** A visitor scrolls to §04 → clicks through to a real generated wiki → assets load under subpath → returns to landing and sees install CTA. Measure later via GitHub Pages referrers or manual spot-check until analytics lands.

---

## Architecture spine (Winston)

### Invariants

1. **Generated wikis are build artifacts, not source.** Hero output lands in `dist/landing-site/examples/agent-harness-parcel/` at deploy time; never commit generated HTML.
2. **Full-page wiki, not iframe.** Hero opens at `/examples/agent-harness-parcel/` with a shareable URL.
3. **Relative paths only.** CI asserts zero absolute-root `href="/` or `src="/` before shipping.
4. **Build order:** `npm run build` → generate hero example → `build:site` → GitHub Pages.

### URL scheme (v1)

| Surface        | URL                                                                 |
| -------------- | ------------------------------------------------------------------- |
| Hero live wiki | `https://specwiki.ai/examples/agent-harness-parcel/html/index.html` |
| Other examples | GitHub `examples/` folder (source only until S27.3+)                |

### Build flow (v1)

```text
examples/manifest.yaml          # hero entry + catalog for future gallery
examples/agent-harness-parcel/
        ↓
npm run build
npm run build:examples -- --hero-only   # v1: single slug
        ↓
dist/landing-site/examples/agent-harness-parcel/html/…
        ↓
npm run build:site -- --with-cname
        ↓
GitHub Pages → specwiki.ai
```

---

## Stories

| Story | Summary                                | v1?   | Depends      | Status  |
| ----- | -------------------------------------- | ----- | ------------ | ------- |
| S27.1 | Example metadata manifest (hero-first) | ✓     | —            | review  |
| S27.2 | Build-time hero wiki generation        | ✓     | S27.1        | review  |
| S27.4 | Landing page §04 → live hero wiki      | ✓     | S27.2        | backlog |
| S27.5 | Deploy verification and site tests     | ✓     | S27.2, S27.4 | backlog |
| S27.3 | Examples gallery hub (`/examples/`)    | defer | S27.1, S27.2 | backlog |
| S27.6 | Cross-example navigation chrome        | defer | S27.3        | backlog |

**Recommended first PR:** S27.1 + S27.2 + S27.4 — one live wiki linked from the landing page.

---

### S27.1 — Example metadata manifest (hero-first)

**As** a maintainer, **I want** a manifest with a designated hero example, **so that** build and landing copy stay in sync without hardcoding paths.

**Demo path:** Edit `examples/manifest.yaml` → `hero: agent-harness-parcel` → validation test passes.

**Functional:**

- [ ] Add `examples/manifest.yaml` with schema documented in header comment.
- [ ] Top-level `hero: agent-harness-parcel`.
- [ ] Catalog entries for all five mock projects (`slug`, `title`, `tagline`, `framework`) — used by README and future S27.3; only hero is built in v1.
- [ ] Hero entry includes `commands.generate` / `commands.open` for docs parity.

**Quality measures:**

- [ ] Unit test: manifest validates; hero slug matches an existing `examples/` folder.
- [ ] No duplicate hero copy in three places — landing §04 pulls title/tagline from manifest at build time **or** documents a single manual sync point (prefer build-time).

---

### S27.2 — Build-time hero wiki generation

**As** a deploy pipeline, **I want** to generate the hero example wiki on each site deploy, **so that** specwiki.ai serves output from the current CLI.

**Demo path:** `npm run build:examples -- --hero-only` → one tree under `dist/landing-site/examples/agent-harness-parcel/` with browsable `html/index.html`.

**Functional:**

- [ ] Add `scripts/build-examples.mjs` reading manifest; v1 default generates hero slug only; optional `--all` flag for future gallery work.
- [ ] Wire `npm run build:examples` in `package.json`; integrate into `build:site` or deploy workflow.
- [ ] `.github/workflows/deploy-site.yml`: add `npm run build` before site build; run hero generation.
- [ ] Do not commit generated wikis; remain under `dist/`.

**Quality measures:**

- [ ] Assert zero absolute-root `href="/` or `src="/` in hero generated HTML.
- [ ] Generation failure fails deploy with actionable stderr.

---

### S27.4 — Landing page §04 → live hero wiki

**As** a landing-page visitor, **I want** the example section to open a **real** generated wiki, **so that** I trust the product before installing.

**Demo path:** Scroll to §04 on specwiki.ai → click **Explore live wiki** → live hero wiki loads with CSS/search working → install CTA still visible on return.

**Functional:**

- [ ] Replace static wiki mock in `site/index.html` with prominent link to `/examples/agent-harness-parcel/html/index.html` (or equivalent entry URL).
- [ ] Primary CTA above the fold in §04: open live wiki (not iframe).
- [ ] Secondary link: GitHub source for `examples/agent-harness-parcel` and note that four more examples exist on GitHub (not live yet).
- [ ] Remove stale “two more demos” copy; do **not** claim five live wikis until S27.3 ships.
- [ ] Update `tests/site/landing.test.ts`.

**Quality measures:**

- [ ] No regression on S20.1 narrative / brand / accessibility.
- [ ] Core landing page usable without JavaScript.

---

### S27.5 — Deploy verification and site tests

**As** a maintainer, **I want** CI to verify the hero wiki and landing link on every deploy, **so that** broken subpath hosting never reaches production.

**Functional:**

- [ ] Extend `tests/site/deploy-workflow.test.ts`: `npm run build` + hero generation steps.
- [ ] Add relative-path safety test on hero output (or fixture tree).
- [ ] `tests/site/examples.test.ts`: landing §04 href targets hero example path.
- [ ] Update `docs/hosting/specwiki-ai.md` post-deploy checklist: curl hero wiki, verify assets.

**Quality measures:**

- [ ] `npm test -- tests/site/` passes.

---

### S27.3 — Examples gallery hub (`/examples/`) — **deferred**

**Trigger to pull forward:** Hero live + landing refresh shipped; owner sees install/referrer lift **or** repeated requests for framework-specific live demos.

**As** a visitor comparing stacks, **I want** a gallery of live wikis, **so that** I pick the demo closest to my workflow.

_(Full acceptance criteria unchanged from breadth draft — implement when conversion hypothesis is validated.)_

---

### S27.6 — Cross-example navigation chrome — **deferred**

**Trigger:** S27.3 ships with multiple live wikis.

---

## Epic gate (v1 — conversion)

- [ ] `https://specwiki.ai/examples/agent-harness-parcel/` (or documented entry URL) loads a real generated wiki with working assets.
- [ ] Landing §04 primary CTA opens the live hero wiki — no static fake mock.
- [ ] Copy honest: one live example; others on GitHub until gallery ships.
- [ ] Deploy workflow builds CLI, generates hero wiki, passes site tests.
- [ ] Relative asset paths verified for subpath hosting.

## Epic gate (v2 — breadth, optional)

- [ ] S27.3 gallery live with all five examples.
- [ ] S27.2 `--all` generates full catalog in CI (with cache if slow).

---

## Cross-epic notes

- **E20:** Extends public surface; no change to `src/output/` wiki contract.
- **E11 S11.2:** Local `serve` complementary; not required for static hero.
- **Analytics follow-up:** Track hero click-through when instrumentation is added (Mary).

---

## Decisions log

| Date       | Decision                                                            | By         |
| ---------- | ------------------------------------------------------------------- | ---------- |
| 2026-07-18 | Epic framed as live examples gallery (breadth)                      | Party mode |
| 2026-07-18 | **Conversion over breadth** — hero only in v1; S27.3/S27.6 deferred | Lucas      |
