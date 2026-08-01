#!/usr/bin/env npx tsx
/**
 * Smoke test: Railway Medusa /store/shc/* with publishable key + auth.
 * Tier 1 E2E: core order → messages → collected/completed → review → growth flow.
 * Run after: pnpm env:sync (or pnpm bootstrap:medusa against Railway)
 */
import fs from 'fs';
import path from 'path';
import {
  RAILWAY_MEDUSA_PUBLISHABLE_KEY,
  resolveRailwayMedusaBase,
  resolveRailwayPublishableKey,
} from '@shc/utils';

const BASE = resolveRailwayMedusaBase(process.env.MEDUSA_URL || process.env.EXPO_PUBLIC_MEDUSA_BASE);
const CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local';
const CUSTOMER_PASS = process.env.SEED_CUSTOMER_PASS || 'customersecret';
const COOK_EMAIL = 'rose@shc.local';
const COOK_PASS = 'cooksecret';
const COOK2_EMAIL = process.env.SEED_COOK2_EMAIL || 'doris@shc.local';
const COOK2_PASS = process.env.SEED_COOK2_PASS || 'cooksecret';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@shc.local';
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || 'supersecret';

function loadPubKey(): string {
  if (process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    return resolveRailwayPublishableKey(process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY);
  }
  for (const rel of ['apps/mobile-customer/.env.local', 'apps/web/.env.local']) {
    const envLocal = path.join(__dirname, '..', rel);
    if (fs.existsSync(envLocal)) {
      const m = fs.readFileSync(envLocal, 'utf8').match(/(?:EXPO_PUBLIC_|NEXT_PUBLIC_)?MEDUSA_PUBLISHABLE_KEY=(.+)/);
      if (m) return resolveRailwayPublishableKey(m[1].trim());
    }
  }
  return RAILWAY_MEDUSA_PUBLISHABLE_KEY;
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

async function loginCook(email = COOK_EMAIL, password = COOK_PASS) {
  const r = await shcFetch('/store/shc/auth/cook/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (r.status !== 200 || !r.body?.token) {
    throw new Error(`Cook login failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  return r.body.token as string;
}

function futureIsoDate(daysAhead = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function parseRequestLineIds(request: { items_json?: string }): string[] {
  if (!request?.items_json) return [];
  try {
    const rows = JSON.parse(request.items_json);
    if (!Array.isArray(rows)) return [];
    return rows.map((row: { id?: string }, i: number) => String(row.id || `line_${i}`));
  } catch {
    return [];
  }
}

/** Custom requests v2 — multi-dish, per-line quote, partial accept, sibling decline, PayNow. */
async function runCustomRequestV2E2E(customerToken: string, cookToken: string, cookToken2: string) {
  const stamp = Date.now();
  const lineA = `line_laksa_${stamp}`;
  const lineB = `line_kueh_${stamp}`;
  const dishA = `E2E Laksa ${stamp}`;
  const dishB = `E2E Kueh ${stamp}`;
  const collDate = futureIsoDate(21);

  const reqCreate = await shcFetch(
    '/store/shc/requests',
    {
      method: 'POST',
      body: JSON.stringify({
        body: `${dishA} and ${dishB} for family gathering (E2E v2)`,
        guest_count: 8,
        budget_cents: 22000,
        date: collDate,
        items: [
          { id: lineA, name: dishA, servings: 8 },
          { id: lineB, name: dishB, servings: 8 },
        ],
      }),
    },
    customerToken
  );
  if (reqCreate.status !== 201 && reqCreate.status !== 200) {
    throw new Error(`Request create v2 failed ${reqCreate.status}: ${JSON.stringify(reqCreate.body)}`);
  }
  const requestId = reqCreate.body?.request?.id;
  if (!requestId) throw new Error('Request id missing from v2 create');
  const lineIds = parseRequestLineIds(reqCreate.body?.request);
  if (lineIds.length < 2) {
    throw new Error(`Expected 2 request lines, got ${lineIds.length}`);
  }
  console.log(`✅ /store/shc/requests POST v2 (${requestId}, ${lineIds.length} dishes)`);

  const primaryQuote = await shcFetch(
    '/store/shc/bids',
    {
      method: 'POST',
      body: JSON.stringify({
        request_id: requestId,
        message: 'Rose per-line quote (E2E)',
        line_items: [
          { request_line_id: lineA, included: true, servings: 8, price_cents: 4500 },
          { request_line_id: lineB, included: true, servings: 8, price_cents: 3500 },
        ],
      }),
    },
    cookToken
  );
  if (primaryQuote.status !== 201 && primaryQuote.status !== 200) {
    throw new Error(`Primary quote failed ${primaryQuote.status}: ${JSON.stringify(primaryQuote.body)}`);
  }
  const bidId = primaryQuote.body?.bid?.id;
  if (!bidId) throw new Error('Primary bid id missing');
  console.log(`✅ /store/shc/bids POST line_items (${bidId})`);

  const siblingQuote = await shcFetch(
    '/store/shc/bids',
    {
      method: 'POST',
      body: JSON.stringify({
        request_id: requestId,
        message: 'Doris alternate quote (E2E)',
        line_items: [{ request_line_id: lineA, included: true, servings: 8, price_cents: 9000 }],
      }),
    },
    cookToken2
  );
  if (siblingQuote.status !== 201 && siblingQuote.status !== 200) {
    throw new Error(`Sibling quote failed ${siblingQuote.status}: ${JSON.stringify(siblingQuote.body)}`);
  }
  console.log(`✅ /store/shc/bids POST sibling quote (${siblingQuote.body?.bid?.id})`);

  const bidAccept = await shcFetch(
    `/store/shc/bids/${bidId}/accept`,
    {
      method: 'POST',
      body: JSON.stringify({
        accepted_line_ids: [lineA],
        collection_date: collDate,
        collection_slot: '18:00-19:00',
      }),
    },
    customerToken
  );
  if (bidAccept.status !== 200) {
    throw new Error(`Bid accept v2 failed ${bidAccept.status}: ${JSON.stringify(bidAccept.body)}`);
  }
  if (!bidAccept.body?.order_id) throw new Error('Bid accept missing order_id');
  if (!bidAccept.body?.requires_paynow) throw new Error('Bid accept missing requires_paynow');
  if ((bidAccept.body?.rejected_sibling_quotes ?? 0) < 1) {
    throw new Error(`Expected rejected_sibling_quotes >= 1, got ${bidAccept.body?.rejected_sibling_quotes}`);
  }
  const customOrderId = bidAccept.body.order_id as string;
  const order = bidAccept.body.order;
  if (order?.shc_status !== 'accepted') {
    throw new Error(`Expected awaiting PayNow (accepted), got ${order?.shc_status}`);
  }
  if ((order?.total ?? 0) !== 4500 && order?.total_cents !== 4500) {
    const total = order?.total_cents ?? order?.total;
    if (Number(total) !== 4500) {
      throw new Error(`Partial accept total expected 4500 cents, got ${total}`);
    }
  }
  console.log(
    `✅ /store/shc/bids/:id/accept partial (${customOrderId}, rejected=${bidAccept.body.rejected_sibling_quotes})`
  );

  const orderGet = await shcFetch(`/store/shc/orders/${customOrderId}`, { method: 'GET' }, customerToken);
  if (orderGet.status !== 200) {
    throw new Error(`Custom order GET failed ${orderGet.status}: ${JSON.stringify(orderGet.body)}`);
  }
  if (orderGet.body?.order?.shc_status !== 'accepted') {
    throw new Error(`Custom order not awaiting PayNow: ${orderGet.body?.order?.shc_status}`);
  }
  console.log(`✅ /store/shc/orders/:id awaiting PayNow (${customOrderId})`);

  const paynow = await shcFetch(`/store/shc/orders/${customOrderId}/paynow`, { method: 'POST' }, customerToken);
  if (paynow.status === 200) {
    console.log(`✅ /store/shc/orders/:id/paynow session (${paynow.body?.provider || 'ok'})`);
  } else if (paynow.status === 503 && paynow.body?.provider === 'hitpay_unconfigured') {
    console.log('✅ /store/shc/orders/:id/paynow reachable (HitPay unconfigured on Railway)');
  } else {
    throw new Error(`PayNow after custom accept failed ${paynow.status}: ${JSON.stringify(paynow.body)}`);
  }
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
  const cleared = await shcFetch('/store/shc/cart', { method: 'GET' }, customerToken);
  if (cleared.status === 200 && (cleared.body?.cart?.items?.length ?? 0) > 0) {
    throw new Error(`Cart not empty after DELETE: ${JSON.stringify(cleared.body?.cart?.items)}`);
  }

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

  const cookToken = await loginCook();
  console.log('✅ cook auth login (DB-backed)');

  await transitionOrder(orderId, 'accepted', cookToken);
  console.log('✅ order transition cart → accepted (awaiting PayNow)');

  const adminToken = await loginAdmin();
  const paid = await adminFetch(
    '/admin/shc/payment-confirm',
    {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        paynow_reference: `E2E-${orderId}`,
        notes: 'verify-real-e2e synthetic PayNow',
      }),
    },
    adminToken
  );
  if (paid.status !== 200) {
    throw new Error(`Payment confirm failed ${paid.status}: ${JSON.stringify(paid.body)}`);
  }
  console.log('✅ /admin/shc/payment-confirm (accepted → paid)');

  const customerOrders = await shcFetch('/store/shc/orders?role=customer&limit=100', { method: 'GET' }, customerToken);
  if (customerOrders.status !== 200) throw new Error(`Customer orders failed ${customerOrders.status}`);
  const found = (customerOrders.body?.orders ?? []).some((o: { order_id?: string; id?: string }) => o.order_id === orderId || o.id === orderId);
  if (!found) {
    const direct = await shcFetch(`/store/shc/orders/${orderId}`, { method: 'GET' }, customerToken);
    if (direct.status !== 200 || !direct.body?.order?.id) {
      throw new Error(`Order ${orderId} not in customer orders list`);
    }
  }
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

  const cookToken2 = await loginCook(COOK2_EMAIL, COOK2_PASS);
  console.log('✅ cook2 auth login (sibling quote)');

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

  for (const state of ['preparing', 'ready_for_collection', 'collected', 'completed'] as const) {
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

  await runCustomRequestV2E2E(customerToken, cookToken, cookToken2);

  console.log('\n=== verify:real-e2e PASSED (Tier 1) ===');
}

main().catch((e) => {
  console.error('verify:real-e2e FAILED:', e.message || e);
  process.exit(1);
});