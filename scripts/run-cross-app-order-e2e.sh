#!/usr/bin/env bash
# Customer checkout (Railway) → cook accepts on simulator.
# Prereqs: Metro :8081 + :8082, iOS simulator booted, SHC apps installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"

echo "=== Cross-app order E2E (customer → cook) ==="
curl -sf "http://127.0.0.1:8081/status" >/dev/null || { echo "Customer Metro (8081) not running"; exit 1; }
curl -sf "http://127.0.0.1:8082/status" >/dev/null || { echo "Cook Metro (8082) not running"; exit 1; }

echo ">>> Customer: place order (PayNow)"
maestro test "$ROOT/apps/mobile-customer/e2e/full-order-fulfil.yaml"

echo ">>> Cook: sign in as rose and accept order"
maestro test "$ROOT/apps/mobile-cook/e2e/full-order-fulfil.yaml"

echo "=== Cross-app order E2E PASSED ==="