import { describe, expect, it } from 'vitest';
import {
  appendGuestOrderId,
  createGuestUuid,
  isGuestCheckoutContactComplete,
  isGuestCartActorId,
  normalizeGuestId,
  toGuestCartActorId,
} from './guest-session';

describe('guest-session', () => {
  it('normalizes guest ids', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(normalizeGuestId(id)).toBe(id);
    expect(toGuestCartActorId(id)).toBe(`guest_${id}`);
    expect(isGuestCartActorId(`guest_${id}`)).toBe(true);
  });

  it('creates uuid-shaped ids', () => {
    expect(normalizeGuestId(createGuestUuid())).toBeTruthy();
  });

  it('tracks guest order ids locally', () => {
    expect(appendGuestOrderId(['a'], 'b')).toEqual(['b', 'a']);
    expect(appendGuestOrderId(['a'], 'a')).toEqual(['a']);
  });

  it('validates guest checkout contact', () => {
    expect(
      isGuestCheckoutContactComplete({ name: 'Alex', email: 'a@b.com', phone: '91234567' })
    ).toBe(true);
    expect(isGuestCheckoutContactComplete({ name: 'A', email: 'bad', phone: '1' })).toBe(false);
  });
});
