/**
 * Singapore marketplace order invoices (customer tax invoice / cook settlement).
 * Blueprint: GST_TAX_RULES.md, trust receipts layer. PDF is pure-JS (no native deps).
 */

import {
  DEFAULT_COMMISSION_RATE,
  calculateCookEarnings,
  calculatePlatformFee,
} from '@shc/business-rules';

export type InvoiceAudience = 'customer' | 'cook';

export type OrderInvoiceLine = {
  description: string;
  qty: number;
  unit_cents: number;
  line_cents: number;
};

export type OrderInvoiceDoc = {
  doc_type: 'tax_invoice' | 'settlement_note';
  title: string;
  invoice_number: string;
  invoice_date: string;
  order_id: string;
  currency: 'SGD';
  supplier: {
    legal_name: string;
    uen: string;
    address: string;
    gst_registered: boolean;
    gst_registration_number: string | null;
  };
  bill_to: {
    name: string;
    role_label: string;
    id?: string;
  };
  fulfilled_by?: {
    cook_name: string;
    cook_id?: string;
  };
  lines: OrderInvoiceLine[];
  subtotal_cents: number;
  /** Shown when gst_registered — 0 while platform not registered */
  gst_cents: number;
  gst_rate: number;
  total_cents: number;
  /** Cook settlement only */
  platform_fee_cents?: number;
  cook_earnings_cents?: number;
  commission_rate?: number;
  payment: {
    method: string;
    reference: string | null;
    collection_date?: string | null;
    collection_slot?: string | null;
    status?: string | null;
  };
  notes: string[];
  audience: InvoiceAudience;
};

export type BuildInvoiceInput = {
  order: {
    id?: string;
    order_id?: string;
    cook_id?: string;
    cook_name?: string;
    customer_id?: string;
    customer_name?: string;
    shc_status?: string;
    collection_date?: string | null;
    collection_slot?: string | null;
    paynow_reference?: string | null;
    items?: Array<{ name?: string; qty?: number; price_cents?: number; unit_price_cents?: number }>;
    total?: number | string;
    total_cents?: number;
    credits_applied?: number;
    credits_applied_cents?: number;
    is_corporate?: boolean;
    created_at?: string;
  };
  audience: InvoiceAudience;
  actorName?: string;
  /** Override supplier (tests / env) */
  supplier?: Partial<OrderInvoiceDoc['supplier']>;
  now?: Date;
  commissionRate?: number;
};

export const DEFAULT_PLATFORM_SUPPLIER = {
  legal_name: 'Singapore Home Cooks',
  uen: process.env.SHC_PLATFORM_UEN || process.env.NEXT_PUBLIC_SHC_PLATFORM_UEN || 'UEN pending',
  address: 'Singapore',
  gst_registered: false,
  gst_registration_number: null as string | null,
};

function dollarsToCents(total: number | string | undefined, totalCents?: number): number {
  if (totalCents != null && Number.isFinite(Number(totalCents))) {
    return Math.max(0, Math.round(Number(totalCents)));
  }
  const n = Number(total);
  if (!Number.isFinite(n)) return 0;
  // API often returns dollars (e.g. 116); if value looks like cents (> 1000 and integer), keep
  if (Number.isInteger(n) && n >= 1000) return n;
  return Math.max(0, Math.round(n * 100));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function invoiceNumber(orderId: string, date: string): string {
  const safe = String(orderId || 'ORDER').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
  return `INV-${safe}-${date.replace(/-/g, '')}`;
}

export function buildOrderInvoice(input: BuildInvoiceInput): OrderInvoiceDoc {
  const order = input.order || {};
  const orderId = String(order.id || order.order_id || 'UNKNOWN');
  const now = input.now ?? new Date();
  const date = order.created_at ? String(order.created_at).slice(0, 10) : isoDate(now);
  const totalCents = dollarsToCents(order.total, order.total_cents);
  const rate = input.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const platformFee = calculatePlatformFee(totalCents, rate);
  const cookEarn = calculateCookEarnings(totalCents, rate);

  const rawItems = Array.isArray(order.items) ? order.items : [];
  let lines: OrderInvoiceLine[] = rawItems.map((it, i) => {
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    const unit =
      it.unit_price_cents != null
        ? Math.round(Number(it.unit_price_cents))
        : it.price_cents != null
          ? Math.round(Number(it.price_cents))
          : 0;
    const line = unit > 0 ? unit * qty : 0;
    return {
      description: String(it.name || `Item ${i + 1}`),
      qty,
      unit_cents: unit,
      line_cents: line,
    };
  });

  const linesSum = lines.reduce((s, l) => s + l.line_cents, 0);
  if (lines.length === 0 || linesSum === 0) {
    // Single line from order total when snapshot lacks unit prices
    lines = [
      {
        description:
          rawItems.map((x) => x.name).filter(Boolean).join(', ') ||
          'Home-cooked meal collection (marketplace order)',
        qty: 1,
        unit_cents: totalCents,
        line_cents: totalCents,
      },
    ];
  } else if (linesSum !== totalCents && totalCents > 0) {
    // Adjust last line so sum matches paid total (credits / rounding)
    const diff = totalCents - linesSum;
    const last = lines[lines.length - 1];
    last.line_cents = Math.max(0, last.line_cents + diff);
    last.unit_cents = last.qty > 0 ? Math.round(last.line_cents / last.qty) : last.line_cents;
  }

  const credits =
    order.credits_applied_cents != null
      ? Math.round(Number(order.credits_applied_cents))
      : Math.round(Number(order.credits_applied) || 0);

  const supplier = { ...DEFAULT_PLATFORM_SUPPLIER, ...input.supplier };
  const gstRate = supplier.gst_registered ? 0.09 : 0;
  // Total is treated as GST-inclusive when registered (not currently)
  const gstCents = supplier.gst_registered
    ? Math.round((totalCents * gstRate) / (1 + gstRate))
    : 0;
  const subtotal = totalCents - gstCents;

  const isCook = input.audience === 'cook';
  const notes: string[] = [
    supplier.gst_registered
      ? `GST is included at ${(gstRate * 100).toFixed(0)}% where applicable.`
      : 'Supplier is not GST-registered. This tax invoice does not charge GST.',
    'Collection-first marketplace: customer collects from the cook’s kitchen at the stated slot.',
    'This document is issued by the platform for the marketplace order. Keep for your records.',
  ];
  if (order.is_corporate) {
    notes.push('Corporate / group order flag was set at checkout.');
  }
  if (credits > 0) {
    notes.push(`Platform credits applied: S$${(credits / 100).toFixed(2)}.`);
  }
  if (isCook) {
    notes.push(
      `Platform service fee (${(rate * 100).toFixed(0)}%) is deducted from the order total before cook payout.`
    );
  }

  return {
    doc_type: isCook ? 'settlement_note' : 'tax_invoice',
    title: isCook ? 'Order settlement note' : 'Tax invoice',
    invoice_number: invoiceNumber(orderId, date),
    invoice_date: date,
    order_id: orderId,
    currency: 'SGD',
    supplier,
    bill_to: isCook
      ? {
          name: order.cook_name || input.actorName || 'Home cook',
          role_label: 'Cook (fulfilment partner)',
          id: order.cook_id,
        }
      : {
          name: order.customer_name || input.actorName || 'Customer',
          role_label: 'Customer',
          id: order.customer_id,
        },
    fulfilled_by: {
      cook_name: order.cook_name || 'Home kitchen',
      cook_id: order.cook_id,
    },
    lines,
    subtotal_cents: subtotal,
    gst_cents: gstCents,
    gst_rate: gstRate,
    total_cents: totalCents,
    platform_fee_cents: isCook ? platformFee : undefined,
    cook_earnings_cents: isCook ? cookEarn : undefined,
    commission_rate: isCook ? rate : undefined,
    payment: {
      method: 'PayNow (platform UEN)',
      reference: order.paynow_reference || orderId,
      collection_date: order.collection_date || null,
      collection_slot: order.collection_slot || null,
      status: order.shc_status || null,
    },
    notes,
    audience: input.audience,
  };
}

export function formatInvoiceMoney(cents: number): string {
  return `S$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

/** Printable HTML (web PDF via print / mobile via print API if available). */
export function invoiceToHtml(doc: OrderInvoiceDoc): string {
  const rows = doc.lines
    .map(
      (l) =>
        `<tr>
          <td>${escapeHtml(l.description)}</td>
          <td style="text-align:center">${l.qty}</td>
          <td style="text-align:right">${formatInvoiceMoney(l.unit_cents)}</td>
          <td style="text-align:right">${formatInvoiceMoney(l.line_cents)}</td>
        </tr>`
    )
    .join('');

  const settlement =
    doc.doc_type === 'settlement_note'
      ? `<tr><td colspan="3">Platform service fee (${((doc.commission_rate || 0) * 100).toFixed(0)}%)</td>
           <td style="text-align:right">-${formatInvoiceMoney(doc.platform_fee_cents || 0)}</td></tr>
         <tr><td colspan="3"><strong>Net cook earnings</strong></td>
           <td style="text-align:right"><strong>${formatInvoiceMoney(doc.cook_earnings_cents || 0)}</strong></td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.title)} ${escapeHtml(doc.invoice_number)}</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 32px; font-size: 12px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .muted { color: #555; }
    .box { border: 1px solid #ccc; border-radius: 8px; padding: 12px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; vertical-align: top; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: #666; }
    .totals td { border: none; padding: 4px 6px; }
    .foot { margin-top: 20px; font-size: 10px; color: #666; line-height: 1.4; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.title)}</h1>
  <p class="muted">${escapeHtml(doc.invoice_number)} · ${escapeHtml(doc.invoice_date)} · ${escapeHtml(doc.currency)}</p>

  <div class="box">
    <strong>${escapeHtml(doc.supplier.legal_name)}</strong><br/>
    UEN: ${escapeHtml(doc.supplier.uen)}<br/>
    ${escapeHtml(doc.supplier.address)}<br/>
    ${
      doc.supplier.gst_registered
        ? `GST Reg: ${escapeHtml(doc.supplier.gst_registration_number || '')}`
        : 'Not GST-registered'
    }
  </div>

  <div class="box">
    <strong>Bill to</strong> (${escapeHtml(doc.bill_to.role_label)})<br/>
    ${escapeHtml(doc.bill_to.name)}
    ${doc.bill_to.id ? `<br/><span class="muted">ID: ${escapeHtml(doc.bill_to.id)}</span>` : ''}
    ${
      doc.fulfilled_by
        ? `<br/><br/><strong>Fulfilled by kitchen</strong><br/>${escapeHtml(doc.fulfilled_by.cook_name)}`
        : ''
    }
  </div>

  <p><strong>Order:</strong> ${escapeHtml(doc.order_id)}
    ${doc.payment.collection_date ? ` · Collection ${escapeHtml(doc.payment.collection_date)} ${escapeHtml(doc.payment.collection_slot || '')}` : ''}
    ${doc.payment.status ? ` · Status: ${escapeHtml(doc.payment.status)}` : ''}
  </p>
  <p><strong>Payment:</strong> ${escapeHtml(doc.payment.method)}
    ${doc.payment.reference ? ` · Ref ${escapeHtml(doc.payment.reference)}` : ''}
  </p>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <table class="totals" style="margin-top:16px;width:50%;margin-left:auto">
    <tr><td>Subtotal</td><td style="text-align:right">${formatInvoiceMoney(doc.subtotal_cents)}</td></tr>
    <tr><td>GST (${(doc.gst_rate * 100).toFixed(0)}%)</td>
        <td style="text-align:right">${formatInvoiceMoney(doc.gst_cents)}</td></tr>
    <tr><td><strong>Total payable</strong></td>
        <td style="text-align:right"><strong>${formatInvoiceMoney(doc.total_cents)}</strong></td></tr>
    ${settlement}
  </table>

  <div class="foot">
    ${doc.notes.map((n) => `<p>${escapeHtml(n)}</p>`).join('')}
    <p>Generated by Singapore Home Cooks marketplace · Document for accounting records.</p>
  </div>
</body>
</html>`;
}

// fix typo - I used doc.gst_registered_display incorrectly. Fix in invoiceToHtml
function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapePdf(s: string): string {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Minimal single-page PDF (A4) — Helvetica, no images.
 * Returns base64 (no data: prefix).
 */
export function invoiceToPdfBase64(doc: OrderInvoiceDoc): string {
  type TLine = { text: string; size: number };
  const content: TLine[] = [];
  const add = (text: string, size = 11) => content.push({ text, size });

  add(doc.title.toUpperCase(), 16);
  add(`${doc.invoice_number}  |  ${doc.invoice_date}  |  ${doc.currency}`, 10);
  add('');
  add(`Supplier: ${doc.supplier.legal_name}`, 11);
  add(`UEN: ${doc.supplier.uen}  |  ${doc.supplier.address}`, 10);
  add(
    doc.supplier.gst_registered
      ? `GST Reg: ${doc.supplier.gst_registration_number || ''}`
      : 'Not GST-registered — no GST charged',
    10
  );
  add('');
  add(`Bill to (${doc.bill_to.role_label}): ${doc.bill_to.name}`, 11);
  if (doc.fulfilled_by) add(`Kitchen: ${doc.fulfilled_by.cook_name}`, 10);
  add(`Order: ${doc.order_id}`, 10);
  if (doc.payment.collection_date) {
    add(`Collection: ${doc.payment.collection_date} ${doc.payment.collection_slot || ''}`, 10);
  }
  add(`Payment: ${doc.payment.method}  Ref: ${doc.payment.reference || '—'}`, 10);
  add('');
  add('Items', 12);
  for (const l of doc.lines) {
    add(
      `  ${l.qty} x ${l.description}  @ ${formatInvoiceMoney(l.unit_cents)}  = ${formatInvoiceMoney(l.line_cents)}`,
      10
    );
  }
  add('');
  add(`Subtotal: ${formatInvoiceMoney(doc.subtotal_cents)}`, 11);
  add(`GST (${(doc.gst_rate * 100).toFixed(0)}%): ${formatInvoiceMoney(doc.gst_cents)}`, 11);
  add(`TOTAL: ${formatInvoiceMoney(doc.total_cents)}`, 13);
  if (doc.doc_type === 'settlement_note') {
    add(
      `Platform fee (${((doc.commission_rate || 0) * 100).toFixed(0)}%): -${formatInvoiceMoney(doc.platform_fee_cents || 0)}`,
      11
    );
    add(`Net cook earnings: ${formatInvoiceMoney(doc.cook_earnings_cents || 0)}`, 12);
  }
  add('');
  for (const n of doc.notes) add(n, 9);
  add('Singapore Home Cooks marketplace invoice', 9);

  // Build PDF content stream (y from top of A4 842)
  let y = 800;
  const ops: string[] = [];
  for (const line of content) {
    if (y < 50) break;
    const t = escapePdf(line.text.slice(0, 110));
    ops.push(`BT /F1 ${line.size} Tf 48 ${y} Td (${t}) Tj ET`);
    y -= line.size + 6;
  }
  const stream = ops.join('\n');
  const streamLen = Buffer.byteLength(stream, 'utf8');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  );
  objects.push(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(pdf, 'utf8').toString('base64');
  }
  // browser fallback
  const bytes = new TextEncoder().encode(pdf);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  // btoa may not exist in RN — use base64 from Buffer path primarily on server
  if (typeof btoa !== 'undefined') return btoa(binary);
  throw new Error('PDF base64 requires Buffer or btoa');
}

