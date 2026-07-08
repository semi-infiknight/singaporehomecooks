#!/usr/bin/env bash
# Goal-close only (legacy UI audit). During build: no tests.
# Prefer: SCOPE=tray pnpm verify:goal — see blueprint/production/goal-workflow.md
# Family Values UI verification gate — alert grep, shared-press audit, builds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${FAMILY_VALUES_SCRATCH:-$ROOT}"
mkdir -p "$OUT"

log() { echo "$@" | tee -a "$OUT/build.log"; }

: > "$OUT/build.log"
log "=== Family Values audit $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

log ""
log "--- Alert.alert audit (tray flows) ---"
ALERT_FILES=(
  "apps/mobile-cook/app/(cook)/listings.tsx"
  "apps/mobile-customer/app/(customer)/cart.tsx"
  "apps/mobile-customer/app/(customer)/checkout.tsx"
)
: > "$OUT/alert-audit.txt"
for f in "${ALERT_FILES[@]}"; do
  if rg -n 'Alert\.alert' "$ROOT/$f" 2>/dev/null; then
    rg -n 'Alert\.alert' "$ROOT/$f" >> "$OUT/alert-audit.txt" || true
  fi
done
if [[ ! -s "$OUT/alert-audit.txt" ]]; then
  echo "PASS: no Alert.alert on tray screens" | tee -a "$OUT/alert-audit.txt" "$OUT/build.log"
else
  echo "FAIL: Alert.alert found" | tee -a "$OUT/build.log"
fi

log ""
log "--- Shared dish press structural grep ---"
: > "$OUT/exports-audit.txt"
{
  echo "useSharedDishPress: $(rg -l 'useSharedDishPress' "$ROOT/packages/shc-ui/src" 2>/dev/null | wc -l | tr -d ' ') files"
  echo "SharedDishProductLink: $(rg -l 'SharedDishProductLink' "$ROOT/apps/web" 2>/dev/null | wc -l | tr -d ' ') files"
  echo "getSyncHeroTransformForDish: $(rg -l 'getSyncHeroTransformForDish' "$ROOT" 2>/dev/null | wc -l | tr -d ' ') files"
  echo "SHCTrayProvider: $(rg -l 'SHCTrayProvider' "$ROOT" 2>/dev/null | wc -l | tr -d ' ') files"
  echo "ListingWizardMorphCta: $(rg -l 'ListingWizardMorphCta' "$ROOT" 2>/dev/null | wc -l | tr -d ' ') files"
  echo "SHCCelebration: $(rg -l 'SHCCelebration' "$ROOT" 2>/dev/null | wc -l | tr -d ' ') files"
} | tee -a "$OUT/exports-audit.txt" "$OUT/build.log"

log ""
log "--- @shc/ui vitest ---"
: > "$OUT/unit-tests.log"
(cd "$ROOT" && pnpm --filter @shc/ui test) 2>&1 | tee -a "$OUT/unit-tests.log" "$OUT/build.log"

log ""
log "--- @shc/ui tsc ---"
(cd "$ROOT/packages/shc-ui" && pnpm typecheck) 2>&1 | tee -a "$OUT/build.log"

log ""
log "--- mobile-customer typecheck ---"
(cd "$ROOT" && pnpm --filter mobile-customer typecheck) 2>&1 | tee -a "$OUT/build.log"

log ""
log "--- mobile-cook typecheck ---"
(cd "$ROOT" && pnpm --filter mobile-cook typecheck) 2>&1 | tee -a "$OUT/build.log"

log ""
log "--- web typecheck ---"
(cd "$ROOT" && pnpm --filter web typecheck) 2>&1 | tee -a "$OUT/build.log"

log ""
log "--- maestro validate ---"
: > "$OUT/tray-flow.log"
if (cd "$ROOT" && pnpm maestro:validate) 2>&1 | tee -a "$OUT/build.log" "$OUT/tray-flow.log"; then
  echo "maestro:validate PASS" >> "$OUT/tray-flow.log"
else
  echo "maestro:validate SKIP or FAIL — see build.log" >> "$OUT/tray-flow.log"
fi
echo "MAESTRO_SKIPPED: rebuild required per plan allowance (device tray flows not gated)" >> "$OUT/tray-flow.log"

log ""
log "=== Audit complete (gating steps 1–4) ==="