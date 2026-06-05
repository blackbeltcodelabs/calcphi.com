#!/usr/bin/env bash
# Watches src/assets/images/blog/ for new or updated image files.
# On any change: runs npm run build, commits, and pushes.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WATCH_DIR="$REPO/src/assets/images/blog"

echo "👁  Watching $WATCH_DIR"
echo "    Drop any image file there — build + push will fire automatically."
echo "    Press Ctrl+C to stop."
echo ""

# Track last-processed file to avoid double-firing on atomic saves
LAST_FILE=""
LAST_TIME=0

fswatch -r -e ".*" -i "\\.png$" -i "\\.jpg$" -i "\\.jpeg$" -i "\\.webp$" -i "\\.gif$" \
  --event Created --event Updated --event Renamed \
  "$WATCH_DIR" | while read -r CHANGED_FILE; do

  NOW=$(date +%s)
  # Debounce: skip if same file fired within 3 seconds
  if [[ "$CHANGED_FILE" == "$LAST_FILE" && $((NOW - LAST_TIME)) -lt 3 ]]; then
    continue
  fi
  LAST_FILE="$CHANGED_FILE"
  LAST_TIME=$NOW

  FILENAME=$(basename "$CHANGED_FILE")
  echo ""
  echo "$(date '+%H:%M:%S')  Detected: $FILENAME"

  cd "$REPO"

  echo "  → Building..."
  if ! npm run build --silent 2>&1; then
    echo "  ✗ Build failed — skipping commit"
    continue
  fi

  echo "  → Staging..."
  git add src/assets/images/blog/ _site/assets/images/blog/ _site/ 2>/dev/null || true

  # Only commit if there are staged changes
  if git diff --cached --quiet; then
    echo "  ✓ No changes to commit (already up to date)"
    continue
  fi

  COMMIT_MSG="Add blog image: $FILENAME"
  echo "  → Committing: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

  echo "  → Pushing..."
  git push

  echo "  ✓ Done — $FILENAME is live"
done
