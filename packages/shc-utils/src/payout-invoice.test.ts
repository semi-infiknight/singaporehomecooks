import { describe, expect, it } from 'vitest';
import { buildPayoutInvoice, payoutInvoiceToPdfBase64 } from './payout-invoice';

describe('payout-invoice', () => {
  it('builds weekly payout invoice from SHC to cook', () => {
    const doc = buildPayoutInvoice({
      batch_id: 'batch_123',
      week_start: '2026-07-28',
      cook: {
        cook_id: 'cook_rose',
        legal_name: 'Rose Kitchen',
        paynow_mobile: '+6591234567',
      },
      lines: [{ description: 'Laksa · SHC-1', qty: 1, unit_cents: 9860, line_cents: 9860 }],
      gross_order_cents: 11600,
      platform_fee_cents: 1740,
      net_payout_cents: 9860,
      transfer_ref: 'SIM-PAYOUT-1',
      status: 'paid',
    });
    expect(doc.invoice_number).toMatch(/^PAY-batch123-/);
    expect(doc.net_payout_cents).toBe(9860);
    const b64 = payoutInvoiceToPdfBase64(doc);
    expect(b64.length).toBeGreaterThan(200);
    expect(Buffer.from(b64, 'base64').subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
