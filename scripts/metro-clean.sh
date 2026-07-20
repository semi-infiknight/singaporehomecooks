#!/usr/bin/env bash
# Stop Metro daemons and delete local Metro/Expo caches (regenerated on next pnpm ios:dev).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.metro-logs"

for f in "$LOG_DIR"/Customer-8081.pid "$LOG_DIR"/Cook-8082.pid; do
  [ -f "$f" ] && kill -9 "$(cat "$f")" 2>/dev/null || true
done
lsof -ti :8081 -ti :8082 2>/dev/null | xargs kill -9 2>/dev/null || true

rm -rf \
  "$ROOT/apps/mobile-customer/.metro-cache" \
  "$ROOT/apps/mobile-cook/.metro-cache" \
  "$ROOT/apps/mobile-customer/.expo" \
  "$ROOT/apps/mobile-cook/.expo" \
  "$LOG_DIR"/*.log \
  "$LOG_DIR"/*.pid

echo "Metro/Expo caches cleared. Restart: pnpm ios:dev"
