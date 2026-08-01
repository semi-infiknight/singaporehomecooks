/**
 * Weekly payout invoice — issued by Singapore Home Cooks to the cook.
 */

import { DEFAULT_COMMISSION_RATE } from '@shc/business-rules';
import {
  DEFAULT_PLATFORM_SUPPLIER,
  formatInvoiceMoney,
  invoiceToHtml,
  invoiceToPdfBase64,
  type OrderInvoiceDoc,
  type OrderInvoiceLine,
} from './order-invoice';

export type PayoutInvoiceLine = OrderInvoiceLine & {
  order_id?: string;
};

export type PayoutInvoiceDoc = {
  batch_id: string;
  week_start: string;
  week_end?: string | null;
  invoice_number: string;
  invoice_date: string;
  currency: 'SGD';
  cook: {
    cook_id: string;
    legal_name: string;
    paynow_mobile?: string | null;
    paynow_uen?: string | null;
    area?: string | null;
  };
  lines: PayoutInvoiceLine[];
  gross_order_cents: number;
  platform_fee_cents: number;
  net_payout_cents: number;
  commission_rate: number;
  transfer_ref?: string | null;
  status?: string | null;
  paid_at?: string | null;
  notes: string[];
};

export type BuildPayoutInvoiceInput = {
  batch_id: string;
  week_start: string;
  week_end?: string | null;
  cook: PayoutInvoiceDoc['cook'];
  lines: PayoutInvoiceLine[];
  gross_order_cents: number;
  platform_fee_cents: number;
  net_payout_cents: number;
  commission_rate?: number;
  transfer_ref?: string | null;
  status?: string | null;
  paid_at?: string | null;
  now?: Date;
};

function payoutInvoiceNumber(batchId: string, weekStart: string): string {
  const safe = String(batchId || 'BATCH').replace(/[^A-Za-z0-9-]/g, '').slice(0, 16);
  const day = String(weekStart || '').replace(/[^0-9]/g, '').slice(0, 8);
  return `PAY-${safe}-${day || '00000000'}`;
}

export function buildPayoutInvoice(input: BuildPayoutInvoiceInput): PayoutInvoiceDoc {
  const now = input.now ?? new Date();
  const rate = input.commission_rate ?? DEFAULT_COMMISSION_RATE;
  const invoice_date = input.paid_at
    ? String(input.paid_at).slice(0, 10)
    : now.toISOString().slice(0, 10);

  return {
    batch_id: input.batch_id,
    week_start: input.week_start,
    week_end: input.week_end || null,
    invoice_number: payoutInvoiceNumber(input.batch_id, input.week_start),
    invoice_date,
    currency: 'SGD',
    cook: input.cook,
    lines: input.lines,
    gross_order_cents: input.gross_order_cents,
    platform_fee_cents: input.platform_fee_cents,
    net_payout_cents: input.net_payout_cents,
    commission_rate: rate,
    transfer_ref: input.transfer_ref || null,
    status: input.status || null,
    paid_at: input.paid_at || null,
    notes: [
      'Weekly payout invoice issued by Singapore Home Cooks to the cook.',
      `Accrual week starting ${input.week_start}.`,
      `Platform service fee (${(rate * 100).toFixed(0)}%) deducted from completed orders before payout.`,
      'Keep for IRAS records and your home-business bookkeeping.',
    ],
  };
}

export function payoutInvoiceToOrderInvoiceDoc(doc: PayoutInvoiceDoc): OrderInvoiceDoc {
  const paynowHint = doc.cook.paynow_mobile
    ? `PayNow mobile ${doc.cook.paynow_mobile}`
    : doc.cook.paynow_uen
      ? `PayNow UEN ${doc.cook.paynow_uen}`
      : 'PayNow on file';

  return {
    doc_type: 'tax_invoice',
    title: 'Weekly payout invoice',
    invoice_number: doc.invoice_number,
    invoice_date: doc.invoice_date,
    order_id: doc.batch_id,
    currency: 'SGD',
    supplier: { ...DEFAULT_PLATFORM_SUPPLIER },
    bill_to: {
      name: doc.cook.legal_name,
      role_label: 'Cook (payout recipient)',
      id: doc.cook.cook_id,
    },
    lines: doc.lines,
    subtotal_cents: doc.net_payout_cents,
    gst_cents: 0,
    gst_rate: 0,
    total_cents: doc.net_payout_cents,
    platform_fee_cents: doc.platform_fee_cents,
    cook_earnings_cents: doc.net_payout_cents,
    commission_rate: doc.commission_rate,
    payment: {
      method: `PayNow transfer · ${paynowHint}`,
      reference: doc.transfer_ref ?? null,
      status: doc.status ?? null,
    },
    notes: [
      ...doc.notes,
      `Gross completed orders: ${formatInvoiceMoney(doc.gross_order_cents)}.`,
      `Platform fee: ${formatInvoiceMoney(doc.platform_fee_cents)}.`,
    ],
    audience: 'customer',
    payout_remittance: true,
  };
}

export function payoutInvoiceToHtml(doc: PayoutInvoiceDoc): string {
  return invoiceToHtml(payoutInvoiceToOrderInvoiceDoc(doc));
}

export function payoutInvoiceToPdfBase64(doc: PayoutInvoiceDoc): string {
  return invoiceToPdfBase64(payoutInvoiceToOrderInvoiceDoc(doc));
}
