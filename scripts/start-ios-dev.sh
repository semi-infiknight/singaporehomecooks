#!/usr/bin/env bash
# One-shot iOS dev: Metro :8081 + :8082 (Railway API) → boot sim → install + launch both apps.
# Usage: pnpm ios:dev
# Env: METRO_CLEAR=1  IOS_SIMULATOR="iPhone 16 Pro"  LAUNCH_CUSTOMER=0  LAUNCH_COOK=0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.metro-logs"
export ROOT LOG_DIR

# shellcheck source=scripts/lib/metro-daemon.sh
source "$ROOT/scripts/lib/metro-daemon.sh"

mkdir -p "$LOG_DIR"

if [ ! -f "$ROOT/apps/mobile-customer/.env.local" ]; then
  echo "Syncing Railway client env ..."
  (cd "$ROOT" && pnpm env:sync)
fi

echo "=== SHC iOS dev (Railway API + local Metro) ==="
quit_rn_devtools

if [ "${SKIP_METRO_START:-0}" != "1" ]; then
  metro_start_daemon "apps/mobile-customer" 8081 "Customer" "com.singaporehomecooks.customer"
  sleep 3
  metro_start_daemon "apps/mobile-cook" 8082 "Cook" "com.singaporehomecooks.cook"
fi

ensure_ios_simulator

CUST_APP=$(find /Users/semi/Library/Developer/Xcode/DerivedData \
  -path '*SHCCustomer*/Build/Products/Debug-iphonesimulator/SHCCustomer.app' \
  -type d 2>/dev/null | head -1)
COOK_APP=$(find /Users/semi/Library/Developer/Xcode/DerivedData \
  -path '*SHCCook*/Build/Products/Debug-iphonesimulator/SHCCook.app' \
  -type d 2>/dev/null | head -1)

launch_ios_app() {
  local bundle_id="$1"
  local app_path="$2"
  local route_url="$3"
  local label="$4"

  echo "Launching $label ..."
  xcrun simctl terminate booted "$bundle_id" 2>/dev/null || true
  if ! xcrun simctl get_app_container booted "$bundle_id" >/dev/null 2>&1; then
    xcrun simctl install booted "$app_path"
  fi
  xcrun simctl launch booted "$bundle_id" >/dev/null
  sleep 4
  xcrun simctl openurl booted "$route_url" 2>/dev/null || true
}

if [ -n "$CUST_APP" ] && [ "${LAUNCH_CUSTOMER:-1}" = "1" ]; then
  launch_ios_app "com.singaporehomecooks.customer" "$CUST_APP" "shc-customer:///(customer)" "Customer"
else
  [ "${LAUNCH_CUSTOMER:-1}" = "1" ] && echo "WARN: No SHCCustomer debug build — run: pnpm setup:ios-dev"
fi

if [ -n "$COOK_APP" ] && [ "${LAUNCH_COOK:-1}" = "1" ]; then
  launch_ios_app "com.singaporehomecooks.cook" "$COOK_APP" "shc-cook:///(cook)/dashboard" "Cook"
else
  [ "${LAUNCH_COOK:-1}" = "1" ] && echo "WARN: No SHCCook debug build — run: pnpm setup:ios-dev"
fi

metro_is_healthy 8081 "com.singaporehomecooks.customer"
metro_is_healthy 8082 "com.singaporehomecooks.cook"

echo ""
echo "✓ iOS dev ready — Metro daemons persist (PIDs in .metro-logs/*.pid)"
echo "  Customer :8081 → Railway Medusa"
echo "  Cook     :8082 → Railway Medusa"
echo "  Stale UI: METRO_CLEAR=1 pnpm ios:dev  or  pnpm customer:reload / pnpm cook:reload"
