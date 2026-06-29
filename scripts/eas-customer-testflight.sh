#!/usr/bin/env bash
# One-shot: configure Apple credentials (first run) + iOS production build + TestFlight submit.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile-customer"

if ! pnpm dlx eas-cli whoami >/dev/null 2>&1; then
  echo "Log in first: pnpm dlx eas-cli login"
  exit 1
fi

echo "=== Step 1: Apple credentials (interactive, first time only) ==="
echo "Choose: production profile → Set up credentials automatically → sign in with Apple ID"
pnpm dlx eas-cli credentials:configure-build -p ios -e production || true

echo ""
echo "=== Step 2: iOS production build + auto-submit to TestFlight ==="
pnpm dlx eas-cli build --profile production --platform ios --auto-submit

echo ""
echo "Done. After upload, open TestFlight in App Store Connect:"
echo "  https://appstoreconnect.apple.com/apps/6783204699/testflight/ios"
