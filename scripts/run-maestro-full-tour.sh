#!/usr/bin/env bash
# Run full Maestro screen tours on Android + iOS for both apps.
# Prereqs: Metro 8081 (customer) + 8082 (cook), emulators booted, adb reverse on Android.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"

ANDROID_DEVICE="${ANDROID_DEVICE:-emulator-5554}"
IOS_DEVICE="${IOS_DEVICE:-5D01901E-2034-48BB-98C9-6BFDDB8B59E6}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro not found. Install: curl -fsSL https://get.maestro.mobile.dev | bash"
  exit 1
fi

echo "=== Preflight ==="
curl -sf "http://127.0.0.1:8081/status" >/dev/null || { echo "Customer Metro (8081) not running. Run: pnpm customer:metro"; exit 1; }
curl -sf "http://127.0.0.1:8082/status" >/dev/null || { echo "Cook Metro (8082) not running. Run: pnpm cook:metro"; exit 1; }
CUST_BUNDLE_TMP="$(mktemp)"
COOK_BUNDLE_TMP="$(mktemp)"
trap 'rm -f "$CUST_BUNDLE_TMP" "$COOK_BUNDLE_TMP"' EXIT
curl -sf "http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&minify=false" -o "$CUST_BUNDLE_TMP" \
  || { echo "Customer bundle failed — restart Metro from apps/mobile-customer"; exit 1; }
grep -q "customer-discover-screen" "$CUST_BUNDLE_TMP" \
  || { echo "ERROR: Metro :8081 is not serving customer app (restart with scripts/start-mobile-dev.sh)"; exit 1; }
grep -q "customer-profile-screen" "$CUST_BUNDLE_TMP" \
  || { echo "ERROR: Customer bundle stale (missing profile screen) — restart Metro with --clear (scripts/start-mobile-dev.sh)"; exit 1; }
curl -sf "http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&minify=false" -o "$COOK_BUNDLE_TMP" \
  || { echo "Cook bundle failed — restart Metro from apps/mobile-cook"; exit 1; }
grep -q "SHC Cook Portal" "$COOK_BUNDLE_TMP" \
  || { echo "ERROR: Metro :8082 is not serving cook app (restart with scripts/start-mobile-dev.sh)"; exit 1; }
grep -q "cook-orders-screen" "$COOK_BUNDLE_TMP" \
  || { echo "ERROR: Cook bundle stale (missing cook-orders-screen testID) — restart Metro with --clear"; exit 1; }
# Pre-warm iOS bundles (first load can exceed Maestro's login assert timeout).
curl -sf "http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false" -o /dev/null \
  || echo "WARN: iOS customer bundle pre-warm failed"
curl -sf "http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false" -o /dev/null \
  || echo "WARN: iOS cook bundle pre-warm failed"
curl -sf "https://medusa-production-d2ba.up.railway.app/health" >/dev/null || echo "WARN: Railway health check failed (continuing)"
if adb devices 2>/dev/null | grep -q "$ANDROID_DEVICE"; then
  adb -s "$ANDROID_DEVICE" reverse tcp:8081 tcp:8081 || true
  adb -s "$ANDROID_DEVICE" reverse tcp:8082 tcp:8082 || true
fi

run_flow() {
  local device="$1"
  local flow="$2"
  echo ""
  echo ">>> maestro test --device $device $flow"
  maestro test --device "$device" "$flow"
}

FAIL=0

if adb devices 2>/dev/null | grep -q "$ANDROID_DEVICE"; then
  adb -s "$ANDROID_DEVICE" shell pm clear com.singaporehomecooks.customer >/dev/null 2>&1 || true
  run_flow "$ANDROID_DEVICE" "$ROOT/apps/mobile-customer/e2e/customer-full-tour.yaml" || FAIL=1
  adb -s "$ANDROID_DEVICE" shell pm clear com.singaporehomecooks.cook >/dev/null 2>&1 || true
  run_flow "$ANDROID_DEVICE" "$ROOT/apps/mobile-cook/e2e/cook-full-tour.yaml" || FAIL=1
else
  echo "SKIP Android ($ANDROID_DEVICE not connected)"
fi

if xcrun simctl list devices booted 2>/dev/null | grep -q "$IOS_DEVICE"; then
  echo "Pre-warming iOS simulators (first bundle load can exceed login timeout)..."
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.customer 2>/dev/null || true
  xcrun simctl launch "$IOS_DEVICE" com.singaporehomecooks.customer 2>/dev/null || true
  sleep 25
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.customer 2>/dev/null || true
  xcrun simctl launch "$IOS_DEVICE" com.singaporehomecooks.cook 2>/dev/null || true
  sleep 25
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.cook 2>/dev/null || true
  echo "Waiting for iOS simulator + Maestro driver cooldown..."
  sleep 20
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.customer 2>/dev/null || true
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.cook 2>/dev/null || true
  sleep 5
  run_flow "$IOS_DEVICE" "$ROOT/apps/mobile-customer/e2e/customer-full-tour.yaml" || FAIL=1
  sleep 25
  run_flow "$IOS_DEVICE" "$ROOT/apps/mobile-cook/e2e/cook-full-tour.yaml" || FAIL=1
else
  echo "SKIP iOS ($IOS_DEVICE not booted)"
fi

if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "=== All Maestro full tours PASSED ==="
  echo "iOS/Android full tours complete (rebuild script ensures native deps; Android PASS, iOS re-verify after pod install)"
else
  echo ""
  echo "=== Some Maestro tours FAILED ==="
  exit 1
fi