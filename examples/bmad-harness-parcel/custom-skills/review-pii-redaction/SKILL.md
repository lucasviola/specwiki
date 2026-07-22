---
name: review-pii-redaction
description: >-
  Audit Parcel Path changes for PII leaks in logs and error messages. Use before
  opening a PR, after adding verbose logging, or when touching carrier responses.
---

# Review PII redaction

Parcel Path handles tracking ids, addresses, and recipient hints. Never ship logs or errors that expose them.

## What counts as PII here

| Data                         | OK in user output         | Must redact in logs/errors |
| ---------------------------- | ------------------------- | -------------------------- |
| Tracking id (short demo id)  | Yes (`DEMO-1001`)         | Redact full tokens in URLs |
| Full tracking URL with token | No                        | Always redact query params |
| Street address               | Truncated city/state only | Never log full address     |
| Recipient name               | No in verbose mode        | Never log                  |
| Phone / email                | Never                     | Never                      |

## Review steps

1. **Search the diff** for `console.`, `logger.`, `verbose`, and `throw new Error`.
2. **Run verbose locally** — `npm run dev -- track --id DEMO-1001 --verbose` and scan stdout/stderr.
3. **Check test output** — failing tests should not print fixture addresses; use matchers, not snapshot dumps of raw JSON.
4. **Error paths** — carrier failures should say _what_ failed, not paste the raw HTTP body.

## Redaction patterns

Prefer helpers over inline string surgery:

```typescript
// Good
redactTrackingUrl(url); // https://carrier/track/…?token=[REDACTED]
redactAddress(address); // Portland, OR (no street)

// Avoid
console.log("response", rawBody);
```

## PR checklist

- [ ] No new unredacted fields in verbose mode
- [ ] Error messages safe to paste in a public issue
- [ ] Tests mock network; no live responses logged on failure
