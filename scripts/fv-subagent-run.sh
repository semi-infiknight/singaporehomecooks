#!/usr/bin/env bash
# Cluster review — subagent runs this script; stdout is the verbatim transcript.
set -euo pipefail
CLUSTER="${1:?usage: fv-subagent-run.sh <foundation|simplicity|fluidity|delight-web|docs-tests>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${FAMILY_VALUES_SCRATCH:-$ROOT}"
LOG="$OUT/cluster-${CLUSTER}-subagent-raw.txt"
mkdir -p "$OUT"

{
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
    run "pnpm --filter @shc/ui exec vitest run src/family-values-tray-integration.test.tsx"
    run "rg -n 'SHCOrderReviewTrayContent|useMutation' packages/shc-ui/src/order-tray-content.tsx packages/shc-ui/src/family-values-tray-integration.test.tsx"
    ;;
  simplicity)
    run "FAMILY_VALUES_SCRATCH=$OUT node scripts/fv-e2e-preflight.mjs"
    run "rg -n 'submitReviewFn|SHCOrderReviewTrayContent' 'apps/mobile-customer/app/(customer)/orders/[id].tsx'"
    ;;
  fluidity)
    run "FAMILY_VALUES_SCRATCH=$OUT pnpm --filter @shc/ui exec vitest run src/family-values-morph-evidence.test.ts"
    run "node -e \"const m=require('$OUT/morph-flow.json'); console.log(JSON.stringify({clickY:m.clickDishImage.y,continuity:m.continuity.ok}))\""
    ;;
  delight-web)
    run "pnpm --filter web typecheck"
    run "rg -n 'maestroE2e|SHCTrayProviderWeb' 'apps/web/app/orders/[id]/page.tsx' apps/web/app/components/SHCWebComponents.tsx | head -20"
    ;;
  docs-tests)
    run "ls -la $OUT/tray-flow-maestro-*.log"
    run "rg FAILED $OUT/tray-flow-maestro-order.log || echo 'order-tray: no FAILED'"
    run "rg -n 'subagent-raw' scripts/fv-cluster-review.sh"
    ;;
  *)
    echo "unknown cluster: $CLUSTER" | tee -a "$LOG"
    exit 1
    ;;
esac

echo "" | tee -a "$LOG"
echo "cluster-${CLUSTER}: capture complete" | tee -a "$LOG"
echo "Wrote $LOG"