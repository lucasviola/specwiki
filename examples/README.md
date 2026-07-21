# Specwiki examples

Small mock projects you can point [[specwiki]] at to see **spec → wiki** in action.

**Catalog source of truth:** [`manifest.yaml`](./manifest.yaml) lists every mock project (`slug`, `title`, `tagline`, `framework`, generate/open commands). The hero example (`agent-harness-parcel`) is designated for the live specwiki.ai demo; landing §04 copy is documented on that entry until build-time injection ships (S27.4).

Each folder is a standalone `--project` root. Generate a wiki, then open it:

```bash
# From the specwiki repo root
npm run build

# 1) BMAD technical research
npx @lucasviola/specwiki generate --project examples/bmad-research-relay --output /tmp/specwiki-bmad
npx @lucasviola/specwiki open --project examples/bmad-research-relay --output /tmp/specwiki-bmad

# 2) Agent harness (README + AGENTS + CLAUDE)
npx @lucasviola/specwiki generate --project examples/agent-harness-parcel --output /tmp/specwiki-harness
npx @lucasviola/specwiki open --project examples/agent-harness-parcel --output /tmp/specwiki-harness

# 3) Article research notes
npx @lucasviola/specwiki generate --project examples/article-research-mycelium --output /tmp/specwiki-article
npx @lucasviola/specwiki open --project examples/article-research-mycelium --output /tmp/specwiki-article
```

| Example                                                      | What it demonstrates (see `manifest.yaml` for canonical copy)  |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| [`agent-harness-parcel/`](./agent-harness-parcel/) **hero**  | Root agent harness: `README.md`, `AGENTS.md`, `CLAUDE.md`      |
| [`bmad-research-relay/`](./bmad-research-relay/)             | BMAD-style `_bmad-output/**` technical research for a mock CLI |
| [`article-research-mycelium/`](./article-research-mycelium/) | Loose research markdowns for a long-form article               |

These folders are demos only — not part of the published npm package.
