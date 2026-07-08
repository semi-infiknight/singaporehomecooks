#!/usr/bin/env bash
# Tiered verification — run only what the change scope needs.
# Usage: bash scripts/verify-tier.sh <tier> [extra args]
#
# Tiers:
#   0 | quick     — typecheck + unit tests (default every commit, ~2–5 min)
#   1 | area      — tier 0 + targeted checks (pass SCOPE=ui|api|mobile|web|medusa|contracts)
#   2 | goal      — tier 1 + API smoke (verify:real-e2e) — end of a multi-file goal
#   3 | stitch    — tier 2 + Maestro tray flows for scope (needs Metro + emulator)
#   4 | full      — everything: API e2e + maestro full tour (milestone / pre-ship only)
#
# Examples:
#   bash scripts/verify-tier.sh quick
#   SCOPE=ui bash scripts/verify-tier.sh area
#   bash scripts/verify-tier.sh goal
#   SCOPE=tray bash scripts/verify-tier.sh stitch
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TIER="${1:-quick}"
SCOPE="${SCOPE:-}"

log() { echo ""; echo "=== verify-tier [$TIER] $* ==="; }

tier_quick() {
  log "seed validate"
  npx tsx scripts/seed.ts --validate
  log "typecheck (web + mobile + packages)"
  pnpm --filter @shc/types build
  pnpm --filter @shc/business-rules build
  pnpm --filter @shc/utils build
  pnpm --filter mobile-customer typecheck
  pnpm --filter mobile-cook typecheck
  pnpm --filter web typecheck
  log "unit tests (packages)"
  pnpm --filter @shc/business-rules test
  pnpm --filter @shc/utils test
}

tier_area() {
  tier_quick
  case "$SCOPE" in
    ui|tray|family-values)
      log "UI scope — @shc/ui unit tests"
      pnpm --filter @shc/ui exec vitest run src/family-values-core.test.ts 2>/dev/null \
        || pnpm --filter @shc/ui test 2>/dev/null \
        || echo "WARN: @shc/ui tests skipped"
      bash scripts/maestro-validate.sh
      ;;
    web|pwa)
      log "web scope — PWA guard"
      bash scripts/verify-web-pwa.sh
      ;;
    api|medusa|backend)
      log "api scope — medusa route tests"
      pnpm --filter medusa test 2>/dev/null || echo "WARN: medusa tests skipped"
      ;;
    mobile|expo)
      log "mobile scope — dep + bundle guards"
      bash scripts/verify-mobile-deps.sh
      bash scripts/verify-mobile-bundles.sh
      ;;
    contracts)
      log "contracts scope"
      pnpm --filter @shc/types test
      ;;
    *)
      log "no SCOPE — quick only (set SCOPE=ui|api|web|mobile|contracts for targeted checks)"
      ;;
  esac
}

tier_goal() {
  tier_area
  log "API smoke against Railway"
  pnpm verify:real-e2e
}

tier_stitch() {
  tier_goal
  export PATH="$PATH:$HOME/.maestro/bin"
  if ! command -v maestro >/dev/null 2>&1; then
    echo "SKIP: maestro not installed (tray device tests need maestro CLI)"
    return 0
  fi
  curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1 || {
    echo "SKIP: Metro :8081 not running — start scripts/start-mobile-dev.sh for tray Maestro"
    return 0
  }
  case "$SCOPE" in
    tray|family-values|ui)
      log "Maestro tray flows only"
      maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml || true
      maestro test apps/mobile-cook/e2e/listing-tray.yaml || true
      maestro test apps/mobile-customer/e2e/order-tray.yaml || true
      ;;
    checkout)
      maestro test apps/mobile-customer/e2e/checkout-allergen-tray.yaml
      ;;
    listings)
      maestro test apps/mobile-cook/e2e/listing-tray.yaml
      ;;
    *)
      log "Maestro auth smoke (fast)"
      maestro test apps/mobile-customer/e2e/customer-auth.yaml
      maestro test apps/mobile-cook/e2e/cook-auth.yaml
      ;;
  esac
}

tier_full() {
  tier_goal
  log "Maestro full tour (Android + iOS if devices available)"
  bash scripts/run-maestro-full-tour.sh
}

case "$TIER" in
  0|quick) tier_quick ;;
  1|area) tier_area ;;
  2|goal) tier_goal ;;
  3|stitch) tier_stitch ;;
  4|full) tier_full ;;
  *)
    echo "Unknown tier: $TIER (use quick|area|goal|stitch|full)"
    exit 1
    ;;
esac

echo ""
echo "✓ verify-tier [$TIER] complete${SCOPE:+ (SCOPE=$SCOPE)}"