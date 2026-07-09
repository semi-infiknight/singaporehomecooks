#!/usr/bin/env bash
# Wave 7 — Ship HomelyEats tiffin OS to Railway and verify write path.
#
#   bash scripts/ship-tiffin-wave7.sh
#   SKIP_PUSH=1 bash scripts/ship-tiffin-wave7.sh   # smoke only (after manual push/redeploy)
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Wave 7: Ship tiffin OS ==="
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "HEAD:   $(git rev-parse --short HEAD)"

if [ "${SKIP_PUSH:-0}" != "1" ]; then
  # Staged dirty blocks push; unstaged local WIP is OK unless FORCE_CLEAN=1
  if ! git diff --cached --quiet; then
    echo "ERROR: staged changes — commit or unstage before push"
    git status -sb
    exit 1
  fi
  if [ "${FORCE_CLEAN:-0}" = "1" ] && ! git diff --quiet; then
    echo "ERROR: FORCE_CLEAN=1 and unstaged changes present"
    git status -sb
    exit 1
  fi
  echo ">>> git push origin main"
  git push origin main
  echo ">>> Push complete. Redeploy medusa from source (required for pg-first subscribe)."
  if command -v railway >/dev/null 2>&1; then
    if [ "${SKIP_REDEPLOY:-0}" != "1" ]; then
      echo ">>> railway redeploy -s medusa --from-source -y"
      railway redeploy -s medusa --from-source -y || {
        echo "WARN: railway redeploy failed — redeploy medusa manually in dashboard"
      }
    fi
  else
    echo "    railway redeploy -s medusa --from-source -y   # if CLI linked"
  fi
else
  echo ">>> SKIP_PUSH=1 — assuming main is already on origin"
fi

echo ">>> Unit + typecheck (local)"
pnpm exec vitest run packages/business-rules/src/tiffin.test.ts packages/shc-utils/src/subscribe-funnel.test.ts packages/shc-utils/src/cook-tiffin-os.test.ts
(cd packages/business-rules && pnpm run build)
(cd packages/shc-api-client && pnpm run build)
(cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json)

echo ">>> Wait for Railway (optional SLEEP_S=45)"
sleep "${SLEEP_S:-15}"

echo ">>> REQUIRE_TIFFIN_SMOKE=1 pnpm smoke:tiffin"
REQUIRE_TIFFIN_SMOKE=1 pnpm smoke:tiffin

echo ""
echo "=== Wave 7 ship verification PASSED ==="
echo "Optional: bash scripts/start-mobile-dev.sh && pnpm e2e:tiffin"
