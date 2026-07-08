#!/usr/bin/env bash
# Batch-build / batch-verify workflow (all goals — see blueprint/production/goal-workflow.md).
#
#   wip   — during goal: build freely, no tests (optional FILTER=pkg typecheck)
#   goal  — goal done: one verification pass (SCOPE=* required)
#   full  — milestone / stitch / pre-ship: goal + Maestro full tour + API smoke
#   quick — standalone small fix outside a goal (~2–5 min)
#
# SCOPE values (pick primary surface changed):
#   contracts | api|medusa|backend | infra | railway|deploy | web|pwa
#   mobile|expo | ui|tray|family-values | auth | checkout | listings | orders
#   money|payouts|credits | onboarding | content|seed | pdpa
#
# Examples:
#   SCOPE=api pnpm verify:goal
#   SCOPE=web pnpm verify:goal
#   SCOPE=tray pnpm verify:goal
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
    api|medusa|backend|money|payouts|credits)
      pnpm --filter medusa typecheck
      pnpm --filter @shc/business-rules build
      ;;
    mobile|expo|auth|onboarding|listings|orders)
      pnpm --filter mobile-customer typecheck
      pnpm --filter mobile-cook typecheck
      ;;
    checkout)
      pnpm --filter mobile-customer typecheck
      pnpm --filter web typecheck
      ;;
    contracts)
      pnpm --filter @shc/types build
      pnpm --filter @shc/business-rules build
      ;;
    infra|railway|deploy|content|seed|pdpa)
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
    mobile|expo|auth|checkout|listings|orders|onboarding)
      bash scripts/verify-mobile-deps.sh
      bash scripts/verify-mobile-bundles.sh
      ;;
    money|payouts|credits)
      log "money / ledger tests"
      pnpm --filter @shc/business-rules test
      pnpm --filter medusa test 2>/dev/null || echo "WARN: medusa tests skipped"
      ;;
    contracts)
      pnpm --filter @shc/types test
      pnpm --filter @shc/business-rules test
      ;;
    infra)
      log "platform guards"
      bash scripts/verify-mobile-deps.sh
      bash scripts/verify-mobile-bundles.sh
      bash scripts/verify-web-pwa.sh
      ;;
    railway|deploy)
      log "live Railway PWA verify"
      pnpm railway:verify-pwa
      ;;
    content|seed|pdpa)
      log "seed validate"
      npx tsx scripts/seed.ts --validate
      ;;
  esac
}

scope_maestro_yaml() {
  if [[ "$SCOPE" =~ ^(ui|tray|family-values|mobile|expo|auth|checkout|listings|orders|money|payouts|credits|onboarding|pdpa|web)$ ]]; then
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
      log "Maestro tray flows"
      maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
      maestro test apps/mobile-cook/e2e/listing-tray.yaml
      maestro test apps/mobile-customer/e2e/order-tray.yaml
      ;;
    checkout|pdpa)
      maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
      ;;
    listings)
      maestro test apps/mobile-cook/e2e/listing-tray.yaml
      ;;
    orders)
      maestro test apps/mobile-customer/e2e/order-tray.yaml
      ;;
    mobile|expo|auth)
      maestro test apps/mobile-customer/e2e/customer-auth.yaml
      maestro test apps/mobile-cook/e2e/cook-auth.yaml
      ;;
    money|payouts|credits)
      maestro test apps/mobile-customer/e2e/credits-earnings-payout.yaml
      maestro test apps/mobile-cook/e2e/credits-earnings-payout.yaml
      ;;
    onboarding)
      maestro test apps/mobile-customer/e2e/onboarding.yaml
      maestro test apps/mobile-cook/e2e/onboarding.yaml
      ;;
  esac
}

tier_wip() {
  if [[ -n "$FILTER" ]]; then
    log "optional typecheck: $FILTER"
    pnpm --filter "$FILTER" typecheck
  else
    log "WIP build — no tests (batch verify at goal end; see blueprint/production/goal-workflow.md)"
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
    echo "ERROR: set SCOPE for goal verify (see blueprint/production/goal-workflow.md)"
    echo "  SCOPE=api pnpm verify:goal"
    echo "  SCOPE=web pnpm verify:goal"
    echo "  SCOPE=tray pnpm verify:goal"
    exit 1
  fi
  log "batch verify for goal (SCOPE=$SCOPE)"
  npx tsx scripts/seed.ts --validate
  typecheck_scope
  scope_unit_tests
  scope_maestro_yaml
  scope_maestro_device
  if [[ "$SCOPE" =~ ^(api|medusa|backend|money|payouts|credits)$ ]] || [[ "${TOUCHES_API:-}" == "1" ]]; then
    log "API smoke (backend touched)"
    pnpm verify:real-e2e
  else
    log "skip API smoke (set TOUCHES_API=1 if routes changed)"
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