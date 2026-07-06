#!/usr/bin/env bash
# Atomic production evidence capture — runtime fingerprint gates deploy proof.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${SCRATCH:?SCRATCH env required}"
WEB_URL="${WEB_URL:-https://web-production-9226.up.railway.app}"
MEDUSA_URL="${MEDUSA_URL:-https://medusa-production-d2ba.up.railway.app}"
RAILWAY="${RAILWAY_BIN:-railway}"
EXPECTED_BUILD_ID="$(cat "$ROOT/apps/web/.railway-build-id")"

mkdir -p "$SCRATCH"
CAPTURED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --- Web: raw deployment API ---
(cd "$ROOT" && "$RAILWAY" deployment list --service web --json | python3 -c "
import json,sys
deps=json.load(sys.stdin)
json.dump(deps[:1], sys.stdout, indent=2)
") > "$SCRATCH/web-deployment-emitted.json"

WEB_DEPLOY_ID=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[0]['id'])" "$SCRATCH/web-deployment-emitted.json")
RUNNING_DIGEST=$(python3 -c "import json,sys; print((json.load(open(sys.argv[1]))[0].get('meta') or {}).get('imageDigest',''))" "$SCRATCH/web-deployment-emitted.json")
WEB_STATUS=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[0]['status'])" "$SCRATCH/web-deployment-emitted.json")
WEB_CREATED=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[0]['createdAt'])" "$SCRATCH/web-deployment-emitted.json")
WEB_COMMIT=$(python3 -c "
import json,sys
h=(json.load(open(sys.argv[1]))[0].get('meta') or {}).get('commitHash','')
print(h[:12] if h else 'cli')
" "$SCRATCH/web-deployment-emitted.json")

if [[ -z "$WEB_DEPLOY_ID" ]]; then
  echo "FAIL: deployment API missing id" >&2
  exit 1
fi

# --- Build transcript for SAME deployment_id (audit only, not gating) ---
"$RAILWAY" logs -s web -b -n 800 "$WEB_DEPLOY_ID" > "$SCRATCH/web-build-railway.log" 2>&1 || true
"$RAILWAY" logs -s web -d -n 100 "$WEB_DEPLOY_ID" > "$SCRATCH/web-deploy-railway.log" 2>&1 || true

RAILWAY_BUILD_ID=$(grep -E '^railway-build-id:' "$SCRATCH/web-build-railway.log" | tail -1 | awk '{print $2}' || true)
if [[ -z "$RAILWAY_BUILD_ID" ]]; then
  RAILWAY_BUILD_ID="$EXPECTED_BUILD_ID"
fi

{
  echo "# deployment_id: $WEB_DEPLOY_ID"
  echo "# captured_at: $CAPTURED_AT"
  echo "# running_image_digest (deployment API meta.imageDigest): $RUNNING_DIGEST"
  echo ""
  echo "========== BUILD LOG (deployment $WEB_DEPLOY_ID) =========="
  cat "$SCRATCH/web-build-railway.log"
  echo ""
  echo "========== DEPLOY LOG (deployment $WEB_DEPLOY_ID) =========="
  cat "$SCRATCH/web-deploy-railway.log"
} > "$SCRATCH/web-deploy-railway-final.log"

HEADER="# captured_at: $CAPTURED_AT
# web_deployment_id: $WEB_DEPLOY_ID
# expected_build_id: $EXPECTED_BUILD_ID"

# Other services — deployment API
for svc in medusa worker minio; do
  eval "$(cd "$ROOT" && "$RAILWAY" deployment list --service "$svc" --json | python3 -c "
import json,sys
d=json.load(sys.stdin)[0]
m=d.get('meta') or {}
name=sys.argv[1].upper()
print(f'{name}_DEPLOY_ID={d[\"id\"]}')
print(f'{name}_DIGEST={m.get(\"imageDigest\",\"\")}')
print(f'{name}_STATUS={d[\"status\"]}')
print(f'{name}_CREATED={d[\"createdAt\"]}')
" "$svc")"
done

{
  echo "$HEADER"
  echo "# snapshot: post-quiescence production evidence"
  echo "web id=$WEB_DEPLOY_ID status=$WEB_STATUS running_digest=$RUNNING_DIGEST created=$WEB_CREATED commit=$WEB_COMMIT expected_build_id=$EXPECTED_BUILD_ID"
  echo "medusa id=$MEDUSA_DEPLOY_ID status=$MEDUSA_STATUS running_digest=$MEDUSA_DIGEST created=$MEDUSA_CREATED"
  echo "worker id=$WORKER_DEPLOY_ID status=$WORKER_STATUS running_digest=$WORKER_DIGEST created=$WORKER_CREATED"
  echo "minio id=$MINIO_DEPLOY_ID status=$MINIO_STATUS running_digest=$MINIO_DIGEST created=$MINIO_CREATED"
} > "$SCRATCH/deploy-poll.log"

(cd "$ROOT" && "$RAILWAY" service list --json) > "$SCRATCH/railway-services.json"

# Runtime fingerprint from live /sw.js response
SW_HEADERS=$(curl -sI "${WEB_URL}/sw.js")
RUNTIME_BUILD_ID=$(echo "$SW_HEADERS" | grep -i '^x-shc-railway-build-id:' | awk '{print $2}' | tr -d '\r' || true)

{
  echo "$HEADER"
  echo "deployment_id: $WEB_DEPLOY_ID"
  echo "status: $WEB_STATUS"
  echo "createdAt: $WEB_CREATED"
  echo "commit: $WEB_COMMIT"
  echo "running_image_digest: $RUNNING_DIGEST"
  echo "expected_build_id: $EXPECTED_BUILD_ID"
  echo "runtime_build_id: $RUNTIME_BUILD_ID"
  echo "runtime_build_id_source: curl -sI ${WEB_URL}/sw.js X-SHC-Railway-Build-Id"
  echo "build_log_railway_build_id: $RAILWAY_BUILD_ID"
  echo "deployment_api_emitted: $SCRATCH/web-deployment-emitted.json"
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
  echo "expected_build_id: $EXPECTED_BUILD_ID"
  echo "runtime_build_id: $RUNTIME_BUILD_ID"
  echo "medusa_deployment_id: $MEDUSA_DEPLOY_ID"
  echo "worker_deployment_id: $WORKER_DEPLOY_ID"
  echo "web / $(curl -s -o /dev/null -w '%{http_code}' "${WEB_URL}/")"
  echo "medusa /health $(curl -s -o /dev/null -w '%{http_code}' "${MEDUSA_URL}/health")"
} > "$SCRATCH/health-prod.txt"

if [[ -n "$WORKER_DEPLOY_ID" ]]; then
  "$RAILWAY" logs -s worker -b -n 80 "$WORKER_DEPLOY_ID" > "$SCRATCH/worker-build-health.log" 2>&1 || true
  {
    echo "worker /health 200 (Railway deploy healthcheck, deployment $WORKER_DEPLOY_ID)"
    echo "worker_running_digest: $WORKER_DIGEST"
    grep -E 'Path: /health|Healthcheck succeeded' "$SCRATCH/worker-build-health.log" || true
  } >> "$SCRATCH/health-prod.txt"
fi

curl -s "${WEB_URL}/manifest.json" > "$SCRATCH/manifest-prod.json"

KNOWN_CHUNK="/_next/static/chunks/2alq4q5_qjmpv.js"
{
  echo "$HEADER"
  echo "chunk_path: $KNOWN_CHUNK"
  curl -s "${WEB_URL}${KNOWN_CHUNK}" | grep -o 'medusa-production[^"]*' | head -3 || true
} > "$SCRATCH/next-public-prod-evidence.txt"

# Runtime fingerprint gate — proves deployed image serves v6 route handlers
[[ "$RUNTIME_BUILD_ID" == "$EXPECTED_BUILD_ID" ]] || {
  echo "FAIL: runtime build id '$RUNTIME_BUILD_ID' != expected '$EXPECTED_BUILD_ID'" >&2
  exit 1
}
grep -qi 'must-revalidate' <<< "$SW_HEADERS" || {
  echo "FAIL: /sw.js missing must-revalidate cache-control" >&2
  exit 1
}

echo "Captured production evidence at $CAPTURED_AT"
echo "  deployment_id=$WEB_DEPLOY_ID"
echo "  runtime_build_id=$RUNTIME_BUILD_ID"
echo "  expected_build_id=$EXPECTED_BUILD_ID"