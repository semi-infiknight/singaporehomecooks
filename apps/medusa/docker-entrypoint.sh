#!/bin/sh
set -e

# Production Node cannot load .ts — activate compiled JS from dist/ (image build keeps .ts for medusa build)
if [ -d dist/src ]; then
  echo "[shc-medusa] Activating compiled sources from dist/..."
  for dir in api lib links modules subscribers utils workflows; do
    if [ -d "dist/src/$dir" ]; then
      rm -rf "src/$dir"
      cp -a "dist/src/$dir" "src/$dir"
    fi
  done
  cp dist/medusa-config.js medusa-config.js
fi

echo "[shc-medusa] Running database migrations..."
pnpm exec medusa db:migrate

if [ "$RAILWAY_RUN_SEED" = "true" ]; then
  echo "[shc-medusa] Seeding demo data (RAILWAY_RUN_SEED=true)..."
  pnpm exec tsx ./scripts/seed.ts || echo "[shc-medusa] Seed skipped or partial — check logs"
fi

echo "[shc-medusa] Starting API on port ${PORT:-9000}..."
exec pnpm exec medusa start