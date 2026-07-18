#!/usr/bin/env bash
# Customer app: iOS production build + TestFlight submit (non-interactive when ascAppId is set).
# Submit profile assigns builds to internal group "SHC" (see config/testflight.json).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile-customer"

if [ -z "${EXPO_TOKEN:-}" ] && [ -n "${EXPO_ACCESS:-}" ]; then
  export EXPO_TOKEN="$EXPO_ACCESS"
fi

EAS="pnpm dlx eas-cli@21.0.2"
export TESTFLIGHT_GROUPS="${TESTFLIGHT_GROUPS:-SHC}"

if ! $EAS whoami >/dev/null 2>&1; then
  echo "Log in first: export EXPO_TOKEN=... or pnpm dlx eas-cli login"
  exit 1
fi

echo "=== Pre-flight guards ==="
bash "$ROOT/scripts/verify-mobile-deps.sh"
bash "$ROOT/scripts/verify-mobile-bundles.sh"

echo "=== Customer iOS production build + TestFlight (group: $TESTFLIGHT_GROUPS) ==="
CI=1 $EAS build --profile production --platform ios --auto-submit --non-interactive --wait

echo ""
echo "Build submitted to TestFlight group '$TESTFLIGHT_GROUPS'."
echo "Tester email (must be in that ASC group): mathurshubhang2002@gmail.com"
echo "Manage: https://appstoreconnect.apple.com/apps/6783204699/testflight/ios"
echo "If group name is wrong, set TESTFLIGHT_GROUPS=ExactName and update eas.json submit.production.ios.groups"
