#!/usr/bin/env bash
# Rebuild Android debug APKs for customer (:8081) + cook (:8082) and install on a running emulator.
# Pair with: bash scripts/start-mobile-dev.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found — set ANDROID_HOME"
  exit 1
fi

if ! adb devices 2>/dev/null | grep -qE 'emulator|device$'; then
  echo "No Android device/emulator — start SHC_Pixel (or any AVD) first"
  exit 1
fi

adb reverse tcp:8081 tcp:8081 || true
adb reverse tcp:8082 tcp:8082 || true
echo "adb reverse :8081 + :8082"

build_install() {
  local app_dir="$1"
  local pkg="$2"
  local label="$3"
  echo "=== assembleDebug: $label ==="
  (cd "$ROOT/$app_dir/android" && ./gradlew assembleDebug)
  local apk
  apk=$(ls -1 "$ROOT/$app_dir/android/app/build/outputs/apk/debug/"*.apk 2>/dev/null | head -1)
  if [ -z "$apk" ]; then
    echo "ERROR: no debug APK for $label"
    exit 1
  fi
  echo "Installing $apk"
  adb install -r "$apk"
  adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
  echo "=== $label installed ($pkg) ==="
}

build_install "apps/mobile-customer" "com.singaporehomecooks.customer" "Customer"
build_install "apps/mobile-cook" "com.singaporehomecooks.cook" "Cook"

echo "Done. Metros: customer :8081, cook :8082 → Railway Medusa."
echo "If JS is blank, run: bash scripts/start-mobile-dev.sh"
