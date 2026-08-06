#!/usr/bin/env bash
# Republish this repo's PUBLIC reader site to here.now.
# Reader-only: gallery.html, footnotes.html, docs and scratch files never ship.
#
# Gated: git's pre-push hook fires BEFORE the remote accepts refs, so we wait
# (up to 60s) for the remote to advertise the pushed HEAD. If the push was
# rejected or aborted, we do not publish — the live site can never lead the
# remote. The hook's own always-on log lives in $HOME/.herenow-sync.log; this
# script uses its own $HOME/.herenow-publish.log, and greps the captured output
# rather than a file another process is writing to.
set -euo pipefail
cd "$(dirname "$0")/.."

PUB="$HOME/.claude/skills/here-now/scripts/publish.sh"
LOG="$HOME/.herenow-publish.log"
REMOTE="${AOY_REMOTE:-origin}"
BRANCH="${AOY_BRANCH:-main}"
SLUG="russet-bamboo-b5sa"
TITLE='Autobiography of a Yogi - Annotated Edition'

# ---- gate: wait for the remote to reflect HEAD ----------------------------
head_sha="$(git rev-parse HEAD)"
remote_sha=""
for _ in $(seq 1 30); do
  remote_sha="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" 2>/dev/null | cut -f1 | head -1 || true)"
  if [ -n "$remote_sha" ] && [ "$remote_sha" = "$head_sha" ]; then break; fi
  sleep 2
done
if [ "$remote_sha" != "$head_sha" ]; then
  echo "[sync] $REMOTE/$BRANCH does not advertise $head_sha after 60s; publish skipped (push likely rejected/aborted)" >&2
  exit 1
fi

# ---- stage the deploy set --------------------------------------------------
SITE=$(mktemp -d)
trap 'rm -rf "$SITE"' EXIT
cp index.html styles.css app.js data.js annotations.js footnote_overrides.js shared.js "$SITE"/

# Content-hash cache busters: rewrite ?v= for every asset so a changed file is
# never served stale and returning readers always get the new build.
for f in shared.js annotations.js footnote_overrides.js data.js app.js styles.css; do
  h="$(shasum -a 256 "$SITE/$f" | cut -c1-10)"
  sed -i '' -E "s|($f)\?v=[0-9a-zA-Z]+|\1?v=$h|g" "$SITE/index.html"
done

# Mark the public copy: hide the gallery/footnotes buttons without 404 probes.
sed -i '' 's|<body data-local-tools="true">|<body data-local-tools="false">|' "$SITE/index.html"

# ---- publish --------------------------------------------------------------
OUT="$("$PUB" "$SITE" --slug "$SLUG" --title "$TITLE" 2>&1)"
printf '%s\n' "$OUT" >>"$LOG"
URL="$(printf '%s' "$OUT" | grep -oE 'https://[A-Za-z0-9-]+\.here\.now' | head -1 || true)"
if [ -n "$URL" ]; then
  echo "here.now synced: $URL"
else
  echo "publish completed but no URL captured (see $LOG)"
fi
