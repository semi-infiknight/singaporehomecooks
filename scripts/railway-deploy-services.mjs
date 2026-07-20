#!/usr/bin/env node
/**
 * Redeploy Railway services from the latest GitHub commit on main.
 *
 * Usage:
 *   node scripts/railway-deploy-services.mjs web
 *   node scripts/railway-deploy-services.mjs web medusa worker
 *   SERVICES=web,medusa node scripts/railway-deploy-services.mjs
 *
 * Env (CI):
 *   RAILWAY_API_TOKEN — team/account token (NOT RAILWAY_TOKEN)
 *   RAILWAY_PROJECT_ID / RAILWAY_ENVIRONMENT_ID — optional; defaults from railway link
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const RAILWAY = process.env.RAILWAY_BIN ?? 'railway';
const DEFAULT_PROJECT = '09a28324-88a2-4ad0-aa5f-54bc2198007b';
const DEFAULT_ENV = '546be85e-73ad-4df7-b105-4bfd90b280c0';

function servicesFromArgs() {
  const fromEnv = process.env.SERVICES?.split(',').map((s) => s.trim()).filter(Boolean);
  const fromArgs = process.argv.slice(2).filter(Boolean);
  const list = fromEnv?.length ? fromEnv : fromArgs;
  if (!list.length) throw new Error('Pass service names: web medusa worker');
  return list;
}

function ensureAuth() {
  if (process.env.RAILWAY_API_TOKEN) {
    if (process.env.RAILWAY_TOKEN) delete process.env.RAILWAY_TOKEN;
    return;
  }
  const cfgPath = path.join(os.homedir(), '.railway', 'config.json');
  if (!fs.existsSync(cfgPath)) {
    throw new Error('Set RAILWAY_API_TOKEN or run: railway login');
  }
}

function railwayEnv() {
  return {
    ...process.env,
    RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID ?? DEFAULT_PROJECT,
    RAILWAY_ENVIRONMENT_ID: process.env.RAILWAY_ENVIRONMENT_ID ?? DEFAULT_ENV,
  };
}

function deploy(service) {
  console.log(`→ redeploy ${service} from latest main`);
  execSync(`${RAILWAY} redeploy --from-source --service ${service} -y`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: railwayEnv(),
  });
}

function main() {
  ensureAuth();
  for (const service of servicesFromArgs()) {
    deploy(service);
  }
  console.log('Done.');
}

main();
