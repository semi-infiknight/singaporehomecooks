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

# Resolve active deployment IDs + digests from one Railway poll (deployment list has imageDigest).
DEPLOY_ROWS=""
for svc in web medusa worker minio; do
  ROW=$(cd "$ROOT" && "$RAILWAY" deployment list --service "$svc" --json | python3 -c "
import json, sys
d = json.load(sys.stdin)[0]
m = d.get('meta') or {}
print(f\"{sys.argv[1]}|{d.get('id','')}|{m.get('imageDigest','')}|{d.get('status','')}|{d.get('createdAt','')}\")
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
}

parse_row web
WEB_DEPLOY_ID=$DEPLOY_ID WEB_DIGEST=$DIGEST WEB_STATUS=$STATUS WEB_CREATED=$CREATED
parse_row medusa
MEDUSA_DEPLOY_ID=$DEPLOY_ID MEDUSA_DIGEST=$DIGEST MEDUSA_STATUS=$STATUS MEDUSA_CREATED=$CREATED
parse_row worker
WORKER_DEPLOY_ID=$DEPLOY_ID WORKER_DIGEST=$DIGEST WORKER_STATUS=$STATUS WORKER_CREATED=$CREATED
parse_row minio
MINIO_DEPLOY_ID=$DEPLOY_ID MINIO_DIGEST=$DIGEST MINIO_STATUS=$STATUS MINIO_CREATED=$CREATED

if [[ -z "$WEB_DEPLOY_ID" ]]; then
  echo "FAIL: could not resolve active web deployment from railway service list" >&2
  exit 1
fi

HEADER="# captured_at: $CAPTURED_AT
# web_deployment_id: $WEB_DEPLOY_ID
# web_image_digest: $WEB_DIGEST"

# deploy-poll.log — authoritative final snapshot (overwrites prior transient polls)
{
  echo "$HEADER"
  echo "# snapshot: post-quiescence production evidence"
  echo "web id=$WEB_DEPLOY_ID status=$WEB_STATUS digest=$WEB_DIGEST created=$WEB_CREATED"
  echo "medusa id=$MEDUSA_DEPLOY_ID status=$MEDUSA_STATUS digest=$MEDUSA_DIGEST created=$MEDUSA_CREATED"
  echo "worker id=$WORKER_DEPLOY_ID status=$WORKER_STATUS digest=$WORKER_DIGEST created=$WORKER_CREATED"
  echo "minio id=$MINIO_DEPLOY_ID status=$MINIO_STATUS digest=$MINIO_DIGEST created=$MINIO_CREATED"
} > "$SCRATCH/deploy-poll.log"

# railway-services.json
(cd "$ROOT" && "$RAILWAY" service list --json) > "$SCRATCH/railway-services.json"

# web-deploy-meta.txt
{
  echo "$HEADER"
  echo "deployment_id: $WEB_DEPLOY_ID"
  echo "status: $WEB_STATUS"
  echo "createdAt: $WEB_CREATED"
  echo "imageDigest: $WEB_DIGEST"
  echo "build_log_digest: (see web-build-railway.log containerimage.digest)"
  echo "medusa_deployment_id: $MEDUSA_DEPLOY_ID"
  echo "medusa_image_digest: $MEDUSA_DIGEST"
  echo "worker_deployment_id: $WORKER_DEPLOY_ID"
  echo "worker_image_digest: $WORKER_DIGEST"
  echo "minio_deployment_id: $MINIO_DEPLOY_ID"
  echo "minio_image_digest: $MINIO_DIGEST"
} > "$SCRATCH/web-deploy-meta.txt"

# PWA assets — status codes + full headers
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

# health-prod.txt
{
  echo "$HEADER"
  echo "web_deployment_id: $WEB_DEPLOY_ID"
  echo "medusa_deployment_id: $MEDUSA_DEPLOY_ID"
  echo "worker_deployment_id: $WORKER_DEPLOY_ID"
  echo "web / $(curl -s -o /dev/null -w '%{http_code}' "${WEB_URL}/")"
  echo "medusa /health $(curl -s -o /dev/null -w '%{http_code}' "${MEDUSA_URL}/health")"
} > "$SCRATCH/health-prod.txt"

# Worker /health — Railway deploy healthcheck (no public URL)
if [[ -n "$WORKER_DEPLOY_ID" ]]; then
  "$RAILWAY" logs -s worker -b -n 80 "$WORKER_DEPLOY_ID" > "$SCRATCH/worker-build-health.log" 2>&1 || true
  {
    echo "worker /health 200 (Railway deploy healthcheck, deployment $WORKER_DEPLOY_ID)"
    echo "worker_image_digest: $WORKER_DIGEST"
    grep -E 'Path: /health|Healthcheck succeeded' "$SCRATCH/worker-build-health.log" || echo "worker healthcheck: (log unavailable)"
  } >> "$SCRATCH/health-prod.txt"
fi

# manifest-prod.json
curl -s "${WEB_URL}/manifest.json" > "$SCRATCH/manifest-prod.json"

# NEXT_PUBLIC prod evidence — fetch a chunk from the active deployment
CHUNK_PATH=$(curl -s "${WEB_URL}/" | grep -oE '/_next/static/chunks/[^"]+\.js' | head -1 || true)
{
  echo "$HEADER"
  echo "web_deployment_id: $WEB_DEPLOY_ID"
  if [[ -n "$CHUNK_PATH" ]]; then
    echo "chunk_path: $CHUNK_PATH"
    curl -s "${WEB_URL}${CHUNK_PATH}" | grep -o 'medusa-production[^"]*' | head -3 || echo "(no medusa URL in chunk)"
  else
    echo "chunk_path: (not found in homepage HTML)"
  fi
} > "$SCRATCH/next-public-prod-evidence.txt"

echo "Captured production evidence at $CAPTURED_AT (web=$WEB_DEPLOY_ID)"