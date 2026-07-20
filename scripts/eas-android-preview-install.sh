#!/usr/bin/env bash
# Install EAS preview APKs (bundled JS — no Metro needed). Best for Maestro on slow emulators.
# Prereqs: EXPO_TOKEN, running emulator/device.
# Build first: cd apps/mobile-customer && eas build --profile preview --platform android
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH:$HOME/.maestro/bin"
EAS="npx --yes eas-cli@latest"

if [ -z "${EXPO_TOKEN:-}" ] && [ -n "${EXPO_ACCESS:-}" ]; then
  export EXPO_TOKEN="$EXPO_ACCESS"
fi
if ! $EAS whoami >/dev/null 2>&1; then
  echo "Set EXPO_TOKEN for EAS auth"
  exit 1
fi

boot=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
if [ "$boot" != "1" ]; then
  echo "Start emulator first: bash scripts/start-android-emulator.sh"
  exit 1
fi

install_latest() {
  local app_dir="$1"
  local pkg="$2"
  local label="$3"
  echo "=== EAS preview APK: $label ==="
  local art
  art=$(
    cd "$ROOT/$app_dir" && $EAS build:list --platform android --profile preview --status finished --limit 1 --non-interactive --json \
      | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j[0]?.artifacts?.applicationArchiveUrl||'')}catch{}})"
  )
  if [ -z "$art" ]; then
    echo "No finished preview Android build for $label. Run:"
    echo "  cd $app_dir && CI=1 $EAS build --platform android --profile preview --non-interactive --wait"
    exit 1
  fi
  local apk="/tmp/shc-${pkg##*.}-preview.apk"
  echo "Downloading $art"
  curl -fsSL "$art" -o "$apk"
  adb uninstall "$pkg" >/dev/null 2>&1 || true
  adb install -r "$apk"
  echo "Installed $label ($pkg) — no Metro required"
}

TARGET="${1:-both}"
case "$TARGET" in
  customer) install_latest "apps/mobile-customer" "com.singaporehomecooks.customer" "Customer" ;;
  cook) install_latest "apps/mobile-cook" "com.singaporehomecooks.cook" "Cook" ;;
  both)
    install_latest "apps/mobile-customer" "com.singaporehomecooks.customer" "Customer"
    install_latest "apps/mobile-cook" "com.singaporehomecooks.cook" "Cook"
    ;;
  *) echo "Usage: $0 [customer|cook|both]"; exit 1 ;;
esac

echo "Done. Run Maestro without Metro: maestro test apps/mobile-customer/e2e/customer-auth.yaml"
