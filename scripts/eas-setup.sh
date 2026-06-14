#!/usr/bin/env bash
# EAS preview build setup — Sprint 6
# Requires: Expo account (npx eas login)
set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

echo "=== Singapore Home Cooks — EAS Setup ==="
if ! command -v eas >/dev/null 2>&1; then
  echo "Installing eas-cli..."
  npm install -g eas-cli
fi

echo "Step 1: eas login (interactive)"
echo "  Run: npx eas login"

echo "Step 2: Link project (creates real projectId in app.json)"
if ! npx eas project:info >/dev/null 2>&1; then
  echo "  Run: npx eas init"
else
  echo "  ✓ EAS project already linked"
fi

echo "Step 3: Preview build (internal TestFlight / APK)"
echo "  pnpm eas:build:preview"
echo "  or: npx eas build --profile preview --platform all"

echo "Step 4: Set staging Medusa URL in eas.json preview env or EAS secrets:"
echo "  EXPO_PUBLIC_MEDUSA_BASE=https://your-medusa.up.railway.app"
echo "  EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_..."
echo "  EXPO_PUBLIC_USE_REAL_MEDUSA=true"

echo "Done. See blueprint/03-railway/03-railway.md for full launch checklist."