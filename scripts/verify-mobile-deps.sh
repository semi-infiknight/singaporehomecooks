#!/usr/bin/env bash
# Fail if mobile-customer / mobile-cook resolve wrong RN, expo-modules-core, or global RN override.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

expect_version() {
  local app_dir="$1"
  local pkg="$2"
  local expected="$3"
  local actual
  actual=$(cd "$ROOT/$app_dir" && node -e "console.log(require('${pkg}/package.json').version)" 2>/dev/null || echo "MISSING")
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: $app_dir $pkg expected $expected, got $actual"
    FAIL=1
    return 1
  fi
  echo "OK: $app_dir $pkg $actual"
}

echo "=== Mobile dependency guard ==="

if rg -n '^[[:space:]]*react-native:[[:space:]]' "$ROOT/pnpm-workspace.yaml" \
  | rg -v 'mobile>' >/dev/null 2>&1; then
  echo "FAIL: pnpm-workspace.yaml has a global react-native override (scope to mobile> only)"
  FAIL=1
else
  echo "OK: no global react-native override in pnpm-workspace.yaml"
fi

for app in apps/mobile-customer apps/mobile-cook; do
  expect_version "$app" "react-native" "0.81.5" || true
  expect_version "$app" "expo-modules-core" "3.0.30" || true
done

if rg -q '@babel/plugin-transform-react-jsx.*\^8' "$ROOT/apps/mobile-customer/package.json" \
  || rg -q '@babel/plugin-transform-react-jsx.*\^8' "$ROOT/apps/mobile-cook/package.json"; then
  echo "FAIL: @babel/plugin-transform-react-jsx must stay on ^7.x (v8 breaks worklets bundling)"
  FAIL=1
else
  echo "OK: @babel/plugin-transform-react-jsx pinned to Babel 7"
fi

if rg -q '^apps/mobile-cook/ios/' "$ROOT/.easignore" 2>/dev/null \
  || rg -q '^apps/mobile-customer/ios/' "$ROOT/.easignore" 2>/dev/null; then
  echo "FAIL: .easignore must not exclude ios/ (bare workflow needs native projects)"
  FAIL=1
else
  echo "OK: .easignore keeps ios/ native projects"
fi

for app in apps/mobile-customer apps/mobile-cook; do
  plist=$(find "$ROOT/$app/ios" -maxdepth 2 -name Info.plist | head -1)
  if [ -z "$plist" ]; then
    echo "FAIL: $app Info.plist not found"
    FAIL=1
    continue
  fi
  if ! rg -q 'ITSAppUsesNonExemptEncryption' "$plist" 2>/dev/null \
    || ! rg -A1 'ITSAppUsesNonExemptEncryption' "$plist" | rg -q '<false/>'; then
    echo "FAIL: $app Info.plist must set ITSAppUsesNonExemptEncryption to false (export compliance)"
    FAIL=1
  else
    echo "OK: $app Info.plist export compliance (ITSAppUsesNonExemptEncryption=false)"
  fi

  if ! rg -q '"ITSAppUsesNonExemptEncryption": false' "$ROOT/$app/app.json" 2>/dev/null; then
    echo "FAIL: $app app.json must set ios.infoPlist.ITSAppUsesNonExemptEncryption to false"
    FAIL=1
  else
    echo "OK: $app app.json export compliance"
  fi
done

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "DEPENDENCY GUARD FAILED"
  exit 1
fi

echo ""
echo "DEPENDENCY GUARD PASSED"