#!/usr/bin/env node
/**
 * Audit and remove Railway orphans left behind by infra changes.
 *
 * Safe auto-delete targets:
 *   - Volumes with serviceName=null (detached orphans)
 *   - Empty/offline services with no deployments (e.g. abandoned duplicates)
 *
 * Reports (does not auto-delete):
 *   - Duplicate databases of the same type when one is clearly unwired
 *
 * Usage: pnpm railway:cleanup
 */
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const RAILWAY = process.env.RAILWAY_BIN ?? "railway";

function railJson(args) {
  const out = execSync(`${RAILWAY} ${args} --json`, { cwd: ROOT, encoding: "utf8" });
  return JSON.parse(out);
}

function deleteVolume(id, name) {
  console.log(`  🗑  volume ${name} (${id})`);
  execSync(`${RAILWAY} volume delete --volume ${id} --yes --json`, { cwd: ROOT, stdio: "pipe" });
}

function deleteService(name) {
  console.log(`  🗑  service ${name}`);
  execSync(`${RAILWAY} service delete --service ${name} --yes --json`, { cwd: ROOT, stdio: "pipe" });
}

function medusaRedisHost() {
  try {
    execSync(`${RAILWAY} service link medusa`, { cwd: ROOT, stdio: "pipe" });
    const vars = railJson("variable list");
    const url = vars.REDIS_URL || "";
    const m = url.match(/@([^:/]+)/);
    return m?.[1]?.replace(".railway.internal", "") ?? null;
  } catch {
    return null;
  }
}

console.log("Railway cleanup audit…\n");

const services = railJson("service list");
const volumes = railJson("volume list").volumes ?? [];

// 1. Orphan volumes (no attached service)
const orphans = volumes.filter((v) => !v.serviceName && !v.isPendingDeletion);
if (orphans.length) {
  console.log(`Orphan volumes (${orphans.length}):`);
  for (const v of orphans) {
    deleteVolume(v.id, v.name);
  }
} else {
  console.log("Orphan volumes: none");
}

// 2. Duplicate Redis / Postgres — report which medusa uses
const redisServices = services.filter((s) => /^redis/i.test(s.name));
if (redisServices.length > 1) {
  const wired = medusaRedisHost();
  console.log(`\nDuplicate Redis (${redisServices.length}): medusa wired to "${wired ?? "unknown"}"`);
  for (const s of redisServices) {
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const wiredSlug = (wired ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const isWired =
      s.name === "Redis" && wired === "redis" ||
      slug.includes(wiredSlug) ||
      wiredSlug.includes(slug);
    if (!isWired && !s.latestDeployment) {
      console.log(`  🗑  unused Redis service ${s.name} (no deployments)`);
      deleteService(s.name);
    } else if (!isWired) {
      console.log(`  ⚠  ${s.name} looks unused — verify, then: railway service delete --service ${s.name} --yes`);
    }
  }
}

// 3. Abandoned empty services
const abandoned = services.filter(
  (s) => !s.source?.repo && !s.source?.image && !s.latestDeployment && s.name !== "minio"
);
if (abandoned.length) {
  console.log(`\nAbandoned services (${abandoned.length}):`);
  for (const s of abandoned) {
    deleteService(s.name);
  }
} else {
  console.log("\nAbandoned services: none");
}

const pending = volumes.filter((v) => v.isPendingDeletion);
if (pending.length) {
  console.log(`\nVolumes pending deletion (${pending.length}): ${pending.map((v) => v.name).join(", ")}`);
}

console.log("\n✓ Cleanup audit complete");