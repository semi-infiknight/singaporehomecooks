#!/usr/bin/env npx tsx
/**
 * Smoke Cooking soon via real cart → checkout funnel.
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
  console.log(`=== smoke-cooking-soon (cart→checkout) → ${BASE} ===`);

  const list = await json('/store/shc/drops');
  if (list.status === 404) throw new Error('GET /store/shc/drops 404 — redeploy medusa');
  if (list.status !== 200) throw new Error(`list ${list.status}`);
  console.log('✅ list marketplace drops', list.body?.count ?? list.body?.drops?.length);

  const cookLogin = await json('/store/shc/auth/cook/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.SEED_COOK_EMAIL || 'rose@shc.local',
      password: process.env.SEED_COOK_PASS || 'cooksecret',
    }),
  });
  if (cookLogin.status !== 200 || !cookLogin.body?.token) throw new Error(`cook login ${cookLogin.status}`);
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
      title: 'Smoke Samosas Cart',
      note: 'via cart checkout',
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

  // Customer
  const custLogin = await json('/store/shc/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local',
      password: process.env.SEED_CUSTOMER_PASS || 'customersecret',
    }),
  });
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

  // Cart path (not orderDrop)
  const cartAdd = await json('/store/shc/cart', {
    method: 'POST',
    token: custToken,
    body: JSON.stringify({ drop_id: dropId, qty: 3 }),
  });
  if (cartAdd.status !== 200) {
    throw new Error(`cart add drop ${cartAdd.status} ${JSON.stringify(cartAdd.body).slice(0, 200)}`);
  }
  if (!cartAdd.body?.cart?.drop_id) throw new Error('cart missing drop_id');
  console.log('✅ add drop to cart', cartAdd.body.cart.drop_id, 'qty', cartAdd.body.cart.items?.[0]?.qty);

  // Capacity not reserved until checkout
  const mid = await json(`/store/shc/drops/${encodeURIComponent(dropId)}`);
  const orderedBefore = mid.body?.drop?.ordered_qty;
  console.log('✅ ordered_qty before checkout', orderedBefore);

  const complete = await json('/store/shc/carts/demo-complete', {
    method: 'POST',
    token: custToken,
    body: JSON.stringify({
      collection_date: '2099-01-01', // ignored — server uses drop date
      collection_slot: '00:00-01:00',
      allergen_acked: true,
      pdpa_consent: true,
    }),
  });
  if (complete.status !== 200) {
    throw new Error(`demo-complete ${complete.status} ${JSON.stringify(complete.body).slice(0, 220)}`);
  }
  const order = complete.body?.order;
  if (!order?.id) throw new Error('no order from checkout');
  if (order.collection_date !== cookDate) {
    throw new Error(`expected locked cook_date ${cookDate} got ${order.collection_date}`);
  }
  if (order.collection_slot !== '18:00-19:00') {
    throw new Error(`expected locked slot got ${order.collection_slot}`);
  }
  console.log('✅ checkout complete', order.id, 'collection', order.collection_date, order.collection_slot);

  const after = await json(`/store/shc/drops/${encodeURIComponent(dropId)}`);
  const orderedAfter = after.body?.drop?.ordered_qty;
  if (Number(orderedAfter) < Number(orderedBefore) + 3) {
    throw new Error(`capacity not reserved: before=${orderedBefore} after=${orderedAfter}`);
  }
  console.log('✅ capacity reserved', orderedBefore, '→', orderedAfter, 'remaining', after.body?.drop?.remaining_qty);

  await json(`/store/shc/drops/${encodeURIComponent(dropId)}`, {
    method: 'PATCH',
    token: cookToken,
    body: JSON.stringify({ status: 'closed' }),
  });
  console.log('✅ close drop');

  // UI: cart path not orderDrop
  const dropPage = fs.readFileSync(path.join(process.cwd(), 'apps/web/app/drops/[id]/page.tsx'), 'utf8');
  if (!dropPage.includes('addDropToCart') && !dropPage.includes('useAddDropToCart')) {
    throw new Error('web drop page must use addDropToCart');
  }
  if (dropPage.includes('orderDrop') || dropPage.includes('useOrderDrop')) {
    throw new Error('web drop page must not call orderDrop');
  }
  if (!dropPage.includes('/checkout')) throw new Error('web drop page must navigate to checkout');
  const home = fs.readFileSync(path.join(process.cwd(), 'apps/web/app/page.tsx'), 'utf8');
  if (!home.includes('home-cooking-soon-rail')) throw new Error('home missing cooking soon rail');
  console.log('✅ UI cart→checkout wiring');

  console.log('\n=== smoke-cooking-soon PASSED ===');
}

main().catch((e) => {
  console.error('smoke-cooking-soon FAILED:', e.message || e);
  process.exit(1);
});
