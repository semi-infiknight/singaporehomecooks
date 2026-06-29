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

if ! pnpm dlx eas-cli whoami >/dev/null 2>&1; then
  echo "Log in first: pnpm dlx eas-cli login"
  exit 1
fi

echo "=== Cook iOS production build ==="
CI=1 pnpm dlx eas-cli build --profile production --platform ios --non-interactive --wait

echo ""
echo "=== Submit to TestFlight ==="
CI=1 pnpm dlx eas-cli submit --platform ios --profile production --latest --non-interactive --wait

echo ""
echo "Open TestFlight in App Store Connect (ascAppId must be set in eas.json after first app create)."
