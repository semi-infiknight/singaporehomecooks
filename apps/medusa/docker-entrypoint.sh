#!/bin/sh
set -e

export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import tsx"
MEDUSA_BIN="./node_modules/.bin/medusa"

echo "[shc-medusa] Running database migrations..."
"$MEDUSA_BIN" db:migrate

echo "[shc-medusa] Ensuring admin user (idempotent)..."
"$MEDUSA_BIN" user -e admin@shc.local -p supersecret 2>/dev/null || true

# Single idempotent seed for the whole SHC demo DB (cooks, dishes, growth, tiffin, …).
# Opt out only with RAILWAY_SKIP_SEED=true (e.g. future locked prod data).
# RAILWAY_RUN_SEED=true is obsolete — seed is the normal path, not a special flag.
if [ "$RAILWAY_SKIP_SEED" = "true" ]; then
  echo "[shc-medusa] Skipping seed (RAILWAY_SKIP_SEED=true)"
else
  echo "[shc-medusa] Seeding demo data (idempotent — includes tiffin kitchen config)..."
  node --import tsx ./scripts/seed.ts || echo "[shc-medusa] Seed skipped or partial — check logs"
fi

echo "[shc-medusa] Starting API on port ${PORT:-9000}..."
exec "$MEDUSA_BIN" start
