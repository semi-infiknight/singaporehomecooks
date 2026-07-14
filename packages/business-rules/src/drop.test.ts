import { describe, expect, it } from 'vitest';
import {
  dropCanOrder,
  dropClampOrderQty,
  dropCookDateWithinDays,
  dropFillRate,
  dropPostDeadlineStatus,
  dropRemainingQty,
} from './drop';

describe('drop rules', () => {
  it('cook date within next 7 days (customer window)', () => {
    const now = new Date('2026-07-14T10:00:00');
    expect(dropCookDateWithinDays('2026-07-14', 7, now)).toBe(true);
    expect(dropCookDateWithinDays('2026-07-21', 7, now)).toBe(true);
    expect(dropCookDateWithinDays('2026-07-22', 7, now)).toBe(false);
    expect(dropCookDateWithinDays('2026-07-13', 7, now)).toBe(false);
    expect(dropCookDateWithinDays('bad', 7, now)).toBe(false);
  });

  it('remaining qty', () => {
    expect(dropRemainingQty(40, 12)).toBe(28);
    expect(dropRemainingQty(10, 10)).toBe(0);
  });

  it('can order when open with capacity', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(dropCanOrder('open', 40, 12, future).ok).toBe(true);
  });

  it('blocks sold out and closed window', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(dropCanOrder('open', 10, 10, future).ok).toBe(false);
    const past = new Date(Date.now() - 1000).toISOString();
    expect(dropCanOrder('open', 40, 0, past).reason).toMatch(/closed/i);
  });

  it('clamps qty', () => {
    expect(dropClampOrderQty(50, 12)).toBe(12);
    expect(dropClampOrderQty(0, 12)).toBe(0);
  });

  it('post-deadline status', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(dropPostDeadlineStatus('open', 5, 10, past)).toBe('cancelled_min_not_met');
    expect(dropPostDeadlineStatus('open', 12, 10, past)).toBe('closed');
  });

  it('fill rate', () => {
    expect(dropFillRate(20, 40)).toBe(0.5);
  });
});
