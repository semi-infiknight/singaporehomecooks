#!/usr/bin/env bash
# Verify Customer + Cook iOS apps launch without PlatformConstants / crash on simulator.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIM_ID="${IOS_SIMULATOR_ID:-5D01901E-2034-48BB-98C9-6BFDDB8B59E6}"
FAIL=0

check_bundle() {
  local port="$1"
  local name="$2"
  local bytes
  bytes=$(curl -sf "http://127.0.0.1:${port}/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&lazy=true&minify=false" | wc -c | tr -d ' ')
  if [ "${bytes:-0}" -lt 5000000 ]; then
    echo "FAIL: $name Metro bundle too small (${bytes:-0} bytes on :$port)"
    FAIL=1
    return 1
  fi
  echo "OK: $name Metro bundle ${bytes} bytes on :$port"
}

check_release_embedded() {
  local app_path="$1"
  local name="$2"
  local bundle
  bundle=$(find "$app_path" -maxdepth 1 \( -name 'main.jsbundle' -o -name '*.hbc' \) 2>/dev/null | head -1)
  if [ -z "$bundle" ]; then
    echo "FAIL: $name Release app has no embedded JS bundle at $app_path"
    FAIL=1
    return 1
  fi
  local bytes
  bytes=$(wc -c < "$bundle" | tr -d ' ')
  if [ "${bytes:-0}" -lt 5000000 ]; then
    echo "FAIL: $name embedded bundle too small (${bytes} bytes) — TestFlight would crash"
    FAIL=1
    return 1
  fi
  echo "OK: $name embedded bundle ${bytes} bytes ($(basename "$bundle"))"
}

launch_and_check_logs() {
  local bundle_id="$1"
  local app_path="$2"
  local label="$3"
  local route_url="${4:-}"

  xcrun simctl terminate booted "$bundle_id" 2>/dev/null || true
  xcrun simctl install booted "$app_path" 2>/dev/null || true
  xcrun simctl launch booted "$bundle_id" >/dev/null
  if [ -n "$route_url" ]; then
    sleep 3
    xcrun simctl openurl booted "$route_url" 2>/dev/null || true
  fi
  sleep 25

  if xcrun simctl spawn booted log show --predicate "process == \"${label}\"" --last 20s 2>/dev/null | rg -q "PlatformConstants|main.*has not been registered"; then
    echo "FAIL: $label device logs show PlatformConstants or main-not-registered"
    xcrun simctl spawn booted log show --predicate "process == \"${label}\"" --last 20s 2>/dev/null \
      | rg "PlatformConstants|main.*has not been registered" | tail -3
    FAIL=1
    return 1
  fi

  local shot="/tmp/shc-verify-${label}.png"
  xcrun simctl io booted screenshot "$shot" 2>/dev/null || true
  echo "OK: $label launched without PlatformConstants errors (screenshot: $shot)"
}

echo "=== iOS app verification ==="

if ! xcrun simctl list devices booted 2>/dev/null | rg -q Booted; then
  xcrun simctl boot "$SIM_ID" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  sleep 5
fi

if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
  check_bundle 8081 "Customer" || true
fi
if curl -sf http://127.0.0.1:8082/status >/dev/null 2>&1; then
  check_bundle 8082 "Cook" || true
fi

CUST_DEBUG=$(find /Users/semi/Library/Developer/Xcode/DerivedData -path '*SHCCustomer*/Debug-iphonesimulator/SHCCustomer.app' -type d 2>/dev/null | head -1)
COOK_DEBUG=$(find /Users/semi/Library/Developer/Xcode/DerivedData -path '*SHCCook*/Debug-iphonesimulator/SHCCook.app' -type d 2>/dev/null | head -1)
CUST_RELEASE=$(find /Users/semi/Library/Developer/Xcode/DerivedData -path '*SHCCustomer*/Release-iphonesimulator/SHCCustomer.app' -type d 2>/dev/null | head -1)
COOK_RELEASE=$(find /Users/semi/Library/Developer/Xcode/DerivedData -path '*SHCCook*/Release-iphonesimulator/SHCCook.app' -type d 2>/dev/null | head -1)

if [ -n "${CUST_RELEASE:-}" ]; then
  check_release_embedded "$CUST_RELEASE" "Customer Release" || true
fi

if [ -n "${COOK_RELEASE:-}" ]; then
  check_release_embedded "$COOK_RELEASE" "Cook Release" || true
fi

# TestFlight parity: Release builds must launch with embedded bundle (no Metro).
pkill -f "expo start" 2>/dev/null || true
sleep 2

if [ -n "${CUST_RELEASE:-}" ]; then
  launch_and_check_logs "com.singaporehomecooks.customer" "$CUST_RELEASE" "SHCCustomer" "shc-customer:///(customer)" || true
fi

if [ -n "${COOK_RELEASE:-}" ]; then
  launch_and_check_logs "com.singaporehomecooks.cook" "$COOK_RELEASE" "SHCCook" "shc-cook:///(cook)/dashboard" || true
fi

# Restart Metro for Debug verification if it was running before.
if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1 || curl -sf http://127.0.0.1:8082/status >/dev/null 2>&1; then
  :
elif [ "${SKIP_DEBUG_RELAUNCH:-0}" != "1" ]; then
  bash "$ROOT/scripts/start-mobile-dev.sh" >/dev/null 2>&1 &
  for _ in $(seq 1 90); do
    curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1 && curl -sf http://127.0.0.1:8082/status >/dev/null 2>&1 && break
    sleep 1
  done
fi

if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1 && [ -n "${CUST_DEBUG:-}" ]; then
  launch_and_check_logs "com.singaporehomecooks.customer" "$CUST_DEBUG" "SHCCustomer" "shc-customer:///(customer)" || true
fi

if curl -sf http://127.0.0.1:8082/status >/dev/null 2>&1 && [ -n "${COOK_DEBUG:-}" ]; then
  launch_and_check_logs "com.singaporehomecooks.cook" "$COOK_DEBUG" "SHCCook" "shc-cook:///(cook)/dashboard" || true
fi

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "VERIFICATION FAILED"
  exit 1
fi

echo ""
echo "VERIFICATION PASSED — apps launch without PlatformConstants crash"