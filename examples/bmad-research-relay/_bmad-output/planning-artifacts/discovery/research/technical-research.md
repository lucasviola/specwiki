# Relay Desk — Technical Research

**Date:** 2026-07-16  
**Author:** Mock discovery (examples)  
**Status:** Complete  
**Scope:** Greenfield CLI; storage and sync options for a local-first status board

---

## Executive Summary

Relay Desk needs a **single-user local store** that can later sync to a shared folder or git remote. The research compares three stacks for v0.1:

1. **SQLite + better-sqlite3** — durable, queryable, easy backups
2. **JSON file tree** — zero native deps, trivial diffs in git
3. **SQLite in WASM (sql.js)** — portable binaries, slower writes

**Recommendation for MVP:** JSON file tree under `.relay/`, with a clear path to SQLite if filtering and history grow past a few hundred notes.

---

## 1. Problem framing

### 1.1 Product constraints

| Constraint       | Implication                                    |
| ---------------- | ---------------------------------------------- |
| Offline-first    | No required network at write time              |
| Agent-friendly   | Specs and notes stay plain text where possible |
| Single binary UX | Prefer few native addons                       |
| Future sync      | Storage should be copyable as a folder         |

### 1.2 Non-goals (v0.1)

- Multi-tenant hosted SaaS
- Real-time CRDT collaboration
- Mobile apps

---

## 2. Option A — SQLite (`better-sqlite3`)

**Pros**

- Transactions and indexes for “notes since Monday” queries
- Mature Node bindings; familiar ops story (one file backup)

**Cons**

- Native compile step complicates `npx` install
- Binary diffs are opaque in git

**Fit:** Strong if Relay Desk becomes a query tool. Weak if the selling point is “everything is markdown in git.”

---

## 3. Option B — JSON / Markdown file tree

**Layout sketch**

```text
.relay/
  board.json          # columns + order
  notes/
    2026-07-16-standup.md
    2026-07-15-blocker.md
```

**Pros**

- No native deps; works everywhere Node runs
- Humans and agents can read notes without the CLI
- Git-friendly review of status changes

**Cons**

- Ad-hoc querying (grep / custom index)
- Concurrent writers need simple locking or “last write wins”

**Fit:** Best match for an agent-heavy workflow and for [[specwiki]]-style discovery later (notes as specs).

---

## 4. Option C — sql.js (SQLite WASM)

**Pros**

- SQLite semantics without native toolchain
- Single-file DB still possible

**Cons**

- Write performance and memory use worse than native
- Still a binary blob in the project unless exported

**Fit:** Useful bridge if SQL is required but native modules are banned. Not needed for MVP.

---

## 5. Decision

| Criterion           | Weight | Winner    |
| ------------------- | ------ | --------- |
| Install friction    | High   | JSON tree |
| Agent readability   | High   | JSON tree |
| Query power         | Medium | SQLite    |
| Sync via folder/git | High   | JSON tree |

**Decision:** Ship v0.1 on a **markdown + JSON tree**. Revisit SQLite when note count or search latency becomes a measured pain.

---

## 6. Open questions

1. Should `board.json` be the only machine file, with notes always `.md`?
2. Do we need an append-only `events.jsonl` for audit before sync?
3. How should conflict markers look if two agents edit the same note?

---

## Sources (illustrative)

- Node.js sqlite binding tradeoffs (native vs WASM)
- Local-first app patterns: folder as database
- AGENTS.md / plain-text agent artifact conventions
