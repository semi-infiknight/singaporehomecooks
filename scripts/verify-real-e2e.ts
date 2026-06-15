#!/usr/bin/env npx tsx
/**
 * Smoke test: real Medusa /store/shc/* with publishable key + auth.
 * Run after: docker:up, medusa:dev:admin, bootstrap:medusa, seed:medusa
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.MEDUSA_URL || process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000';
const CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local';
const CUSTOMER_PASS = process.env.SEED_CUSTOMER_PASS || 'customersecret';
const COOK_EMAIL = 'rose@shc.local';
const COOK_PASS = 'cooksecret';

function loadPubKey(): string {
  if (process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    return process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  }
  for (const rel of ['apps/mobile-customer/.env.local', 'apps/web/.env.local']) {
    const envLocal = path.join(__dirname, '..', rel);
    if (fs.existsSync(envLocal)) {
      const m = fs.readFileSync(envLocal, 'utf8').match(/(?:EXPO_PUBLIC_|NEXT_PUBLIC_)?MEDUSA_PUBLISHABLE_KEY=(.+)/);
      if (m) return m[1].trim();
    }
  }
  throw new Error('No publishable key. Run: pnpm bootstrap:medusa');
}

async function shcFetch(pathname: string, init?: RequestInit, token?: string) {
  const pubKey = loadPubKey();
  const res = await fetch(`${BASE}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': pubKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string>),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function loginCustomer() {
  const r = await shcFetch('/store/shc/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASS }),
  });
  if (r.status !== 200 || !r.body?.token) {
    throw new Error(`Customer login failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  return r.body.token as string;
}

async function loginCook() {
  const r = await shcFetch('/store/shc/auth/cook/login', {
    method: 'POST',
    body: JSON.stringify({ email: COOK_EMAIL, password: COOK_PASS }),
  });
  if (r.status !== 200 || !r.body?.token) {
    throw new Error(`Cook login failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  return r.body.token as string;
}

async function transitionOrder(orderId: string, to: string, cookToken: string) {
  const r = await shcFetch(
    `/store/shc/orders/${orderId}/transition`,
    { method: 'POST', body: JSON.stringify({ to }) },
    cookToken
  );
  if (r.status !== 200) {
    throw new Error(`Transition to ${to} failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  return r.body;
}

async function main() {
  console.log('=== SHC Real Medusa E2E Smoke Test ===');
  console.log('Base:', BASE);

  const health = await fetch(`${BASE}/health`);
  if (!health.ok) throw new Error(`/health failed: ${health.status}`);
  console.log('✅ /health');

  const cooks = await shcFetch('/store/shc/cooks');
  if (cooks.status !== 200) throw new Error(`/store/shc/cooks ${cooks.status}`);
  const cookCount = cooks.body?.cooks?.length ?? 0;
  if (cookCount < 1) throw new Error('Expected >=1 cook. Run: cd apps/medusa && pnpm seed');
  console.log(`✅ /store/shc/cooks (${cookCount})`);

  const products = await shcFetch('/store/shc/products');
  if (products.status !== 200) throw new Error(`/store/shc/products ${products.status}`);
  const productList = products.body?.products ?? [];
  console.log(`✅ /store/shc/products (${productList.length})`);

  const canonical = productList.find((p: { id?: string }) => p.id === 'dish_nasi_lemak_prawn_001');
  if (!canonical) {
    console.warn('⚠️  dish_nasi_lemak_prawn_001 not in products — re-run medusa seed');
  } else {
    const detail = await shcFetch('/store/shc/products/dish_nasi_lemak_prawn_001');
    if (detail.status !== 200) throw new Error(`Product detail failed ${detail.status}`);
    console.log('✅ /store/shc/products/dish_nasi_lemak_prawn_001');
  }

  const customerToken = await loginCustomer();
  console.log('✅ customer auth login');

  const me = await shcFetch('/store/shc/auth/me', { method: 'GET' }, customerToken);
  if (me.status !== 200 || !me.body?.user?.id) {
    throw new Error(`/auth/me failed ${me.status}: ${JSON.stringify(me.body)}`);
  }
  console.log('✅ /store/shc/auth/me (customer)');

  await shcFetch('/store/shc/cart', { method: 'DELETE' }, customerToken);

  const cartAdd = await shcFetch(
    '/store/shc/cart',
    { method: 'POST', body: JSON.stringify({ product_id: 'dish_nasi_lemak_prawn_001', qty: 5 }) },
    customerToken
  );
  if (cartAdd.status !== 200) throw new Error(`Cart add failed ${cartAdd.status}: ${JSON.stringify(cartAdd.body)}`);
  console.log('✅ /store/shc/cart POST (authenticated)');

  const checkout = await shcFetch(
    '/store/shc/carts/demo-complete',
    {
      method: 'POST',
      body: JSON.stringify({
        collection_date: '2026-06-20',
        collection_slot: '18:00-19:00',
        allergen_acked: true,
        pdpa_consent: true,
      }),
    },
    customerToken
  );
  if (checkout.status !== 200 || !checkout.body?.order?.id) {
    throw new Error(`Checkout failed ${checkout.status}: ${JSON.stringify(checkout.body)}`);
  }
  const orderId = checkout.body.order.id as string;
  console.log(`✅ /store/shc/carts/demo-complete (${orderId})`);

  const customerOrders = await shcFetch('/store/shc/orders?role=customer', { method: 'GET' }, customerToken);
  if (customerOrders.status !== 200) throw new Error(`Customer orders failed ${customerOrders.status}`);
  const found = (customerOrders.body?.orders ?? []).some((o: { order_id?: string }) => o.order_id === orderId);
  if (!found) throw new Error(`Order ${orderId} not in customer orders list`);
  console.log('✅ /store/shc/orders?role=customer');

  const cookToken = await loginCook();
  console.log('✅ cook auth login');

  const cookOrders = await shcFetch('/store/shc/orders?role=cook', { method: 'GET' }, cookToken);
  if (cookOrders.status !== 200) throw new Error(`Cook orders failed ${cookOrders.status}`);
  console.log('✅ /store/shc/orders?role=cook');

  for (const state of ['accepted', 'preparing', 'ready_for_collection'] as const) {
    await transitionOrder(orderId, state, cookToken);
    console.log(`✅ order transition → ${state}`);
  }

  const orderDetail = await shcFetch(`/store/shc/orders/${orderId}`, { method: 'GET' }, cookToken);
  if (orderDetail.status !== 200) throw new Error(`Order detail failed ${orderDetail.status}`);
  const status = orderDetail.body?.order?.shc_status || orderDetail.body?.shc_meta?.shc_status;
  if (status !== 'ready_for_collection') {
    throw new Error(`Expected ready_for_collection, got ${status}`);
  }
  console.log('✅ /store/shc/orders/:id (ready_for_collection)');

  console.log('\n=== verify:real-e2e PASSED ===');
}

main().catch((e) => {
  console.error('verify:real-e2e FAILED:', e.message || e);
  process.exit(1);
});