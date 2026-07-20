#!/usr/bin/env bash
# Create SHC_Lite — smaller/faster AVD for cloud VMs without KVM.
# Same API 34 image; reduced screen, RAM, sensors. Use: ANDROID_AVD=SHC_Lite
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
AVD_NAME="${1:-SHC_Lite}"
IMAGE="system-images;android-34;google_apis;x86_64"

if [ ! -d "$ANDROID_HOME/system-images/android-34/google_apis/x86_64" ]; then
  echo "Installing $IMAGE..."
  yes | sdkmanager "$IMAGE"
fi

if [ -d "$HOME/.android/avd/${AVD_NAME}.avd" ]; then
  echo "AVD $AVD_NAME already exists"
  exit 0
fi

echo "Creating $AVD_NAME (720p, 2GB RAM, minimal sensors)..."
echo no | avdmanager create avd -n "$AVD_NAME" -k "$IMAGE" -d pixel_4 --force

CFG="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"
# Lighter than SHC_Pixel (1080x2400 / 1.5GB) — less GPU + CPU work in software mode.
cat >>"$CFG" <<'EOF'
hw.lcd.width=720
hw.lcd.height=1280
hw.lcd.density=320
hw.ramSize=2048
hw.gpu.enabled=no
hw.gpu.mode=off
hw.audioInput=no
hw.audioOutput=no
hw.camera.back=none
hw.camera.front=none
hw.gps=no
hw.sensors.proximity=no
hw.sensors.magnetic_field=no
hw.sensors.orientation=no
hw.sensors.temperature=no
hw.sensors.humidity=no
hw.sensors.light=no
hw.sensors.pressure=no
hw.accelerometer=no
hw.gyroscope=no
hw.sdCard=no
showDeviceFrame=no
fastboot.forceColdBoot=yes
EOF

echo "Created $AVD_NAME — boot with: ANDROID_AVD=$AVD_NAME bash scripts/start-android-emulator.sh"
