#!/bin/sh
set -e

export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import tsx"
MEDUSA_CLI="/app/node_modules/@medusajs/cli/cli.js"

echo "[shc-medusa] Running database migrations..."
node "$MEDUSA_CLI" db:migrate

if [ "$RAILWAY_RUN_SEED" = "true" ]; then
  echo "[shc-medusa] Seeding demo data (RAILWAY_RUN_SEED=true)..."
  node --import tsx ./scripts/seed.ts || echo "[shc-medusa] Seed skipped or partial — check logs"
fi

echo "[shc-medusa] Starting API on port ${PORT:-9000}..."
exec node "$MEDUSA_CLI" start