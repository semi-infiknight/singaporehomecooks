#!/usr/bin/env bash
# AGENT: Start Metro :8081 (customer) + :8082 (cook) → Railway API (not local Medusa).
# Prefer one-shot iOS: pnpm ios:dev
# Ports invariant — blueprint/10-mobile/10-mobile.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.metro-logs"
export ROOT LOG_DIR

# shellcheck source=scripts/lib/metro-daemon.sh
source "$ROOT/scripts/lib/metro-daemon.sh"

mkdir -p "$LOG_DIR"

if [ "${METRO_CLEAR:-0}" = "1" ]; then
  metro_stop "Customer" 8081
  metro_stop "Cook" 8082
  sleep 2
fi

metro_start_daemon "apps/mobile-customer" 8081 "Customer" "com.singaporehomecooks.customer"
sleep 3
metro_start_daemon "apps/mobile-cook" 8082 "Cook" "com.singaporehomecooks.cook"

if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -qE 'emulator-[0-9]+[[:space:]]+device'; then
  adb reverse tcp:8081 tcp:8081 || true
  adb reverse tcp:8082 tcp:8082 || true
  echo "adb reverse configured for 8081 + 8082"
fi

echo "Mobile Metro ready. All clients use Railway Medusa (config/railway-client.json / .env.local)."

# iOS sim + app launch (skip with LAUNCH_CUSTOMER=0 LAUNCH_COOK=0 or SKIP_IOS_LAUNCH=1)
if [ "${SKIP_IOS_LAUNCH:-0}" != "1" ]; then
  SKIP_METRO_START=1 exec "$ROOT/scripts/start-ios-dev.sh"
fi
