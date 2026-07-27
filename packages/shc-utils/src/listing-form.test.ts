import { describe, expect, it } from 'vitest';
import {
  buildCookListingPayload,
  emptyAllergenTiers,
  toggleAllergenTier1,
  toggleCollectionDay,
  availabilityFromListing,
  normalizeCollectionSlot,
  resolveDefaultBatchCollectionSlot,
} from './listing-form';

describe('listing-form', () => {
  it('builds API payload with cook-editable fields', () => {
    const payload = buildCookListingPayload({
      name: 'Laksa',
      description: 'Family recipe',
      price: 14,
      min_qty: 4,
      cuisine: 'Peranakan',
      occasion_tags: ['Hari Raya'],
      ingredients: [{ name: 'Prawn', quantity: 6, unit: 'pcs' }],
      allergen_tiers: { tier1: ['Shellfish'], tier2: [], tier3: [] },
      halal: false,
      portions_per_day: 12,
      collection_days: [1, 2, 3, 4, 5],
      time_slots: ['17:00-19:00'],
      last_minute_premium_pct: 10,
      image_url: 'https://example.com/laksa.jpg',
    });
    expect(payload.description).toBe('Family recipe');
    expect(payload.allergen_tiers).toEqual({ tier1: ['Shellfish'], tier2: [], tier3: [] });
    expect(payload.portions_per_day).toBe(12);
    expect(payload.last_minute_premium_pct).toBe(10);
  });

  it('toggles allergens and collection days', () => {
    let tiers = emptyAllergenTiers();
    tiers = toggleAllergenTier1(tiers, 'Nuts (Peanuts)');
    expect(tiers.tier1).toContain('Nuts (Peanuts)');
    tiers = toggleAllergenTier1(tiers, 'Nuts (Peanuts)');
    expect(tiers.tier1).toHaveLength(0);
    expect(toggleCollectionDay([1, 3], 2)).toEqual([1, 2, 3]);
  });

  it('falls back to defaults when availability missing', () => {
    const avail = availabilityFromListing(null);
    expect(avail.portions_per_day).toBe(18);
    expect(avail.collection_days).toHaveLength(7);
  });

  it('normalizes collection slots and batch defaults', () => {
    expect(normalizeCollectionSlot('17:00-18:00')).toBe('17:00-18:00');
    expect(normalizeCollectionSlot('bad')).toBe('18:00-19:00');
    expect(resolveDefaultBatchCollectionSlot({ tiffinDefaultSlot: '17:00-19:00' })).toBe('17:00-19:00');
    expect(resolveDefaultBatchCollectionSlot({ tiffinDefaultSlot: '' })).toBe('18:00-19:00');
  });
});
