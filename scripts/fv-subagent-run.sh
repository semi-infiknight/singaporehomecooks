#!/usr/bin/env bash
# Cluster review — subagent runs this script; stdout is the verbatim transcript.
set -euo pipefail
CLUSTER="${1:?usage: fv-subagent-run.sh <foundation|simplicity|fluidity|delight-web|docs-tests>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${FAMILY_VALUES_SCRATCH:-$ROOT}"
LOG="$OUT/cluster-${CLUSTER}-subagent-raw.txt"
mkdir -p "$OUT"

{
  echo "spawn_tool: spawn_subagent"
  echo "capture_source: subagent_shell_tee"
  echo "cluster: $CLUSTER"
  echo "captured_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "cwd: $ROOT"
  echo "--- commands ---"
} > "$LOG"

run() {
  echo "" | tee -a "$LOG"
  echo "\$ $*" | tee -a "$LOG"
  (cd "$ROOT" && eval "$*") 2>&1 | tee -a "$LOG" || echo "exit_code: $?" | tee -a "$LOG"
}

case "$CLUSTER" in
  foundation)
    run "pnpm --filter @shc/ui exec vitest run src/order-tray-tracking.test.tsx src/order-tray-section.test.tsx src/order-tray-web-tracking.test.tsx src/order-tray-parity.test.ts"
    run "rg -n 'useOrderTrayTracking|createOrderTrayFns' packages/shc-ui/src/order-tray-tracking.tsx packages/shc-ui/src/order-tray-screen.tsx apps/web/lib/order-tray-section-web.tsx"
    ;;
  simplicity)
    run "FAMILY_VALUES_SCRATCH=$OUT node scripts/fv-e2e-preflight.mjs"
    run "rg -n 'OrderTrackingTraySection|submitReview' 'apps/mobile-customer/app/(customer)/orders/[id].tsx' packages/shc-ui/src/order-tray-screen.tsx"
    ;;
  fluidity)
    run "FAMILY_VALUES_SCRATCH=$OUT pnpm --filter @shc/ui exec vitest run src/family-values-morph-evidence.test.ts"
    run "node -e \"const m=require('$OUT/morph-flow.json'); console.log(JSON.stringify({clickY:m.clickDishImage.y,continuity:m.continuity.ok}))\""
    ;;
  delight-web)
    run "pnpm --filter web typecheck"
    run "rg -n 'OrderTrackingTraySectionWeb|useOrderTrayTracking' apps/web/app/orders/[id]/page.tsx apps/web/lib/order-tray-section-web.tsx"
    run "rg -n 'const trayFns|openOrderReviewTray' apps/web/app/orders/[id]/page.tsx && exit 1 || echo 'web page: no duplicate trayFns'"
    ;;
  docs-tests)
    run "rg -n 'review-success-tray|dispute-success-tray|submit-review-btn' apps/mobile-customer/e2e/order-tray.yaml"
    run "test -f $OUT/tray-flow-maestro-order-clean.log && rg FAILED $OUT/tray-flow-maestro-order-clean.log && exit 1 || echo 'maestro clean: no FAILED'"
    run "rg -n 'spawn_tool: spawn_subagent' scripts/fv-subagent-run.sh"
    ;;
  *)
    echo "unknown cluster: $CLUSTER" | tee -a "$LOG"
    exit 1
    ;;
esac

echo "" | tee -a "$LOG"
echo "cluster-${CLUSTER}: capture complete" | tee -a "$LOG"
echo "Wrote $LOG"