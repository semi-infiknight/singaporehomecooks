import { describe, expect, it } from 'vitest';
import {
  buildCookCalendarDays,
  collectCookOrderDates,
  cookOrderCollectionDate,
  emptyCookOrdersDayCopy,
  filterCookOrdersByDate,
} from './cook-orders-calendar';

describe('cook-orders-calendar', () => {
  it('normalizes collection date with fallback', () => {
    expect(cookOrderCollectionDate({ collection_date: '2026-07-20' }, '2026-07-15')).toBe('2026-07-20');
    expect(cookOrderCollectionDate({ collection_date: '' }, '2026-07-15')).toBe('2026-07-15');
  });

  it('collects non-cancelled order dates', () => {
    const dates = collectCookOrderDates([
      { collection_date: '2026-07-20', shc_status: 'paid' },
      { collection_date: '2026-07-21', shc_status: 'cancelled' },
      { collection_date: '2026-07-22', shc_status: 'preparing' },
    ]);
    expect([...dates].sort()).toEqual(['2026-07-20', '2026-07-22']);
  });

  it('filters orders by collection date', () => {
    const orders = [
      { id: 'a', collection_date: '2026-07-20' },
      { id: 'b', collection_date: '2026-07-21' },
      { id: 'c', collection_date: '' },
    ];
    expect(filterCookOrdersByDate(orders, '2026-07-20', '2026-07-15').map((o) => o.id)).toEqual(['a']);
    expect(filterCookOrdersByDate(orders, '2026-07-15', '2026-07-15').map((o) => o.id)).toEqual(['c']);
  });

  it('builds calendar strip days with meal/order markers', () => {
    const days = buildCookCalendarDays('2026-07-15', new Set(['2026-07-15', '2026-07-17']), 1, 2);
    const marked = days.filter((d) => d.hasMeal);
    expect(marked.map((d) => d.date)).toEqual(['2026-07-15', '2026-07-17']);
    expect(marked[0]?.hasOrder).toBe(true);
  });

  it('empty copy differs for today vs other days', () => {
    expect(emptyCookOrdersDayCopy({ isToday: true }).title).toContain('today');
    expect(emptyCookOrdersDayCopy({ isToday: false }).title).toContain('this day');
  });
});
