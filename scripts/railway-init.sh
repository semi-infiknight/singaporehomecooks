#!/usr/bin/env bash
# One-time post-deploy setup: bootstrap publishable key + demo customer against Railway Medusa.
# Usage:
#   MEDUSA_URL=https://shc-medusa.up.railway.app ./scripts/railway-init.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MEDUSA_URL="${MEDUSA_URL:-${MEDUSA_PUBLIC_URL:-}}"
if [ -z "$MEDUSA_URL" ]; then
  echo "ERROR: Set MEDUSA_URL to your Railway Medusa public URL."
  echo "  Example: MEDUSA_URL=https://shc-medusa.up.railway.app ./scripts/railway-init.sh"
  exit 1
fi

export MEDUSA_URL
echo "=== SHC Railway init ==="
echo "Target: $MEDUSA_URL"
echo ""

node scripts/bootstrap-medusa.js

PUBKEY="$(grep -E 'EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=' apps/mobile-customer/.env.local | cut -d= -f2- || true)"

echo ""
echo "=== Railway env to copy ==="
echo "Medusa service:"
echo "  MEDUSA_PUBLIC_URL=$MEDUSA_URL"
echo "  RAILWAY_RUN_SEED=true   # set once for first deploy, then remove"
echo ""
echo "Web service (build + runtime):"
echo "  NEXT_PUBLIC_SHC_API_BASE=$MEDUSA_URL"
echo "  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PUBKEY:-<from bootstrap>}"
echo ""
echo "Mobile EAS preview:"
echo "  EXPO_PUBLIC_MEDUSA_BASE=$MEDUSA_URL"
echo "  EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PUBKEY:-<from bootstrap>}"
echo ""
echo "Optional CORS (if auto-detection is not enough):"
echo "  STORE_CORS=$MEDUSA_URL,<web-url>,http://localhost:8081"
echo "  AUTH_CORS=$MEDUSA_URL,<web-url>,http://localhost:8081,http://localhost:8082"
echo ""
echo "Done. See RAILWAY_DEPLOY.md for full topology."