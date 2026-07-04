#!/usr/bin/env bash
# Start both Expo Metro servers (customer 8081, cook 8082). Processes survive script exit (nohup).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.metro-logs"
mkdir -p "$LOG_DIR"

start_metro() {
  local app_dir="$1"
  local port="$2"
  local name="$3"
  local log_file="${LOG_DIR}/${name// /-}-${port}.log"
  if curl -sf "http://127.0.0.1:${port}/status" >/dev/null 2>&1; then
    echo "$name Metro already running on :$port"
    return 0
  fi
  echo "Starting $name Metro on :$port (log: $log_file) ..."
  nohup bash -c "cd \"$ROOT/$app_dir\" && RCT_METRO_PORT=\"$port\" npx expo start --port \"$port\" --clear" \
    >"$log_file" 2>&1 &
  for _ in $(seq 1 90); do
    if curl -sf "http://127.0.0.1:${port}/status" >/dev/null 2>&1; then
      echo "$name Metro ready on :$port"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: $name Metro failed to start on :$port (see $log_file)"
  tail -20 "$log_file" || true
  return 1
}

start_metro "apps/mobile-customer" 8081 "Customer"
# Stagger cook Metro so customer file map finishes before cook indexes the monorepo.
sleep 3
start_metro "apps/mobile-cook" 8082 "Cook"

if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -q emulator; then
  adb reverse tcp:8081 tcp:8081 || true
  adb reverse tcp:8082 tcp:8082 || true
  echo "adb reverse configured for 8081 + 8082"
fi

echo "Mobile dev ready. Railway backend wired via each app .env.local"

# Auto-launch debug builds on the booted simulator (bare workflow, not expo-dev-client).
SIM_NAME="${IOS_SIMULATOR:-iPhone 16 Pro}"
if ! xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
  echo "Booting simulator: $SIM_NAME"
  xcrun simctl boot "$SIM_NAME" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  for _ in $(seq 1 30); do
    xcrun simctl list devices booted 2>/dev/null | grep -q Booted && break
    sleep 1
  done
fi

wait_for_bundle() {
  local port="$1"
  local name="$2"
  for _ in $(seq 1 120); do
    local bytes
    bytes=$(curl -sf "http://127.0.0.1:${port}/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&lazy=true&minify=false" | wc -c | tr -d ' ')
    if [ "${bytes:-0}" -gt 500000 ]; then
      echo "$name bundle ready (${bytes} bytes)"
      return 0
    fi
    sleep 1
  done
  echo "WARN: $name bundle still small after 120s — launch may fail until Metro finishes indexing"
  return 1
}

IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
CUST_APP=$(find /Users/semi/Library/Developer/Xcode/DerivedData -path '*SHCCustomer*/Debug-iphonesimulator/SHCCustomer.app' -type d 2>/dev/null | head -1)
COOK_APP=$(find /Users/semi/Library/Developer/Xcode/DerivedData -path '*SHCCook*/Debug-iphonesimulator/SHCCook.app' -type d 2>/dev/null | head -1)

wait_for_bundle 8081 "Customer" || true
wait_for_bundle 8082 "Cook" || true

launch_ios_app() {
  local bundle_id="$1"
  local app_path="$2"
  local port="$3"
  local route_url="$4"
  local label="$5"

  echo "Installing and launching $label (Metro :$port) ..."
  xcrun simctl terminate booted "$bundle_id" 2>/dev/null || true
  xcrun simctl uninstall booted "$bundle_id" 2>/dev/null || true
  xcrun simctl install booted "$app_path" 2>/dev/null || true
  xcrun simctl launch booted "$bundle_id" 2>/dev/null || true
  sleep 8
  xcrun simctl openurl booted "$route_url" 2>/dev/null || true
  sleep 3
}

if [ -n "$CUST_APP" ] && [ "${LAUNCH_CUSTOMER:-1}" = "1" ]; then
  launch_ios_app \
    "com.singaporehomecooks.customer" \
    "$CUST_APP" \
    "8081" \
    "shc-customer:///(customer)" \
    "Customer"
fi

if [ -n "$COOK_APP" ] && [ "${LAUNCH_COOK:-1}" = "1" ]; then
  launch_ios_app \
    "com.singaporehomecooks.cook" \
    "$COOK_APP" \
    "8082" \
    "shc-cook:///(cook)/dashboard" \
    "Cook"
fi

if [ "${LAUNCH_CUSTOMER:-1}" != "1" ]; then
  echo "Skipped Customer (LAUNCH_CUSTOMER=0)."
fi
if [ "${LAUNCH_COOK:-1}" != "1" ]; then
  echo "Skipped Cook (LAUNCH_COOK=0). Run with LAUNCH_COOK=1 to start cook alone."
fi

echo ""
echo "Debug builds load JS from Metro via .expo/.virtual-metro-entry (localhost:${IP})."
echo "If a app shows a redbox after rebuild, shake simulator > Reload, or rerun this script."
echo "For TestFlight/production: eas build --profile production --platform ios (rebuild after this metro fix)."