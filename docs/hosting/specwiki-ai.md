# specwiki.ai — Hosting and Release

Production landing page for **[[specwiki]]** at `https://specwiki.ai`.

| Item                 | Value                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| **Provider**         | [GitHub Pages](https://docs.github.com/en/pages) (GitHub Actions source)       |
| **Source**           | `site/` in this repository                                                     |
| **Build output**     | `dist/landing-site/` (gitignored; produced by CI and local builds)             |
| **Build command**    | `npm run build:site`                                                           |
| **Deploy workflow**  | [`.github/workflows/deploy-site.yml`](../../.github/workflows/deploy-site.yml) |
| **Default URL**      | `https://lucasviola.github.io/specwiki/` (until custom domain is configured)   |
| **Custom domain**    | `specwiki.ai` (opt-in via `--with-cname` after DNS is configured)              |
| **Secrets required** | None — workflow uses the built-in `GITHUB_TOKEN`                               |

## How deployment works

1. **Pull request** — `deploy-site.yml` runs landing-page tests, builds `dist/landing-site/` **without** `CNAME`, and publishes a **GitHub Pages preview** linked from the PR checks panel. Review the preview before merging.
2. **Merge to `main`** — the workflow deploys to **`https://lucasviola.github.io/specwiki/`** (no custom domain required).
3. **Manual deploy** — run **Actions → Deploy specwiki.ai → Run workflow** (`workflow_dispatch`).

The build script [`scripts/build-landing-site.mjs`](../../scripts/build-landing-site.mjs) copies `site/` into `dist/landing-site/` and adds `.nojekyll` so GitHub Pages serves static files as-is. **CNAME is omitted by default.** After you own `specwiki.ai` and configure DNS, change the workflow build step to `npm run build:site -- --with-cname` and add the custom domain in **Settings → Pages**.

## One-time setup (repository maintainer)

### 1. Enable GitHub Pages from Actions

1. Open **Settings → Pages** for `lucasviola/specwiki`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### 2. Configure the custom domain (after you own specwiki.ai)

Skip this section until you have purchased the domain.

1. Update `.github/workflows/deploy-site.yml` — change the build step to `npm run build:site -- --with-cname`.
2. In **Settings → Pages → Custom domain**, enter `specwiki.ai` and save.
3. Enable **Enforce HTTPS** once the certificate is issued (may take up to 24 hours after DNS propagates).

### 3. DNS records (at your domain registrar)

Point `specwiki.ai` at GitHub Pages. Use either apex **A** records or a registrar **ALIAS/ANAME** if supported.

**Apex domain (`specwiki.ai`) — A records:**

| Type | Name | Value             |
| ---- | ---- | ----------------- |
| A    | `@`  | `185.199.108.153` |
| A    | `@`  | `185.199.109.153` |
| A    | `@`  | `185.199.110.153` |
| A    | `@`  | `185.199.111.153` |

**Optional `www` subdomain:**

| Type  | Name  | Value                  |
| ----- | ----- | ---------------------- |
| CNAME | `www` | `lucasviola.github.io` |

GitHub documents current IPs in [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Re-check that page if GitHub updates their address list.

### Environment variables

None. The deploy workflow does not use repository secrets or environment variables.

## Local build and preview

```bash
npm run build:site
```

Output lands in `dist/landing-site/`. Preview locally:

```bash
open dist/landing-site/index.html
```

Or serve the folder with any static file server:

```bash
npx --yes serve dist/landing-site
```

## Rollback

Choose one:

1. **Revert the merge commit** on `main` and push — the deploy workflow republishes the previous landing page automatically.
2. **Re-run a prior successful workflow** — Actions → Deploy specwiki.ai → select a known-good run → Re-run all jobs.
3. **Hotfix forward** — restore `site/` from a known-good commit, open a PR, verify the preview URL, merge.

Always confirm production after rollback (see verification below).

## Production verification checklist

Run after the first deploy and after any rollback:

1. `curl -sI https://specwiki.ai` — expect `HTTP/2 200` (or `301` → `200`) and a valid TLS certificate for `specwiki.ai`.
2. Open `https://specwiki.ai` in a browser — hero reads **"Make AI knowledge useful to humans."**
3. Click **View source on GitHub** — lands on `https://github.com/lucasviola/specwiki`.
4. `npm test -- tests/site/landing.test.ts` — all landing guard tests pass on the `site/` source that was deployed.

Until DNS is live, verify at **`https://lucasviola.github.io/specwiki/`** or the GitHub Pages preview URL from the PR or workflow summary instead of step 1–3.

## Maintainer handoff

Another maintainer with **Admin** access to the repository and DNS can:

- Deploy: merge to `main` or run `workflow_dispatch`
- Preview: open any PR and use the Pages preview link
- Roll back: revert on `main` or re-run a prior workflow (see above)
- Change DNS: update A/CNAME records at the registrar; no workflow changes needed unless the domain changes

Do **not** commit API tokens, deploy keys, or registrar credentials to this repository.
