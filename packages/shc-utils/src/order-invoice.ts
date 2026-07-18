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
    items?: Array<{
      name?: string;
      qty?: number;
      price?: number; // dollars (common snapshot)
      price_cents?: number;
      unit_price_cents?: number;
    }>;
    total?: number | string;
    total_cents?: number;
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
  /** Set SHC_PLATFORM_UEN on medusa for production tax invoices */
  uen: (process.env.SHC_PLATFORM_UEN || process.env.NEXT_PUBLIC_SHC_PLATFORM_UEN || 'UEN-PENDING').trim(),
  address: 'Singapore',
  gst_registered: String(process.env.SHC_PLATFORM_GST_REGISTERED || '').toLowerCase() === 'true',
  gst_registration_number: process.env.SHC_PLATFORM_GST_NO?.trim() || null,
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

/** Normalize created_at from Date | ISO | locale string → YYYY-MM-DD */
export function toInvoiceDate(v: unknown, fallback = new Date()): string {
  if (v instanceof Date && !isNaN(v.getTime())) return isoDate(v);
  if (v == null || v === '') return isoDate(fallback);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return isoDate(d);
  return isoDate(fallback);
}

function invoiceNumber(orderId: string, date: string): string {
  const safe = String(orderId || 'ORDER').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
  const day = date.replace(/[^0-9]/g, '').slice(0, 8) || isoDate(new Date()).replace(/-/g, '');
  return `INV-${safe}-${day}`;
}

export function buildOrderInvoice(input: BuildInvoiceInput): OrderInvoiceDoc {
  const order = input.order || {};
  const orderId = String(order.id || order.order_id || 'UNKNOWN');
  const now = input.now ?? new Date();
  const date = toInvoiceDate(order.created_at, now);
  let totalCents = dollarsToCents(order.total, order.total_cents);
  const rate = input.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const platformFee = calculatePlatformFee(totalCents, rate);
  const cookEarn = calculateCookEarnings(totalCents, rate);

  const rawItems = Array.isArray(order.items) ? order.items : [];
  let lines: OrderInvoiceLine[] = rawItems.map((it, i) => {
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    let unit = 0;
    if (it.unit_price_cents != null && Number(it.unit_price_cents) > 0) {
      unit = Math.round(Number(it.unit_price_cents));
    } else if (it.price_cents != null && Number(it.price_cents) > 0) {
      unit = Math.round(Number(it.price_cents));
    } else if (it.price != null && Number(it.price) > 0) {
      // Snapshot stores dollars (e.g. 60) — convert to cents
      unit = Math.round(Number(it.price) * 100);
    }
    const line = unit > 0 ? unit * qty : 0;
    return {
      description: String(it.name || `Item ${i + 1}`),
      qty,
      unit_cents: unit,
      line_cents: line,
    };
  });

  let linesSum = lines.reduce((s, l) => s + l.line_cents, 0);
  // Prefer line sum when order total missing/zero but items have prices
  if (totalCents <= 0 && linesSum > 0) totalCents = linesSum;
  if (lines.length === 0 || (linesSum === 0 && totalCents > 0)) {
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
    linesSum = totalCents;
  } else if (linesSum !== totalCents && totalCents > 0 && linesSum > 0) {
    // Adjust last line so sum matches paid total (rounding)
    const diff = totalCents - linesSum;
    const last = lines[lines.length - 1];
    last.line_cents = Math.max(0, last.line_cents + diff);
    last.unit_cents = last.qty > 0 ? Math.round(last.line_cents / last.qty) : last.line_cents;
  }

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
  if (isCook) {
    notes.push(
      `Platform service fee (${(rate * 100).toFixed(0)}%) is deducted from the order total before cook payout.`
    );
  }

  return {
    doc_type: isCook ? 'settlement_note' : 'tax_invoice',
    title: isCook
      ? 'Order settlement note'
      : order.is_corporate
        ? 'Tax invoice (Corporate / group)'
        : 'Tax invoice',
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
 * Singapore tax invoice / settlement PDF (A4, Helvetica).
 * Layout follows common IRAS tax-invoice fields (supplier UEN, invoice no/date,
 * line items, GST status, total in SGD). Not a scanned letterhead — platform-issued digital record.
 * Returns base64 (no data: prefix).
 */
export function invoiceToPdfBase64(doc: OrderInvoiceDoc): string {
  type Cmd = string;
  const ops: Cmd[] = [];
  let y = 800;

  const text = (str: string, x: number, yy: number, size: number, font = '/F1') => {
    const t = escapePdf(String(str || '').slice(0, 120));
    ops.push(`BT ${font} ${size} Tf ${x} ${yy} Td (${t}) Tj ET`);
  };
  const hline = (yy: number, x1 = 48, x2 = 547) => {
    ops.push(`${x1} ${yy} m ${x2} ${yy} l S`);
  };
  const advance = (dy: number) => {
    y -= dy;
  };

  // Header
  text(doc.title.toUpperCase(), 48, y, 18, '/F2');
  advance(22);
  text('Singapore marketplace · Digital tax document', 48, y, 9);
  advance(16);
  hline(y + 4);
  advance(14);

  // Invoice meta (right-aligned-ish block via fixed x)
  text(`Invoice No: ${doc.invoice_number}`, 48, y, 11, '/F2');
  text(`Date of issue: ${doc.invoice_date}`, 320, y, 11);
  advance(14);
  text(`Currency: ${doc.currency}`, 48, y, 10);
  text(`Order ID: ${doc.order_id}`, 320, y, 10);
  advance(18);

  // Supplier (seller)
  text('SUPPLIER (SELLER)', 48, y, 9, '/F2');
  advance(12);
  text(doc.supplier.legal_name, 48, y, 12, '/F2');
  advance(13);
  text(`UEN: ${doc.supplier.uen || 'UEN-PENDING'}`, 48, y, 10);
  advance(12);
  text(`Address: ${doc.supplier.address || 'Singapore'}`, 48, y, 10);
  advance(12);
  if (doc.supplier.gst_registered) {
    text(
      `GST-registered · GST Reg No: ${doc.supplier.gst_registration_number || doc.supplier.uen}`,
      48,
      y,
      10
    );
  } else {
    text('Not GST-registered — GST amount on this invoice is S$0.00 (no GST charged).', 48, y, 10);
  }
  advance(18);

  // Bill to
  text('BILL TO', 48, y, 9, '/F2');
  advance(12);
  text(`${doc.bill_to.name}  (${doc.bill_to.role_label})`, 48, y, 11, '/F2');
  advance(12);
  if (doc.bill_to.id) {
    text(`Account: ${doc.bill_to.id}`, 48, y, 10);
    advance(12);
  }
  if (doc.fulfilled_by?.cook_name) {
    text(`Fulfilled by kitchen: ${doc.fulfilled_by.cook_name}`, 48, y, 10);
    advance(12);
  }
  advance(6);

  // Supply details
  text('SUPPLY DETAILS', 48, y, 9, '/F2');
  advance(12);
  if (doc.payment.collection_date) {
    text(
      `Date of supply (collection): ${doc.payment.collection_date} ${doc.payment.collection_slot || ''}`.trim(),
      48,
      y,
      10
    );
    advance(12);
  }
  text(
    `Payment: ${doc.payment.method}${doc.payment.reference ? ` · Ref ${doc.payment.reference}` : ''}`,
    48,
    y,
    10
  );
  advance(12);
  if (doc.payment.status) {
    text(`Order status: ${doc.payment.status}`, 48, y, 10);
    advance(12);
  }
  advance(6);
  hline(y + 4);
  advance(14);

  // Line table header
  text('Description', 48, y, 9, '/F2');
  text('Qty', 320, y, 9, '/F2');
  text('Unit', 370, y, 9, '/F2');
  text('Amount (SGD)', 450, y, 9, '/F2');
  advance(10);
  hline(y + 4);
  advance(12);

  for (const l of doc.lines) {
    if (y < 120) break;
    text(l.description.slice(0, 48), 48, y, 10);
    text(String(l.qty), 325, y, 10);
    text(formatInvoiceMoney(l.unit_cents), 370, y, 10);
    text(formatInvoiceMoney(l.line_cents), 460, y, 10);
    advance(14);
  }
  advance(4);
  hline(y + 6);
  advance(16);

  // Totals
  text('Subtotal (before GST)', 320, y, 10);
  text(formatInvoiceMoney(doc.subtotal_cents), 460, y, 10);
  advance(13);
  text(
    doc.supplier.gst_registered
      ? `GST (${(doc.gst_rate * 100).toFixed(0)}%)`
      : 'GST (not charged — not registered)',
    320,
    y,
    10
  );
  text(formatInvoiceMoney(doc.gst_cents), 460, y, 10);
  advance(14);
  text('TOTAL PAYABLE', 320, y, 12, '/F2');
  text(formatInvoiceMoney(doc.total_cents), 460, y, 12, '/F2');
  advance(16);

  if (doc.doc_type === 'settlement_note') {
    hline(y + 4);
    advance(14);
    text('COOK SETTLEMENT', 48, y, 10, '/F2');
    advance(13);
    text(
      `Platform service fee (${((doc.commission_rate || 0) * 100).toFixed(0)}%)`,
      48,
      y,
      10
    );
    text(`-${formatInvoiceMoney(doc.platform_fee_cents || 0)}`, 460, y, 10);
    advance(13);
    text('Net cook earnings', 48, y, 11, '/F2');
    text(formatInvoiceMoney(doc.cook_earnings_cents || 0), 460, y, 11, '/F2');
    advance(16);
  }

  advance(6);
  hline(y + 4);
  advance(14);
  text('NOTES', 48, y, 9, '/F2');
  advance(12);
  for (const n of doc.notes) {
    if (y < 48) break;
    // wrap long notes
    const chunk = n.slice(0, 95);
    text(chunk, 48, y, 8);
    advance(11);
    if (n.length > 95) {
      text(n.slice(95, 190), 48, y, 8);
      advance(11);
    }
  }
  advance(8);
  text('This is a computer-generated document issued by the marketplace platform.', 48, y, 8);
  advance(10);
  text('Keep for your accounting records. Singapore Home Cooks.', 48, y, 8);

  const stream = `0.2 w\n${ops.join('\n')}`;
  const streamLen = Buffer.byteLength(stream, 'utf8');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n'
  );
  objects.push(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

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
  const bytes = new TextEncoder().encode(pdf);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  if (typeof btoa !== 'undefined') return btoa(binary);
  throw new Error('PDF base64 requires Buffer or btoa');
}

