#!/usr/bin/env node
/**
 * Point the Railway "web" service at railway.web.toml (Next.js Dockerfile + / healthcheck).
 * Root railway.toml is Medusa-only; without this override, web builds the Medusa image and fails.
 *
 * Prereqs: railway login && railway link -p <project> (from repo root)
 *
 * Usage:
 *   pnpm railway:configure-web
 *   RAILWAY_WEB_SERVICE_ID=<uuid> node scripts/railway-configure-web.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API = 'https://backboard.railway.com/graphql/v2';
const ROOT = path.join(import.meta.dirname, '..');
const RAILWAY = process.env.RAILWAY_BIN ?? 'railway';

function token() {
  if (process.env.RAILWAY_TOKEN) return process.env.RAILWAY_TOKEN;
  const cfgPath = path.join(os.homedir(), '.railway', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const t = cfg?.user?.accessToken;
  if (!t) throw new Error('Not logged in. Run: railway login');
  return t;
}

function linkedContext() {
  const cfgPath = path.join(os.homedir(), '.railway', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const proj = cfg.projects?.[ROOT];
  if (!proj?.project || !proj?.environment) {
    throw new Error('Run: railway link -p <project> from the repo root');
  }
  return { projectId: proj.project, environmentId: proj.environment };
}

function webServiceId() {
  if (process.env.RAILWAY_WEB_SERVICE_ID) return process.env.RAILWAY_WEB_SERVICE_ID;
  const out = execSync(`${RAILWAY} service list --json`, { cwd: ROOT, encoding: 'utf8' });
  const services = JSON.parse(out);
  const web = services.find((s) => s.name === 'web');
  if (!web?.id) {
    throw new Error('No service named "web". Create it first — see RAILWAY_DEPLOY.md §5');
  }
  return web.id;
}

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function main() {
  const { projectId, environmentId } = linkedContext();
  const serviceId = webServiceId();

  console.log('Configuring Railway web service → railway.web.toml');
  await gql(
    `mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }`,
    {
      serviceId,
      environmentId,
      input: {
        railwayConfigFile: 'railway.web.toml',
        dockerfilePath: 'apps/web/Dockerfile',
        healthcheckPath: '/',
        healthcheckTimeout: 300,
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 3,
      },
    }
  );
  console.log('  ✓ web service config updated');
  const deployId = await gql(
    `mutation($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
    }`,
    { serviceId, environmentId }
  );
  console.log(`  ✓ redeploy triggered: ${deployId.serviceInstanceDeployV2}`);
  console.log(`Project: ${projectId}`);
}

main().catch((err) => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});