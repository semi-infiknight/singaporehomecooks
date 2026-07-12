#!/usr/bin/env npx tsx
/**
 * Smoke: order invoice PDF download path (customer + cook).
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
  });
  const localB64 = invoiceToPdfBase64(local);
  const localBuf = Buffer.from(localB64, 'base64');
  assertPdf(localBuf, 'local buildOrderInvoice');
  fs.writeFileSync(path.join(OUT, 'local-customer.pdf'), localBuf);

  // Simulate browser download blob (Node polyfill)
  const binary = Buffer.from(localB64, 'base64');
  if (typeof Blob !== 'undefined') {
    const blob = new Blob([binary], { type: 'application/pdf' });
    if (blob.size !== binary.length) throw new Error('Blob size mismatch');
    console.log(`✅ browser Blob simulation size=${blob.size}`);
  }
  // downloadPdfBase64InBrowser needs document — structural check only
  if (typeof dlBrowser !== 'function') throw new Error('downloadPdfBase64InBrowser missing');
  console.log('✅ downloadPdfBase64InBrowser exported for web');

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

  const oid =
    cList[0]?.id ||
    cList[0]?.order_id ||
    kList[0]?.id ||
    kList[0]?.order_id;
  if (!oid) throw new Error('No orders on Railway to invoice — place an order first');

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

  // Cook settlement
  const invK = await shc(`/store/shc/orders/${encodeURIComponent(oid)}/invoice`, { method: 'GET' }, ktoken);
  if (invK.status !== 200 || !invK.json?.pdf_base64) {
    throw new Error(`cook invoice failed ${invK.status}: ${JSON.stringify(invK.json).slice(0, 200)}`);
  }
  const kPdf = Buffer.from(invK.json.pdf_base64, 'base64');
  assertPdf(kPdf, 'cook settlement JSON.pdf_base64');
  fs.writeFileSync(path.join(OUT, invK.json.filename || 'cook.pdf'), kPdf);
  console.log(
    `   cook title=${invK.json.invoice?.title} fee=${invK.json.invoice?.platform_fee_cents} earn=${invK.json.invoice?.cook_earnings_cents}`
  );

  // Static wiring: UI must expose download CTAs
  const checks: Array<[string, string]> = [
    ['apps/mobile-customer/app/(customer)/orders/[id].tsx', 'order-download-invoice-btn'],
    ['apps/mobile-cook/app/(cook)/orders/[id].tsx', 'cook-order-download-invoice-btn'],
    ['apps/web/app/orders/[id]/page.tsx', 'order-download-invoice-btn'],
    ['apps/web/app/cook-portal/orders/[id]/page.tsx', 'cook-order-download-invoice-btn'],
    ['apps/mobile-customer/app/(customer)/orders/[id].tsx', 'getOrderInvoice'],
    ['apps/web/app/orders/[id]/page.tsx', 'downloadPdfBase64InBrowser'],
  ];
  for (const [file, needle] of checks) {
    const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    if (!src.includes(needle)) throw new Error(`missing ${needle} in ${file}`);
  }
  console.log('✅ UI wiring: customer+cook mobile+web download CTAs present');

  console.log(`\n=== smoke-order-invoice PASSED (files in ${OUT}) ===`);
}

main().catch((e) => {
  console.error('smoke-order-invoice FAILED:', e.message || e);
  process.exit(1);
});
