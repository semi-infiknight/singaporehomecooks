#!/usr/bin/env npx tsx
/**
 * Smoke Cooking soon (cook drops) APIs.
 *   pnpm exec tsx scripts/smoke-cooking-soon.ts
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

async function json(pathname: string, init?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': pub(),
    ...(init?.headers as any),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  const res = await fetch(`${BASE}${pathname}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  console.log(`=== smoke-cooking-soon → ${BASE} ===`);

  // Public list (may be empty)
  const list = await json('/store/shc/drops');
  if (list.status === 404) throw new Error('GET /store/shc/drops 404 — redeploy medusa with shc-drop');
  if (list.status !== 200) throw new Error(`list ${list.status} ${JSON.stringify(list.body).slice(0, 160)}`);
  console.log('✅ list marketplace drops', list.body?.count ?? list.body?.drops?.length);

  // Cook login
  const cookLogin = await json('/store/shc/auth/cook/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.SEED_COOK_EMAIL || 'rose@shc.local',
      password: process.env.SEED_COOK_PASS || 'cooksecret',
    }),
  });
  if (cookLogin.status !== 200 || !cookLogin.body?.token) {
    throw new Error(`cook login ${cookLogin.status}`);
  }
  const cookToken = cookLogin.body.token as string;
  console.log('✅ cook login');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const cookDate = tomorrow.toISOString().slice(0, 10);
  const orderBy = new Date(Date.now() + 12 * 3600_000).toISOString();

  const created = await json('/store/shc/drops', {
    method: 'POST',
    token: cookToken,
    body: JSON.stringify({
      title: 'Smoke Samosas',
      note: 'with chutney',
      price: 1.2,
      min_qty: 5,
      max_qty: 30,
      cook_date: cookDate,
      collection_slot: '18:00-19:00',
      order_by: orderBy,
      visibility: 'marketplace',
    }),
  });
  if (created.status !== 201 && created.status !== 200) {
    throw new Error(`create drop ${created.status} ${JSON.stringify(created.body).slice(0, 200)}`);
  }
  const dropId = created.body?.drop?.id;
  if (!dropId) throw new Error('no drop id');
  console.log('✅ create drop', dropId);

  const mine = await json('/store/shc/drops?mine=true', { token: cookToken });
  if (mine.status !== 200) throw new Error(`mine ${mine.status}`);
  console.log('✅ mine drops', mine.body?.count);

  // Customer order
  const custLogin = await json('/store/shc/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local',
      password: process.env.SEED_CUSTOMER_PASS || 'customersecret',
    }),
  });
  // fallback medusa emailpass store customer
  let custToken = custLogin.body?.token as string | undefined;
  if (!custToken) {
    const alt = await fetch(`${BASE}/auth/customer/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': pub() },
      body: JSON.stringify({
        email: process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local',
        password: process.env.SEED_CUSTOMER_PASS || 'customersecret',
      }),
    });
    const altBody = await alt.json().catch(() => ({}));
    custToken = altBody.token;
  }
  if (!custToken) throw new Error('customer login failed');
  console.log('✅ customer login');

  const ordered = await json(`/store/shc/drops/${encodeURIComponent(dropId)}/order`, {
    method: 'POST',
    token: custToken,
    body: JSON.stringify({ qty: 3, allergen_acked: true, pdpa_consent: true }),
  });
  if (ordered.status !== 201 && ordered.status !== 200) {
    throw new Error(`order ${ordered.status} ${JSON.stringify(ordered.body).slice(0, 200)}`);
  }
  console.log('✅ order drop', ordered.body?.order?.id, 'remaining', ordered.body?.drop?.remaining_qty);

  // Close batch
  const closed = await json(`/store/shc/drops/${encodeURIComponent(dropId)}`, {
    method: 'PATCH',
    token: cookToken,
    body: JSON.stringify({ status: 'closed' }),
  });
  if (closed.status !== 200) throw new Error(`close ${closed.status}`);
  console.log('✅ close drop');

  // UI wiring
  const home = fs.readFileSync(path.join(process.cwd(), 'apps/web/app/page.tsx'), 'utf8');
  if (!home.includes('home-cooking-soon-rail')) throw new Error('web home missing cooking soon rail');
  const batches = fs.readFileSync(path.join(process.cwd(), 'apps/web/app/cook-portal/batches/page.tsx'), 'utf8');
  if (!batches.includes('Post a batch')) throw new Error('cook portal batches missing');
  console.log('✅ UI wiring present');

  console.log('\n=== smoke-cooking-soon PASSED ===');
}

main().catch((e) => {
  console.error('smoke-cooking-soon FAILED:', e.message || e);
  process.exit(1);
});
