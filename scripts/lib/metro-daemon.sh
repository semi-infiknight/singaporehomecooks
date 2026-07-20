#!/usr/bin/env bash
# Shared Metro daemon helpers — customer :8081, cook :8082, Railway API only.
# Source from start-mobile-dev.sh / reload-*-emulator.sh (do not execute directly).
set -euo pipefail

: "${ROOT:?ROOT must be set before sourcing metro-daemon.sh}"
: "${LOG_DIR:?LOG_DIR must be set before sourcing metro-daemon.sh}"

METRO_MIN_BUNDLE_BYTES="${METRO_MIN_BUNDLE_BYTES:-5000000}"

metro_slug() {
  echo "${1// /-}"
}

metro_pid_file() {
  echo "${LOG_DIR}/$(metro_slug "$1")-${2}.pid"
}

metro_log_file() {
  echo "${LOG_DIR}/$(metro_slug "$1")-${2}.log"
}

metro_kill_port() {
  local port="$1"
  lsof -ti ":${port}" 2>/dev/null | xargs kill -9 2>/dev/null || true
}

# Maestro/ios:dev kill/relaunch sim apps constantly — if React Native DevTools
# was opened once (Metro `j`, dev menu), it pops "disconnected" dialogs. Quit it.
quit_rn_devtools() {
  osascript -e 'tell application "React Native DevTools" to quit' 2>/dev/null || true
  pkill -f "React Native DevTools" 2>/dev/null || true
  pkill -f "debugger-frontend" 2>/dev/null || true
  osascript -e 'tell application "Brave Browser" to close (every window whose name contains "DevTools")' 2>/dev/null || true
  osascript -e 'tell application "Google Chrome" to close (every window whose name contains "DevTools")' 2>/dev/null || true
}

metro_stop() {
  local name="$1"
  local port="$2"
  local pid_file
  pid_file="$(metro_pid_file "$name" "$port")"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
  metro_kill_port "$port"
}

metro_status_ok() {
  local port="$1"
  curl -sf "http://127.0.0.1:${port}/status" >/dev/null 2>&1
}

metro_bundle_bytes() {
  local port="$1"
  local bundle_id="$2"
  curl -sf \
    "http://127.0.0.1:${port}/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&lazy=true&minify=false&app=${bundle_id}" \
    2>/dev/null | wc -c | tr -d ' '
}

metro_is_healthy() {
  local port="$1"
  local bundle_id="$2"
  metro_status_ok "$port" || return 1
  local bytes
  bytes="$(metro_bundle_bytes "$port" "$bundle_id")"
  [ "${bytes:-0}" -gt "$METRO_MIN_BUNDLE_BYTES" ]
}

metro_wait_healthy() {
  local port="$1"
  local bundle_id="$2"
  local name="$3"
  local attempts="${4:-120}"
  for _ in $(seq 1 "$attempts"); do
    if metro_is_healthy "$port" "$bundle_id"; then
      local bytes
      bytes="$(metro_bundle_bytes "$port" "$bundle_id")"
      echo "$name Metro healthy on :${port} (${bytes} bytes)"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: $name Metro not healthy on :${port} (see $(metro_log_file "$name" "$port"))"
  tail -30 "$(metro_log_file "$name" "$port")" 2>/dev/null || true
  return 1
}

metro_start_daemon() {
  local app_dir="$1"
  local port="$2"
  local name="$3"
  local bundle_id="$4"
  local clear_flag="${5:-}"

  local log_file pid_file
  log_file="$(metro_log_file "$name" "$port")"
  pid_file="$(metro_pid_file "$name" "$port")"
  mkdir -p "$LOG_DIR"

  if metro_is_healthy "$port" "$bundle_id"; then
    if [ "${METRO_CLEAR:-0}" = "1" ]; then
      echo "$name Metro healthy but METRO_CLEAR=1 — restarting ..."
      metro_stop "$name" "$port"
      sleep 2
    else
      echo "$name Metro already healthy on :${port}"
      return 0
    fi
  fi

  if metro_status_ok "$port"; then
    echo "WARN: $name Metro on :${port} responds but bundle is stale/broken — restarting"
    metro_stop "$name" "$port"
    sleep 2
  fi

  echo "Starting $name Metro daemon on :${port} (log: $log_file) ..."
  local inner_clear=""
  [ "$clear_flag" = "1" ] || [ "${METRO_CLEAR:-0}" = "1" ] && inner_clear="--clear"

  (
    cd "$ROOT/$app_dir"
    export RCT_METRO_PORT="$port"
    export SHC_HEADLESS_METRO=1
    export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }-r ${ROOT}/scripts/lib/metro-preload-no-devtools.js"
    unset CI
    exec npx expo start --port "$port" $inner_clear
  ) >>"$log_file" 2>&1 &
  local pid=$!
  echo "$pid" >"$pid_file"
  disown "$pid" 2>/dev/null || true

  for _ in $(seq 1 90); do
    if metro_status_ok "$port"; then
      break
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "ERROR: $name Metro process exited during startup (see $log_file)"
      tail -30 "$log_file" || true
      return 1
    fi
    sleep 1
  done

  if ! metro_status_ok "$port"; then
    echo "ERROR: $name Metro never answered on :${port} (see $log_file)"
    tail -30 "$log_file" || true
    return 1
  fi

  metro_wait_healthy "$port" "$bundle_id" "$name" 120
}

ensure_ios_simulator() {
  local sim_name="${IOS_SIMULATOR:-iPhone 16 Pro}"
  if xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
    echo "Simulator already booted"
    return 0
  fi
  echo "Booting simulator: $sim_name"
  xcrun simctl boot "$sim_name" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  for _ in $(seq 1 30); do
    xcrun simctl list devices booted 2>/dev/null | grep -q Booted && return 0
    sleep 1
  done
  echo "ERROR: No booted iOS simulator"
  return 1
}
