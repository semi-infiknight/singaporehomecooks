#!/usr/bin/env bash
# Export iOS JS bundles and assert size > 5MB (catches broken ~125KB Metro entry regressions).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIN_BYTES=5000000
FAIL=0

export_and_check() {
  local app_dir="$1"
  local name="$2"
  local out_dir
  out_dir=$(mktemp -d)
  echo "=== Export iOS bundle: $name ==="
  (
    cd "$ROOT/$app_dir"
    rm -rf dist
    # Use workspace Expo CLI — bare `npx expo` can download a newer major (e.g. 57) and break export.
    pnpm exec expo export --platform ios --output-dir "$out_dir" >/dev/null
  ) || {
    echo "FAIL: $name expo export --platform ios failed"
    FAIL=1
    rm -rf "$out_dir"
    return 1
  }

  local bundle
  bundle=$(find "$out_dir" -type f \( -name '*.js' -o -name '*.hbc' -o -name '*.bundle' \) \
    ! -name 'metadata.json' 2>/dev/null | head -1)
  if [ -z "$bundle" ]; then
    echo "FAIL: $name export produced no JS bundle under $out_dir"
    find "$out_dir" -type f | head -20
    FAIL=1
    rm -rf "$out_dir"
    return 1
  fi

  local bytes
  bytes=$(wc -c < "$bundle" | tr -d ' ')
  if [ "${bytes:-0}" -lt "$MIN_BYTES" ]; then
    echo "FAIL: $name bundle too small (${bytes} bytes) — TestFlight would crash"
    FAIL=1
  else
    echo "OK: $name bundle ${bytes} bytes ($(basename "$bundle"))"
  fi
  rm -rf "$out_dir"
}

export_and_check "apps/mobile-customer" "Customer" || true
export_and_check "apps/mobile-cook" "Cook" || true

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "BUNDLE GUARD FAILED"
  exit 1
fi

echo ""
echo "BUNDLE GUARD PASSED"