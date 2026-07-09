#!/usr/bin/env bash
# Tiffin subscription Maestro E2E — cook config + customer subscribe/plan.
# Prereqs: Metro :8081 + :8082, iOS simulator booted, SHC apps installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"

echo "=== Tiffin subscription E2E ==="
curl -sf "http://127.0.0.1:8081/status" >/dev/null || { echo "Customer Metro (8081) not running — run: bash scripts/start-mobile-dev.sh"; exit 1; }
curl -sf "http://127.0.0.1:8082/status" >/dev/null || { echo "Cook Metro (8082) not running — run: bash scripts/start-mobile-dev.sh"; exit 1; }

echo ">>> Cook: tiffin kitchen config"
maestro test "$ROOT/apps/mobile-cook/e2e/tiffin-config.yaml"

echo ">>> Customer: subscribe + weekly meal plan"
maestro test "$ROOT/apps/mobile-customer/e2e/tiffin-subscribe.yaml"

echo "=== Tiffin E2E PASSED ==="