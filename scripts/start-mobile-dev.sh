#!/usr/bin/env bash
# Start both Expo Metro servers (customer 8081, cook 8082). Processes survive script exit (nohup).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.metro-logs"
mkdir -p "$LOG_DIR"

start_metro() {
  local app_dir="$1"
  local port="$2"
  local name="$3"
  local log_file="${LOG_DIR}/${name// /-}-${port}.log"
  if curl -sf "http://127.0.0.1:${port}/status" >/dev/null 2>&1; then
    echo "$name Metro already running on :$port"
    return 0
  fi
  echo "Starting $name Metro on :$port (log: $log_file) ..."
  nohup bash -c "cd \"$ROOT/$app_dir\" && RCT_METRO_PORT=\"$port\" npx expo start --port \"$port\" --clear" \
    >"$log_file" 2>&1 &
  for _ in $(seq 1 90); do
    if curl -sf "http://127.0.0.1:${port}/status" >/dev/null 2>&1; then
      echo "$name Metro ready on :$port"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: $name Metro failed to start on :$port (see $log_file)"
  tail -20 "$log_file" || true
  return 1
}

start_metro "apps/mobile-customer" 8081 "Customer"
# Stagger cook Metro so customer file map finishes before cook indexes the monorepo.
sleep 3
start_metro "apps/mobile-cook" 8082 "Cook"

if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -q emulator; then
  adb reverse tcp:8081 tcp:8081 || true
  adb reverse tcp:8082 tcp:8082 || true
  echo "adb reverse configured for 8081 + 8082"
fi

echo "Mobile dev ready. Railway backend wired via each app .env.local"