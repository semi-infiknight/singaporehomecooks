#!/usr/bin/env bash
# Boot SHC_Pixel AVD for Maestro / local APK testing.
# Cloud VMs without /dev/kvm use software rendering (-accel off) — slow but works.
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
AVD="${ANDROID_AVD:-SHC_Pixel}"
LOG="${ANDROID_EMULATOR_LOG:-/tmp/shc-emulator.log}"

if adb devices 2>/dev/null | grep -qE 'emulator-[0-9]+[[:space:]]+device'; then
  echo "Emulator already running: $(adb devices | awk '/emulator/{print $1}')"
  exit 0
fi

ACCEL_ARGS=()
if [ ! -e /dev/kvm ]; then
  echo "No /dev/kvm — starting with -accel off (software rendering; APK install may take several minutes)"
  ACCEL_ARGS=(-accel off -gpu swiftshader_indirect)
else
  ACCEL_ARGS=(-gpu auto)
fi

echo "Starting $AVD (log: $LOG)"
nohup emulator -avd "$AVD" -no-window -no-audio -no-boot-anim "${ACCEL_ARGS[@]}" >"$LOG" 2>&1 &

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
    adb reverse tcp:8081 tcp:8081 || true
    adb reverse tcp:8082 tcp:8082 || true
    echo "Ready: $(adb devices | awk '/emulator/{print $1}')"
    exit 0
  fi
  echo -n "."
  sleep 3
done

echo ""
echo "ERROR: emulator did not finish boot — see $LOG"
tail -20 "$LOG" || true
exit 1
