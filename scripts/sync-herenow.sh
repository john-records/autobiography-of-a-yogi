#!/usr/bin/env bash
# Republish this repo's site to here.now after a GitHub push (called by git hook).
# Uses the installed here-now skill: ~/.claude/skills/here-now/scripts/publish.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PUB="$HOME/.claude/skills/here-now/scripts/publish.sh"
SITE=$(mktemp -d)
trap 'rm -rf "$SITE"' EXIT
cp index.html gallery.html footnotes.html styles.css app.js data.js annotations.js "$SITE"/
"$PUB" "$SITE" 2>&1 | tee "$HOME/.herenow-sync.log"
URL=$(grep -oE 'https://[A-Za-z0-9-]+.here.now' "$HOME/.herenow-sync.log" | head -1)
if [ -n "$URL" ]; then echo "here.now synced: $URL"; else echo "here.now synced: no URL captured - see $HOME/.herenow-sync.log"; fi
