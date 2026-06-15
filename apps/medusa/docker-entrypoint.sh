#!/bin/sh
set -e

echo "[shc-medusa] Running database migrations..."
pnpm exec medusa db:migrate

if [ "$RAILWAY_RUN_SEED" = "true" ]; then
  echo "[shc-medusa] Seeding demo data (RAILWAY_RUN_SEED=true)..."
  pnpm exec node ./dist/scripts/seed.js || echo "[shc-medusa] Seed skipped or partial — check logs"
fi

echo "[shc-medusa] Starting API on port ${PORT:-9000}..."
exec pnpm exec medusa start