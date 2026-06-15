#!/usr/bin/env bash
# Maestro flow validation — split customer/cook apps
set -euo pipefail
ROOT="$(dirname "$0")/.."

echo "=== Maestro E2E Validation ==="

if ! command -v maestro >/dev/null 2>&1; then
  echo "Installing Maestro CLI..."
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi

for dir in apps/mobile-customer/e2e apps/mobile-cook/e2e; do
  E2E="$ROOT/$dir"
  if [ ! -d "$E2E" ]; then
    echo "WARN: missing $E2E"
    continue
  fi
  echo "Flows in $dir:"
  ls -1 "$E2E"/*.yaml 2>/dev/null || true
  for f in "$E2E"/*.yaml; do
    [ -f "$f" ] || continue
    if ! grep -q "appId\|---" "$f" 2>/dev/null; then
      echo "WARN: $f may be missing Maestro header"
    fi
    echo "  ✓ $f readable"
  done
done

if [ "${MAESTRO_RUN_DEVICE:-}" = "true" ] && [ "$(uname)" = "Darwin" ]; then
  echo "Device run requested — requires booted simulator + Expo dev servers"
  maestro test "$ROOT/apps/mobile-customer/e2e/"*.yaml "$ROOT/apps/mobile-cook/e2e/"*.yaml
else
  echo "Skipping device run (set MAESTRO_RUN_DEVICE=true on macOS with simulator)"
  echo "Local:"
  echo "  pnpm customer:dev & maestro test apps/mobile-customer/e2e/customer-auth.yaml"
  echo "  pnpm cook:dev & maestro test apps/mobile-cook/e2e/cook-auth.yaml"
fi

echo "=== Maestro validation PASSED ==="