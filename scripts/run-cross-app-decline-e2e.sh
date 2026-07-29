#!/usr/bin/env bash
# Customer checkout → cook declines paid order (alternate cross-app path).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"

echo "=== Cross-app decline E2E (customer → cook decline) ==="
curl -sf "http://127.0.0.1:8081/status" >/dev/null || { echo "Customer Metro (8081) not running"; exit 1; }
curl -sf "http://127.0.0.1:8082/status" >/dev/null || { echo "Cook Metro (8082) not running"; exit 1; }

echo ">>> Customer: place order (PayNow)"
maestro test "$ROOT/apps/mobile-customer/e2e/full-order-fulfil.yaml"

echo ">>> Cook: decline paid order"
maestro test "$ROOT/apps/mobile-cook/e2e/cook-decline-tray.yaml"

echo "=== Cross-app decline E2E PASSED ==="
