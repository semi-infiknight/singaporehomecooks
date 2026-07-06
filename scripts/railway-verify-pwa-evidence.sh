#!/usr/bin/env bash
# Run plan verification steps 1–6 against current production (no redeploy).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${SCRATCH:?SCRATCH env required}"
WEB_URL="${WEB_URL:-https://web-production-9226.up.railway.app}"
MEDUSA_URL="${MEDUSA_URL:-https://medusa-production-d2ba.up.railway.app}"

mkdir -p "$SCRATCH"
export SCRATCH WEB_URL MEDUSA_URL

echo "=== PWA verification plan $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee "$SCRATCH/verify-plan.log"

echo "--- step 1: pnpm verify:web-pwa ---" | tee -a "$SCRATCH/verify-plan.log"
(cd "$ROOT" && pnpm verify:web-pwa) 2>&1 | tee "$SCRATCH/verify-web-pwa.log"
grep -q 'WEB PWA GUARD PASSED' "$SCRATCH/verify-web-pwa.log"

echo "--- step 2: pnpm --filter web build ---" | tee -a "$SCRATCH/verify-plan.log"
(cd "$ROOT" && pnpm --filter web build) 2>&1 | tee "$SCRATCH/web-build.log"
grep -q 'Compiled successfully' "$SCRATCH/web-build.log"

echo "--- steps 3–6: capture production evidence ---" | tee -a "$SCRATCH/verify-plan.log"
bash "$ROOT/scripts/railway-capture-prod-evidence.sh" 2>&1 | tee -a "$SCRATCH/verify-plan.log"

# Gating checks on captured artifacts
for path in /sw.js /icon.png /icon-512.png; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "${WEB_URL}${path}")
  [[ "$code" == "200" ]] || { echo "FAIL: $path returned $code" >&2; exit 1; }
done

python3 -c "
import json, sys
m = json.load(open('$SCRATCH/manifest-prod.json'))
assert m.get('display') == 'standalone', m
assert m.get('icons'), m
"

python3 -c "
import json
s = json.load(open('$SCRATCH/railway-services.json'))
for name in ('medusa','web','worker','minio'):
    svc = next(x for x in s if x['name']==name)
    st = (svc.get('latestDeployment') or {}).get('status')
    assert st == 'SUCCESS', f'{name} status {st}'
"

grep -q 'web / 200' "$SCRATCH/health-prod.txt"
grep -q 'medusa /health 200' "$SCRATCH/health-prod.txt"
grep -q 'must-revalidate' "$SCRATCH/pwa-assets-prod.txt"
grep -q 'max-age=86400' "$SCRATCH/pwa-assets-prod.txt"
grep -q 'goal-pwa-2026-07-06-v5-route-handlers' "$SCRATCH/web-build-transcript-emitted.txt"
grep -q '/sw.js' "$SCRATCH/web-build-transcript-emitted.txt"
grep -q 'running_image_digest:' "$SCRATCH/digest-link-emitted.txt"
test -s "$SCRATCH/web-deployment-emitted.json"
python3 -c "
import json,sys
d=json.load(open('$SCRATCH/web-deployment-emitted.json'))[0]
assert d['id']==open('$SCRATCH/web-deploy-meta.txt').read().split('deployment_id: ')[1].split()[0]
assert (d.get('meta') or {}).get('imageDigest'), d
"

echo "VERIFICATION PLAN PASSED" | tee -a "$SCRATCH/verify-plan.log"