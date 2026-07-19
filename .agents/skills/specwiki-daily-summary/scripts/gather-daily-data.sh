#!/usr/bin/env bash
# Gather raw data for specwiki daily summary. stdout is markdown sections.
set -euo pipefail

ROOT="${1:-.}"
DATE="${2:-$(date +%Y-%m-%d)}"
SINCE="${DATE} 00:00:00"
UNTIL="${DATE} 23:59:59"

cd "$ROOT"

echo "## Git — commits on ${DATE}"
COMMIT_COUNT=$(git log --since="$SINCE" --until="$UNTIL" --format="%h" 2>/dev/null | wc -l | tr -d ' ')
echo "count: ${COMMIT_COUNT}"
if [[ "$COMMIT_COUNT" -gt 0 ]]; then
  git log --since="$SINCE" --until="$UNTIL" --format="%h|%ad|%s" --date=format:"%H:%M" 2>/dev/null
fi

echo ""
echo "## Git — working tree"
git status --short 2>/dev/null || echo "(not a git repo)"

echo ""
echo "## Package version"
if [[ -f package.json ]]; then
  node -e "const p=require('./package.json'); console.log(p.version || 'unknown')" 2>/dev/null || echo "unknown"
else
  echo "no package.json"
fi

echo ""
echo "## Sprint status"
SPRINT="_bmad-output/implementation-artifacts/sprint-status.yaml"
if [[ -f "$SPRINT" ]]; then
  grep -E '^(last_updated|mvp_status|mvp_closed|generated):' "$SPRINT" 2>/dev/null || true
  echo "--- active epics ---"
  awk '
    /^  epic-[0-9]+: (in-progress|backlog)$/ { print }
  ' "$SPRINT" 2>/dev/null || true
  echo "--- stories not done (in-progress|review|ready-for-dev) ---"
  awk '
    /^  [0-9]+-[0-9]+-[^:]+: (in-progress|review|ready-for-dev)$/ { print }
  ' "$SPRINT" 2>/dev/null || true
  echo "--- epics completed (done) ---"
  awk '
    /^  epic-[0-9]+: done$/ { print }
  ' "$SPRINT" 2>/dev/null || true
else
  echo "no sprint-status.yaml"
fi

echo ""
echo "## Story files touched today"
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" -- "_bmad-output/implementation-artifacts/*.md" 2>/dev/null \
  | sort -u | grep -E '\.md$' || true
