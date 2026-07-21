#!/usr/bin/env bash
# Static guards for .github/workflows/ci.yml and related scripts.
# Catches stale turbo --filter=!pkg after package removal, and npx expo footguns.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

workspace_packages() {
  node -e "
    const fs = require('fs');
    const path = require('path');
    const names = new Set();
    for (const bucket of ['apps', 'packages']) {
      const base = path.join('$ROOT', bucket);
      if (!fs.existsSync(base)) continue;
      for (const dir of fs.readdirSync(base)) {
        const pkgPath = path.join(base, dir, 'package.json');
        try {
          names.add(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name);
        } catch {}
      }
    }
    console.log([...names].sort().join('\n'));
  "
}

echo "=== CI config guard ==="

PKG_LIST=$(workspace_packages)
PKG_FILE=$(mktemp)
printf '%s\n' "$PKG_LIST" > "$PKG_FILE"

while IFS= read -r filter; do
  pkg="${filter#!}"
  [[ "$pkg" == *"*"* ]] && continue
  if ! grep -qxF "$pkg" "$PKG_FILE"; then
    echo "FAIL: ci.yml turbo --filter=!$pkg but workspace has no package named '$pkg'"
    echo "      (remove the filter or restore the package)"
    FAIL=1
  else
    echo "OK: turbo exclusion !$pkg matches workspace package"
  fi
done < <(grep -oE -- '--filter=![a-z0-9-]+' "$ROOT/scripts/ci-gate.sh" | sed 's/--filter=!//' | sort -u)

if grep -q 'npx expo export' "$ROOT/scripts/verify-mobile-bundles.sh"; then
  echo "FAIL: verify-mobile-bundles.sh must use 'pnpm exec expo export' (npx can install wrong Expo major)"
  FAIL=1
else
  echo "OK: mobile bundle guard uses workspace Expo CLI"
fi

if grep -qE 'apps/mobile[^-]' "$ROOT/.github/workflows/ci.yml" 2>/dev/null; then
  echo "FAIL: ci.yml still references removed apps/mobile monolith"
  FAIL=1
else
  echo "OK: ci.yml does not reference legacy apps/mobile"
fi

# CI jobs must delegate to scripts/ci-gate.sh — no duplicated guard commands in ci.yml.
for target in build-test-typecheck mobile-ios-guard web-pwa-guard; do
  if ! grep -q "ci-gate.sh $target" "$ROOT/.github/workflows/ci.yml"; then
    echo "FAIL: ci.yml must run 'bash scripts/ci-gate.sh $target' (single source of truth)"
    FAIL=1
  else
    echo "OK: ci.yml delegates $target → ci-gate.sh"
  fi
done

# Guard scripts must not use ripgrep (rg) — not installed on GitHub Actions ubuntu.
for script in scripts/verify-ci-config.sh scripts/verify-mobile-deps.sh scripts/ci-gate.sh; do
  if grep -v 'grep' "$ROOT/$script" | grep -qE '(^|[^a-zA-Z-])rg -[a-z]' 2>/dev/null \
    || grep -v 'grep' "$ROOT/$script" | grep -qE '\| rg -' 2>/dev/null; then
    echo "FAIL: $script invokes rg — use grep (rg missing on GHA ubuntu)"
    FAIL=1
  fi
done
if [ "$FAIL" -eq 0 ]; then
  echo "OK: guard scripts use grep only (GHA-safe)"
fi

rm -f "$PKG_FILE"

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "CI CONFIG GUARD FAILED"
  exit 1
fi

echo ""
echo "CI CONFIG GUARD PASSED"
