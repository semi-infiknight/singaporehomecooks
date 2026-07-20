#!/usr/bin/env bash
# Maestro smoke for recent agent mobile changes only (NOT full-tour).
# Maps git changes since 2026-07-14 → targeted flows. Railway API + Metro :8081/:8082.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"
export ROOT LOG_DIR="${ROOT}/.metro-logs"
# shellcheck source=scripts/lib/metro-daemon.sh
source "$ROOT/scripts/lib/metro-daemon.sh"

IOS_DEVICE="${IOS_DEVICE:-}"
if [ -z "$IOS_DEVICE" ]; then
  IOS_DEVICE="$(xcrun simctl list devices booted 2>/dev/null | rg -o '[A-F0-9-]{36}' | head -1 || true)"
fi
if [ -z "$IOS_DEVICE" ]; then
  echo "ERROR: No booted iOS simulator. Run: pnpm ios:dev"
  exit 1
fi

echo "=== Maestro: recent agent changes (scoped) ==="
echo "Device: $IOS_DEVICE"
quit_rn_devtools
curl -sf http://127.0.0.1:8081/status >/dev/null || { echo "Customer Metro :8081 down — pnpm ios:dev"; exit 1; }
curl -sf http://127.0.0.1:8082/status >/dev/null || { echo "Cook Metro :8082 down — pnpm ios:dev"; exit 1; }

echo "Pre-warming iOS bundles (cold start after clearState needs this)..."
curl -sf "http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&app=com.singaporehomecooks.customer" -o /dev/null \
  || { echo "Customer iOS bundle failed"; exit 1; }
curl -sf "http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&app=com.singaporehomecooks.cook" -o /dev/null \
  || { echo "Cook iOS bundle failed"; exit 1; }
xcrun simctl launch "$IOS_DEVICE" com.singaporehomecooks.customer >/dev/null 2>&1 || true
sleep 20
xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.customer 2>/dev/null || true
sleep 3

run_flow() {
  local label="$1"
  local flow="$2"
  echo ""
  echo ">>> [$label] maestro test --device $IOS_DEVICE $flow"
  maestro test --device "$IOS_DEVICE" "$flow"
}

prewarm_customer() {
  curl -sf "http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&app=com.singaporehomecooks.customer" -o /dev/null \
    || { echo "Customer iOS bundle failed"; exit 1; }
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.cook 2>/dev/null || true
  sleep 2
}

FAIL=0

# | Area | Commit / change | Flow |
# |------|-----------------|------|
# | Guest browse + auth | b84139d, d98ea64 | customer-auth |
# | Tab bar + cook route | session fix | tab-bar-smoke |
# | Add-to-cart → checkout | f01645b, 274050c | full-order-fulfil (customer) |
# | Cook login + dashboard | 4659c66, compliance | cook-auth |
# | Cook listings tray | polish | listing-tray |
# | Tiffin subscribe/recharge | a6fb6e4 | tiffin-subscribe |

run_flow "guest-auth" "$ROOT/apps/mobile-customer/e2e/customer-auth.yaml" || FAIL=1
run_flow "tab-bar-routes" "$ROOT/apps/mobile-customer/e2e/tab-bar-smoke.yaml" || FAIL=1
run_flow "cook-auth" "$ROOT/apps/mobile-cook/e2e/cook-auth.yaml" || FAIL=1
run_flow "cook-listings" "$ROOT/apps/mobile-cook/e2e/listing-tray.yaml" || FAIL=1
prewarm_customer
run_flow "tiffin" "$ROOT/apps/mobile-customer/e2e/tiffin-subscribe.yaml" || FAIL=1

if [ "${RUN_ORDER:-0}" = "1" ]; then
  run_flow "order-checkout" "$ROOT/apps/mobile-customer/e2e/full-order-fulfil.yaml" || FAIL=1
else
  echo "Skipping full-order-fulfil (set RUN_ORDER=1 to include checkout/PayNow path)"
fi

if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "=== Recent-changes Maestro PASSED ==="
else
  echo ""
  echo "=== Some scoped flows FAILED (see above) ==="
  exit 1
fi
