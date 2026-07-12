import { describe, it, expect } from 'vitest';
import {
  buildOrderInvoice,
  formatInvoiceMoney,
  invoiceToHtml,
  invoiceToPdfBase64,
} from './order-invoice';

const sampleOrder = {
  id: 'SHC-71655263',
  cook_id: 'cook_rose_tampines_001',
  cook_name: 'Rose Kitchen',
  customer_id: 'cus_demo',
  customer_name: 'Aisha Tan',
  shc_status: 'preparing',
  collection_date: '2026-07-10',
  collection_slot: '18:00-19:00',
  paynow_reference: 'PN-71655263',
  items: [
    { name: 'Railway Redeploy Laksa', qty: 2, unit_price_cents: 5800 },
  ],
  total: 116,
  total_cents: 11600,
};

describe('order-invoice', () => {
  it('builds customer tax invoice with SGD totals', () => {
    const inv = buildOrderInvoice({ order: sampleOrder, audience: 'customer' });
    expect(inv.doc_type).toBe('tax_invoice');
    expect(inv.invoice_number).toMatch(/^INV-SHC-71655263-/);
    expect(inv.total_cents).toBe(11600);
    expect(inv.lines[0].description).toMatch(/Laksa/);
    expect(inv.lines[0].line_cents).toBe(11600);
    expect(inv.gst_cents).toBe(0);
    expect(inv.supplier.gst_registered).toBe(false);
    expect(inv.bill_to.role_label).toMatch(/Customer/i);
  });

  it('builds cook settlement with 15% platform fee split', () => {
    const inv = buildOrderInvoice({ order: sampleOrder, audience: 'cook' });
    expect(inv.doc_type).toBe('settlement_note');
    expect(inv.platform_fee_cents).toBe(1740); // 15% of 11600
    expect(inv.cook_earnings_cents).toBe(9860);
    expect(inv.bill_to.role_label).toMatch(/Cook/i);
  });

  it('formats money and HTML/PDF for download', () => {
    const inv = buildOrderInvoice({ order: sampleOrder, audience: 'customer' });
    expect(formatInvoiceMoney(11600)).toBe('S$116.00');
    const html = invoiceToHtml(inv);
    expect(html).toContain('Tax invoice');
    expect(html).toContain('Not GST-registered');
    expect(html).toContain('S$116.00');
    const b64 = invoiceToPdfBase64(inv);
    expect(b64.length).toBeGreaterThan(200);
    // PDF magic after decode
    const head = Buffer.from(b64, 'base64').subarray(0, 5).toString('utf8');
    expect(head).toBe('%PDF-');
  });

  it('falls back to single line when items lack unit prices', () => {
    const inv = buildOrderInvoice({
      order: {
        id: 'O1',
        total: 50,
        items: [{ name: 'Nasi Lemak', qty: 1 }],
      },
      audience: 'customer',
    });
    expect(inv.total_cents).toBe(5000);
    expect(inv.lines[0].line_cents).toBe(5000);
  });

  it('uses line sum when total is zero and dates stay ISO', () => {
    const inv = buildOrderInvoice({
      order: {
        id: 'O2',
        total: 0,
        created_at: new Date('2026-07-10T12:00:00.000Z') as any,
        items: [{ name: 'Laksa', qty: 2, unit_price_cents: 5800 }],
      },
      audience: 'customer',
    });
    expect(inv.total_cents).toBe(11600);
    expect(inv.invoice_date).toBe('2026-07-10');
    expect(inv.invoice_number).toMatch(/-20260710$/);
  });
});
