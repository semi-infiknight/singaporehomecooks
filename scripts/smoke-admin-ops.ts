#!/usr/bin/env npx tsx
/**
 * Smoke admin ops APIs used by /ops dashboard.
 *   pnpm exec tsx scripts/smoke-admin-ops.ts
 */
import fs from 'fs';
import path from 'path';
import {
  RAILWAY_MEDUSA_PUBLISHABLE_KEY,
  resolveRailwayMedusaBase,
  resolveRailwayPublishableKey,
} from '../packages/shc-utils/src/railway-client';

const BASE = resolveRailwayMedusaBase(process.env.MEDUSA_URL);

function pub() {
  for (const rel of ['apps/web/.env.local']) {
    const p = path.join(process.cwd(), rel);
    if (fs.existsSync(p)) {
      const m = fs.readFileSync(p, 'utf8').match(/(?:NEXT_PUBLIC_)?MEDUSA_PUBLISHABLE_KEY=(.+)/);
      if (m) return resolveRailwayPublishableKey(m[1].trim());
    }
  }
  return RAILWAY_MEDUSA_PUBLISHABLE_KEY;
}

let adminToken = '';

async function get(pathname: string) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: {
      'x-publishable-api-key': pub(),
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function post(pathname: string, body: unknown) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST',
    headers: {
      'x-publishable-api-key': pub(),
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

async function main() {
  console.log(`=== smoke-admin-ops → ${BASE} ===`);

  const login = await fetch(`${BASE}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SEED_ADMIN_EMAIL || 'admin@shc.local',
      password: process.env.SEED_ADMIN_PASS || 'supersecret',
    }),
  });
  const loginBody = await login.json().catch(() => ({}));
  if (!login.ok || !loginBody.token) throw new Error(`admin login ${login.status}`);
  adminToken = loginBody.token;
  console.log('✅ admin login');

  const health = await get('/admin/shc/health');
  if (health.status !== 200) throw new Error(`health ${health.status}`);
  console.log('✅ health', health.body?.status || health.body?.ok);

  const overview = await get('/admin/shc/overview');
  if (overview.status === 404) throw new Error('overview 404 — redeploy medusa');
  if (overview.status !== 200) throw new Error(`overview ${overview.status} ${JSON.stringify(overview.body).slice(0, 160)}`);
  console.log('✅ overview', overview.body?.overview);

  const orders = await get('/admin/shc/orders?limit=20');
  if (orders.status !== 200) throw new Error(`orders ${orders.status}`);
  console.log('✅ orders', orders.body?.count ?? orders.body?.orders?.length);

  const cats = await get('/admin/shc/categories');
  if (cats.status !== 200) throw new Error(`categories ${cats.status}`);
  console.log('✅ admin categories', cats.body?.count);

  const pubCats = await get('/store/shc/categories');
  if (pubCats.status !== 200) throw new Error(`store categories ${pubCats.status}`);
  console.log('✅ store categories', pubCats.body?.count, pubCats.body?.categories?.[1]?.label);

  // Upsert a test category then disable it (idempotent)
  const up = await post('/admin/shc/categories', {
    id: 'OpsTest',
    label: 'Ops Test',
    imageUrl: '',
    enabled: true,
    sort_order: 99,
  });
  if (up.status !== 200) throw new Error(`category upsert ${up.status} ${JSON.stringify(up.body).slice(0, 160)}`);
  console.log('✅ category upsert', up.body?.action);

  // UI file checks
  const ops = fs.readFileSync(path.join(process.cwd(), 'apps/web/app/ops/page.tsx'), 'utf8');
  for (const n of ['ops-dashboard', 'ops-login', 'ops-tab-', 'ops-panel-overview', 'ops-orders-list', 'ops-panel-catalog']) {
    if (!ops.includes(n)) throw new Error(`ops UI missing ${n}`);
  }
  console.log('✅ ops UI tabs wired');

  console.log('\n=== smoke-admin-ops PASSED ===');
}

main().catch((e) => {
  console.error('smoke-admin-ops FAILED:', e.message || e);
  process.exit(1);
});
