#!/usr/bin/env bash
# Cloud iOS Simulator workflow for Linux / Cursor Cloud (no local Xcode).
#
# Option A — EAS Simulator (best: live browser preview + agent-device control)
#   Requires Expo account with "device run sessions" enabled (paid / allowlist).
#   eas simulator:start --platform ios --type agent-device --non-interactive
#
# Option B — EAS simulator .app + Maestro Cloud (automated flows)
#   Add MAESTRO_CLOUD_TOKEN + MAESTRO_PROJECT_ID to Cursor secrets.
#
# Option C — EAS simulator .app + Appetize (browser stream, manual)
#   Add APPETIZE_API_KEY to Cursor secrets; upload the .tar.gz artifact.
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/apps/mobile-customer"
cd "$APP_DIR"

if [ -z "${EXPO_TOKEN:-}" ] && [ -n "${EXPO_ACCESS:-}" ]; then
  export EXPO_TOKEN="$EXPO_ACCESS"
fi

if ! pnpm dlx eas-cli@21.0.2 whoami >/dev/null 2>&1; then
  echo "Set EXPO_TOKEN (or EXPO_ACCESS) for EAS auth."
  exit 1
fi

EAS="pnpm dlx eas-cli@21.0.2"

echo "=== 1) Pre-flight guards ==="
bash "$ROOT/scripts/verify-mobile-deps.sh"
bash "$ROOT/scripts/verify-mobile-bundles.sh"

echo ""
echo "=== 2) EAS iOS simulator build (unsigned .app tarball) ==="
CI=1 $EAS build --platform ios --profile ios-simulator --non-interactive --wait

ART=$($EAS build:list --platform ios --profile ios-simulator --status finished --limit 1 --non-interactive --json \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j[0]?.artifacts?.applicationArchiveUrl||'')}catch{}})")
echo "Artifact: $ART"

echo ""
echo "=== 3) Try EAS cloud simulator session ==="
printf '# managed by eas-cli\n' > .env.eas-simulator
if $EAS simulator:start --platform ios --type agent-device --non-interactive 2>&1 | tee /tmp/eas-sim-start.log; then
  echo "Session started — check /tmp/eas-sim-start.log for webPreviewUrl"
  echo "Install app: $EAS simulator:exec npx agent-device@latest install-from-source \"$ART\" --platform ios"
  echo "Open app:    $EAS simulator:exec npx agent-device@latest open com.singaporehomecooks.customer --platform ios"
  echo "Stop:        $EAS simulator:stop"
else
  echo "EAS Simulator not enabled on this Expo account."
  echo "Enable device run sessions at expo.dev or use Maestro Cloud / Appetize with the artifact above."
fi
