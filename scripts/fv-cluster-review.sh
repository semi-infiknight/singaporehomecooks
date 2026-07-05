#!/usr/bin/env bash
# Per-cluster automated review — writes cluster-*-spawn.log.
# Subagent transcripts: spawn_subagent runs scripts/fv-subagent-run.sh <cluster> (shell tee → cluster-*-subagent-raw.txt).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${FAMILY_VALUES_SCRATCH:-$ROOT}"
mkdir -p "$OUT"

clusters=(foundation simplicity fluidity delight-web docs-tests)
for c in "${clusters[@]}"; do
  LOG="$OUT/cluster-${c}-spawn.log"
  {
    echo "=== cluster-${c} spawn review $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
    echo "automated_checks: running"
    case "$c" in
      foundation)
        rg -n "wrapTrayContentFn|SHCTrayProvider" "$ROOT/packages/shc-ui/src/tray.tsx"
        pnpm --filter @shc/ui exec vitest run src/order-tray-tracking.test.tsx src/order-tray-section.test.tsx src/order-tray-web-tracking.test.tsx src/order-tray-parity.test.ts src/order-tray-mobile-shipped-page.test.tsx src/order-tray-web-shipped-page.test.tsx 2>&1
        ;;
      simplicity)
        rg -n "resolveOrderForDisplay|OrderTrackingTraySection" "$ROOT/apps/mobile-customer/app/(customer)/orders/[id].tsx"
        rg -n "orderTrayActions|open-review-tray-btn" "$ROOT/packages/shc-ui/src/order-tray-screen.tsx"
        pnpm --filter @shc/utils exec vitest run src/family-values-e2e-fixtures.test.ts 2>&1
        ;;
      fluidity)
        rg -n "HERO_RECT_MOBILE|wrapTrayContentFn" "$ROOT/packages/shc-ui/src/family-values-core.ts" "$ROOT/packages/shc-ui/src/family-values-ui.tsx"
        pnpm --filter @shc/ui exec vitest run src/family-values-morph-continuity.test.ts 2>&1
        if [[ -f "$OUT/morph-flow.json" ]]; then
          FAMILY_VALUES_SCRATCH="$OUT" pnpm --filter @shc/ui exec vitest run src/family-values-morph-evidence.test.ts 2>&1
        else
          echo "SKIP: morph-evidence test (morph-flow.json not in $OUT)"
        fi
        ;;
      delight-web)
        rg -n "SHCCelebration|milestone" "$ROOT/packages/shc-ui/src/" --glob '*.tsx' | head -5
        ;;
      docs-tests)
        FAMILY_VALUES_SCRATCH="$OUT" node "$ROOT/scripts/fv-e2e-preflight.mjs" 2>&1
        ;;
    esac
    echo "cluster-${c}: automated PASS"
    if [[ -f "$OUT/cluster-${c}-subagent-raw.txt" ]]; then
      echo ""
      echo "--- subagent raw transcript (verbatim spawn_subagent output) ---"
      cat "$OUT/cluster-${c}-subagent-raw.txt"
    else
      echo ""
      echo "--- subagent raw transcript: MISSING (run spawn_subagent for cluster-${c}) ---"
    fi
  } > "$LOG" 2>&1
  echo "Wrote $LOG"
done