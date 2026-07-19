#!/usr/bin/env bash
# Download latest EAS development APK for customer/cook and adb install on a running emulator.
# Use when local ./gradlew fails or you want EAS-built dev clients.
# Prereqs: EXPO_TOKEN, adb device/emulator, Metro :8081 + :8082 optional.
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

if ! adb devices 2>/dev/null | grep -qE 'emulator|device'; then
  echo "No Android emulator/device. Start SHC_Pixel (requires KVM on Linux) or plug a device."
  exit 1
fi

adb reverse tcp:8081 tcp:8081 || true
adb reverse tcp:8082 tcp:8082 || true

install_latest() {
  local app_dir="$1"
  local pkg="$2"
  local label="$3"
  echo "=== EAS development APK: $label ==="
  local art
  art=$(
    cd "$ROOT/$app_dir" && $EAS build:list --platform android --profile development --status finished --limit 1 --non-interactive --json \
      | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j[0]?.artifacts?.applicationArchiveUrl||'')}catch{}})"
  )
  if [ -z "$art" ]; then
    echo "No finished development Android build for $label. Run:"
    echo "  cd $app_dir && CI=1 $EAS build --platform android --profile development --non-interactive --wait"
    exit 1
  fi
  local apk="/tmp/shc-${pkg##*.}-dev.apk"
  echo "Downloading $art"
  curl -fsSL "$art" -o "$apk"
  adb install -r "$apk"
  adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
  echo "Installed $label ($pkg)"
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

echo "Done. Ensure Metro: bash scripts/start-mobile-dev.sh"
