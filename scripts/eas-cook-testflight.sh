#!/usr/bin/env bash
# Cook app: iOS production build + TestFlight submit (non-interactive when ascAppId is set).
#
# First-time setup (once):
#   1. Enable Push on com.singaporehomecooks.cook in Apple Developer Portal:
#      https://developer.apple.com/account/resources/identifiers/bundleId/edit/UP2GVHBSNM
#   2. SHC_INITIAL_SETUP=1 node scripts/regen-ios-push-profile-cook.mjs   # if no credentials yet
#   3. node scripts/regen-ios-push-profile-cook.mjs                         # after push enabled
#   4. Create "SHC Cook" in App Store Connect, add ascAppId to eas.json submit.production.ios
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile-cook"

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

echo "=== Cook iOS production build ==="
CI=1 $EAS build --profile production --platform ios --non-interactive --wait

echo ""
echo "=== Submit to TestFlight ==="
CI=1 $EAS submit --platform ios --profile production --latest --non-interactive --wait "${GROUP_ARGS[@]}"

echo ""
echo "Uploaded to App Store Connect. Testers are NOT notified until you:"
echo "  1. Open https://appstoreconnect.apple.com/apps/6785112476/testflight/ios"
echo "  2. Wait for build Processing to finish (usually 5–15 min)"
echo "  3. Add build to Internal or External group (or enable automatic distribution)"
echo "  4. Invite testers (email must match their Apple ID)"
echo "Optional: TESTFLIGHT_GROUPS='Group Name' bash scripts/eas-cook-testflight.sh"
