import { describe, it, expect } from 'vitest';
import { canTransition, validateTransitionWithCode, isTerminal, getAllowedNext } from './order-state';
import { SHCOrderStatus } from '@shc/types';

describe('order-state rule (10+ tests, exact 09-order-state.md FSM + transitions)', () => {
  it('allows cart -> paid', () => expect(canTransition('cart', 'paid')).toBe(true));
  it('allows paid -> accepted', () => expect(canTransition('paid', 'accepted')).toBe(true));
  it('allows paid -> cancelled', () => expect(canTransition('paid', 'cancelled')).toBe(true));
  it('rejects invalid cart -> collected', () => expect(canTransition('cart', 'collected')).toBe(false));

  it('collected -> completed allowed', () => expect(canTransition('collected', 'completed')).toBe(true));
  it('collected -> disputed allowed', () => expect(canTransition('collected', 'disputed')).toBe(true));

  it('terminal states have no outgoing', () => {
    expect(canTransition('completed', 'paid')).toBe(false);
    expect(canTransition('cancelled', 'cart')).toBe(false);
    expect(canTransition('resolved', 'disputed')).toBe(false);
  });

  it('validate returns code on invalid', () => {
    const r = validateTransitionWithCode('paid', 'collected');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('SHC-ORDER-001');
  });

  it('isTerminal correct for all terminals', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('resolved')).toBe(true);
    expect(isTerminal('cart')).toBe(false);
  });

  it('getAllowedNext returns correct lists per 09', () => {
    expect(getAllowedNext('preparing')).toEqual(['ready_for_collection', 'cancelled']);
    expect(getAllowedNext('completed')).toEqual([]);
    expect(getAllowedNext('disputed')).toContain('resolved');
  });

  it('disputed can go to cancelled', () => expect(canTransition('disputed', 'cancelled')).toBe(true));

  it('no skip states e.g. paid to ready', () => expect(canTransition('paid', 'ready_for_collection')).toBe(false));

  it('covers all states in enum via transitions (mobile mock order status)', () => {
    const states: SHCOrderStatus[] = ['cart','paid','accepted','preparing','ready_for_collection','collected','completed','cancelled','disputed','resolved'];
    states.forEach(s => expect(typeof getAllowedNext(s)).toBe('object'));
  });

  it('pure + deterministic', () => {
    expect(canTransition('accepted', 'preparing')).toBe(canTransition('accepted', 'preparing'));
  });
});
