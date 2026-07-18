#!/usr/bin/env bash
# Customer app: iOS production build + TestFlight submit (non-interactive when ascAppId is set).
# After upload, assign the build to testers in App Store Connect (upload alone does not notify phones).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile-customer"

if [ -z "${EXPO_TOKEN:-}" ] && [ -n "${EXPO_ACCESS:-}" ]; then
  export EXPO_TOKEN="$EXPO_ACCESS"
fi

EAS="pnpm dlx eas-cli@21.0.2"
GROUP_ARGS=()
if [ -n "${TESTFLIGHT_GROUPS:-}" ]; then
  IFS=',' read -ra GROUPS <<< "$TESTFLIGHT_GROUPS"
  for g in "${GROUPS[@]}"; do
    GROUP_ARGS+=(--groups "$g")
  done
fi

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
echo "=== Submit to TestFlight ==="
CI=1 $EAS submit --platform ios --profile production --latest --non-interactive --wait "${GROUP_ARGS[@]}"

echo ""
echo "Uploaded to App Store Connect. Testers are NOT notified until you:"
echo "  1. Open https://appstoreconnect.apple.com/apps/6783204699/testflight/ios"
echo "  2. Wait for build Processing to finish (usually 5–15 min)"
echo "  3. Add build to Internal or External group (or enable automatic distribution)"
echo "  4. Invite testers (email must match their Apple ID)"
echo "     Internal: user must be in App Store Connect Users and Access"
echo "     External: TestFlight → External Testing → add email → assign build"
echo "Optional: TESTFLIGHT_GROUPS='Group Name' bash scripts/eas-customer-testflight.sh"
