#!/usr/bin/env bash
# Web PWA production guard — manifest, icons, production build.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
FAIL=0

check_file() {
  local path="$1"
  local label="$2"
  if [ ! -f "$path" ]; then
    echo "FAIL: missing $label ($path)"
    FAIL=1
    return 1
  fi
  echo "OK: $label"
}

echo "=== Web PWA guard ==="

check_file "$WEB/public/manifest.json" "manifest.json" || true
check_file "$WEB/public/sw.js" "service worker" || true
check_file "$WEB/public/icon.png" "PWA icon 192" || true
check_file "$WEB/public/apple-touch-icon.png" "apple-touch-icon" || true

if ! node -e "
  const m = require('$WEB/public/manifest.json');
  if (!m.display || m.display !== 'standalone') process.exit(1);
  if (!m.start_url) process.exit(1);
"; then
  echo "FAIL: manifest.json missing standalone display or start_url"
  FAIL=1
else
  echo "OK: manifest.json valid standalone PWA"
fi

echo "=== Web production build ==="
if (cd "$WEB" && pnpm exec next build >/dev/null); then
  echo "OK: next build succeeded"
else
  echo "FAIL: next build failed"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "WEB PWA GUARD FAILED"
  exit 1
fi

echo ""
echo "WEB PWA GUARD PASSED"