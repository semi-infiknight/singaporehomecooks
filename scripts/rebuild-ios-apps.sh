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
  echo "=== Building iOS Debug: $name ==="
  # Build only, do not launch (avoids wrong URL during staggered metro start).
  # Launch will be handled by start-mobile-dev.sh after metros are ready.
  (cd "$ROOT/$app_dir" && npx expo run:ios -d "$SIM" --no-bundler)
  echo "=== Building iOS Release (TestFlight parity): $name ==="
  (cd "$ROOT/$app_dir" && npx expo run:ios -d "$SIM" --no-bundler --configuration Release)
}

rebuild_app "apps/mobile-customer" "Customer"
rebuild_app "apps/mobile-cook" "Cook"

echo "Done. Now run: bash scripts/start-mobile-dev.sh (starts Metros, waits for full bundles, launches on simulator)."
echo "TestFlight: rebuild with eas after metro.config.js / @expo/metro-runtime fixes — old IPAs had a ~125KB broken JS bundle."