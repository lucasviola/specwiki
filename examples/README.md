# Specwiki examples

Small mock projects you can point [[specwiki]] at to see **spec → wiki** in action.

**Catalog source of truth:** [`manifest.yaml`](./manifest.yaml) lists every **published** mock project (`slug`, `title`, `tagline`, `framework`, generate/open commands). The hero example (`agent-harness-parcel`) is designated for the live specwiki.ai demo; `build:site` injects landing §04 title and intro prose from the hero entry's `landing` fields. Folders listed under `unpublished` stay in this directory for local demos but are not built into the live gallery.

Each folder is a standalone `--project` root. Generate a wiki, then open it:

```bash
# From the specwiki repo root
npm run build

# 1) Agent harness (hero)
npx @lucasviola/specwiki generate --project examples/agent-harness-parcel --output /tmp/specwiki-harness
npx @lucasviola/specwiki open --project examples/agent-harness-parcel --output /tmp/specwiki-harness

# 2) Spec Kit
npx @lucasviola/specwiki generate --project examples/speckit-harness-parcel --output /tmp/specwiki-speckit
npx @lucasviola/specwiki open --project examples/speckit-harness-parcel --output /tmp/specwiki-speckit

# 3) OpenSpec
npx @lucasviola/specwiki generate --project examples/openspec-harness-parcel --output /tmp/specwiki-openspec
npx @lucasviola/specwiki open --project examples/openspec-harness-parcel --output /tmp/specwiki-openspec

# 4) Kiro
npx @lucasviola/specwiki generate --project examples/kiro-harness-parcel --output /tmp/specwiki-kiro
npx @lucasviola/specwiki open --project examples/kiro-harness-parcel --output /tmp/specwiki-kiro

# 5) BMAD
npx @lucasviola/specwiki generate --project examples/bmad-harness-parcel --output /tmp/specwiki-bmad
npx @lucasviola/specwiki open --project examples/bmad-harness-parcel --output /tmp/specwiki-bmad

# 6) tlc-spec-driven
npx @lucasviola/specwiki generate --project examples/tlc-harness-parcel --output /tmp/specwiki-tlc
npx @lucasviola/specwiki open --project examples/tlc-harness-parcel --output /tmp/specwiki-tlc

# 7) Article research notes (local-only — not on the live gallery)
npx @lucasviola/specwiki generate --project examples/article-research-mycelium --output /tmp/specwiki-article
npx @lucasviola/specwiki open --project examples/article-research-mycelium --output /tmp/specwiki-article
```

| Example                                                      | What it demonstrates (see `manifest.yaml` for canonical copy) |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| [`agent-harness-parcel/`](./agent-harness-parcel/) **hero**  | Root agent harness: `README.md`, `AGENTS.md`, `CLAUDE.md`     |
| [`speckit-harness-parcel/`](./speckit-harness-parcel/)       | Spec Kit: constitution + feature `spec` / `plan` / `tasks`    |
| [`openspec-harness-parcel/`](./openspec-harness-parcel/)     | OpenSpec: living specs + delta change for `track`             |
| [`kiro-harness-parcel/`](./kiro-harness-parcel/)             | Kiro: steering + `requirements` / `design` / `tasks`          |
| [`bmad-harness-parcel/`](./bmad-harness-parcel/)             | BMAD: `_bmad-output/**` product brief, research, track story  |
| [`tlc-harness-parcel/`](./tlc-harness-parcel/)               | tlc-spec-driven: `.specs/` STATE + feature track-command      |
| [`article-research-mycelium/`](./article-research-mycelium/) | Loose research markdowns (unpublished / local-only)           |

These folders are demos only — not part of the published npm package.
