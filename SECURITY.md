# Security Policy

## Supported Versions

We release security fixes for the latest published `@lucasviola/specwiki` on npm and for unreleased fixes on the `main` branch. Older major versions are not supported unless listed below.

| Version              | Supported |
| -------------------- | --------- |
| Latest npm release   | Yes       |
| `main` (unreleased)  | Yes       |
| Older major versions | No        |

Install the latest release with `npm install -g @lucasviola/specwiki` or run via `npx @lucasviola/specwiki`.

## Reporting a Vulnerability

**Do not open a public GitHub issue** for exploitable vulnerabilities in the specwiki CLI, npm package, or this repository's release pipeline.

Report privately using a **GitHub Private Security Advisory**:

[https://github.com/lucasviola/specwiki/security/advisories/new](https://github.com/lucasviola/specwiki/security/advisories/new)

Include as much detail as you can safely share: specwiki version (`specwiki --version`), Node.js version, operating system, reproduction steps, and impact assessment.

## Scope

### In scope

Vulnerabilities in specwiki itself, including:

- **Path handling** — `--project`, `--output`, discovery patterns, config file location, and wiki write confinement (see [ADR-0001](docs/adr/0001-path-confinement-trust-boundary.md))
- **Config execution** — `specwiki.config.js` dynamic import runs arbitrary Node.js with your user privileges (see [ADR-0003](docs/adr/0003-config-loader-execution-model.md))
- **Generated HTML** — how specwiki renders markdown into wiki pages (trusted-local-content model; raw HTML in specs is passed through by default)
- **npm package surface** — published tarball contents, install-time scripts, and maintainer publish hygiene
- **Dependency supply chain** — vulnerabilities in specwiki's direct or transitive dependencies as shipped in the npm package

### Out of scope

- **User-authored content** in projects you choose to scan — malicious or untrusted markdown, HTML, or config in a repository you run specwiki against is expected under the [trusted-local project model](README.md#security). Run specwiki only on repositories you trust.
- **Third-party spec formats or tooling** outside this repository unless specwiki's integration introduces a distinct vulnerability.

For end-user security guidance (config.js, XSS in generated wikis, path safety), see the [README Security section](README.md#security).

## Response Timeline

- We aim to **acknowledge** new reports within **7 business days**.
- We will work with you on **coordinated disclosure** when appropriate.
- Timelines for fixes depend on severity and complexity; we will keep you updated.

Thank you for helping keep specwiki and its users safe.
