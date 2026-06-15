#!/bin/sh
set -e

export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import tsx"
MEDUSA_BIN="./node_modules/.bin/medusa"

echo "[shc-medusa] Running database migrations..."
"$MEDUSA_BIN" db:migrate

echo "[shc-medusa] Ensuring admin user (idempotent)..."
"$MEDUSA_BIN" user -e admin@shc.local -p supersecret 2>/dev/null || true

if [ "$RAILWAY_RUN_SEED" = "true" ]; then
  echo "[shc-medusa] Seeding demo data (RAILWAY_RUN_SEED=true)..."
  node --import tsx ./scripts/seed.ts || echo "[shc-medusa] Seed skipped or partial — check logs"
fi

echo "[shc-medusa] Starting API on port ${PORT:-9000}..."
exec "$MEDUSA_BIN" start