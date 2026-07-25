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
 *   RAILWAY_API_TOKEN — team/account API token (required in GitHub Actions)
 *   RAILWAY_PROJECT_ID / RAILWAY_ENVIRONMENT_ID — optional; defaults below
 *   RAILWAY_BIN — optional path to railway CLI
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
  const fromArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const list = fromEnv?.length ? fromEnv : fromArgs;
  if (!list.length) throw new Error('Pass service names: web medusa worker');
  return list;
}

function resolveToken() {
  const token = process.env.RAILWAY_API_TOKEN?.trim();
  if (token) return token;

  const cfgPath = path.join(os.homedir(), '.railway', 'config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const fromLogin = cfg?.user?.accessToken?.trim();
    if (fromLogin) return fromLogin;
  }

  throw new Error(
    'Missing Railway auth. In GitHub Actions set secret RAILWAY_API_TOKEN to a Railway account/team API token (Railway dashboard → Account → Tokens). Do not use a project-scoped RAILWAY_TOKEN.'
  );
}

function railwayEnv(token) {
  const env = {
    ...process.env,
    RAILWAY_API_TOKEN: token,
    RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID ?? DEFAULT_PROJECT,
    RAILWAY_ENVIRONMENT_ID: process.env.RAILWAY_ENVIRONMENT_ID ?? DEFAULT_ENV,
  };
  // Project-scoped RAILWAY_TOKEN breaks team-token auth — never pass it to the CLI.
  delete env.RAILWAY_TOKEN;
  return env;
}

function verifyToken(env) {
  try {
    execSync(`${RAILWAY} service list --json`, {
      cwd: ROOT,
      stdio: 'pipe',
      env,
    });
  } catch {
    throw new Error(
      'Railway token rejected (Unauthorized). Update GitHub secret RAILWAY_API_TOKEN: Railway dashboard → Account → Tokens → create account/team token with deploy access. See RAILWAY_DEPLOY.md §9.'
    );
  }
}

function deploy(service, env) {
  const projectId = env.RAILWAY_PROJECT_ID;
  const environmentId = env.RAILWAY_ENVIRONMENT_ID;
  console.log(`→ redeploy ${service} from latest main (${projectId.slice(0, 8)}…)`);
  execSync(
    `${RAILWAY} redeploy --from-source --service ${service} --project ${projectId} --environment ${environmentId} -y`,
    {
      cwd: ROOT,
      stdio: 'inherit',
      env,
    }
  );
}

function main() {
  const token = resolveToken();
  const env = railwayEnv(token);
  verifyToken(env);

  if (process.argv.includes('--check-token')) {
    console.log('✅ Railway token OK');
    return;
  }

  const services = servicesFromArgs();
  for (const service of services) {
    deploy(service, env);
  }
  console.log('Done.');
}

main();
