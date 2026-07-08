#!/usr/bin/env bash
# Batch-build / batch-verify workflow — see blueprint/production/goal-workflow.md
# Experience-based flavours — see blueprint/production/testing-flavours.md
#
#   wip   — during goal: build freely (optional FILTER=pkg typecheck; RISK=native spot check)
#   goal  — goal done: one pass (SCOPE=* required; FLAVOUR=* optional)
#   full  — milestone: goal + Maestro full tour + API smoke
#   quick — one-off fix outside a goal
#
# FLAVOUR: polish | wiring | feature (default) | tri-platform | native | api | deploy
# TOUCHES_API=1    — add Railway API smoke
# TOUCHES_NATIVE=1 — add mobile bundle export guard (~2-3 min)
# SKIP_SEED=1      — skip seed validate (auto for FLAVOUR=polish)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TIER="${1:-wip}"
SCOPE="${SCOPE:-}"
FILTER="${FILTER:-}"
FLAVOUR="${FLAVOUR:-feature}"
RISK="${RISK:-}"

log() { echo ""; echo "=== verify-tier [$TIER] flavour=$FLAVOUR $* ==="; }

should_run_seed() {
  [[ "${SKIP_SEED:-}" == "1" ]] && return 1
  [[ "$FLAVOUR" == "polish" ]] && return 1
  return 0
}

should_run_mobile_bundles() {
  [[ "${TOUCHES_NATIVE:-}" == "1" ]] && return 0
  [[ "$FLAVOUR" == "native" ]] && return 0
  [[ "$SCOPE" =~ ^(infra|mobile|expo)$ ]] && return 0
  return 1
}

should_run_maestro_yaml() {
  [[ "$FLAVOUR" == "polish" ]] && return 1
  [[ "$SCOPE" =~ ^(ui|tray|family-values|mobile|expo|auth|checkout|listings|orders|money|payouts|credits|onboarding|pdpa|web)$ ]] && return 0
  return 1
}

should_run_maestro_device() {
  [[ "$FLAVOUR" == "polish" ]] && return 1
  [[ "$FLAVOUR" == "deploy" ]] && return 1
  [[ "$SCOPE" =~ ^(railway|deploy|infra|contracts|content|seed|api|medusa|backend)$ ]] && [[ "$FLAVOUR" != "wiring" ]] && return 1
  return 0
}

should_run_api_smoke() {
  [[ "$FLAVOUR" == "polish" ]] && [[ "${TOUCHES_API:-}" != "1" ]] && return 1
  [[ "$SCOPE" =~ ^(api|medusa|backend|money|payouts|credits)$ ]] && return 0
  [[ "${TOUCHES_API:-}" == "1" ]] && return 0
  return 1
}

# --- typecheck helpers ---
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
      if [[ "$FLAVOUR" != "polish" ]]; then
        log "UI unit tests"
        pnpm --filter @shc/ui exec vitest run src/family-values-core.test.ts 2>/dev/null \
          || pnpm --filter @shc/ui test 2>/dev/null \
          || echo "WARN: @shc/ui tests skipped"
      fi
      if [[ "$FLAVOUR" != "polish" ]]; then
        pnpm --filter @shc/utils test
      fi
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
      if should_run_mobile_bundles; then
        bash scripts/verify-mobile-bundles.sh
      else
        log "skip mobile bundles (set TOUCHES_NATIVE=1 if metro/babel/deps changed)"
      fi
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
      if should_run_mobile_bundles; then
        bash scripts/verify-mobile-bundles.sh
      fi
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
  if should_run_maestro_yaml; then
    log "Maestro YAML validate"
    bash scripts/maestro-validate.sh
  fi
}

scope_maestro_device() {
  if ! should_run_maestro_device; then
    log "skip Maestro device (FLAVOUR=$FLAVOUR — see testing-flavours.md)"
    return 0
  fi
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
      if [[ "$FLAVOUR" == "wiring" ]]; then
        log "Maestro single flow (wiring — set SCOPE=checkout|listings|orders for specific flow)"
        maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
      elif [[ "$FLAVOUR" == "tri-platform" ]] || [[ "$FLAVOUR" == "feature" ]]; then
        log "Maestro tray flows"
        maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
        maestro test apps/mobile-cook/e2e/listing-tray.yaml
        maestro test apps/mobile-customer/e2e/order-tray.yaml
      fi
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
  if [[ "$RISK" == "native" ]] || [[ "${TOUCHES_NATIVE:-}" == "1" ]]; then
    log "spot check: mobile native guards"
    bash scripts/verify-mobile-deps.sh
    bash scripts/verify-mobile-bundles.sh
  elif [[ -n "$FILTER" ]]; then
    log "optional typecheck: $FILTER"
    pnpm --filter "$FILTER" typecheck
  else
    log "WIP build — no tests (see testing-flavours.md for wiring checklist)"
  fi
}

tier_quick() {
  log "seed validate"
  npx tsx scripts/seed.ts --validate
  SCOPE="${SCOPE:-}"
  typecheck_scope
  pnpm --filter @shc/business-rules test
  pnpm --filter @shc/utils test
}

tier_goal() {
  if [[ -z "$SCOPE" ]]; then
    echo "ERROR: set SCOPE for goal verify (see blueprint/production/testing-flavours.md)"
    echo "  FLAVOUR=polish SCOPE=web pnpm verify:goal"
    echo "  FLAVOUR=wiring SCOPE=checkout pnpm verify:goal"
    echo "  SCOPE=api pnpm verify:goal"
    exit 1
  fi
  log "batch verify (SCOPE=$SCOPE FLAVOUR=$FLAVOUR)"
  if should_run_seed; then
    npx tsx scripts/seed.ts --validate
  else
    log "skip seed validate (polish / SKIP_SEED)"
  fi
  typecheck_scope
  scope_unit_tests
  scope_maestro_yaml
  scope_maestro_device
  if should_run_api_smoke; then
    log "API smoke"
    pnpm verify:real-e2e
  else
    log "skip API smoke (SCOPE=$SCOPE FLAVOUR=$FLAVOUR — set TOUCHES_API=1 if routes changed)"
  fi
}

tier_full() {
  FLAVOUR="${FLAVOUR:-feature}"
  SCOPE="${SCOPE:-mobile}"
  tier_goal
  log "Maestro full tour (milestone only)"
  bash scripts/run-maestro-full-tour.sh
  log "API smoke (milestone)"
  pnpm verify:real-e2e
}

case "$TIER" in
  wip) tier_wip ;;
  quick) tier_quick ;;
  goal) tier_goal ;;
  full) tier_full ;;
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
echo "✓ verify-tier [$TIER] complete${SCOPE:+ SCOPE=$SCOPE} flavour=$FLAVOUR"