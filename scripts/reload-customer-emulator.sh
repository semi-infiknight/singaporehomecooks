#!/usr/bin/env bash
# Ensure Customer Metro + iOS simulator are running, debug SHCCustomer is installed, then reload JS.
# Use after @shc/ui / tab bar / shared-package changes when Fast Refresh looks stale:
#   pnpm customer:reload
# Env: CUSTOMER_ROUTE=shc-customer:///(customer)  FORCE_REINSTALL=1  METRO_CLEAR=1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8081
BUNDLE_ID="com.singaporehomecooks.customer"
ROUTE="${CUSTOMER_ROUTE:-shc-customer:///(customer)}"
LOG_DIR="${ROOT}/.metro-logs"
export ROOT LOG_DIR

# shellcheck source=scripts/lib/metro-daemon.sh
source "$ROOT/scripts/lib/metro-daemon.sh"

find_debug_app() {
  find /Users/semi/Library/Developer/Xcode/DerivedData \
    -path '*SHCCustomer*/Build/Products/Debug-iphonesimulator/SHCCustomer.app' \
    -type d 2>/dev/null | head -1
}

installed_has_embedded_bundle() {
  local container
  container="$(xcrun simctl get_app_container booted "$BUNDLE_ID" 2>/dev/null || true)"
  [ -n "$container" ] && [ -f "${container}/main.jsbundle" ]
}

install_debug_app() {
  local app_path="$1"
  echo "Installing debug SHCCustomer (Metro :${PORT}, no embedded bundle) ..."
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl uninstall booted "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl install booted "$app_path"
}

launch_app() {
  xcrun simctl launch booted "$BUNDLE_ID" >/dev/null
}

echo "=== Customer emulator sync ==="

metro_start_daemon "apps/mobile-customer" "$PORT" "Customer" "$BUNDLE_ID"
ensure_ios_simulator

DEBUG_APP="$(find_debug_app)"
if [ -z "$DEBUG_APP" ]; then
  echo "No Debug SHCCustomer.app in DerivedData — run: pnpm setup:ios-dev"
  exit 1
fi

if [ "${FORCE_REINSTALL:-0}" = "1" ] || installed_has_embedded_bundle || ! xcrun simctl get_app_container booted "$BUNDLE_ID" >/dev/null 2>&1; then
  if installed_has_embedded_bundle; then
    echo "WARN: Installed Customer app has embedded main.jsbundle (TestFlight/preview build). Reinstalling debug build."
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
echo "Sent Metro reload to connected simulators"
xcrun simctl openurl booted "$ROUTE" 2>/dev/null || true

metro_is_healthy "$PORT" "$BUNDLE_ID"
echo "Customer app synced. If UI still looks old: METRO_CLEAR=1 pnpm ios:dev"
