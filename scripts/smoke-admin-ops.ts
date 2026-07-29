#!/usr/bin/env npx tsx
/**
 * Smoke admin ops APIs used by Medusa Admin SHC Ops UI (/app/shc-ops).
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

async function del(pathname: string) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'DELETE',
    headers: {
      'x-publishable-api-key': pub(),
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

function assertEq(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Tier 4 — admin patch → store read round-trip (useCustomerConfig / useCookConfig parity). */
async function verifyConfigRoundTrip(marker: string) {
  console.log('\n--- Tier 4: admin config → store round-trip ---');

  const adminCustBefore = await get('/admin/shc/customer-config');
  if (adminCustBefore.status !== 200) throw new Error(`admin customer-config ${adminCustBefore.status}`);
  const guestHeadlineBefore = adminCustBefore.body?.config?.copy?.guest_headline as string | undefined;
  const occasionsNavBefore = adminCustBefore.body?.config?.occasions_nav?.label as string | undefined;
  console.log('✅ admin customer-config', adminCustBefore.body?.source);

  const testHeadline = `Ops smoke ${marker}`;
  const testOccasionsNav = `Occasions ${marker.slice(-6)}`;
  const custPatch = await post('/admin/shc/customer-config', {
    copy: { guest_headline: testHeadline },
    occasions_nav: { label: testOccasionsNav },
  });
  if (custPatch.status !== 200) {
    throw new Error(`customer-config patch ${custPatch.status} ${JSON.stringify(custPatch.body).slice(0, 200)}`);
  }
  console.log('✅ admin customer-config patch', custPatch.body?.action);

  const storeCust = await get('/store/shc/customer-config');
  if (storeCust.status !== 200) throw new Error(`store customer-config ${storeCust.status}`);
  assertEq('store customer-config guest_headline', storeCust.body?.config?.copy?.guest_headline, testHeadline);
  assertEq('store customer-config occasions_nav.label', storeCust.body?.config?.occasions_nav?.label, testOccasionsNav);
  console.log('✅ store customer-config reflects admin (useCustomerConfig path)');

  const adminRulesBefore = await get('/admin/shc/business-rules');
  if (adminRulesBefore.status !== 200) throw new Error(`admin business-rules ${adminRulesBefore.status}`);
  const windowBefore = Number(adminRulesBefore.body?.config?.drop?.customer_window_days ?? 7);
  const testWindow = windowBefore === 7 ? 6 : 7;
  console.log('✅ admin business-rules', adminRulesBefore.body?.source);

  const rulesPatch = await post('/admin/shc/business-rules', {
    drop: { customer_window_days: testWindow },
  });
  if (rulesPatch.status !== 200) {
    throw new Error(`business-rules patch ${rulesPatch.status} ${JSON.stringify(rulesPatch.body).slice(0, 200)}`);
  }
  console.log('✅ admin business-rules patch', rulesPatch.body?.action);

  const storeRules = await get('/store/shc/business-rules');
  if (storeRules.status !== 200) throw new Error(`store business-rules ${storeRules.status}`);
  assertEq('store business-rules drop.customer_window_days', storeRules.body?.config?.drop?.customer_window_days, testWindow);
  console.log('✅ store business-rules reflects admin');

  const adminCookBefore = await get('/admin/shc/cook-config');
  if (adminCookBefore.status !== 200) throw new Error(`admin cook-config ${adminCookBefore.status}`);
  const morningBefore = adminCookBefore.body?.config?.greeting?.morning as string | undefined;
  console.log('✅ admin cook-config', adminCookBefore.body?.source);

  const testMorning = `Good morning — ${marker}`;
  const cookPatch = await post('/admin/shc/cook-config', {
    greeting: { morning: testMorning },
  });
  if (cookPatch.status !== 200) {
    throw new Error(`cook-config patch ${cookPatch.status} ${JSON.stringify(cookPatch.body).slice(0, 200)}`);
  }
  console.log('✅ admin cook-config patch', cookPatch.body?.action);

  const storeCook = await get('/store/shc/cook-config');
  if (storeCook.status !== 200) throw new Error(`store cook-config ${storeCook.status}`);
  assertEq('store cook-config greeting.morning', storeCook.body?.config?.greeting?.morning, testMorning);
  console.log('✅ store cook-config reflects admin (useCookConfig path)');

  // Restore prod config (non-destructive smoke)
  if (guestHeadlineBefore != null || occasionsNavBefore != null) {
    const restoreCust = await post('/admin/shc/customer-config', {
      ...(guestHeadlineBefore != null ? { copy: { guest_headline: guestHeadlineBefore } } : {}),
      ...(occasionsNavBefore != null ? { occasions_nav: { label: occasionsNavBefore } } : {}),
    });
    if (restoreCust.status !== 200) {
      console.warn('⚠️ customer-config restore failed — manual check in SHC Ops Catalog');
    } else {
      console.log('✅ customer-config restored');
    }
  }

  const restoreRules = await post('/admin/shc/business-rules', {
    drop: { customer_window_days: windowBefore },
  });
  if (restoreRules.status !== 200) {
    console.warn('⚠️ business-rules restore failed — manual check in SHC Ops Controls');
  } else {
    console.log('✅ business-rules restored');
  }

  if (morningBefore != null) {
    const restoreCook = await post('/admin/shc/cook-config', {
      greeting: { morning: morningBefore },
    });
    if (restoreCook.status !== 200) {
      console.warn('⚠️ cook-config restore failed — manual check in SHC Ops Cook Portal');
    } else {
      console.log('✅ cook-config restored');
    }
  }
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

  const promos = await get('/admin/shc/discover-promos');
  if (promos.status !== 200) throw new Error(`discover-promos ${promos.status}`);
  console.log('✅ admin discover-promos', promos.body?.count);

  const pubPromos = await get('/store/shc/discover-promos');
  if (pubPromos.status !== 200) throw new Error(`store discover-promos ${pubPromos.status}`);
  console.log('✅ store discover-promos', pubPromos.body?.count, pubPromos.body?.promos?.[0]?.title);

  const promoUp = await post('/admin/shc/discover-promos', {
    id: 'promo-ops-test',
    title: 'Ops Test Promo',
    subtitle: 'Smoke test slide',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640',
    mobile_route: '/(customer)/',
    web_route: '/',
    enabled: true,
    sort_order: 99,
  });
  if (promoUp.status !== 200) throw new Error(`promo upsert ${promoUp.status} ${JSON.stringify(promoUp.body).slice(0, 160)}`);
  console.log('✅ discover-promo upsert', promoUp.body?.action);

  const storePromoAfter = await get('/store/shc/discover-promos');
  if (storePromoAfter.status !== 200) throw new Error(`store discover-promos after upsert ${storePromoAfter.status}`);
  const opsPromo = (storePromoAfter.body?.promos || []).find((p: { id?: string }) => p?.id === 'promo-ops-test');
  if (!opsPromo || opsPromo.title !== 'Ops Test Promo') {
    throw new Error('store discover-promos missing promo-ops-test after admin upsert');
  }
  console.log('✅ store discover-promos reflects admin upsert', opsPromo.title);

  const marker = `smoke-${Date.now()}`;
  await verifyConfigRoundTrip(marker);

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

  // UI file checks — single admin = Medusa Admin SHC Ops; web /ops is redirect only
  const ops = fs.readFileSync(path.join(process.cwd(), 'apps/web/app/ops/page.tsx'), 'utf8');
  for (const n of ['ops-redirect', 'app/shc-ops', 'Medusa Admin']) {
    if (!ops.includes(n)) throw new Error(`ops redirect missing ${n}`);
  }
  console.log('✅ web /ops redirects to Medusa Admin');

  const adminRoot = path.join(process.cwd(), 'apps/medusa/src/admin/routes/shc-ops');
  const adminPages = [
    path.join(adminRoot, 'page.tsx'),
    path.join(adminRoot, 'orders/page.tsx'),
    path.join(adminRoot, 'catalog/page.tsx'),
    path.join(adminRoot, 'controls/page.tsx'),
    path.join(adminRoot, 'cook-portal/page.tsx'),
  ];
  for (const f of adminPages) {
    if (!fs.existsSync(f)) throw new Error(`missing admin UI ${path.relative(process.cwd(), f)}`);
    const src = fs.readFileSync(f, 'utf8');
    if (!src.includes('defineRouteConfig') || !src.includes('/admin/shc/')) {
      throw new Error(`admin UI not wired ${path.relative(process.cwd(), f)}`);
    }
  }
  console.log('✅ Medusa Admin SHC Ops routes wired');

  // Production admin SPA is served (auth gate returns HTML shell)
  const appRes = await fetch(`${BASE}/app`);
  if (!appRes.ok) throw new Error(`GET /app ${appRes.status}`);
  const appHtml = await appRes.text();
  if (!appHtml.includes('html') && !appHtml.includes('root')) {
    throw new Error('Medusa /app did not return admin shell HTML');
  }
  console.log('✅ Medusa /app reachable', appRes.status);

  console.log('\n=== smoke-admin-ops PASSED ===');
}

main().catch((e) => {
  console.error('smoke-admin-ops FAILED:', e.message || e);
  process.exit(1);
});
