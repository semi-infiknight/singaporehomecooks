import { describe, expect, it } from 'vitest';
import {
  emptyOrdersDayCopy,
  emptyActiveSubscriptionsCopy,
  emptyPastSubscriptionsCopy,
} from './empty-screens';

describe('empty-screens (HomelyEats empty IA)', () => {
  it('orders day empty — today vs other day', () => {
    expect(emptyOrdersDayCopy({ isToday: true }).title).toMatch(/today/i);
    expect(emptyOrdersDayCopy({ isToday: false }).title).toMatch(/this day/i);
    expect(emptyOrdersDayCopy().illustration).toBe('no_orders');
  });

  it('active subscriptions empty has CTA', () => {
    const c = emptyActiveSubscriptionsCopy();
    expect(c.title).toMatch(/no active subscriptions/i);
    expect(c.ctaLabel).toMatch(/Subscribe now/i);
    expect(c.illustration).toBe('no_active_sub');
  });

  it('past subscriptions empty has no CTA field', () => {
    const c = emptyPastSubscriptionsCopy();
    expect(c.title).toMatch(/no past subscriptions/i);
    expect(c.illustration).toBe('no_past_sub');
    expect('ctaLabel' in c).toBe(false);
  });
});
