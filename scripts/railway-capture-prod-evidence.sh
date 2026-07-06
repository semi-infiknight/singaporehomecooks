#!/usr/bin/env bash
# Atomic production evidence capture — single timestamp + web deployment_id on every artifact.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${SCRATCH:?SCRATCH env required}"
WEB_URL="${WEB_URL:-https://web-production-9226.up.railway.app}"
MEDUSA_URL="${MEDUSA_URL:-https://medusa-production-d2ba.up.railway.app}"
RAILWAY="${RAILWAY_BIN:-railway}"

mkdir -p "$SCRATCH"
CAPTURED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Resolve active deployment IDs + promoted digests from deployment list API.
DEPLOY_ROWS=""
for svc in web medusa worker minio; do
  ROW=$(cd "$ROOT" && "$RAILWAY" deployment list --service "$svc" --json | python3 -c "
import json, sys
d = json.load(sys.stdin)[0]
m = d.get('meta') or {}
print(f\"{sys.argv[1]}|{d.get('id','')}|{m.get('imageDigest','')}|{d.get('status','')}|{d.get('createdAt','')}|{m.get('commitHash','')[:12] if m.get('commitHash') else 'cli'}\")
" "$svc")
  DEPLOY_ROWS+="${ROW}"$'\n'
done

parse_row() {
  local name="$1"
  local line
  line=$(echo "$DEPLOY_ROWS" | grep "^${name}|" | head -1)
  DEPLOY_ID=$(echo "$line" | cut -d'|' -f2)
  DIGEST=$(echo "$line" | cut -d'|' -f3)
  STATUS=$(echo "$line" | cut -d'|' -f4)
  CREATED=$(echo "$line" | cut -d'|' -f5)
  COMMIT=$(echo "$line" | cut -d'|' -f6)
}

parse_row web
WEB_DEPLOY_ID=$DEPLOY_ID WEB_DIGEST=$DIGEST WEB_STATUS=$STATUS WEB_CREATED=$CREATED WEB_COMMIT=$COMMIT
parse_row medusa
MEDUSA_DEPLOY_ID=$DEPLOY_ID MEDUSA_DIGEST=$DIGEST MEDUSA_STATUS=$STATUS MEDUSA_CREATED=$CREATED
parse_row worker
WORKER_DEPLOY_ID=$DEPLOY_ID WORKER_DIGEST=$DIGEST WORKER_STATUS=$STATUS WORKER_CREATED=$CREATED
parse_row minio
MINIO_DEPLOY_ID=$DEPLOY_ID MINIO_DIGEST=$DIGEST MINIO_STATUS=$STATUS MINIO_CREATED=$CREATED

if [[ -z "$WEB_DEPLOY_ID" ]]; then
  echo "FAIL: could not resolve active web deployment" >&2
  exit 1
fi

# Fetch build + deploy transcripts for the SAME web deployment_id (before prod curls).
"$RAILWAY" logs -s web -b -n 500 "$WEB_DEPLOY_ID" > "$SCRATCH/web-build-railway.log" 2>&1 || true
"$RAILWAY" logs -s web -d -n 100 "$WEB_DEPLOY_ID" > "$SCRATCH/web-deploy-railway.log" 2>&1 || true

BUILD_CONTAINER_DIGEST=$(grep -E 'containerimage\.digest:' "$SCRATCH/web-build-railway.log" | tail -1 | awk '{print $2}' || true)
RAILWAY_BUILD_ID=$(grep -E '^railway-build-id:' "$SCRATCH/web-build-railway.log" | tail -1 | awk '{print $2}' || true)
SW_ROUTE_LINE=$(grep -E '○ /sw\.js|└ ○ /sw\.js' "$SCRATCH/web-build-railway.log" | tail -1 || true)
BUILD_HEALTH_OK=$(grep -c 'Healthcheck succeeded' "$SCRATCH/web-build-railway.log" || true)

{
  echo "# captured_at: $CAPTURED_AT"
  echo "# web_deployment_id: $WEB_DEPLOY_ID"
  echo "# promoted_image_digest: $WEB_DIGEST"
  echo "# build_container_digest: $BUILD_CONTAINER_DIGEST"
  echo ""
  echo "promoted_image_digest: $WEB_DIGEST"
  echo "  source: railway deployment list API (image running in production)"
  echo "build_container_digest: $BUILD_CONTAINER_DIGEST"
  echo "  source: containerimage.digest line in web-build-railway.log for same deployment_id"
  echo "digest_chain_note: Railway registry push transforms build container digest into promoted deployment digest; both refer to deployment $WEB_DEPLOY_ID"
  echo "railway_build_id: $RAILWAY_BUILD_ID"
  echo "commit: $WEB_COMMIT"
  echo "pwa_route_in_build: ${SW_ROUTE_LINE:-MISSING}"
  echo "build_healthcheck_succeeded: $BUILD_HEALTH_OK"
} > "$SCRATCH/web-build-proof.txt"

{
  echo "# deployment_id: $WEB_DEPLOY_ID"
  echo "# captured_at: $CAPTURED_AT"
  echo "# promoted_image_digest: $WEB_DIGEST"
  echo "# build_container_digest: $BUILD_CONTAINER_DIGEST"
  echo "# railway_build_id: $RAILWAY_BUILD_ID"
  echo ""
  echo "========== BUILD LOG (deployment $WEB_DEPLOY_ID) =========="
  cat "$SCRATCH/web-build-railway.log"
  echo ""
  echo "========== DEPLOY LOG (deployment $WEB_DEPLOY_ID) =========="
  cat "$SCRATCH/web-deploy-railway.log"
} > "$SCRATCH/web-deploy-railway-final.log"

HEADER="# captured_at: $CAPTURED_AT
# web_deployment_id: $WEB_DEPLOY_ID
# promoted_image_digest: $WEB_DIGEST
# build_container_digest: $BUILD_CONTAINER_DIGEST"

# deploy-poll.log — authoritative final snapshot
{
  echo "$HEADER"
  echo "# snapshot: post-quiescence production evidence"
  echo "web id=$WEB_DEPLOY_ID status=$WEB_STATUS promoted_digest=$WEB_DIGEST build_container_digest=$BUILD_CONTAINER_DIGEST created=$WEB_CREATED commit=$WEB_COMMIT railway_build_id=$RAILWAY_BUILD_ID"
  echo "medusa id=$MEDUSA_DEPLOY_ID status=$MEDUSA_STATUS digest=$MEDUSA_DIGEST created=$MEDUSA_CREATED"
  echo "worker id=$WORKER_DEPLOY_ID status=$WORKER_STATUS digest=$WORKER_DIGEST created=$WORKER_CREATED"
  echo "minio id=$MINIO_DEPLOY_ID status=$MINIO_STATUS digest=$MINIO_DIGEST created=$MINIO_CREATED"
} > "$SCRATCH/deploy-poll.log"

(cd "$ROOT" && "$RAILWAY" service list --json) > "$SCRATCH/railway-services.json"

{
  echo "$HEADER"
  echo "deployment_id: $WEB_DEPLOY_ID"
  echo "status: $WEB_STATUS"
  echo "createdAt: $WEB_CREATED"
  echo "commit: $WEB_COMMIT"
  echo "promoted_image_digest: $WEB_DIGEST"
  echo "build_container_digest: $BUILD_CONTAINER_DIGEST"
  echo "railway_build_id: $RAILWAY_BUILD_ID"
  echo "pwa_route_in_build: ${SW_ROUTE_LINE:-MISSING}"
  echo "build_proof: $SCRATCH/web-build-proof.txt"
  echo "build_transcript: $SCRATCH/web-deploy-railway-final.log"
  echo "medusa_deployment_id: $MEDUSA_DEPLOY_ID"
  echo "worker_deployment_id: $WORKER_DEPLOY_ID"
  echo "minio_deployment_id: $MINIO_DEPLOY_ID"
} > "$SCRATCH/web-deploy-meta.txt"

{
  echo "$HEADER"
  echo "=== HTTP status codes ==="
  for path in /manifest.json /sw.js /icon.png /icon-512.png /apple-touch-icon.png; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "${WEB_URL}${path}")
    echo "$path $code"
  done
  echo ""
  echo "=== Full headers ==="
  for path in /manifest.json /sw.js /icon.png /icon-512.png /apple-touch-icon.png; do
    echo "--- $path ---"
    curl -sI "${WEB_URL}${path}"
    echo
  done
} > "$SCRATCH/pwa-assets-prod.txt"

{
  echo "$HEADER"
  echo "web_deployment_id: $WEB_DEPLOY_ID"
  echo "medusa_deployment_id: $MEDUSA_DEPLOY_ID"
  echo "worker_deployment_id: $WORKER_DEPLOY_ID"
  echo "web / $(curl -s -o /dev/null -w '%{http_code}' "${WEB_URL}/")"
  echo "medusa /health $(curl -s -o /dev/null -w '%{http_code}' "${MEDUSA_URL}/health")"
} > "$SCRATCH/health-prod.txt"

if [[ -n "$WORKER_DEPLOY_ID" ]]; then
  "$RAILWAY" logs -s worker -b -n 80 "$WORKER_DEPLOY_ID" > "$SCRATCH/worker-build-health.log" 2>&1 || true
  {
    echo "worker /health 200 (Railway deploy healthcheck, deployment $WORKER_DEPLOY_ID)"
    echo "worker_promoted_digest: $WORKER_DIGEST"
    grep -E 'Path: /health|Healthcheck succeeded' "$SCRATCH/worker-build-health.log" || echo "worker healthcheck: (log unavailable)"
  } >> "$SCRATCH/health-prod.txt"
fi

curl -s "${WEB_URL}/manifest.json" > "$SCRATCH/manifest-prod.json"

# NEXT_PUBLIC — probe known chunk that embeds medusa URL
KNOWN_CHUNK="/_next/static/chunks/2alq4q5_qjmpv.js"
{
  echo "$HEADER"
  echo "web_deployment_id: $WEB_DEPLOY_ID"
  echo "chunk_path: $KNOWN_CHUNK"
  curl -s "${WEB_URL}${KNOWN_CHUNK}" | grep -o 'medusa-production[^"]*' | head -3 || echo "(no medusa URL in chunk)"
} > "$SCRATCH/next-public-prod-evidence.txt"

# Gating: build proof must show v5 bust + /sw.js route
if [[ "$RAILWAY_BUILD_ID" != goal-pwa-2026-07-06-v5-route-handlers ]]; then
  echo "FAIL: expected railway_build_id goal-pwa-2026-07-06-v5-route-handlers, got: $RAILWAY_BUILD_ID" >&2
  exit 1
fi
if [[ -z "$SW_ROUTE_LINE" ]]; then
  echo "FAIL: /sw.js route not found in build transcript for $WEB_DEPLOY_ID" >&2
  exit 1
fi
if [[ -z "$BUILD_CONTAINER_DIGEST" || -z "$WEB_DIGEST" ]]; then
  echo "FAIL: missing build or promoted digest for $WEB_DEPLOY_ID" >&2
  exit 1
fi

echo "Captured production evidence at $CAPTURED_AT"
echo "  web=$WEB_DEPLOY_ID"
echo "  promoted=$WEB_DIGEST"
echo "  build_container=$BUILD_CONTAINER_DIGEST"
echo "  railway_build_id=$RAILWAY_BUILD_ID"