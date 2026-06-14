import { describe, it, expect } from 'vitest';
import { requiresAllergenAck, validateAllergenAckForCheckout, allergenAckSchema, ackAllergens } from './allergen-ack';

describe('allergen-ack rule (10+ tests per 08-marketplace-rules + 09-order-state + production PDPA)', () => {
  it('requires ack when missing', () => {
    expect(requiresAllergenAck({})).toBe(true);
    expect(requiresAllergenAck({ allergen_acked_at: null })).toBe(true);
  });

  it('does not require when acked', () => {
    expect(requiresAllergenAck({ allergen_acked_at: '2026-06-13T10:00:00Z' })).toBe(false);
  });

  it('validate blocks checkout without ack', () => {
    const res = validateAllergenAckForCheckout({});
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-CART-003');
  });

  it('validate passes with ack', () => {
    const res = validateAllergenAckForCheckout({ allergen_acked_at: '2026-06-13T10:00:00Z' });
    expect(res.valid).toBe(true);
  });

  it('schema accepts null or datetime or absent', () => {
    expect(() => allergenAckSchema.parse({ allergen_acked_at: null })).not.toThrow();
    expect(() => allergenAckSchema.parse({ allergen_acked_at: '2026-06-01T00:00:00Z' })).not.toThrow();
    expect(() => allergenAckSchema.parse({})).not.toThrow();
  });

  it('ackAllergens sets timestamp', () => {
    const res = ackAllergens({}, '2026-06-14T08:00:00Z');
    expect(res.meta.allergen_acked_at).toBe('2026-06-14T08:00:00Z');
  });

  it('rejects invalid datetime in schema', () => {
    expect(() => allergenAckSchema.parse({ allergen_acked_at: 'not-a-date' })).toThrow();
  });

  it('checkout error message references marketplace rules', () => {
    const res = validateAllergenAckForCheckout({ allergen_acked_at: null });
    expect(res.error).toContain('08-marketplace-rules.md');
  });

  it('multiple calls consistent (pure)', () => {
    const m = { allergen_acked_at: '2026-06-13T10:00:00Z' };
    expect(validateAllergenAckForCheckout(m)).toEqual(validateAllergenAckForCheckout(m));
  });

  it('handles undefined explicitly', () => {
    expect(requiresAllergenAck({ allergen_acked_at: undefined })).toBe(true);
  });

  it('ack after order paid state (per 09)', () => {
    // simulation
    const postPayMeta = { allergen_acked_at: '2026-06-13T11:00:00Z' };
    expect(validateAllergenAckForCheckout(postPayMeta).valid).toBe(true);
  });

  it('covers edge for contract test (mock checkout payload)', () => {
    const mobileMock = { allergen_acked_at: undefined };
    expect(validateAllergenAckForCheckout(mobileMock).valid).toBe(false);
  });
});
