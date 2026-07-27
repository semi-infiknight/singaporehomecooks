import { describe, expect, it } from 'vitest';
import {
  buildCustomerConfigPayload,
  customerCategoryOfferCopy,
  customerIsPopularDish,
  customerMindCategories,
  defaultCustomerBrowseConfig,
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
});
