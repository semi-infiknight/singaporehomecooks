import { describe, expect, it } from 'vitest';
import {
  isCollectionOptionOrderable,
  listEligibleCollectionSlots,
  orderDeadlineForCollection,
  orderWindowCustomerCopy,
  orderWindowRulesFromProduct,
} from './order-window';

const RULES = {
  collection_days: [1, 2, 3, 4, 5], // Mon–Fri
  time_slots: ['18:00-19:00', '19:00-20:00'],
  min_order_lead_days: 1,
  order_cutoff_time: '14:00',
};

describe('orderDeadlineForCollection', () => {
  it('sets day-before cutoff clock as the order deadline', () => {
    // Collect Friday 2026-08-14 → order by Thu 2026-08-13 14:00 UTC
    const d = orderDeadlineForCollection('2026-08-14', '18:00-19:00', RULES);
    expect(d?.toISOString()).toBe('2026-08-13T14:00:00.000Z');
  });

  it('applies min lead hours before slot start', () => {
    const d = orderDeadlineForCollection('2026-08-14', '18:00-19:00', {
      collection_days: [5],
      time_slots: ['18:00-19:00'],
      min_order_lead_hours: 4,
    });
    expect(d?.toISOString()).toBe('2026-08-14T14:00:00.000Z');
  });
});

describe('isCollectionOptionOrderable', () => {
  // Thursday 13 Aug 2026 10:00 UTC — before 14:00 cutoff for Friday collection
  const thuMorning = new Date('2026-08-13T10:00:00.000Z');
  // Thursday 13 Aug 15:00 UTC — after cutoff
  const thuAfternoon = new Date('2026-08-13T15:00:00.000Z');

  it('allows order before day-before cutoff', () => {
    expect(isCollectionOptionOrderable('2026-08-14', '18:00-19:00', RULES, thuMorning)).toBe(true);
  });

  it('rejects order after day-before cutoff', () => {
    expect(isCollectionOptionOrderable('2026-08-14', '18:00-19:00', RULES, thuAfternoon)).toBe(false);
  });

  it('rejects collection on non-collection weekday', () => {
    // 2026-08-15 is Saturday
    expect(isCollectionOptionOrderable('2026-08-15', '18:00-19:00', RULES, thuMorning)).toBe(false);
  });

  it('rejects when min hours not met', () => {
    const rules = {
      collection_days: [5],
      time_slots: ['18:00-19:00'],
      min_order_lead_hours: 6,
    };
    // Friday 15:00, slot 18:00 → only 3h left
    const fri = new Date('2026-08-14T15:00:00.000Z');
    expect(isCollectionOptionOrderable('2026-08-14', '18:00-19:00', rules, fri)).toBe(false);
    const friEarly = new Date('2026-08-14T10:00:00.000Z');
    expect(isCollectionOptionOrderable('2026-08-14', '18:00-19:00', rules, friEarly)).toBe(true);
  });
});

describe('listEligibleCollectionSlots', () => {
  it('returns only slots that satisfy lead + cutoff and collection days', () => {
    // Mon 10 Aug 2026 10:00 — can order for Tue+ (1 day + before 14:00 on Mon for Tue)
    const now = new Date('2026-08-10T10:00:00.000Z');
    const slots = listEligibleCollectionSlots(RULES, now, { daysAhead: 5 });
    expect(slots.length).toBeGreaterThan(0);
    // Tuesday 11 Aug is eligible (Mon before 14:00)
    expect(slots.some((s) => s.date === '2026-08-11' && s.slot === '18:00-19:00')).toBe(true);
    // No weekend
    expect(slots.every((s) => {
      const dow = new Date(s.date + 'T00:00:00.000Z').getUTCDay();
      return dow >= 1 && dow <= 5;
    })).toBe(true);

    // After Monday 14:00, Tuesday drops out
    const monLate = new Date('2026-08-10T15:00:00.000Z');
    const lateSlots = listEligibleCollectionSlots(RULES, monLate, { daysAhead: 5 });
    expect(lateSlots.some((s) => s.date === '2026-08-11')).toBe(false);
  });

  it('returns empty when paused', () => {
    const now = new Date('2026-08-10T10:00:00.000Z');
    expect(listEligibleCollectionSlots({ ...RULES, paused: true }, now)).toEqual([]);
  });
});

describe('orderWindowCustomerCopy', () => {
  it('describes day-before cutoff and hours', () => {
    const copy = orderWindowCustomerCopy(RULES);
    expect(copy).toMatch(/day before/i);
    expect(copy).toMatch(/2pm|14/i);
    const hours = orderWindowCustomerCopy({
      collection_days: [1],
      time_slots: ['18:00-19:00'],
      min_order_lead_hours: 3,
    });
    expect(hours).toMatch(/3 hours/i);
  });
});

describe('orderWindowRulesFromProduct', () => {
  it('reads nested shc_availability', () => {
    const r = orderWindowRulesFromProduct({
      shc_availability: {
        collection_days: [1, 3],
        time_slots: ['18:00-19:00'],
        min_order_lead_days: 2,
        order_cutoff_time: '12:00',
      },
    });
    expect(r.min_order_lead_days).toBe(2);
    expect(r.order_cutoff_time).toBe('12:00');
    expect(r.collection_days).toEqual([1, 3]);
  });
});
