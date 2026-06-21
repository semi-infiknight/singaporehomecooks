#!/usr/bin/env node
/**
 * Configure a Railway service instance (config file, dockerfile, healthcheck) and optionally redeploy.
 *
 * Usage:
 *   node scripts/railway-configure-service.mjs --service worker --config railway.worker.toml --dockerfile apps/worker/Dockerfile --health /health
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API = 'https://backboard.railway.com/graphql/v2';
const ROOT = path.join(import.meta.dirname, '..');
const RAILWAY = process.env.RAILWAY_BIN ?? 'railway';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { redeploy: true };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--service') out.service = args[++i];
    else if (args[i] === '--config') out.config = args[++i];
    else if (args[i] === '--dockerfile') out.dockerfile = args[++i];
    else if (args[i] === '--health') out.health = args[++i];
    else if (args[i] === '--start') out.start = args[++i];
    else if (args[i] === '--no-redeploy') out.redeploy = false;
  }
  if (!out.service || !out.config) {
    throw new Error('Required: --service <name> --config <file> [--dockerfile path] [--health path] [--start cmd]');
  }
  return out;
}

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

function serviceId(name) {
  const out = execSync(`${RAILWAY} service list --json`, { cwd: ROOT, encoding: 'utf8' });
  const services = JSON.parse(out);
  const svc = services.find((s) => s.name === name);
  if (!svc?.id) throw new Error(`No service named "${name}"`);
  return svc.id;
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
  const opts = parseArgs();
  const { environmentId } = linkedContext();
  const svcId = serviceId(opts.service);

  const input = {
    railwayConfigFile: opts.config,
    healthcheckTimeout: 300,
    restartPolicyType: 'ON_FAILURE',
    restartPolicyMaxRetries: 3,
  };
  if (opts.dockerfile) input.dockerfilePath = opts.dockerfile;
  if (opts.health) input.healthcheckPath = opts.health;
  if (opts.start) input.startCommand = opts.start;

  console.log(`Configuring Railway ${opts.service} → ${opts.config}`);
  await gql(
    `mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }`,
    { serviceId: svcId, environmentId, input }
  );
  console.log('  ✓ service config updated');

  if (opts.redeploy) {
    const deployId = await gql(
      `mutation($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
      }`,
      { serviceId: svcId, environmentId }
    );
    console.log(`  ✓ redeploy triggered: ${deployId.serviceInstanceDeployV2}`);
  }
}

main().catch((err) => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});