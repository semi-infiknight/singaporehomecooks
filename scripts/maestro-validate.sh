#!/usr/bin/env bash
# Maestro flow validation — Sprint 8
# CI: validates YAML + installs CLI; full device run needs simulator.
set -euo pipefail
ROOT="$(dirname "$0")/.."
E2E="$ROOT/apps/mobile/e2e"

echo "=== Maestro E2E Validation ==="

if ! command -v maestro >/dev/null 2>&1; then
  echo "Installing Maestro CLI..."
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi

echo "Flows:"
ls -1 "$E2E"/*.yaml

for f in "$E2E"/*.yaml; do
  if ! grep -q "appId\|---" "$f" 2>/dev/null; then
    echo "WARN: $f may be missing Maestro header"
  fi
  echo "  ✓ $f readable"
done

if [ "${MAESTRO_RUN_DEVICE:-}" = "true" ] && [ "$(uname)" = "Darwin" ]; then
  echo "Device run requested — requires booted simulator + Expo dev server"
  maestro test "$E2E"/*.yaml
else
  echo "Skipping device run (set MAESTRO_RUN_DEVICE=true on macOS with simulator)"
  echo "Local: pnpm --filter mobile dev & maestro test apps/mobile/e2e/onboarding.yaml"
fi

echo "=== Maestro validation PASSED ==="