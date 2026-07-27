import { describe, expect, it } from 'vitest';
import {
  cookOpsCollectionDates,
  cookTiffinMetrics,
  cookMenuPublishSuccessCopy,
  cookDayCancelSuccessCopy,
  cookTiffinEmptyDishesCopy,
  normalizeTiffinMealsPerWeekOptions,
  toggleTiffinMealsPerWeekOption,
  normalizeTiffinDefaultCollectionSlot,
} from './cook-tiffin-os';

describe('cook-tiffin-os (wave 3 cook mirrors)', () => {
  it('returns collection dates only on allowed weekdays', () => {
    const days = cookOpsCollectionDates({
      collectionDays: [1, 3, 5], // Mon Wed Fri
      fromDate: new Date('2026-07-09T12:00:00.000Z'), // Thu
      count: 3,
    });
    expect(days).toHaveLength(3);
    expect(days.every((d) => [1, 3, 5].includes(d.dayOfWeek))).toBe(true);
    expect(days[0]!.date > '2026-07-09').toBe(true);
  });

  it('metrics reflect live vs hidden kitchen', () => {
    const live = cookTiffinMetrics({
      enabled: true,
      eligibleProductIds: ['a', 'b'],
      collectionDays: [1, 2, 3],
      subscriberCount: 12,
    });
    expect(live.statusLabel).toMatch(/Live/i);
    expect(live.eligibleCount).toBe(2);
    expect(live.subscriberCount).toBe(12);

    const off = cookTiffinMetrics({ enabled: false, eligibleProductIds: [], collectionDays: [] });
    expect(off.statusLabel).toMatch(/Hidden/i);
  });

  it('ops copy for publish and cancel', () => {
    expect(cookMenuPublishSuccessCopy('2026-07-14', 3)).toMatch(/published/i);
    expect(cookDayCancelSuccessCopy('2026-07-14')).toMatch(/Canceled by kitchen/i);
    expect(cookTiffinEmptyDishesCopy().ctaLabel).toMatch(/listing/i);
  });

  it('normalizes meals-per-week options with at least one tier', () => {
    expect(normalizeTiffinMealsPerWeekOptions([4, 2, 3])).toEqual([2, 3, 4]);
    expect(toggleTiffinMealsPerWeekOption([2, 3, 4], 3)).toEqual([2, 4]);
    expect(toggleTiffinMealsPerWeekOption([2], 2)).toEqual([2]);
  });

  it('normalizes default collection slot', () => {
    expect(normalizeTiffinDefaultCollectionSlot('17:00-18:00')).toBe('17:00-18:00');
    expect(normalizeTiffinDefaultCollectionSlot('invalid')).toBe('18:00-19:00');
  });
});
