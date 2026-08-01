#!/usr/bin/env npx tsx
/**
 * Smoke: dish invoice (cook → customer) + weekly payout invoice (SHC → cook).
 * Writes PDFs to disk and validates %PDF- magic.
 *
 *   pnpm exec tsx scripts/smoke-order-invoice.ts
 */
import fs from 'fs';
import path from 'path';
import {
  RAILWAY_MEDUSA_PUBLISHABLE_KEY,
  resolveRailwayMedusaBase,
  resolveRailwayPublishableKey,
} from '../packages/shc-utils/src/railway-client';
import { buildOrderInvoice, invoiceToPdfBase64 } from '../packages/shc-utils/src/order-invoice';
import { buildPayoutInvoice, payoutInvoiceToPdfBase64 } from '../packages/shc-utils/src/payout-invoice';
import { downloadPdfBase64InBrowser as dlBrowser } from '../apps/web/lib/download-pdf';

const BASE = resolveRailwayMedusaBase(process.env.MEDUSA_URL || process.env.EXPO_PUBLIC_MEDUSA_BASE);
const OUT = path.join(process.cwd(), 'scripts', '.invoice-smoke');
fs.mkdirSync(OUT, { recursive: true });

function loadPub(): string {
  if (process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    return resolveRailwayPublishableKey(process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY);
  }
  for (const rel of ['apps/mobile-customer/.env.local', 'apps/web/.env.local']) {
    const p = path.join(process.cwd(), rel);
    if (fs.existsSync(p)) {
      const m = fs.readFileSync(p, 'utf8').match(/(?:EXPO_PUBLIC_|NEXT_PUBLIC_)?MEDUSA_PUBLISHABLE_KEY=(.+)/);
      if (m) return resolveRailwayPublishableKey(m[1].trim());
    }
  }
  return RAILWAY_MEDUSA_PUBLISHABLE_KEY;
}

async function shc(pathname: string, init?: RequestInit, token?: string) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': loadPub(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string>),
    },
  });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('pdf') || ct.includes('octet-stream')) {
    return { status: res.status, ct, buf: Buffer.from(await res.arrayBuffer()), json: null as any };
  }
  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, ct, buf: null as Buffer | null, json };
}

function assertPdf(buf: Buffer, label: string) {
  if (!buf || buf.length < 100) throw new Error(`${label}: empty PDF`);
  const magic = buf.subarray(0, 5).toString('utf8');
  if (magic !== '%PDF-') throw new Error(`${label}: bad magic ${magic}`);
  console.log(`✅ ${label} PDF valid (${buf.length} bytes, ${magic})`);
}

async function main() {
  console.log(`=== smoke-order-invoice → ${BASE} ===`);

  // Local pure-path (no network) — proves web download blob construction
  const local = buildOrderInvoice({
    order: {
      id: 'SHC-TEST-INV',
      total: 50,
      items: [{ name: 'Test Nasi Lemak', qty: 2, unit_price_cents: 2500 }],
      cook_name: 'Test Kitchen',
      customer_name: 'Test Customer',
    },
    audience: 'customer',
    cook_supplier: {
      legal_name: 'Test Kitchen',
      address: 'Tampines St 45',
      uen: 'SFA-TEST-001',
    },
  });
  const localB64 = invoiceToPdfBase64(local);
  const localBuf = Buffer.from(localB64, 'base64');
  assertPdf(localBuf, 'local buildOrderInvoice');
  fs.writeFileSync(path.join(OUT, 'local-customer.pdf'), localBuf);
  if (typeof dlBrowser !== 'function') throw new Error('downloadPdfBase64InBrowser missing');

  const cust = await shc('/store/shc/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer@shc.local', password: 'customersecret' }),
  });
  if (cust.status !== 200 || !cust.json?.token) throw new Error(`customer login ${cust.status}`);
  console.log('✅ customer login');
  const ctoken = cust.json.token as string;

  const cook = await shc('/store/shc/auth/cook/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'rose@shc.local', password: 'cooksecret' }),
  });
  if (cook.status !== 200 || !cook.json?.token) throw new Error(`cook login ${cook.status}`);
  console.log('✅ cook login');
  const ktoken = cook.json.token as string;

  const cOrders = await shc('/store/shc/orders?role=customer', { method: 'GET' }, ctoken);
  const kOrders = await shc('/store/shc/orders?role=cook', { method: 'GET' }, ktoken);
  const cList = cOrders.json?.orders || [];
  const kList = kOrders.json?.orders || [];
  console.log(`orders customer=${cList.length} cook=${kList.length}`);

  const pickOrder = (list: any[]) => {
    const withTotal = list.find((o) => Number(o?.total) > 0 || Number(o?.total_cents) > 0);
    return withTotal || list[0];
  };
  const picked = pickOrder(cList) || pickOrder(kList);
  const oid = picked?.id || picked?.order_id;
  if (!oid) throw new Error('No orders on Railway to invoice — place an order first');
  console.log(`using order ${oid} total=${picked?.total}`);

  // Customer JSON + PDF
  const invC = await shc(`/store/shc/orders/${encodeURIComponent(oid)}/invoice`, { method: 'GET' }, ctoken);
  if (invC.status === 404) {
    throw new Error(
      'Invoice route 404 — medusa not redeployed with invoice code. Run: railway redeploy -s medusa --from-source -y'
    );
  }
  if (invC.status !== 200 || !invC.json?.pdf_base64) {
    throw new Error(`customer invoice failed ${invC.status}: ${JSON.stringify(invC.json).slice(0, 200)}`);
  }
  const cPdf = Buffer.from(invC.json.pdf_base64, 'base64');
  assertPdf(cPdf, 'customer invoice JSON.pdf_base64');
  fs.writeFileSync(path.join(OUT, invC.json.filename || 'customer.pdf'), cPdf);
  console.log(`   title=${invC.json.invoice?.title} total_cents=${invC.json.invoice?.total_cents}`);

  const streamC = await shc(
    `/store/shc/orders/${encodeURIComponent(oid)}/invoice?format=pdf`,
    { method: 'GET' },
    ctoken
  );
  if (streamC.status !== 200 || !streamC.buf) {
    throw new Error(`customer format=pdf failed ${streamC.status}`);
  }
  assertPdf(streamC.buf, 'customer format=pdf stream');
  fs.writeFileSync(path.join(OUT, 'customer-stream.pdf'), streamC.buf);

  // Cook must use weekly payout invoice — per-order dish invoice is customer-only
  const invK = await shc(`/store/shc/orders/${encodeURIComponent(oid)}/invoice`, { method: 'GET' }, ktoken);
  if (invK.status !== 403) {
    throw new Error(`expected cook dish invoice 403, got ${invK.status}: ${JSON.stringify(invK.json).slice(0, 200)}`);
  }
  const cookErr = String(invK.json?.error?.message || invK.json?.message || '');
  if (!cookErr.toLowerCase().includes('weekly payout')) {
    throw new Error(`expected weekly payout hint in cook 403, got: ${cookErr.slice(0, 120)}`);
  }
  console.log('✅ cook blocked from per-order dish invoice (weekly payout hint)');

  const localPayout = buildPayoutInvoice({
    batch_id: 'batch_smoke',
    week_start: '2026-07-28',
    cook: { cook_id: 'cook_rose', legal_name: 'Rose Kitchen', paynow_mobile: '+6591234567' },
    lines: [{ description: 'Smoke line', qty: 1, unit_cents: 5000, line_cents: 5000 }],
    gross_order_cents: 6000,
    platform_fee_cents: 1000,
    net_payout_cents: 5000,
    transfer_ref: 'SMOKE',
    status: 'paid',
  });
  const payoutBuf = Buffer.from(payoutInvoiceToPdfBase64(localPayout), 'base64');
  assertPdf(payoutBuf, 'local buildPayoutInvoice');
  fs.writeFileSync(path.join(OUT, 'local-payout.pdf'), payoutBuf);

  const payoutsRes = await shc('/store/shc/earnings/payouts', { method: 'GET' }, ktoken);
  const payouts = payoutsRes.json?.payouts || [];
  console.log(`payout batches for cook: ${payouts.length}`);
  if (payoutsRes.status === 200 && payouts[0]?.batch_id) {
    const batchId = payouts[0].batch_id as string;
    const invP = await shc(
      `/store/shc/earnings/payouts/${encodeURIComponent(batchId)}/invoice`,
      { method: 'GET' },
      ktoken
    );
    if (invP.status === 404) {
      console.log('⚠ payout invoice 404 — medusa may need redeploy with payout invoice route');
    } else if (invP.status !== 200 || !invP.json?.pdf_base64) {
      throw new Error(`payout invoice failed ${invP.status}: ${JSON.stringify(invP.json).slice(0, 200)}`);
    } else {
      const pPdf = Buffer.from(invP.json.pdf_base64, 'base64');
      assertPdf(pPdf, 'weekly payout invoice JSON.pdf_base64');
      fs.writeFileSync(path.join(OUT, invP.json.filename || 'payout.pdf'), pPdf);
      console.log(`   payout title=${invP.json.invoice?.title} net=${invP.json.invoice?.net_payout_cents}`);

      const linkP = await shc(
        `/store/shc/earnings/payouts/${encodeURIComponent(batchId)}/invoice?issue_url=1`,
        { method: 'GET' },
        ktoken
      );
      if (linkP.status === 200 && linkP.json?.download_url) {
        const signedP = await fetch(linkP.json.download_url as string);
        if (!signedP.ok) throw new Error(`signed payout PDF HTTP ${signedP.status}`);
        const signedPBuf = Buffer.from(await signedP.arrayBuffer());
        assertPdf(signedPBuf, 'hooks signed payout PDF');
        fs.writeFileSync(path.join(OUT, 'payout-signed.pdf'), signedPBuf);
        console.log('✅ GET /hooks/shc/payout-invoice signed PDF');
      }
    }
  } else {
    console.log('⚠ no payout batches on Railway — skipped live payout invoice probe');
  }

  // Signed openURL path (mobile least-blast) — customer dish invoice
  const linkC = await shc(
    `/store/shc/orders/${encodeURIComponent(oid)}/invoice?issue_url=1`,
    { method: 'GET' },
    ctoken
  );
  if (linkC.status !== 200 || !linkC.json?.download_url) {
    throw new Error(`issue_url failed ${linkC.status}: ${JSON.stringify(linkC.json).slice(0, 200)}`);
  }
  console.log(`✅ issue_url download_url expires_in=${linkC.json.expires_in}`);
  const signed = await fetch(linkC.json.download_url as string);
  if (!signed.ok) throw new Error(`signed hooks PDF HTTP ${signed.status}`);
  const signedBuf = Buffer.from(await signed.arrayBuffer());
  assertPdf(signedBuf, 'hooks signed dish invoice PDF');
  fs.writeFileSync(path.join(OUT, 'customer-signed.pdf'), signedBuf);
  console.log('✅ GET /hooks/shc/invoice signed PDF');

  const cartOrder = kList.find((o) => String(o?.shc_status) === 'cart');
  if (cartOrder?.id || cartOrder?.order_id) {
    const cartId = cartOrder.id || cartOrder.order_id;
    const blocked = await shc(`/store/shc/orders/${encodeURIComponent(cartId)}/invoice`, { method: 'GET' }, ktoken);
    if (blocked.status !== 403) {
      throw new Error(`expected cook dish invoice 403 on cart order, got ${blocked.status}`);
    }
    console.log('✅ cook blocked from dish invoice on cart order (403)');
  }

  // Static wiring: UI must expose download CTAs
  const checks: Array<[string, string]> = [
    ['apps/mobile-customer/app/(customer)/orders/[id].tsx', 'order-download-invoice-btn'],
    ['apps/web/app/orders/[id]/page.tsx', 'order-download-invoice-btn'],
    ['apps/mobile-cook/app/(cook)/orders/[id].tsx', 'cook-weekly-payout-invoice-hint'],
    ['apps/web/app/cook-portal/orders/[id]/page.tsx', 'cook-weekly-payout-invoice-hint'],
    ['apps/mobile-customer/app/(customer)/orders/[id].tsx', 'getOrderInvoiceDownloadUrl'],
    ['apps/mobile-cook/app/(cook)/earnings.tsx', 'getCookPayoutInvoiceDownloadUrl'],
    ['apps/web/app/cook-portal/earnings/page.tsx', 'getCookPayoutInvoiceDownloadUrl'],
    ['apps/web/app/orders/[id]/page.tsx', 'downloadPdfBase64InBrowser'],
  ];
  for (const [file, needle] of checks) {
    const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    if (!src.includes(needle)) throw new Error(`missing ${needle} in ${file}`);
  }
  // Mobile must NOT depend on native FS for invoice
  for (const file of ['apps/mobile-customer/app/(customer)/orders/[id].tsx']) {
    const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    if (src.includes('shareInvoicePdf') || src.includes('expo-file-system') || src.includes('expo-sharing')) {
      throw new Error(`${file} still uses native FS/sharing for invoice — use signed URL`);
    }
  }
  console.log('✅ UI wiring: signed URL on mobile, web blob download present');

  console.log(`\n=== smoke-order-invoice PASSED (files in ${OUT}) ===`);
}

main().catch((e) => {
  console.error('smoke-order-invoice FAILED:', e.message || e);
  process.exit(1);
});
