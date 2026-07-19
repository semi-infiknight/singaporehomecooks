#!/usr/bin/env bash
# Trigger EAS development Android builds for customer + cook (expo-dev-client APKs).
# Requires EXPO_TOKEN. Install on device: bash scripts/eas-android-dev-install.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EAS="npx --yes eas-cli@latest"

if [ -z "${EXPO_TOKEN:-}" ] && [ -n "${EXPO_ACCESS:-}" ]; then
  export EXPO_TOKEN="$EXPO_ACCESS"
fi
if ! $EAS whoami >/dev/null 2>&1; then
  echo "Set EXPO_TOKEN for EAS auth"
  exit 1
fi

TARGET="${1:-both}"
build_one() {
  local app_dir="$1"
  local label="$2"
  echo "=== EAS development Android: $label ==="
  (cd "$ROOT/$app_dir" && CI=1 $EAS build --platform android --profile development --non-interactive --wait)
}

case "$TARGET" in
  customer) build_one "apps/mobile-customer" "Customer" ;;
  cook) build_one "apps/mobile-cook" "Cook" ;;
  both)
    build_one "apps/mobile-customer" "Customer"
    build_one "apps/mobile-cook" "Cook"
    ;;
  *) echo "Usage: $0 [customer|cook|both]"; exit 1 ;;
esac

echo "Done. Install: bash scripts/eas-android-dev-install.sh $TARGET"
