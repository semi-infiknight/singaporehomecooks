import { describe, expect, it } from 'vitest';
import {
  subscribeTrustChips,
  subscribeConfirmSteps,
  kitchenSubscriberLabel,
  subscriptionLedgerPreview,
} from './subscribe-funnel';

describe('subscribe-funnel (wave 4)', () => {
  it('trust chips cover one kitchen, collection, allergens, flex', () => {
    const ids = subscribeTrustChips({ area: 'Tampines', cookName: 'Auntie Rose' }).map((c) => c.id);
    expect(ids).toEqual(['one_kitchen', 'collection', 'allergens', 'flex']);
    expect(subscribeTrustChips({ area: 'Tampines' })[1].detail).toMatch(/Tampines/);
  });

  it('confirm steps are ordered pick → pay → collect', () => {
    const steps = subscribeConfirmSteps();
    expect(steps).toHaveLength(3);
    expect(steps[0]!.id).toBe('plan');
    expect(steps[1]!.id).toBe('pay');
    expect(steps[2]!.id).toBe('collect');
  });

  it('subscriber label social proof', () => {
    expect(kitchenSubscriberLabel(0)).toMatch(/first/i);
    expect(kitchenSubscriberLabel(1)).toBe('1 subscriber');
    expect(kitchenSubscriberLabel(42)).toBe('42 subscribers');
  });

  it('ledger preview has recharge + meals + flex when sub present', () => {
    const rows = subscriptionLedgerPreview({
      meals_per_week: 3,
      deliveries_left: 10,
      flex_remaining: 2,
      expires_on: '2026-08-01',
    });
    expect(rows.map((r) => r.kind)).toEqual(['recharge', 'meal', 'flex']);
    expect(subscriptionLedgerPreview(null)).toEqual([]);
  });
});
