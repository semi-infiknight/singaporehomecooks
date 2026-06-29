#!/usr/bin/env npx tsx
/**
 * Smoke test: real Medusa /store/shc/* with publishable key + auth.
 * Tier 1 E2E: core order → messages → collected/completed → credits → review → growth flow.
 * Run after: docker:up, medusa:dev:admin, bootstrap:medusa, seed:medusa
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.MEDUSA_URL || process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000';
const CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local';
const CUSTOMER_PASS = process.env.SEED_CUSTOMER_PASS || 'customersecret';
const COOK_EMAIL = 'rose@shc.local';
const COOK_PASS = 'cooksecret';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@shc.local';
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || 'supersecret';

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

async function adminFetch(pathname: string, init?: RequestInit, token?: string) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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

async function loginAdmin() {
  const r = await adminFetch('/auth/user/emailpass', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (r.status !== 200 || !r.body?.token) {
    throw new Error(`Admin login failed ${r.status}: ${JSON.stringify(r.body)}`);
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
  console.log('=== SHC Real Medusa E2E Smoke Test (Tier 1) ===');
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
  console.log('✅ /store/shc/cart POST (Postgres-backed)');

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
  const found = (customerOrders.body?.orders ?? []).some((o: { order_id?: string; id?: string }) => o.order_id === orderId || o.id === orderId);
  if (!found) throw new Error(`Order ${orderId} not in customer orders list`);
  console.log('✅ /store/shc/orders?role=customer');

  const msgCustomer = await shcFetch(
    `/store/shc/orders/${orderId}/messages`,
    { method: 'POST', body: JSON.stringify({ body: 'See you at collection — HDB lift landing.', from: 'customer' }) },
    customerToken
  );
  if (msgCustomer.status !== 201 && msgCustomer.status !== 200) {
    throw new Error(`Customer message failed ${msgCustomer.status}: ${JSON.stringify(msgCustomer.body)}`);
  }
  console.log('✅ /store/shc/orders/:id/messages POST (customer)');

  const cookToken = await loginCook();
  console.log('✅ cook auth login (DB-backed)');

  const msgCook = await shcFetch(
    `/store/shc/orders/${orderId}/messages`,
    { method: 'POST', body: JSON.stringify({ body: 'Thanks! Shoes off please, call when you arrive.', from: 'cook' }) },
    cookToken
  );
  if (msgCook.status !== 201 && msgCook.status !== 200) {
    throw new Error(`Cook message failed ${msgCook.status}: ${JSON.stringify(msgCook.body)}`);
  }
  console.log('✅ /store/shc/orders/:id/messages POST (cook)');

  const cookOrders = await shcFetch('/store/shc/orders?role=cook', { method: 'GET' }, cookToken);
  if (cookOrders.status !== 200) throw new Error(`Cook orders failed ${cookOrders.status}`);
  console.log('✅ /store/shc/orders?role=cook');

  for (const state of ['accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'] as const) {
    await transitionOrder(orderId, state, cookToken);
    console.log(`✅ order transition → ${state}`);
  }

  const orderDetail = await shcFetch(`/store/shc/orders/${orderId}`, { method: 'GET' }, cookToken);
  if (orderDetail.status !== 200) throw new Error(`Order detail failed ${orderDetail.status}`);
  const status = orderDetail.body?.order?.shc_status;
  if (status !== 'completed') {
    throw new Error(`Expected completed, got ${status}`);
  }
  console.log('✅ /store/shc/orders/:id (completed)');

  const creditsBefore = await shcFetch('/store/shc/credits', { method: 'GET' }, customerToken);
  if (creditsBefore.status !== 200) throw new Error(`Credits GET failed ${creditsBefore.status}`);
  // Credits redeem E2E completed: always test second checkout with /checkout-credits (award if needed)
  let balance = creditsBefore.body?.balance ?? 0;
  console.log(`✅ /store/shc/credits (balance=${balance})`);
  if (balance <= 0) {
    throw new Error('Expected credits balance > 0 after completed order (check awardCreditsOnComplete + order meta total_cents)');
  }

  await shcFetch('/store/shc/cart', { method: 'DELETE' }, customerToken);
  const cartAdd2 = await shcFetch(
    '/store/shc/cart',
    { method: 'POST', body: JSON.stringify({ product_id: 'dish_nasi_lemak_prawn_001', qty: 5 }) },
    customerToken
  );
  if (cartAdd2.status !== 200) {
    throw new Error(`Second cart add failed ${cartAdd2.status}: ${JSON.stringify(cartAdd2.body)}`);
  }

  const creditsToApply = Math.min(balance, 500);
  const creditsCheckout = await shcFetch(
    '/store/shc/checkout-credits',
    {
      method: 'POST',
      body: JSON.stringify({
        allergenAck: true,
        collection: { date: '2026-06-21', slot: '18:00-19:00' },
        creditsToApply,
        isCorporate: false,
      }),
    },
    customerToken
  );
  if (creditsCheckout.status !== 200 || !creditsCheckout.body?.order?.id) {
    throw new Error(`checkout-credits failed ${creditsCheckout.status}: ${JSON.stringify(creditsCheckout.body)}`);
  }
  const creditsOrderId = creditsCheckout.body.order.id as string;
  const applied = creditsCheckout.body.order.credits_applied ?? creditsCheckout.body.credits_applied ?? 0;
  if (applied <= 0) {
    throw new Error(`checkout-credits did not apply credits (applied=${applied})`);
  }
  console.log(`✅ /store/shc/checkout-credits (${creditsOrderId}, applied=${applied})`);

  const creditsAfter = await shcFetch('/store/shc/credits', { method: 'GET' }, customerToken);
  if (creditsAfter.status !== 200) throw new Error(`Credits GET after redeem failed ${creditsAfter.status}`);
  const balanceAfter = creditsAfter.body?.balance ?? 0;
  if (balanceAfter >= balance) {
    throw new Error(`Expected credits balance to drop after redeem (before=${balance}, after=${balanceAfter})`);
  }
  console.log(`✅ /store/shc/credits after redeem (balance=${balanceAfter})`);

  try {
    const adminToken = await loginAdmin();
    const ledger = await adminFetch(`/admin/shc/ledger?order_id=${orderId}`, { method: 'GET' }, adminToken);
    if (ledger.status === 200 && (ledger.body?.entries?.length ?? 0) > 0) {
      console.log(`✅ /admin/shc/ledger (order_id=${orderId}, entries=${ledger.body.entries.length})`);
    } else {
      console.warn('⚠️  ledger entries empty — commission post may be deferred');
    }
  } catch (e: any) {
    console.warn('⚠️  admin ledger check skipped:', e.message);
  }

  const review = await shcFetch(
    `/store/shc/orders/${orderId}/review`,
    { method: 'POST', body: JSON.stringify({ rating: 5, body: 'Heritage nasi lemak was perfect for our gathering.' }) },
    customerToken
  );
  if (review.status !== 201 && review.status !== 200) {
    throw new Error(`Review failed ${review.status}: ${JSON.stringify(review.body)}`);
  }
  console.log('✅ /store/shc/orders/:id/review POST');

  const reviewGet = await shcFetch(`/store/shc/orders/${orderId}/review`, { method: 'GET' }, customerToken);
  if (reviewGet.status !== 200 || !reviewGet.body?.review?.rating) {
    throw new Error(`Review GET failed ${reviewGet.status}: ${JSON.stringify(reviewGet.body)}`);
  }
  console.log('✅ /store/shc/orders/:id/review GET');

  const reqCreate = await shcFetch(
    '/store/shc/requests',
    {
      method: 'POST',
      body: JSON.stringify({
        body: 'Looking for ayam buah keluak for 8 guests Hari Raya weekend',
        party_size: 8,
        budget_cents: 18000,
        date: '2026-07-12',
      }),
    },
    customerToken
  );
  if (reqCreate.status !== 201 && reqCreate.status !== 200) {
    throw new Error(`Request create failed ${reqCreate.status}: ${JSON.stringify(reqCreate.body)}`);
  }
  const requestId = reqCreate.body?.request?.id;
  if (!requestId) throw new Error('Request id missing');
  console.log(`✅ /store/shc/requests POST (${requestId})`);

  const bidCreate = await shcFetch(
    '/store/shc/bids',
    { method: 'POST', body: JSON.stringify({ request_id: requestId, price_cents: 16000, message: 'Family recipe from Tampines HDB kitchen.' }) },
    cookToken
  );
  if (bidCreate.status !== 201 && bidCreate.status !== 200) {
    throw new Error(`Bid create failed ${bidCreate.status}: ${JSON.stringify(bidCreate.body)}`);
  }
  const bidId = bidCreate.body?.bid?.id;
  if (!bidId) throw new Error('Bid id missing');
  console.log(`✅ /store/shc/bids POST (${bidId})`);

  const bidAccept = await shcFetch(`/store/shc/bids/${bidId}/accept`, { method: 'POST', body: '{}' }, customerToken);
  if (bidAccept.status !== 200) {
    throw new Error(`Bid accept failed ${bidAccept.status}: ${JSON.stringify(bidAccept.body)}`);
  }
  if (!bidAccept.body?.order_id) throw new Error('Bid accept missing order_id');
  console.log(`✅ /store/shc/bids/:id/accept (${bidAccept.body.order_id})`);

  console.log('\n=== verify:real-e2e PASSED (Tier 1) ===');
}

main().catch((e) => {
  console.error('verify:real-e2e FAILED:', e.message || e);
  process.exit(1);
});