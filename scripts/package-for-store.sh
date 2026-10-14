#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/validate.sh"

VERSION="$(node -pe "JSON.parse(require('fs').readFileSync('manifest.json','utf8')).version")"
OUT_DIR="$ROOT/dist"
ZIP="$OUT_DIR/youtube-repeat-store.zip"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

zip -r "$ZIP" . \
  -x "*.git*" \
  -x "dist/*" \
  -x "icons/repeat.svg.png" \
  -x "scripts/*" \
  -x "STORE_LISTING.md" \
  -x "README.md"

echo "→ Created $ZIP (v$VERSION)"
echo "→ Upload this file in Chrome Web Store Developer Dashboard"
