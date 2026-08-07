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
TITLE='Autobiography of a Yogi - Annotated Edition with Audio'

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
cp index.html styles.css app.js audio.js data.js annotations.js footnote_overrides.js shared.js "$SITE"/
# LICENSE ships too, so the CC0 dedication the cover points at has a real
# address on the live site and not only in the repo.
cp LICENSE "$SITE"/

# The home-screen identity. Without these a site saved to a phone gets a
# screenshot of the page as its tile and the URL as its name.
cp manifest.webmanifest "$SITE"/
mkdir -p "$SITE/icons" && cp icons/*.png "$SITE/icons"/

# The narration: one mp3 and one timings JSON per chapter. Chapters not yet
# rendered are simply absent, and the player hides itself for those. The
# review-page scratch renders (smooth_*.mp3, *_options.mp3) are never copied.
mkdir -p "$SITE/audio"
while read -r id; do
  [ -f "audio/$id.mp3" ] && cp "audio/$id.mp3" "audio/$id.json" "$SITE/audio/"
done < <(./.venv-audio/bin/python -c "
import json
for c in json.load(open('chapters.json')): print(c['id'])
")
echo "[sync] narration: $(ls "$SITE/audio"/*.mp3 2>/dev/null | wc -l | tr -d ' ') chapters, $(du -sh "$SITE/audio" 2>/dev/null | cut -f1)"

# Content-hash cache busters: rewrite ?v= for every asset so a changed file is
# never served stale and returning readers always get the new build.
for f in shared.js annotations.js footnote_overrides.js data.js app.js audio.js styles.css; do
  h="$(shasum -a 256 "$SITE/$f" | cut -c1-10)"
  sed -i '' -E "s|($f)\?v=[0-9a-zA-Z]+|\1?v=$h|g" "$SITE/index.html"
done

# ---- publish --------------------------------------------------------------
OUT="$("$PUB" "$SITE" --slug "$SLUG" --title "$TITLE" 2>&1)"
printf '%s\n' "$OUT" >>"$LOG"
URL="$(printf '%s' "$OUT" | grep -oE 'https://[A-Za-z0-9-]+\.here\.now' | head -1 || true)"
if [ -n "$URL" ]; then
  echo "here.now synced: $URL"
else
  echo "publish completed but no URL captured (see $LOG)"
fi
