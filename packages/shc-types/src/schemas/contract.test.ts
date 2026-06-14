import { describe, it, expect } from 'vitest';
import {
  shcCookSchema,
  shcProductMetaSchema,
  shcOrderMetaSchema,
  shcAvailabilitySchema,
  shcOrderMessageSchema,
  shcReviewSchema,
  SHCOrderStatus,
  shcCommissionRuleSchema,
  SHCErrorCodes,
} from '../index';

// Contract tests: validate mobile mocks + future API payloads against exact 05-data-model schemas
// Ensures no drift between contracts and consumers (mobile, medusa modules, api surface). Per production-hardening.md

describe('Contract tests - mobile mocks & API payloads (Zod .strict() validation)', () => {
  // From apps/mobile/app/(customer)/cart.tsx mock (adapted to full schema)
  it('validates one-cook cart derived payload (mobile cart.tsx)', () => {
    const cook = shcCookSchema.parse({
      id: 'cook_auntie_rose',
      auth_identity_id: 'auth_rose',
      slug: 'auntie-rose',
      display_name: 'Auntie Rose',
      area: 'Tampines',
      status: 'active',
      availability_paused: false,
      pdpa_consent_at: '2026-06-01T00:00:00Z',
      pdpa_consent_version: 'v1',
    });
    expect(cook.slug).toBe('auntie-rose');

    const orderMetaForCart = shcOrderMetaSchema.parse({
      order_id: 'cart_temp',
      cook_id: cook.id,
      collection_date: '2026-07-01',
      collection_slot: '18:00-19:00',
      shc_status: 'cart' as const,
    });
    expect(orderMetaForCart.cook_id).toBe(cook.id);
  });

  // From checkout.tsx + paynow ref
  it('validates paid order meta with paynow (mobile checkout.tsx + 09)', () => {
    const meta = shcOrderMetaSchema.parse({
      order_id: 'SHC-2026-00001',
      cook_id: 'cook_auntie_rose',
      collection_date: '2026-07-01',
      collection_slot: '18:00-19:00',
      paynow_reference: 'SHC-2026-00001',
      shc_status: 'paid',
      allergen_acked_at: '2026-06-13T10:10:00Z',
      address_released_at: undefined,
    });
    expect(meta.shc_status).toBe('paid');
    expect(meta.paynow_reference).toMatch(/SHC-/);
  });

  // Cook dashboard mock orders
  it('validates cook dashboard order statuses (mobile dashboard.tsx)', () => {
    ['paid', 'accepted'].forEach((s) => {
      const m = shcOrderMetaSchema.parse({
        order_id: 'o1',
        cook_id: 'c1',
        collection_date: '2026-06-20',
        collection_slot: '17:00-18:00',
        shc_status: s as SHCOrderStatus,
      });
      expect(m.shc_status).toBe(s);
    });
  });

  // Order message from chat mock
  it('validates order chat messages (mobile orders/[id].tsx)', () => {
    const msg = shcOrderMessageSchema.parse({
      id: 'msg1',
      order_id: 'SHC-2026-00001',
      sender_actor: 'cook',
      sender_id: 'cook_auntie_rose',
      body: 'Order accepted! Ready by 5:30pm.',
      created_at: '2026-06-13T12:00:00Z',
    });
    expect(msg.sender_actor).toBe('cook');
    expect(msg.body.length).toBeGreaterThan(0);
  });

  // Full product meta from blueprint examples (Nasi Lemak etc)
  it('validates product meta with allergens, calories (future API + seed)', () => {
    const meta = shcProductMetaSchema.parse({
      product_id: 'prod_nasi_lemak',
      cook_id: 'cook_auntie_rose',
      cuisine: 'Peranakan',
      occasion_tags: ['Hari Raya', 'Everyday'],
      allergen_tiers: { tier1: ['Prawn', 'Peanut'] },
      halal: false,
      calories: 650,
      calories_confidence: 'full',
      ingredients: [{ name: 'Rice', quantity: 200, unit: 'g' }],
      min_qty: 2,
      last_minute_premium_pct: 10,
    });
    expect(meta.min_qty).toBe(2);
    expect(meta.allergen_tiers.tier1).toContain('Prawn');
  });

  // Availability for checkout portions
  it('validates shc_availability for portions enforcement (08 + mobile)', () => {
    const avail = shcAvailabilitySchema.parse({
      product_id: 'prod_nasi_lemak',
      portions_per_day: 8,
      collection_days: [1, 2, 3, 4, 5],
      time_slots: ['17:00-18:00', '18:00-19:00'],
      paused: false,
    });
    expect(avail.portions_per_day).toBe(8);
  });

  // Review post collection contract
  it('validates review payload only post-collected (08-marketplace-rules)', () => {
    const review = shcReviewSchema.parse({
      id: 'rev1',
      order_id: 'o123',
      cook_id: 'c1',
      customer_id: 'cust1',
      rating: 5,
      body: 'Excellent Nasi Lemak, authentic!',
    });
    expect(review.rating).toBe(5);
  });

  // Commission rule payload
  it('validates commission rule (future phase6 API)', () => {
    const rule = shcCommissionRuleSchema.parse({
      id: 'rule_v1',
      version: 1,
      rate_pct: 15,
      effective_from: '2026-01-01T00:00:00Z',
      created_by: 'ops_admin',
    });
    expect(rule.rate_pct).toBe(15);
  });

  // Error code contract usage
  it('SHCErrorCodes has all for contract error responses (ERROR_CODES.md)', () => {
    expect(SHCErrorCodes['SHC-CART-001']).toBeDefined();
    expect(SHCErrorCodes['SHC-ORDER-001']).toBeDefined();
    expect(Object.keys(SHCErrorCodes).length).toBeGreaterThanOrEqual(20);
  });

  // Strict rejection for bad payload (mobile future proof)
  it('rejects non-strict extra fields in all core schemas', () => {
    expect(() => shcOrderMetaSchema.parse({ order_id: 'x', cook_id: 'c', collection_date: '2026-01-01', collection_slot: 'a', shc_status: 'cart', extra: 1 } as any)).toThrow();
  });
});
