import { describe, it, expect } from 'vitest';
import { canCookListProducts, canCookAcceptOrder, canCookRequestPayout, validateCookStatusTransition } from './cook-status-gates';

describe('cook-status-gates rule (10+ tests, 05 shc_cook.status + 08 marketplace + 07 auth + compliance)', () => {
  it('active non-paused cook can list', () => {
    expect(canCookListProducts({ status: 'active', availabilityPaused: false }).valid).toBe(true);
  });

  it('non active cannot list', () => {
    const r = canCookListProducts({ status: 'paused', availabilityPaused: false });
    expect(r.valid).toBe(false);
    expect(r.code).toBe('SHC-COOK-001');
  });

  it('paused avail blocks list', () => {
    expect(canCookListProducts({ status: 'active', availabilityPaused: true }).valid).toBe(false);
  });

  it('active can accept if compliance verified', () => {
    expect(canCookAcceptOrder({ status: 'active', availabilityPaused: false, hasVerifiedCompliance: true }).valid).toBe(true);
  });

  it('blocks accept if no verified compliance', () => {
    const r = canCookAcceptOrder({ status: 'active', availabilityPaused: false, hasVerifiedCompliance: false });
    expect(r.valid).toBe(false);
    expect(r.code).toBe('SHC-COMPLIANCE-002');
  });

  it('blocks accept if not active', () => {
    expect(canCookAcceptOrder({ status: 'pending', availabilityPaused: false }).valid).toBe(false);
  });

  it('active verified can request payout', () => {
    expect(canCookRequestPayout({ status: 'active', availabilityPaused: false, hasVerifiedCompliance: true }).valid).toBe(true);
  });

  it('no compliance blocks payout', () => {
    expect(canCookRequestPayout({ status: 'active', hasVerifiedCompliance: false }).valid).toBe(false);
  });

  it('validateCookStatusTransition per spec', () => {
    expect(validateCookStatusTransition('pending', 'active').valid).toBe(true);
    expect(validateCookStatusTransition('active', 'paused').valid).toBe(true);
    expect(validateCookStatusTransition('suspended', 'active').valid).toBe(false);
  });

  it('suspended is terminal for most', () => {
    expect(validateCookStatusTransition('suspended', 'paused').valid).toBe(false);
  });

  it('covers dashboard status guards (mobile mock)', () => {
    const paidOrderCook = { status: 'active', availabilityPaused: false, hasVerifiedCompliance: true };
    expect(canCookAcceptOrder(paidOrderCook).valid).toBe(true);
  });

  it('pure and no side effects', () => {
    const ctx = { status: 'active', availabilityPaused: false };
    expect(canCookListProducts(ctx)).toEqual(canCookListProducts(ctx));
  });
});
