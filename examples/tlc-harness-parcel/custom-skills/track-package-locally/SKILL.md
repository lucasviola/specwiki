---
name: track-package-locally
description: >-
  Run and debug the Parcel Path track command locally. Use when reproducing a
  tracking bug, validating CLI output, or testing a carrier adapter by hand.
---

# Track package locally

Reproduce tracking behaviour on your machine without touching production credentials.

## Quick commands

```bash
npm install
npm test                    # baseline
npm run dev -- track --id DEMO-1001
npm run dev -- track --id DEMO-1001 --verbose
npm run typecheck
```

## Debugging workflow

1. **Pick a fixture id** — start with `DEMO-1001` (offline fixture in `tests/fixtures/`).
2. **Run with `--verbose`** — confirm timeline order and next-action copy; watch for raw status codes leaking to stdout.
3. **Isolate the layer**:
   - CLI parse error → fix argument parsing first (`exit 1`).
   - Adapter throws → check fixture path and carrier mapping (`exit 2`).
   - Formatting wrong → fix `formatTimeline()` / next-action mapping only.
4. **Add a failing test** — capture the bug as a table-driven case before fixing.

## Checklist before you finish

- [ ] Output is plain language (“Out for delivery today” not `OFD`)
- [ ] Verbose mode redacts tokens and full addresses
- [ ] `npm test` passes for the carrier you touched

## Common mistakes

- Calling live carrier APIs during local dev — use fixtures unless explicitly testing integration.
- Logging full tracking URLs — strip query tokens in verbose output.
