import { describe, expect, it } from 'vitest';
import {
  buildCustomerConfigPayload,
  customerCategoryOfferCopy,
  customerIsPopularDish,
  customerMindCategories,
  defaultCustomerBrowseConfig,
  defaultListingOccasionTag,
  listingOccasionTagOptions,
  normalizeCustomerBrowseConfig,
} from './customer-browse-config';

describe('customer-browse-config', () => {
  it('builds defaults', () => {
    const cfg = defaultCustomerBrowseConfig();
    expect(cfg.occasions.length).toBeGreaterThan(3);
    expect(cfg.meal_type_chips[0]?.id).toBe('all');
  });

  it('resolves mind categories with All row', () => {
    const rows = customerMindCategories(defaultCustomerBrowseConfig());
    expect(rows[0]?.label).toBe('All');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('applies category offer template', () => {
    const copy = customerCategoryOfferCopy(defaultCustomerBrowseConfig(), 'Malay');
    expect(copy.title).toContain('Malay');
  });

  it('respects popular threshold from config', () => {
    const cfg = defaultCustomerBrowseConfig();
    expect(customerIsPopularDish({ rating: 4.8 }, [], cfg.popular)).toBe(true);
    expect(customerIsPopularDish({ rating: 4.0 }, [], { ...cfg.popular, min_rating: 4.5 })).toBe(false);
  });

  it('builds aggregate payload', () => {
    const payload = buildCustomerConfigPayload({});
    expect(payload.categories.length).toBeGreaterThan(0);
    expect(payload.promos.length).toBeGreaterThan(0);
    expect(payload.config.copy.guest_headline).toBeTruthy();
  });

  it('normalizes admin browse overrides', () => {
    const cfg = normalizeCustomerBrowseConfig({
      copy: { guest_headline: 'Welcome back' },
      popular: { min_rating: 4.5, top_percent: 15 },
    });
    expect(cfg.copy.guest_headline).toBe('Welcome back');
    expect(cfg.popular.min_rating).toBe(4.5);
  });

  it('derives listing occasion tag options from admin occasions', () => {
    const cfg = normalizeCustomerBrowseConfig({
      occasions: [
        { id: 'CNY', label: 'Chinese New Year', enabled: true, sort_order: 20, image_url: '' },
        { id: 'Hari Raya', label: 'Hari Raya', enabled: true, sort_order: 10, image_url: '' },
        { id: 'Wedding', label: 'Wedding', enabled: false, sort_order: 30, image_url: '' },
      ],
    });
    expect(listingOccasionTagOptions(cfg)).toEqual(['Hari Raya', 'Chinese New Year']);
    expect(defaultListingOccasionTag(cfg)).toBe('Hari Raya');
  });
});
