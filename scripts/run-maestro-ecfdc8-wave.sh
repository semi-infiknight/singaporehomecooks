#!/usr/bin/env bash
# Maestro smoke scoped to mobile changes since ecfdc8c (Jul 27 wave).
# Customer: discover spine, location, occasions, checkout pre-fill
# Cook: settings, batches slots, tiffin options, listings meta
# Prereq: pnpm ios:dev (Metro :8081 + :8082, sim booted)
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

if ! command -v maestro >/dev/null 2>&1; then
  echo "ERROR: maestro not in PATH. Install: curl -Ls https://get.maestro.mobile.dev | bash"
  exit 1
fi

echo "=== Maestro: ecfdc8c..HEAD mobile wave (scoped) ==="
echo "Device: $IOS_DEVICE"
quit_rn_devtools
curl -sf http://127.0.0.1:8081/status >/dev/null || { echo "Customer Metro :8081 down — pnpm ios:dev"; exit 1; }
curl -sf http://127.0.0.1:8082/status >/dev/null || { echo "Cook Metro :8082 down — pnpm ios:dev"; exit 1; }

echo "Pre-warming iOS bundles..."
curl -sf "http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&app=com.singaporehomecooks.customer" -o /dev/null \
  || { echo "Customer iOS bundle failed"; exit 1; }
curl -sf "http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&app=com.singaporehomecooks.cook" -o /dev/null \
  || { echo "Cook iOS bundle failed"; exit 1; }

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

prewarm_cook() {
  curl -sf "http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&app=com.singaporehomecooks.cook" -o /dev/null \
    || { echo "Cook iOS bundle failed"; exit 1; }
  xcrun simctl terminate "$IOS_DEVICE" com.singaporehomecooks.customer 2>/dev/null || true
  sleep 2
}

FAIL=0

# | Area (since ecfdc8c)              | Flow |
# |-----------------------------------|------|
# | Discover spine + location + modes | discover-location-wave |
# | Checkout collection pre-fill      | location-checkout-prefill |
# | Cook settings + batches + tiffin| cook-settings-wave |
# | Listing product meta (item 8)     | listing-tray |

run_flow "discover-location-wave" "$ROOT/apps/mobile-customer/e2e/discover-location-wave.yaml" || FAIL=1
prewarm_customer
run_flow "location-checkout-prefill" "$ROOT/apps/mobile-customer/e2e/location-checkout-prefill.yaml" || FAIL=1
prewarm_cook
run_flow "cook-settings-wave" "$ROOT/apps/mobile-cook/e2e/cook-settings-wave.yaml" || FAIL=1
prewarm_cook
run_flow "cook-listings-meta" "$ROOT/apps/mobile-cook/e2e/listing-tray.yaml" || FAIL=1

if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "=== ecfdc8c-wave Maestro PASSED ==="
else
  echo ""
  echo "=== Some ecfdc8c-wave flows FAILED (see above) ==="
  exit 1
fi
