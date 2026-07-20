---
# Copy this file to site/blog/YYYY-MM-DD-your-slug.md — do not publish _-prefixed files.
title: "Human title"
date: "YYYY-MM-DD"
author: Lucas
lane: field-notes # field-notes | release-story | ecosystem
summary: "One sentence — OG description and index card."
audience: all # alex | jordan | sam | all
# optional hero (path under site/blog/media/; heroAlt required when hero is set):
# hero: media/YYYY-MM-DD-your-slug/hero.svg
# heroAlt: "Meaningful description of the hero image"
# related:
#   - CHANGELOG.md#anchor
#   - docs/adr/0001-example.md
---

Write the post body in Markdown below this frontmatter block.

Use **quoted** dates (`date: "2026-07-20"`) so the build keeps the literal YYYY-MM-DD string.

**Images**

- Store bytes under `site/blog/media/` (site-wide files or per-post folders like `media/YYYY-MM-DD-your-slug/`).
- Omit `hero` to use the default brand hero (`media/default-hero.svg`). When you set `hero`, also set non-empty `heroAlt`.
- Inline images use relative `media/...` paths only — no `http(s):` hotlinks, no `..`, no root-absolute paths:

```markdown
![Annotated wiki sidebar](media/YYYY-MM-DD-your-slug/example.png)
```

- Default hero is decorative on cards/posts (`alt=""`). Custom heroes need a real `heroAlt`. Body images need meaningful alt text in the markdown.

**Content lanes**

| Lane                | Reader job               | Example                             |
| ------------------- | ------------------------ | ----------------------------------- |
| **Field Notes**     | Should I try this today? | Workflow pain before product pitch  |
| **Release Stories** | What changed and why?    | Narrative wrapper around CHANGELOG  |
| **Ecosystem**       | Where does specwiki fit? | Where BMAD ends and specwiki begins |
