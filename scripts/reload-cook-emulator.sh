#!/usr/bin/env bash
# Ensure Cook Metro + iOS simulator are running, debug SHCCook is installed, then reload JS.
# Use after code changes: pnpm cook:reload
# Env: COOK_ROUTE=shc-cook:///(cook)/dashboard  FORCE_REINSTALL=1  METRO_CLEAR=1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8082
BUNDLE_ID="com.singaporehomecooks.cook"
ROUTE="${COOK_ROUTE:-shc-cook:///(cook)/listings}"
LOG_DIR="${ROOT}/.metro-logs"
export ROOT LOG_DIR

# shellcheck source=scripts/lib/metro-daemon.sh
source "$ROOT/scripts/lib/metro-daemon.sh"

find_debug_app() {
  find /Users/semi/Library/Developer/Xcode/DerivedData \
    -path '*SHCCook*/Build/Products/Debug-iphonesimulator/SHCCook.app' \
    -type d 2>/dev/null | head -1
}

installed_has_embedded_bundle() {
  local container
  container="$(xcrun simctl get_app_container booted "$BUNDLE_ID" 2>/dev/null || true)"
  [ -n "$container" ] && [ -f "${container}/main.jsbundle" ]
}

install_debug_app() {
  local app_path="$1"
  echo "Installing debug SHCCook (Metro :${PORT}, no embedded bundle) ..."
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl uninstall booted "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl install booted "$app_path"
}

launch_app() {
  xcrun simctl launch booted "$BUNDLE_ID" >/dev/null
}

echo "=== Cook emulator sync ==="

metro_start_daemon "apps/mobile-cook" "$PORT" "Cook" "$BUNDLE_ID"
ensure_ios_simulator

DEBUG_APP="$(find_debug_app)"
if [ -z "$DEBUG_APP" ]; then
  echo "No Debug SHCCook.app in DerivedData — run: pnpm setup:ios-dev"
  exit 1
fi

if [ "${FORCE_REINSTALL:-0}" = "1" ] || installed_has_embedded_bundle || ! xcrun simctl get_app_container booted "$BUNDLE_ID" >/dev/null 2>&1; then
  if installed_has_embedded_bundle; then
    echo "WARN: Installed Cook app has embedded main.jsbundle (TestFlight/preview build). Reinstalling debug build."
  fi
  install_debug_app "$DEBUG_APP"
  sleep 2
  launch_app
  sleep 3
else
  launch_app || install_debug_app "$DEBUG_APP"
  sleep 2
fi

curl -sf -X POST "http://127.0.0.1:${PORT}/reload" >/dev/null 2>&1 || true
echo "Sent Metro reload"
xcrun simctl openurl booted "$ROUTE" 2>/dev/null || true

metro_is_healthy "$PORT" "$BUNDLE_ID"
echo "Cook app synced. Fast Refresh should apply saves; METRO_CLEAR=1 pnpm ios:dev if stale."
