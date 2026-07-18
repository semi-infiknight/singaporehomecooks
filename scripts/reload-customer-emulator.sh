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
SIM_NAME="${IOS_SIMULATOR:-iPhone 16 Pro}"
LOG_DIR="${ROOT}/.metro-logs"
LOG_FILE="${LOG_DIR}/Customer-${PORT}.log"

metro_running() {
  curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1
}

start_metro() {
  local clear_flag=""
  if [ "${METRO_CLEAR:-0}" = "1" ]; then
    clear_flag="--clear"
    echo "Starting Customer Metro with cache clear ..."
  else
    echo "Starting Customer Metro on :${PORT} ..."
  fi
  mkdir -p "$LOG_DIR"
  nohup bash -c "cd \"$ROOT/apps/mobile-customer\" && RCT_METRO_PORT=\"$PORT\" npx expo start --port \"$PORT\" $clear_flag" \
    >"$LOG_FILE" 2>&1 &
  for _ in $(seq 1 90); do
    if metro_running; then
      echo "Customer Metro ready on :${PORT}"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: Customer Metro failed to start (see $LOG_FILE)"
  tail -20 "$LOG_FILE" || true
  exit 1
}

restart_metro_clear() {
  echo "Restarting Customer Metro on :${PORT} with --clear ..."
  lsof -ti ":${PORT}" | xargs kill -9 2>/dev/null || true
  sleep 2
  METRO_CLEAR=1 start_metro
}

ensure_simulator() {
  if xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
    echo "Simulator already booted"
    return 0
  fi
  echo "Booting simulator: $SIM_NAME"
  xcrun simctl boot "$SIM_NAME" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  for _ in $(seq 1 30); do
    xcrun simctl list devices booted 2>/dev/null | grep -q Booted && return 0
    sleep 1
  done
  echo "ERROR: No booted iOS simulator"
  exit 1
}

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

reload_js() {
  curl -sf -X POST "http://127.0.0.1:${PORT}/reload" >/dev/null
  echo "Sent Metro reload to connected simulators"
}

open_route() {
  xcrun simctl openurl booted "$ROUTE" 2>/dev/null || true
}

echo "=== Customer emulator sync ==="

if metro_running; then
  if [ "${METRO_CLEAR:-0}" = "1" ]; then
    restart_metro_clear
  else
    echo "Customer Metro already running on :${PORT}"
  fi
else
  start_metro
fi

ensure_simulator

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

reload_js
open_route

echo "Customer app synced. If UI still looks old: METRO_CLEAR=1 pnpm customer:reload"
