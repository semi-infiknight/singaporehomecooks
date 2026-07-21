#!/usr/bin/env bash
# Canonical CI entry — GitHub Actions and `pnpm verify:ci` must use ONLY this script.
# Prevents drift between parallel jobs (rg vs grep, missing @shc/types build, stale turbo filters).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TURBO_EXCLUDE=(--filter=!mobile-cook --filter=!mobile-customer)

run_config() {
  bash scripts/verify-ci-config.sh
}

run_build_test_typecheck() {
  run_config
  pnpm turbo build "${TURBO_EXCLUDE[@]}"
  pnpm turbo test "${TURBO_EXCLUDE[@]}"
  pnpm turbo typecheck "${TURBO_EXCLUDE[@]}"
  pnpm turbo lint --filter=web --filter=medusa --filter=mobile-customer --filter=mobile-cook || true
  npx tsx scripts/seed.ts --validate
  echo "=== @shc/ui build (vitest) ==="
  pnpm --filter @shc/ui build
  echo "=== Typecheck (mobile + web) ==="
  pnpm --filter mobile-customer typecheck
  pnpm --filter mobile-cook typecheck
  pnpm --filter web typecheck
  echo "=== build-test-typecheck PASSED ==="
}

run_mobile_ios_guard() {
  run_config
  bash scripts/verify-mobile-deps.sh
  bash scripts/verify-mobile-bundles.sh
  echo "=== mobile-ios-guard PASSED ==="
}

run_web_pwa_guard() {
  run_config
  bash scripts/verify-web-pwa.sh
  echo "=== web-pwa-guard PASSED ==="
}

run_all() {
  run_build_test_typecheck
  echo ""
  echo "=== mobile-ios-guard (verify:ci) ==="
  bash scripts/verify-mobile-deps.sh
  bash scripts/verify-mobile-bundles.sh
  echo ""
  echo "=== web-pwa-guard (verify:ci) ==="
  bash scripts/verify-web-pwa.sh
  echo ""
  echo "=== verify:ci / ci-gate all PASSED ==="
}

usage() {
  echo "Usage: $0 {config|build-test-typecheck|mobile-ios-guard|web-pwa-guard|all}"
  echo "  GitHub Actions jobs call one target each. Local full mirror: pnpm verify:ci"
  exit 1
}

case "${1:-}" in
  config) run_config ;;
  build-test-typecheck) run_build_test_typecheck ;;
  mobile-ios-guard) run_mobile_ios_guard ;;
  web-pwa-guard) run_web_pwa_guard ;;
  all) run_all ;;
  *) usage ;;
esac
