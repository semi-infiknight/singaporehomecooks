#!/usr/bin/env bash
# Boot Android emulator for Maestro / local APK testing.
#
# KVM (/dev/kvm): hardware-accelerated — fast, testable.
# No KVM (cloud VM): uses SHC_Lite AVD + software rendering — slower but tunable.
#
# Perf tips without KVM:
#   ANDROID_AVD=SHC_Lite bash scripts/start-android-emulator.sh
#   Use EAS preview APK (bundled JS, no Metro): scripts/eas-android-preview-install.sh
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

if [ ! -e /dev/kvm ]; then
  export ANDROID_AVD="${ANDROID_AVD:-SHC_Lite}"
  if [ ! -d "$HOME/.android/avd/${ANDROID_AVD}.avd" ]; then
    echo "Creating lightweight AVD for no-KVM host..."
    bash "$(dirname "$0")/create-android-lite-avd.sh" "$ANDROID_AVD"
  fi
else
  export ANDROID_AVD="${ANDROID_AVD:-SHC_Pixel}"
fi

AVD="$ANDROID_AVD"
LOG="${ANDROID_EMULATOR_LOG:-/tmp/shc-emulator.log}"

if adb devices 2>/dev/null | grep -qE 'emulator-[0-9]+[[:space:]]+device'; then
  echo "Emulator already running: $(adb devices | awk '/emulator/{print $1}')"
  exit 0
fi

EMU_ARGS=(-avd "$AVD" -no-window -no-audio -no-boot-anim -no-metrics -no-snapshot-save)

if [ ! -e /dev/kvm ]; then
  echo "No /dev/kvm — software mode (expect slow APK install + Maestro; use preview APK + SHC_Lite)"
  EMU_ARGS+=(-accel off -gpu swiftshader_indirect -memory 2048 -cores 2)
else
  EMU_ARGS+=(-gpu auto -memory 4096 -cores 4)
fi

echo "Starting $AVD (log: $LOG)"
nohup emulator "${EMU_ARGS[@]}" >"$LOG" 2>&1 &

echo -n "Waiting for device"
for _ in $(seq 1 120); do
  if adb devices 2>/dev/null | grep -qE 'emulator-[0-9]+[[:space:]]+device'; then
    echo ""
    break
  fi
  echo -n "."
  sleep 2
done

echo -n "Waiting for boot"
for _ in $(seq 1 120); do
  boot=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
  if [ "$boot" = "1" ]; then
    echo " complete"
    break
  fi
  echo -n "."
  sleep 3
done

if [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)" != "1" ]; then
  echo ""
  echo "ERROR: emulator did not finish boot — see $LOG"
  tail -20 "$LOG" || true
  exit 1
fi

# Reduce UI jank on slow hosts.
adb shell settings put global window_animation_scale 0 2>/dev/null || true
adb shell settings put global transition_animation_scale 0 2>/dev/null || true
adb shell settings put global animator_duration_scale 0 2>/dev/null || true

adb reverse tcp:8081 tcp:8081 || true
adb reverse tcp:8082 tcp:8082 || true
echo "Ready: $(adb devices | awk '/emulator/{print $1}')  AVD=$AVD  kvm=$([ -e /dev/kvm ] && echo yes || echo no)"
