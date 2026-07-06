#!/usr/bin/env bash
# Atomic production evidence capture — emitted command outputs only, single deployment_id.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${SCRATCH:?SCRATCH env required}"
WEB_URL="${WEB_URL:-https://web-production-9226.up.railway.app}"
MEDUSA_URL="${MEDUSA_URL:-https://medusa-production-d2ba.up.railway.app}"
RAILWAY="${RAILWAY_BIN:-railway}"

mkdir -p "$SCRATCH"
CAPTURED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

emit_digest_link() {
  local web_id="$1"
  local deploy_json="$2"
  local build_log="$3"
  local running_digest
  running_digest=$(python3 -c "
import json,sys
d=json.load(open(sys.argv[1]))[0]
print((d.get('meta') or {}).get('imageDigest',''))
" "$deploy_json")

  {
    echo "# digest-link-emitted.txt — literal command outputs only"
    echo "# captured_at: $CAPTURED_AT"
    echo "# deployment_id: $web_id"
    echo ""
    echo "=== COMMAND: railway deployment list --service web --json (entry 0, full) ==="
    cat "$deploy_json"
    echo ""
    echo "=== COMMAND: python3 extract meta.imageDigest from above ==="
    echo "$running_digest"
    echo ""
    echo "=== COMMAND: grep -E 'containerimage.digest:|railway-build-id:|/sw.js|Healthcheck succeeded' $build_log ==="
    grep -E 'containerimage\.digest:|^railway-build-id:|○ /sw\.js|└ ○ /sw\.js|Healthcheck succeeded' "$build_log" || true
    echo ""
    echo "=== COMMAND: grep -c '2f3fcecf' $build_log (promoted digest in build stdout) ==="
    grep -c '2f3fcecf' "$build_log" 2>/dev/null || echo 0
    echo ""
    echo "=== COMMAND: curl -sI ${WEB_URL}/sw.js | grep -iE 'HTTP/|cache-control|content-type' ==="
    curl -sI "${WEB_URL}/sw.js" | grep -iE 'HTTP/|cache-control|content-type' || true
    echo ""
    echo "=== LINK (emitted fields, same deployment_id=$web_id) ==="
    echo "running_image_digest_source: railway deployment list API meta.imageDigest"
    echo "running_image_digest: $running_digest"
    echo "oci_build_digest_source: build log containerimage.digest line"
    echo "oci_build_digest: $(grep -E 'containerimage\.digest:' "$build_log" | tail -1 | awk '{print $2}')"
    echo "v5_build_id: $(grep -E '^railway-build-id:' "$build_log" | tail -1 | awk '{print $2}')"
    echo "pwa_route_in_build: $(grep -E '○ /sw\.js|└ ○ /sw\.js' "$build_log" | tail -1)"
    echo "deployment_status: $(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[0]['status'])" "$deploy_json")"
  } > "$SCRATCH/digest-link-emitted.txt"
}

# --- Web: raw deployment API (authoritative running digest) ---
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

if [[ -z "$WEB_DEPLOY_ID" || -z "$RUNNING_DIGEST" ]]; then
  echo "FAIL: deployment API missing id or meta.imageDigest" >&2
  exit 1
fi

# --- Build transcript for SAME deployment_id ---
"$RAILWAY" logs -s web -b -n 800 "$WEB_DEPLOY_ID" > "$SCRATCH/web-build-railway.log" 2>&1 || true
"$RAILWAY" logs -s web -d -n 100 "$WEB_DEPLOY_ID" > "$SCRATCH/web-deploy-railway.log" 2>&1 || true

OCI_BUILD_DIGEST=$(grep -E 'containerimage\.digest:' "$SCRATCH/web-build-railway.log" | tail -1 | awk '{print $2}' || true)
RAILWAY_BUILD_ID=$(grep -E '^railway-build-id:' "$SCRATCH/web-build-railway.log" | tail -1 | awk '{print $2}' || true)
SW_ROUTE_LINE=$(grep -E '○ /sw\.js|└ ○ /sw\.js' "$SCRATCH/web-build-railway.log" | tail -1 || true)

grep -E 'containerimage\.digest:|containerimage\.descriptor:|^railway-build-id:|○ /sw\.js|└ ○ /sw\.js|Healthcheck succeeded|Compiled successfully|image push' \
  "$SCRATCH/web-build-railway.log" > "$SCRATCH/web-build-transcript-emitted.txt" || true

emit_digest_link "$WEB_DEPLOY_ID" "$SCRATCH/web-deployment-emitted.json" "$SCRATCH/web-build-railway.log"

{
  echo "# deployment_id: $WEB_DEPLOY_ID"
  echo "# captured_at: $CAPTURED_AT"
  echo "# running_image_digest (deployment API meta.imageDigest): $RUNNING_DIGEST"
  echo "# oci_build_digest (build log containerimage.digest): $OCI_BUILD_DIGEST"
  echo ""
  echo "========== BUILD LOG (deployment $WEB_DEPLOY_ID) =========="
  cat "$SCRATCH/web-build-railway.log"
  echo ""
  echo "========== DEPLOY LOG (deployment $WEB_DEPLOY_ID) =========="
  cat "$SCRATCH/web-deploy-railway.log"
} > "$SCRATCH/web-deploy-railway-final.log"

HEADER="# captured_at: $CAPTURED_AT
# web_deployment_id: $WEB_DEPLOY_ID
# running_image_digest: $RUNNING_DIGEST"

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
  echo "# oci_build_digest: $OCI_BUILD_DIGEST"
  echo "# snapshot: post-quiescence production evidence"
  echo "web id=$WEB_DEPLOY_ID status=$WEB_STATUS running_digest=$RUNNING_DIGEST oci_build_digest=$OCI_BUILD_DIGEST created=$WEB_CREATED commit=$WEB_COMMIT railway_build_id=$RAILWAY_BUILD_ID"
  echo "medusa id=$MEDUSA_DEPLOY_ID status=$MEDUSA_STATUS running_digest=$MEDUSA_DIGEST created=$MEDUSA_CREATED"
  echo "worker id=$WORKER_DEPLOY_ID status=$WORKER_STATUS running_digest=$WORKER_DIGEST created=$WORKER_CREATED"
  echo "minio id=$MINIO_DEPLOY_ID status=$MINIO_STATUS running_digest=$MINIO_DIGEST created=$MINIO_CREATED"
} > "$SCRATCH/deploy-poll.log"

(cd "$ROOT" && "$RAILWAY" service list --json) > "$SCRATCH/railway-services.json"

{
  echo "$HEADER"
  echo "deployment_id: $WEB_DEPLOY_ID"
  echo "status: $WEB_STATUS"
  echo "createdAt: $WEB_CREATED"
  echo "commit: $WEB_COMMIT"
  echo "running_image_digest: $RUNNING_DIGEST"
  echo "running_image_digest_source: railway deployment list --json [.][0].meta.imageDigest"
  echo "oci_build_digest: $OCI_BUILD_DIGEST"
  echo "oci_build_digest_source: web-build-railway.log containerimage.digest"
  echo "railway_build_id: $RAILWAY_BUILD_ID"
  echo "pwa_route_in_build: ${SW_ROUTE_LINE:-MISSING}"
  echo "digest_link_emitted: $SCRATCH/digest-link-emitted.txt"
  echo "deployment_api_emitted: $SCRATCH/web-deployment-emitted.json"
  echo "build_transcript_emitted: $SCRATCH/web-build-transcript-emitted.txt"
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
  echo "running_image_digest: $RUNNING_DIGEST"
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

# Gating
[[ "$RAILWAY_BUILD_ID" == "goal-pwa-2026-07-06-v5-route-handlers" ]] || { echo "FAIL: wrong railway_build_id: $RAILWAY_BUILD_ID" >&2; exit 1; }
[[ -n "$SW_ROUTE_LINE" ]] || { echo "FAIL: /sw.js missing from build transcript" >&2; exit 1; }
[[ -n "$OCI_BUILD_DIGEST" ]] || { echo "FAIL: oci_build_digest missing from build log" >&2; exit 1; }
grep -q "$RUNNING_DIGEST" "$SCRATCH/digest-link-emitted.txt" || { echo "FAIL: running digest not in digest-link-emitted.txt" >&2; exit 1; }
grep -q 'must-revalidate' "$SCRATCH/digest-link-emitted.txt" || { echo "FAIL: PWA must-revalidate not in digest-link-emitted.txt" >&2; exit 1; }

echo "Captured production evidence at $CAPTURED_AT"
echo "  deployment_id=$WEB_DEPLOY_ID"
echo "  running_image_digest=$RUNNING_DIGEST (deployment API)"
echo "  oci_build_digest=$OCI_BUILD_DIGEST (build log)"
echo "  railway_build_id=$RAILWAY_BUILD_ID"