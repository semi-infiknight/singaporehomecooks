#!/usr/bin/env bash
# Rebuild iOS native binaries after adding gesture-handler, reanimated, moti, etc.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIM="${IOS_SIMULATOR:-iPhone 16 Pro}"

rebuild_app() {
  local app_dir="$1"
  local name="$2"
  echo "=== Pod install: $name ==="
  (cd "$ROOT/$app_dir/ios" && pod install)
  echo "=== Building iOS: $name ==="
  (cd "$ROOT/$app_dir" && npx expo run:ios -d "$SIM" --no-bundler)
}

rebuild_app "apps/mobile-customer" "Customer"
rebuild_app "apps/mobile-cook" "Cook"

echo "Done. Start Metro: bash scripts/start-mobile-dev.sh"