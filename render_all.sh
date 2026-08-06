#!/bin/bash
# Render every chapter. Resumable: a chapter with an .mp3 newer than
# lexicon.json is left alone, so an interrupted run picks up where it stopped.
cd "$(dirname "$0")"
for id in $(cat /tmp/chlist.txt); do
  if [ -f "audio/$id.mp3" ] && [ "audio/$id.mp3" -nt lexicon.json ]; then
    echo "== $id  (already current)"; continue
  fi
  echo "== $id"
  ./.venv-audio/bin/python render_passage.py "$id" 2>&1 | grep -E 'min of audio|padded'
done
echo "ALL DONE"
