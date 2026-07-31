import { describe, expect, it } from 'vitest';
import {
  cookHasPaynowConfigured,
  formatCookLastPayoutLine,
  formatCookNextPayoutLine,
  getPreviousWeekStartIso,
  getSingaporeWeekBounds,
  isWithinSingaporeWeek,
  normalizePaynowMobile,
} from './cook-payout';

describe('cook-payout helpers', () => {
  it('detects PayNow mobile configuration', () => {
    expect(cookHasPaynowConfigured({ paynow_mobile: '+6591234567' })).toBe(true);
    expect(cookHasPaynowConfigured({ paynow_uen: '201234567A', payout_legal_name: 'Rose Pte Ltd' })).toBe(true);
    expect(cookHasPaynowConfigured({ paynow_uen: '201234567A' })).toBe(false);
  });

  it('normalizes Singapore mobile numbers', () => {
    expect(normalizePaynowMobile('91234567')).toBe('+6591234567');
    expect(normalizePaynowMobile('+65 9123 4567')).toBe('+6591234567');
  });

  it('formats payout lines', () => {
    expect(
      formatCookLastPayoutLine({
        amount_cents: 5000,
        transfer_ref: 'ABC',
        paid_at: '2026-01-10T02:00:00.000Z',
      })
    ).toContain('S$50.00');
    expect(formatCookNextPayoutLine({ scheduled_day: 'Mon', pending_cents: 12000 })).toContain('pending');
  });

  it('computes week bounds and membership', () => {
    const ref = new Date('2026-07-29T12:00:00+08:00');
    const bounds = getSingaporeWeekBounds(ref);
    expect(bounds.weekStartIso).toBe('2026-07-27');
    expect(isWithinSingaporeWeek('2026-07-29T12:00:00+08:00', bounds)).toBe(true);
    expect(getPreviousWeekStartIso(ref)).toBe('2026-07-20');
  });
});
