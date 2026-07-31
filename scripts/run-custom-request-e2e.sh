#!/usr/bin/env bash
# Custom request cross-app Maestro (Phase 4): customer wizard → cook quote → customer accept.
# Prereqs: Metro :8081 + :8082, iOS simulator booted, Railway API, request_dish flag on.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"

echo "=== Custom request E2E (customer → cook → customer) ==="
curl -sf "http://127.0.0.1:8081/status" >/dev/null || { echo "Customer Metro (8081) not running"; exit 1; }
curl -sf "http://127.0.0.1:8082/status" >/dev/null || { echo "Cook Metro (8082) not running"; exit 1; }

echo ">>> Customer: multi-dish request wizard"
maestro test "$ROOT/apps/mobile-customer/e2e/custom-request-wizard.yaml"

echo ">>> Cook: send per-line quote"
maestro test "$ROOT/apps/mobile-cook/e2e/cook-custom-request-quote.yaml"

echo ">>> Customer: accept quote → PayNow"
maestro test "$ROOT/apps/mobile-customer/e2e/custom-request-quote-accept.yaml"

echo "=== Custom request E2E PASSED ==="
