#!/usr/bin/env bash
# EAS preview build setup — customer + cook split apps
# Requires: Expo account (npx eas login)
set -euo pipefail
ROOT="$(dirname "$0")/.."

echo "=== Singapore Home Cooks — EAS Setup ==="
if ! command -v eas >/dev/null 2>&1; then
  echo "Installing eas-cli..."
  npm install -g eas-cli
fi

echo "Step 1: eas login (interactive)"
echo "  Run: npx eas login"

for app in mobile-customer mobile-cook; do
  echo ""
  echo "=== $app ==="
  cd "$ROOT/apps/$app"
  if ! npx eas project:info >/dev/null 2>&1; then
    echo "  Run: cd apps/$app && npx eas init"
  else
    echo "  ✓ EAS project already linked"
  fi
  echo "  Preview: pnpm --filter $app eas:build:preview"
  echo "  Production: pnpm --filter $app eas:build:prod"
done

echo ""
echo "Railway Medusa URL is baked into eas.json env (see config/railway-client.json)."
echo "Done. See blueprint/03-railway/03-railway.md for full launch checklist."
