# Parcel Path — Product Brief (mock)

## One-liner

A local TypeScript CLI that answers: where is my package, and what should I do
next?

## Who it is for

Shoppers and developers who paste a carrier tracking id and want a plain-language
next action — not a raw status enum — without creating another SaaS account.

## Problem

Carrier tracking pages bury status behind opaque codes and marketing chrome.
People just need: timeline + one clear next step, preferably offline against a
known fixture while building.

## Success signal

A developer can run `parcel-path track --id DEMO-1001` with no network, see an
out-for-delivery style timeline, and get copy like “Wait for the courier today.”

## Non-goals (v0)

- Multi-package batch tracking
- Push notifications
- Carrier account login
- Label printing or full shipping ops

## Proposed first slice

Ship `track --id` with a small carrier-adapter registry, offline fixtures, and
table-driven status → next-action mapping.
