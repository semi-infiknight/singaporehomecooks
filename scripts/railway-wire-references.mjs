#!/usr/bin/env node
/**
 * Wire Railway service references so the architecture canvas shows dependency lines.
 *
 * Railway only draws connections when env vars use ${{Service.VAR}} syntax —
 * hardcoded postgres.railway.internal / redis.railway.internal URLs work at
 * runtime but leave services visually disconnected on the dashboard.
 *
 * Usage: pnpm railway:wire
 *         pnpm railway:wire -- --no-redeploy
 * Prereqs: railway login && railway link (repo root)
 */
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const RAILWAY = process.env.RAILWAY_BIN ?? "railway";
const noRedeploy = process.argv.includes("--no-redeploy");

function set(service, pairs) {
  for (const [key, value] of pairs) {
    const escaped = value.replace(/'/g, "'\\''");
    execSync(`${RAILWAY} variable set ${key}='${escaped}' --service ${service} --skip-deploys`, {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

function redeploy(...services) {
  for (const svc of services) {
    console.log(`Redeploying ${svc}…`);
    execSync(`${RAILWAY} service link ${svc}`, { cwd: ROOT, stdio: "inherit" });
    execSync(`${RAILWAY} service redeploy --yes`, { cwd: ROOT, stdio: "inherit" });
  }
}

console.log("Wiring Railway ${{Service.VAR}} references for canvas visibility…\n");

// medusa → Postgres, Redis, minio (edges appear on architecture graph)
set("medusa", [
  ["DATABASE_URL", "${{Postgres.DATABASE_URL}}"],
  ["REDIS_URL", "${{Redis.REDIS_URL}}"],
  ["MINIO_ENDPOINT", "${{minio.RAILWAY_PRIVATE_DOMAIN}}:9000"],
  ["MINIO_ACCESS_KEY", "${{minio.MINIO_ROOT_USER}}"],
  ["MINIO_SECRET_KEY", "${{minio.MINIO_ROOT_PASSWORD}}"],
  ["MINIO_USE_SSL", "false"],
  ["MINIO_BUCKET", "shc-images"],
  ["MINIO_COMPLIANCE_BUCKET", "cook-certs"],
  ["WEB_PUBLIC_URL", "https://${{web.RAILWAY_PUBLIC_DOMAIN}}"],
  // Explicit origins only — never mix "*" with URLs (breaks browser sign-in CORS).
  // Include both custom domain (RAILWAY_PUBLIC_DOMAIN) and stable *.up.railway.app host —
  // custom domain alone left PWA sign-in as browser "Failed to fetch" when users hit Railway URL.
  [
    "STORE_CORS",
    "https://web-production-9226.up.railway.app,https://www.homecooksg.com,https://homecooksg.com,https://${{web.RAILWAY_PUBLIC_DOMAIN}},http://localhost:3001,http://localhost:8081,http://localhost:8082",
  ],
  [
    "AUTH_CORS",
    "https://web-production-9226.up.railway.app,https://www.homecooksg.com,https://homecooksg.com,https://${{web.RAILWAY_PUBLIC_DOMAIN}},http://localhost:3001,http://localhost:8081,http://localhost:8082",
  ],
]);

// worker → Postgres, medusa
set("worker", [
  ["DATABASE_URL", "${{Postgres.DATABASE_URL}}"],
  ["MEDUSA_URL", "https://${{medusa.RAILWAY_PUBLIC_DOMAIN}}"],
]);

// web → medusa (build-time API base)
set("web", [
  ["NEXT_PUBLIC_SHC_API_BASE", "https://${{medusa.RAILWAY_PUBLIC_DOMAIN}}"],
  ["WEB_PUBLIC_URL", "https://${{web.RAILWAY_PUBLIC_DOMAIN}}"],
]);

if (noRedeploy) {
  console.log("\n✓ References set (--no-redeploy: skipping service redeploys).");
} else {
  console.log("\n✓ References set. Redeploying medusa, worker, web…");
  redeploy("medusa", "worker", "web");
}

console.log("\nDone. Refresh the Railway canvas — you should see:");
console.log("  medusa ── Postgres, Redis, minio");
console.log("  worker ── Postgres, medusa");
console.log("  web    ── medusa");

if (!noRedeploy) {
  console.log("\nRunning cleanup audit…");
  execSync("node scripts/railway-cleanup.mjs", { cwd: ROOT, stdio: "inherit" });
}