#!/usr/bin/env bash
# Ensure Cook Metro + iOS simulator are running, debug SHCCook is installed, then reload JS.
# Use after code changes: pnpm cook:reload
# Env: COOK_ROUTE=shc-cook:///(cook)/dashboard  FORCE_REINSTALL=1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8082
BUNDLE_ID="com.singaporehomecooks.cook"
ROUTE="${COOK_ROUTE:-shc-cook:///(cook)/listings}"
SIM_NAME="${IOS_SIMULATOR:-iPhone 16 Pro}"
LOG_DIR="${ROOT}/.metro-logs"
LOG_FILE="${LOG_DIR}/Cook-${PORT}.log"

metro_running() {
  curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1
}

start_metro() {
  mkdir -p "$LOG_DIR"
  echo "Starting Cook Metro on :${PORT} ..."
  nohup bash -c "cd \"$ROOT/apps/mobile-cook\" && RCT_METRO_PORT=\"$PORT\" npx expo start --port \"$PORT\"" \
    >"$LOG_FILE" 2>&1 &
  for _ in $(seq 1 90); do
    if metro_running; then
      echo "Cook Metro ready on :${PORT}"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: Cook Metro failed to start (see $LOG_FILE)"
  tail -20 "$LOG_FILE" || true
  exit 1
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

reload_js() {
  curl -sf -X POST "http://127.0.0.1:${PORT}/reload" >/dev/null
  echo "Sent Metro reload"
}

open_route() {
  xcrun simctl openurl booted "$ROUTE" 2>/dev/null || true
}

echo "=== Cook emulator sync ==="

if metro_running; then
  echo "Cook Metro already running on :${PORT}"
else
  start_metro
fi

ensure_simulator

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

reload_js
open_route

echo "Cook app synced. Fast Refresh should apply saves; run pnpm cook:reload again if UI looks stale."