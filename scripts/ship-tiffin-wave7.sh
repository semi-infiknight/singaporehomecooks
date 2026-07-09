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
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: working tree dirty — commit first"
    git status -sb
    exit 1
  fi
  echo ">>> git push origin main"
  git push origin main
  echo ">>> Push complete. Trigger medusa redeploy from source if CI does not auto-deploy."
  echo "    railway redeploy --service medusa --from-source   # if CLI linked"
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
