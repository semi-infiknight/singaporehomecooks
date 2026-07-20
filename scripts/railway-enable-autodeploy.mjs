#!/usr/bin/env node
/**
 * Enable Railway GitHub auto-deploy on web, medusa, and worker (production).
 *
 * Prereqs:
 *   railway login && railway link -p homecooks
 *   A Railway workspace member must connect GitHub with contributor access to the repo
 *   (Railway dashboard → Account → GitHub, plus GitHub App repo access).
 *
 * Usage:
 *   pnpm railway:enable-autodeploy
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API = 'https://backboard.railway.com/graphql/v2';
const ROOT = path.join(import.meta.dirname, '..');
const RAILWAY = process.env.RAILWAY_BIN ?? 'railway';
const REPO = process.env.RAILWAY_GITHUB_REPO ?? 'semi-infiknight/singaporehomecooks';
const BRANCH = process.env.RAILWAY_GITHUB_BRANCH ?? 'main';
const SERVICES = (process.env.RAILWAY_AUTODEPLOY_SERVICES ?? 'web,medusa,worker').split(',').map((s) => s.trim());

function token() {
  if (process.env.RAILWAY_API_TOKEN) return process.env.RAILWAY_API_TOKEN;
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
    throw new Error('Run: railway link -p homecooks from the repo root');
  }
  return { projectId: proj.project, environmentId: proj.environment };
}

function serviceMap() {
  const out = execSync(`${RAILWAY} service list --json`, { cwd: ROOT, encoding: 'utf8' });
  const services = JSON.parse(out);
  return new Map(services.map((s) => [s.name, s.id]));
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
  const ids = serviceMap();

  console.log(`Connecting ${REPO}@${BRANCH} and enabling auto-deploy…`);
  for (const name of SERVICES) {
    const serviceId = ids.get(name);
    if (!serviceId) throw new Error(`Missing Railway service "${name}"`);

    execSync(
      `${RAILWAY} service source connect --repo ${REPO} --branch ${BRANCH} --service ${name}`,
      { cwd: ROOT, stdio: 'inherit' }
    );

    const result = await gql(
      `mutation($input: ServiceInstanceAutoDeployUpdateInput!) {
        serviceInstanceAutoDeployUpdate(input: $input) { enabled }
      }`,
      {
        input: { enabled: true, projectId, environmentId, serviceId },
      }
    );
    console.log(`  ✓ ${name}: auto-deploy ${result.serviceInstanceAutoDeployUpdate.enabled ? 'enabled' : 'disabled'}`);
  }

  const status = await gql(
    `query($id: String!) {
      environment(id: $id) {
        serviceInstances {
          edges {
            node {
              serviceName
              isUpdatable
              source { repo }
            }
          }
        }
      }
    }`,
    { id: environmentId }
  );

  console.log('\nStatus:');
  for (const edge of status.environment.serviceInstances.edges) {
    const node = edge.node;
    if (!SERVICES.includes(node.serviceName)) continue;
    console.log(`  ${node.serviceName}: isUpdatable=${node.isUpdatable} repo=${node.source?.repo ?? 'none'}`);
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message || err);
  console.error(
    '\nIf you see "No workspace member has their GitHub account connected", connect GitHub in the Railway dashboard,\ngrant the Railway GitHub App access to the repo, then re-run. GitHub Actions deploy is configured as a fallback.'
  );
  process.exit(1);
});
