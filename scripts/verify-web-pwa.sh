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

echo "=== Build shared packages (fresh CI has no dist/) ==="
if pnpm --filter @shc/types build && pnpm --filter @shc/business-rules build && pnpm --filter @shc/utils build; then
  echo "OK: shared packages built"
else
  echo "FAIL: shared package build failed"
  FAIL=1
fi

PWA_ASSETS="$WEB/public/pwa-assets"
check_file "$WEB/public/manifest.json" "manifest.json" || true
check_file "$PWA_ASSETS/sw.js" "service worker" || true
check_file "$PWA_ASSETS/icon.png" "PWA icon 192" || true
check_file "$PWA_ASSETS/icon-512.png" "PWA icon 512" || true
check_file "$PWA_ASSETS/apple-touch-icon.png" "apple-touch-icon" || true

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

echo "=== Build fingerprint unit test ==="
if (cd "$WEB" && pnpm test); then
  echo "OK: build-fingerprint tests passed"
else
  echo "FAIL: build-fingerprint tests failed"
  FAIL=1
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