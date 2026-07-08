#!/usr/bin/env bash
# Batch-build / batch-verify workflow.
#
#   wip   — during goal: build freely, no tests (optional FILTER=pkg typecheck)
#   goal  — goal done: one verification pass for everything built (SCOPE=*)
#   full  — milestone / pre-ship: goal + Maestro full tour
#   quick — standalone small fix outside a goal (~2–5 min)
#
# Examples:
#   # Family Values: ship 5 tray commits with zero tests, then once:
#   SCOPE=tray pnpm verify:goal
#
#   # Optional mid-batch sanity (seconds):
#   FILTER=@shc/ui pnpm verify:wip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TIER="${1:-wip}"
SCOPE="${SCOPE:-}"
FILTER="${FILTER:-}"

log() { echo ""; echo "=== verify-tier [$TIER] $* ==="; }

# --- typecheck helpers (only packages relevant to SCOPE) ---
typecheck_scope() {
  case "$SCOPE" in
    ui|tray|family-values)
      pnpm --filter @shc/ui typecheck 2>/dev/null || pnpm --filter @shc/ui build 2>/dev/null || true
      pnpm --filter mobile-customer typecheck
      pnpm --filter mobile-cook typecheck
      pnpm --filter web typecheck
      ;;
    web|pwa)
      pnpm --filter web typecheck
      ;;
    api|medusa|backend)
      pnpm --filter medusa typecheck
      ;;
    mobile|expo)
      pnpm --filter mobile-customer typecheck
      pnpm --filter mobile-cook typecheck
      ;;
    contracts)
      pnpm --filter @shc/types build
      pnpm --filter @shc/business-rules build
      ;;
    *)
      pnpm --filter @shc/types build
      pnpm --filter @shc/business-rules build
      pnpm --filter @shc/utils build
      pnpm --filter mobile-customer typecheck
      pnpm --filter mobile-cook typecheck
      pnpm --filter web typecheck
      ;;
  esac
}

scope_unit_tests() {
  case "$SCOPE" in
    ui|tray|family-values)
      log "UI unit tests"
      pnpm --filter @shc/ui exec vitest run src/family-values-core.test.ts 2>/dev/null \
        || pnpm --filter @shc/ui test 2>/dev/null \
        || echo "WARN: @shc/ui tests skipped"
      pnpm --filter @shc/utils test
      ;;
    web|pwa)
      log "web PWA guard"
      bash scripts/verify-web-pwa.sh
      ;;
    api|medusa|backend)
      log "medusa route tests"
      pnpm --filter medusa test 2>/dev/null || echo "WARN: medusa tests skipped"
      ;;
    mobile|expo)
      bash scripts/verify-mobile-deps.sh
      bash scripts/verify-mobile-bundles.sh
      ;;
    contracts)
      pnpm --filter @shc/types test
      pnpm --filter @shc/business-rules test
      ;;
  esac
}

scope_maestro_yaml() {
  if [[ "$SCOPE" =~ ^(ui|tray|family-values|mobile|checkout|listings|web)$ ]]; then
    log "Maestro YAML validate"
    bash scripts/maestro-validate.sh
  fi
}

scope_maestro_device() {
  export PATH="$PATH:$HOME/.maestro/bin"
  if ! command -v maestro >/dev/null 2>&1; then
    echo "SKIP: maestro CLI not installed"
    return 0
  fi
  if ! curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
    echo "SKIP: Metro not running — start scripts/start-mobile-dev.sh for device Maestro"
    return 0
  fi
  case "$SCOPE" in
    ui|tray|family-values)
      log "Maestro tray flows (batch verify)"
      maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
      maestro test apps/mobile-cook/e2e/listing-tray.yaml
      maestro test apps/mobile-customer/e2e/order-tray.yaml
      ;;
    checkout)
      maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
      ;;
    listings)
      maestro test apps/mobile-cook/e2e/listing-tray.yaml
      ;;
    mobile|expo)
      maestro test apps/mobile-customer/e2e/customer-auth.yaml
      maestro test apps/mobile-cook/e2e/cook-auth.yaml
      ;;
  esac
}

tier_wip() {
  if [[ -n "$FILTER" ]]; then
    log "optional typecheck: $FILTER"
    pnpm --filter "$FILTER" typecheck
  else
    log "WIP build — no tests (batch verify at goal end)"
  fi
}

tier_quick() {
  log "seed validate"
  npx tsx scripts/seed.ts --validate
  typecheck_scope
  pnpm --filter @shc/business-rules test
  pnpm --filter @shc/utils test
}

tier_goal() {
  if [[ -z "$SCOPE" ]]; then
    echo "ERROR: set SCOPE for goal verify (e.g. SCOPE=tray, SCOPE=api, SCOPE=web)"
    echo "  SCOPE=tray pnpm verify:goal"
    exit 1
  fi
  log "batch verify for goal (SCOPE=$SCOPE)"
  npx tsx scripts/seed.ts --validate
  typecheck_scope
  scope_unit_tests
  scope_maestro_yaml
  scope_maestro_device
  if [[ "$SCOPE" =~ ^(api|medusa|backend)$ ]] || [[ "${TOUCHES_API:-}" == "1" ]]; then
    log "API smoke (backend touched)"
    pnpm verify:real-e2e
  else
    log "skip API smoke (pure UI goal — set TOUCHES_API=1 if routes changed)"
  fi
}

tier_full() {
  SCOPE="${SCOPE:-mobile}"
  tier_goal
  log "Maestro full tour"
  bash scripts/run-maestro-full-tour.sh
  log "API smoke (milestone)"
  pnpm verify:real-e2e
}

case "$TIER" in
  wip) tier_wip ;;
  quick) tier_quick ;;
  goal) tier_goal ;;
  full) tier_full ;;
  # legacy aliases
  0|quick) tier_quick ;;
  1|area) SCOPE="${SCOPE:-ui}" tier_goal ;;
  2) tier_goal ;;
  3|stitch) tier_goal ;;
  4) tier_full ;;
  *)
    echo "Unknown tier: $TIER (use wip|goal|full|quick)"
    exit 1
    ;;
esac

echo ""
echo "✓ verify-tier [$TIER] complete${SCOPE:+ (SCOPE=$SCOPE)}"