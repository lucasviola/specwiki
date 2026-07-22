# Parcel Path — Technical Research

**Date:** 2026-07-22  
**Author:** Mock discovery (examples)  
**Status:** Complete  
**Scope:** Greenfield CLI; how v0 should resolve carrier tracking data

---

## Executive Summary

Parcel Path needs a **carrier lookup path** that stays agent-friendly and
testable. The research compares three approaches for v0:

1. **Offline fixtures only** — JSON under `tests/fixtures/`, mock adapters in unit tests
2. **Documented carrier APIs** — real HTTP with recorded fixtures for CI
3. **HTML scraping** — parse public tracking pages

**Recommendation for MVP:** Offline fixtures + mock `CarrierAdapter`s. Add real
API adapters only after the CLI shape and next-action copy stabilize.

---

## 1. Problem framing

### 1.1 Product constraints

| Constraint         | Implication                                     |
| ------------------ | ----------------------------------------------- |
| Offline unit tests | No network in `npm test`                        |
| Plain-language UX  | Status enums must map to next-action copy       |
| Tiny diffs         | Prefer adapter interface over a framework       |
| PII safety         | Never log full addresses or raw tracking tokens |

### 1.2 Non-goals (v0)

- Scraping carrier HTML
- Database-backed history
- Multi-carrier batch jobs

---

## 2. Option A — Offline fixtures only

**Layout sketch**

```text
tests/fixtures/DEMO-1001.json
src/carriers/types.ts
src/carriers/demo.ts      # loads fixture
src/format.ts             # status → next action
```

**Pros**

- Deterministic CI; no API keys
- Humans and agents can read fixtures as specs
- Fast iteration on next-action copy

**Cons**

- Not “real” tracking until a live adapter lands
- Fixture drift vs production carrier payloads

**Fit:** Best for vertical-slice demos and [[specwiki]] gallery examples.

---

## 3. Option B — Documented carrier APIs

**Pros**

- Closer to production value
- Can still record fixtures (VCR-style) for tests

**Cons**

- Keys, rate limits, and ToS per carrier
- Slower feedback loop while shaping the CLI

**Fit:** Post-MVP once `CarrierAdapter` and exit-code contracts are stable.

---

## 4. Option C — HTML scraping

**Pros**

- Works when no public API exists

**Cons**

- Brittle selectors; ToS risk; hard to keep offline tests honest

**Fit:** Explicit non-goal for v0.

---

## 5. Decision

| Criterion           | Weight | Winner                  |
| ------------------- | ------ | ----------------------- |
| Test reliability    | High   | Fixtures                |
| Agent readability   | High   | Fixtures                |
| Production fidelity | Medium | Live APIs (later)       |
| Legal / ToS risk    | High   | Fixtures (avoid scrape) |

**Decision:** Ship v0 on **fixture-backed mock adapters**. Keep a thin
`CarrierAdapter` interface so a real carrier can drop in without rewriting the
CLI.

---

## 6. Open questions

1. Should unknown ids always exit `1`, or offer a “try DEMO-1001” hint?
2. Do we need a `--json` machine mode in v0 or only human printing?
3. How many status → next-action rows belong in the first table?

---

## Sources (illustrative)

- Carrier adapter patterns in shipping CLIs
- Offline-first fixture strategies for agent-built tools
- PII redaction in CLI error paths
