# Specwiki examples

Small mock projects you can point [[specwiki]] at to see **spec → wiki** in action.

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

| Example                                                      | What it demonstrates                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| [`bmad-research-relay/`](./bmad-research-relay/)             | BMAD-style `_bmad-output/**` technical research for a mock CLI |
| [`agent-harness-parcel/`](./agent-harness-parcel/)           | Root agent harness: `README.md`, `AGENTS.md`, `CLAUDE.md`      |
| [`article-research-mycelium/`](./article-research-mycelium/) | Loose research markdowns for a long-form article               |

These folders are demos only — not part of the published npm package.
