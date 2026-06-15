#!/bin/sh
set -e

# Production: Medusa CLI loads medusa-config.js at app root; wrapper re-exports dist build
if [ -f medusa-config.prod.js ] && [ ! -f medusa-config.js ]; then
  cp medusa-config.prod.js medusa-config.js
fi

echo "[shc-medusa] Running database migrations..."
pnpm exec medusa db:migrate

if [ "$RAILWAY_RUN_SEED" = "true" ]; then
  echo "[shc-medusa] Seeding demo data (RAILWAY_RUN_SEED=true)..."
  pnpm exec tsx ./scripts/seed.ts || echo "[shc-medusa] Seed skipped or partial — check logs"
fi

echo "[shc-medusa] Starting API on port ${PORT:-9000}..."
exec pnpm exec medusa start