#!/usr/bin/env bash
# Fresh clone → working iOS dev + TestFlight-ready toolchain (macOS + Xcode required).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Singapore Home Cooks — iOS dev setup ==="

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS native builds require macOS with Xcode."
  exit 1
fi

command -v pnpm >/dev/null || { echo "Install pnpm 11.x first"; exit 1; }
command -v pod >/dev/null || { echo "Install CocoaPods: brew install cocoapods"; exit 1; }

git config core.ignorecase false 2>/dev/null || true

echo "=== pnpm install ==="
pnpm install

echo "=== Dependency guard ==="
bash scripts/verify-mobile-deps.sh

echo "=== Bundle guard (export only, no simulator) ==="
bash scripts/verify-mobile-bundles.sh

echo "=== Pod install + native rebuild ==="
bash scripts/rebuild-ios-apps.sh

echo ""
echo "Setup complete."
echo "  Dev:    bash scripts/start-mobile-dev.sh"
echo "  Verify: bash scripts/verify-ios-apps.sh"
echo "  Ship:   bash scripts/eas-customer-testflight.sh"
echo "          bash scripts/eas-cook-testflight.sh"