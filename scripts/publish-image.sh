#!/usr/bin/env bash
# Usage: ./scripts/publish-image.sh <blog-url-or-slug>
# Finds the most recently downloaded image, names it from the slug, builds and pushes.
#
# Example:
#   ./scripts/publish-image.sh https://www.calcphi.com/australia/blog/dollar-cost-averaging-australia/
#   ./scripts/publish-image.sh dollar-cost-averaging-australia

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
INPUT="${1:-}"

if [[ -z "$INPUT" ]]; then
  echo "Usage: $0 <blog-url-or-slug>"
  exit 1
fi

# Extract slug from full URL or use as-is
SLUG=$(echo "$INPUT" | sed 's|.*/blog/||' | sed 's|/$||')
DEST_FILENAME="${SLUG}.png"
DEST_SRC="$REPO/src/assets/images/blog/$DEST_FILENAME"

echo "Slug:   $SLUG"
echo "Target: $DEST_SRC"

# Find most recently modified image in Downloads
LATEST=$(find ~/Downloads -maxdepth 1 \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) -newer "$REPO/.eleventy.js" | xargs ls -t 2>/dev/null | head -1)

if [[ -z "$LATEST" ]]; then
  echo "No recent image found in ~/Downloads"
  exit 1
fi

echo "Source: $LATEST"
cp "$LATEST" "$DEST_SRC"

cd "$REPO"
npm run build --silent

git add "src/assets/images/blog/$DEST_FILENAME" "_site/assets/images/blog/$DEST_FILENAME"

if git diff --cached --quiet; then
  echo "Already up to date — nothing to push"
  exit 0
fi

git commit -m "Add blog image: $DEST_FILENAME

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push
echo "✓ Live: /australia/blog/$SLUG/"
