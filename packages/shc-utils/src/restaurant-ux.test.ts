import { describe, expect, it } from 'vitest';
import {
  checkoutTrustLine,
  collectionEtaHint,
  discoverQuickActions,
  isPopularDish,
  isVegetarianDish,
} from './restaurant-ux';

describe('restaurant-ux', () => {
  it('discoverQuickActions exposes icon+label shortcuts', () => {
    const actions = discoverQuickActions();
    expect(actions.map((a) => a.label)).toEqual(['Browse', 'Tiffin', 'Cart', 'Location']);
    expect(actions.every((a) => a.accessibilityLabel.length > 0)).toBe(true);
  });

  it('isPopularDish flags high ratings', () => {
    expect(isPopularDish({ rating: 4.8 })).toBe(true);
    expect(isPopularDish({ rating: 4.2 })).toBe(false);
  });

  it('isVegetarianDish uses name heuristics', () => {
    expect(isVegetarianDish({ name: 'Gado Gado' })).toBe(true);
    expect(isVegetarianDish({ name: 'Chicken Rice' })).toBe(false);
  });

  it('checkoutTrustLine mentions PayNow and no hidden fees', () => {
    expect(checkoutTrustLine()).toMatch(/hidden fees/i);
    expect(checkoutTrustLine()).toMatch(/PayNow/i);
  });

  it('collectionEtaHint includes area when provided', () => {
    expect(collectionEtaHint('Katong')).toMatch(/Katong/);
    expect(collectionEtaHint()).toMatch(/checkout/i);
  });
});
