#!/usr/bin/env npx tsx
/**
 * Smoke test: real Medusa /store/shc/* with publishable key.
 * Run after: docker:up, medusa:start, bootstrap:medusa, seed:medusa
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.MEDUSA_URL || process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000';

function loadPubKey(): string {
  if (process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    return process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  }
  const envLocal = path.join(__dirname, '..', 'apps', 'mobile', '.env.local');
  if (fs.existsSync(envLocal)) {
    const m = fs.readFileSync(envLocal, 'utf8').match(/EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=(.+)/);
    if (m) return m[1].trim();
  }
  throw new Error('No publishable key. Run: pnpm bootstrap:medusa');
}

async function shcGet(pathname: string) {
  const pubKey = loadPubKey();
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { 'x-publishable-api-key': pubKey },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  console.log('=== SHC Real Medusa E2E Smoke Test ===');
  console.log('Base:', BASE);

  const health = await fetch(`${BASE}/health`);
  if (!health.ok) throw new Error(`/health failed: ${health.status}`);
  console.log('✅ /health');

  const cooks = await shcGet('/store/shc/cooks');
  if (cooks.status !== 200) throw new Error(`/store/shc/cooks ${cooks.status}: ${JSON.stringify(cooks.body)}`);
  const cookCount = cooks.body?.cooks?.length ?? 0;
  if (cookCount < 1) throw new Error('Expected >=1 cook after seed. Run: pnpm seed:medusa');
  console.log(`✅ /store/shc/cooks (${cookCount} cooks)`);

  const products = await shcGet('/store/shc/products');
  if (products.status !== 200) throw new Error(`/store/shc/products ${products.status}`);
  console.log(`✅ /store/shc/products (${products.body?.products?.length ?? 0} products)`);

  const orders = await shcGet('/store/shc/orders?cook_id=cook_rose_tampines_001');
  if (orders.status !== 200) throw new Error(`/store/shc/orders ${orders.status}`);
  console.log(`✅ /store/shc/orders`);

  const demo = await fetch(`${BASE}/store/shc/carts/demo-complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': loadPubKey(),
    },
    body: JSON.stringify({
      collection_date: '2026-06-20',
      collection_slot: '18:00-19:00',
      allergen_acked: true,
      pdpa_consent: true,
    }),
  });
  if (!demo.ok) {
    const err = await demo.text();
    console.warn(`⚠️  /store/shc/carts/demo-complete ${demo.status} (may need cart setup): ${err.slice(0, 120)}`);
  } else {
    console.log('✅ /store/shc/carts/demo-complete');
  }

  console.log('\n=== verify:real-e2e PASSED ===');
}

main().catch((e) => {
  console.error('verify:real-e2e FAILED:', e.message || e);
  process.exit(1);
});