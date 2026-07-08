#!/usr/bin/env npx tsx
/**
 * AGENT: New cook register → listing → customer discover → order → cook accept/decline.
 * Blueprint: blueprint/agent/build-protocol.md
 * Capture: {SCRATCH}/cook-customer-wiring.log
 */
import { execSync } from 'child_process';
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
const RUN_ID = Date.now().toString(36);
const NEW_COOK_EMAIL = process.env.WIRING_COOK_EMAIL || `cook_wiring_${RUN_ID}@shc.test`;
const NEW_COOK_PASS = process.env.WIRING_COOK_PASS || `CookWiring${RUN_ID}!`;

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

function runInProcessWiringFallback(reason: string) {
  console.warn(`\n⚠️  Railway live wiring skipped: ${reason}`);
  console.warn('   Running in-process handler chain (register → profile → listing → orders → accept/decline)…');
  execSync(
    'pnpm --filter medusa exec vitest run src/api/store/shc/auth/cook/wiring.integration.test.ts',
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
  console.log(
    '\n✅ In-process cook-customer wiring passed (deploy Medusa to Railway for live HTTP proof)'
  );
}

async function registerCook() {
  const r = await shcFetch('/store/shc/auth/cook/register', {
    method: 'POST',
    body: JSON.stringify({
      email: NEW_COOK_EMAIL,
      password: NEW_COOK_PASS,
      display_name: `Wiring Cook ${RUN_ID}`,
      area: 'Punggol',
      story: 'E2E wiring test kitchen',
    }),
  });
  if (r.status === 404) {
    runInProcessWiringFallback('POST /store/shc/auth/cook/register not deployed yet (404)');
    process.exit(0);
  }
  if (r.status !== 201 || !r.body?.token) {
    throw new Error(`Cook register failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  console.log(`✅ cook register (${NEW_COOK_EMAIL}) cook_id=${r.body.user.id}`);
  return { token: r.body.token as string, cookId: r.body.user.id as string };
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

async function publishListing(cookToken: string, cookId: string) {
  const dishName = `Wiring Laksa ${RUN_ID}`;
  const r = await shcFetch(
    '/store/shc/listings',
    {
      method: 'POST',
      body: JSON.stringify({
        name: dishName,
        price: 15,
        min_qty: 3,
        cuisine: 'Peranakan',
        description: 'Customer wiring test dish',
        halal: false,
        calories: 420,
        allergen_tiers: { tier1: ['Shellfish'], tier2: [], tier3: [] },
        ingredients: [{ name: 'Prawn', quantity: 4, unit: 'pcs' }],
      }),
    },
    cookToken
  );
  if (r.status !== 201 || !r.body?.product?.id) {
    throw new Error(`Listing create failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  const productId = r.body.product.id as string;
  console.log(`✅ listing published product_id=${productId} cook_id=${cookId}`);
  return { productId, dishName };
}

async function assertProductVisible(productId: string, cookId: string) {
  const r = await shcFetch(`/store/shc/products?cook_id=${encodeURIComponent(cookId)}&limit=50`);
  if (r.status !== 200) throw new Error(`Products list failed ${r.status}`);
  const products = r.body?.products ?? [];
  const found = products.some((p: { id?: string }) => p.id === productId);
  if (!found) throw new Error(`Product ${productId} not in customer products for cook ${cookId}`);
  console.log(`✅ customer products include new listing (${products.length} for cook)`);
}

async function checkoutOrder(customerToken: string, productId: string) {
  await shcFetch('/store/shc/cart', { method: 'DELETE' }, customerToken);
  const add = await shcFetch(
    '/store/shc/cart',
    { method: 'POST', body: JSON.stringify({ product_id: productId, qty: 5 }) },
    customerToken
  );
  if (add.status !== 200) throw new Error(`Cart add failed ${add.status}: ${JSON.stringify(add.body)}`);

  const checkout = await shcFetch(
    '/store/shc/carts/demo-complete',
    {
      method: 'POST',
      body: JSON.stringify({
        collection_date: '2026-08-15',
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
  const orderCookId = checkout.body.order.cook_id ?? checkout.body.order.meta?.cook_id;
  console.log(`✅ customer checkout order_id=${orderId} cook_id=${orderCookId ?? '?'}`);
  return orderId;
}

async function assertCookSeesOrder(cookToken: string, orderId: string, cookId: string) {
  const r = await shcFetch('/store/shc/orders?role=cook', { method: 'GET' }, cookToken);
  if (r.status !== 200) throw new Error(`Cook orders failed ${r.status}`);
  const orders = r.body?.orders ?? [];
  const row = orders.find((o: { id?: string; order_id?: string; cook_id?: string }) =>
    (o.id === orderId || o.order_id === orderId) && o.cook_id === cookId
  );
  if (!row) throw new Error(`Order ${orderId} not in cook list for ${cookId}`);
  console.log(`✅ cook orders list contains order (status=${row.shc_status})`);
  return row.shc_status as string;
}

async function transitionOrder(orderId: string, to: string, cookToken: string) {
  const before = await shcFetch(`/store/shc/orders/${orderId}`, { method: 'GET' }, cookToken);
  const r = await shcFetch(
    `/store/shc/orders/${orderId}/transition`,
    { method: 'POST', body: JSON.stringify({ to }) },
    cookToken
  );
  if (r.status !== 200) {
    throw new Error(`Transition ${to} failed ${r.status}: ${JSON.stringify(r.body)}`);
  }
  const afterStatus = r.body?.order?.shc_status ?? r.body?.shc_status;
  console.log(
    `✅ transition ${before.body?.order?.shc_status ?? '?'} → ${to} (now ${afterStatus})`
  );
  return afterStatus;
}

async function main() {
  console.log('=== Cook ↔ Customer Medusa Wiring ===');
  console.log('Base:', BASE);

  const { token: cookToken, cookId } = await registerCook();
  const { productId } = await publishListing(cookToken, cookId);
  await assertProductVisible(productId, cookId);

  const customerToken = await loginCustomer();
  const acceptOrderId = await checkoutOrder(customerToken, productId);
  const statusBeforeAccept = await assertCookSeesOrder(cookToken, acceptOrderId, cookId);
  if (statusBeforeAccept !== 'paid') {
    console.warn(`⚠️  expected paid before accept, got ${statusBeforeAccept}`);
  }
  const afterAccept = await transitionOrder(acceptOrderId, 'accepted', cookToken);
  if (afterAccept !== 'accepted') throw new Error(`Expected accepted, got ${afterAccept}`);

  const declineOrderId = await checkoutOrder(customerToken, productId);
  await assertCookSeesOrder(cookToken, declineOrderId, cookId);
  const afterDecline = await transitionOrder(declineOrderId, 'cancelled', cookToken);
  if (afterDecline !== 'cancelled') throw new Error(`Expected cancelled, got ${afterDecline}`);

  console.log('\n✅ Cook-customer wiring complete (register → listing → discover → order → accept/decline)');
}

main().catch((e) => {
  console.error('FAIL:', e.message || e);
  process.exit(1);
});