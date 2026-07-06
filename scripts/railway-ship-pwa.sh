#!/usr/bin/env bash
# Single ordered Railway ship pipeline: wire → redeploy all app services → quiesce → capture evidence.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${SCRATCH:-$ROOT/.railway-ship-scratch}"
WEB_URL="${WEB_URL:-https://web-production-9226.up.railway.app}"
MEDUSA_URL="${MEDUSA_URL:-https://medusa-production-d2ba.up.railway.app}"
RAILWAY="${RAILWAY_BIN:-railway}"
POLL_INTERVAL="${POLL_INTERVAL:-15}"
STABLE_SECONDS="${STABLE_SECONDS:-30}"
MAX_POLLS="${MAX_POLLS:-60}"

mkdir -p "$SCRATCH"
export SCRATCH WEB_URL MEDUSA_URL

echo "=== Railway PWA ship pipeline $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee "$SCRATCH/ship-pipeline.log"
echo "SCRATCH=$SCRATCH" | tee -a "$SCRATCH/ship-pipeline.log"

# Step 1–2: local PWA guard + production build
echo "--- verify:web-pwa ---" | tee -a "$SCRATCH/ship-pipeline.log"
(cd "$ROOT" && pnpm verify:web-pwa) 2>&1 | tee "$SCRATCH/verify-web-pwa.log"
echo "--- web build ---" | tee -a "$SCRATCH/ship-pipeline.log"
(cd "$ROOT" && pnpm --filter web build) 2>&1 | tee "$SCRATCH/web-build.log"

# Step 3: wire references without redeploy (NEXT_PUBLIC_* before web build on Railway)
echo "--- railway:wire --no-redeploy ---" | tee -a "$SCRATCH/ship-pipeline.log"
(cd "$ROOT" && pnpm railway:wire -- --no-redeploy) 2>&1 | tee "$SCRATCH/railway-wire.log"

# Step 4: redeploy all four app services from latest source (web last)
echo "--- redeploy app services (medusa → worker → minio → web) ---" | tee -a "$SCRATCH/ship-pipeline.log"
for svc in medusa worker minio web; do
  echo "redeploy $svc --from-source $(date -u +%H:%M:%S)" | tee -a "$SCRATCH/ship-pipeline.log"
  (cd "$ROOT" && "$RAILWAY" redeploy --service "$svc" --from-source -y) 2>&1 | tee -a "$SCRATCH/ship-pipeline.log"
done

# Step 5: poll until all SUCCESS and deployment IDs stable for STABLE_SECONDS
echo "--- poll for quiescence (max ${MAX_POLLS} polls × ${POLL_INTERVAL}s) ---" | tee -a "$SCRATCH/ship-pipeline.log"
: > "$SCRATCH/deploy-poll-transient.log"
PREV_SNAPSHOT=""
STABLE_COUNT=0
REQUIRED_STABLE=$((STABLE_SECONDS / POLL_INTERVAL))
[[ "$REQUIRED_STABLE" -lt 2 ]] && REQUIRED_STABLE=2

for ((i = 1; i <= MAX_POLLS; i++)); do
  SNAPSHOT=$(cd "$ROOT" && "$RAILWAY" service list --json | python3 -c "
import json, sys
services = {s['name']: s for s in json.load(sys.stdin)}
parts = []
for name in ('medusa','worker','minio','web'):
    ld = (services.get(name) or {}).get('latestDeployment') or {}
    parts.append(f\"{name}:{ld.get('id','')}:{ld.get('status','')}\")
print('|'.join(parts))
")
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "$TS poll=$i $SNAPSHOT" | tee -a "$SCRATCH/deploy-poll-transient.log"

  ALL_SUCCESS=true
  for name in medusa worker minio web; do
    STATUS=$(echo "$SNAPSHOT" | tr '|' '\n' | grep "^${name}:" | cut -d: -f3)
    if [[ "$STATUS" != "SUCCESS" ]]; then
      ALL_SUCCESS=false
      break
    fi
  done

  if $ALL_SUCCESS && [[ "$SNAPSHOT" == "$PREV_SNAPSHOT" ]]; then
    STABLE_COUNT=$((STABLE_COUNT + 1))
    if [[ "$STABLE_COUNT" -ge "$REQUIRED_STABLE" ]]; then
      echo "$TS QUIESCENT snapshot=$SNAPSHOT" | tee -a "$SCRATCH/deploy-poll-transient.log"
      break
    fi
  else
    STABLE_COUNT=0
  fi
  PREV_SNAPSHOT="$SNAPSHOT"

  if [[ "$i" -eq "$MAX_POLLS" ]]; then
    echo "FAIL: deployments did not quiesce within timeout" | tee -a "$SCRATCH/ship-pipeline.log"
    exit 1
  fi
  sleep "$POLL_INTERVAL"
done

# Step 6: atomic evidence capture (runtime fingerprint gate)
echo "--- capture production evidence ---" | tee -a "$SCRATCH/ship-pipeline.log"
bash "$ROOT/scripts/railway-capture-prod-evidence.sh" 2>&1 | tee -a "$SCRATCH/ship-pipeline.log"

# Append transient poll audit trail after authoritative snapshot
{
  echo ""
  echo "# transient poll log (pre-capture)"
  cat "$SCRATCH/deploy-poll-transient.log"
} >> "$SCRATCH/deploy-poll.log"

echo "=== Railway PWA ship complete ===" | tee -a "$SCRATCH/ship-pipeline.log"
echo "Evidence: $SCRATCH/deploy-poll.log + $SCRATCH/web-deploy-meta.txt"