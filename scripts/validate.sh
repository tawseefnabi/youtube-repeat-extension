#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Syntax check (JS)"
node --check content.js
node --check popup.js

echo "→ Manifest JSON"
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"

echo "→ Required files"
for f in manifest.json content.js content.css popup.html popup.js popup.css \
  icons/icon16.png icons/icon48.png icons/icon128.png README.md; do
  test -f "$f" || { echo "Missing: $f"; exit 1; }
done

fail_if_match() {
  local pattern=$1
  local message=$2
  if grep -En "$pattern" content.js >/dev/null 2>&1; then
    grep -En "$pattern" content.js
    echo "$message"
    exit 1
  fi
}

echo "→ Dangerous DOM APIs (overlay uses appendChild only)"
fail_if_match 'insertAdjacentElement|\.insertBefore\(' \
  "Remove insertAdjacentElement / insertBefore from content.js"
fail_if_match 'ytp-tooltip' \
  "Do not touch YouTube tooltip DOM in content.js"

echo "✓ Validation passed"
