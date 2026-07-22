# Custom skills — Parcel Path

Example [Cursor Agent Skills](https://cursor.com/docs/agent/skills) for day-to-day work on this CLI.

Each subfolder contains a `SKILL.md` the agent loads when you invoke the skill by name (for example `/add-carrier-adapter`).

| Skill                                                  | Use when                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| [`add-carrier-adapter/`](./add-carrier-adapter/)       | Adding or extending a shipping carrier integration                 |
| [`track-package-locally/`](./track-package-locally/)   | Running or debugging the `track` command on your machine           |
| [`write-tracking-fixture/`](./write-tracking-fixture/) | Creating offline tracking data for tests                           |
| [`review-pii-redaction/`](./review-pii-redaction/)     | Checking logs and errors before a PR for leaked PII                |
| [`ship-vertical-slice/`](./ship-vertical-slice/)       | Delivering one end-to-end feature slice (parse → adapter → output) |

## Using in Cursor

Copy or symlink this folder into `.cursor/skills/`:

```bash
mkdir -p .cursor/skills
cp -R custom-skills/* .cursor/skills/
```

Or keep skills here and add a project rule that points agents at `custom-skills/**/SKILL.md`.

## Using in specwiki

Generate a wiki from the project root to browse these skills alongside the BMAD
planning and implementation artifacts:

```bash
npx @lucasviola/specwiki generate --project examples/bmad-harness-parcel
npx @lucasviola/specwiki open --project examples/bmad-harness-parcel
```
