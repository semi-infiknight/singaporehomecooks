#!/usr/bin/env bash
# Customer app: iOS production build + TestFlight submit.
# MANUAL ONLY — run when you want to ship: bash scripts/eas-customer-testflight.sh
# Submit profile (eas.json) assigns to internal TestFlight group "SHC".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile-customer"

if [ -z "${EXPO_TOKEN:-}" ] && [ -n "${EXPO_ACCESS:-}" ]; then
  export EXPO_TOKEN="$EXPO_ACCESS"
fi

EAS="pnpm dlx eas-cli@21.0.2"

if ! $EAS whoami >/dev/null 2>&1; then
  echo "Log in first: export EXPO_TOKEN=... or pnpm dlx eas-cli login"
  exit 1
fi

echo "=== Pre-flight guards ==="
bash "$ROOT/scripts/verify-mobile-deps.sh"
bash "$ROOT/scripts/verify-mobile-bundles.sh"

echo "=== Customer iOS production build ==="
CI=1 $EAS build --profile production --platform ios --non-interactive --wait

echo ""
echo "=== Submit to TestFlight (group from eas.json: Team (Expo)) ==="
CI=1 $EAS submit --platform ios --profile production --latest --non-interactive --wait

echo ""
echo "Done. Tester: mathurshubhang2002@gmail.com (Team (Expo) internal group)."
echo "https://appstoreconnect.apple.com/apps/6783204699/testflight/ios"
