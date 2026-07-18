# ADR-0009: Runtime dependency budget policy

## Status

accepted

## Date

2026-07-18

## Context

The MVP spine (AD-11) froze runtime dependencies at five packages: commander, fast-glob, gray-matter, marked, chalk. Post-MVP work added HTML rendering (Mustache, Wikimedia tokens, highlight.js), client search (lunr), and retained strict ESM on Node ≥ 20.

AD-11 no longer describes the shipped product. Unchecked dependency growth increases supply-chain risk, install size, and ESM/CJS friction. We need an explicit **budget policy** rather than a stale freeze list.

## Decision

1. **Supersedes spine AD-11** — the five-package freeze is retired. ADR-0002 (S25.3) documents the HTML/search stack additions in detail.
2. **Current runtime budget** (nine packages, `@lucasviola/specwiki` v1.1.1):

   | Package             | Role                       |
   | ------------------- | -------------------------- |
   | `chalk`             | Terminal styling           |
   | `commander`         | CLI parsing                |
   | `fast-glob`         | Spec discovery             |
   | `gray-matter`       | Frontmatter parse          |
   | `highlight.js`      | Code blocks in HTML wiki   |
   | `lunr`              | Client-side search index   |
   | `marked`            | Markdown parse             |
   | `mustache`          | HTML templates             |
   | `wikimedia-ui-base` | Wikipedia-style CSS tokens |

3. **Adding a new runtime dependency requires:**
   - A written ADR (new file or amendment) stating purpose, alternatives rejected, and security/maintenance impact
   - Owner approval in review before merge
   - Update to this ADR's inventory table (or successor ADR if policy itself changes)
4. **Removing a dependency** — update inventory; note in CHANGELOG; no ADR required unless removal implies architectural change.
5. **DevDependencies** (TypeScript, Vitest, ESLint, etc.) are not subject to this runtime budget but follow normal semver maintenance.
6. **Platform:** Node ≥ 20, ESM (`"type": "module"`), `.js` extensions on relative imports — unchanged from AD-11 intent.

## Consequences

### Positive

- Honest record of shipped deps vs MVP spine
- New deps cannot land silently — ADR gate forces explicit tradeoff
- Maintainers can audit supply chain against a single inventory

### Negative

- More process than the old informal freeze
- Nine packages exceed original MVP NFR-014 target — accepted cost for E16/E23 features

### Neutral

- `prepublishOnly` script runs quality gate; no automated dep-count CI yet
- Landing site build (`site/`) may use separate tooling — not published in npm `files`

## References

- [Source: package.json — `dependencies`]
- [Source: ARCHITECTURE-SPINE.md — AD-11 (superseded by this ADR; spine sync in S25.4)]
- Related: ADR-0002 (S25.3 — HTML stack rationale for mustache, wikimedia-ui-base, highlight.js, lunr)
- [Source: IMPLEMENTATION.md — build log / release rows]
