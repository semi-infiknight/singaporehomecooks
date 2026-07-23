import { describe, expect, it } from 'vitest';
import {
  calendarRangeAround,
  markCalendarHasOrders,
  mapShcStatusToDayCard,
  mapTiffinStatusToDayCard,
  oneOffOrderToDayCard,
  tiffinMealToDayCard,
  cardsForDate,
  mergeDayOrderCards,
  dayOrderStatusChip,
  primaryActionLabel,
  isOrderCustomizable,
} from './my-orders';

describe('my-orders calendar + status variants', () => {
  it('builds horizontal calendar range with day labels', () => {
    const days = calendarRangeAround('2026-07-09', 2, 3);
    expect(days.length).toBe(6); // 2 past + today + 3 future = 6
    expect(days.some((d) => d.date === '2026-07-09')).toBe(true);
    expect(days[0]?.label).toMatch(/^[SMTWF]$/);
  });

  it('marks days that have orders', () => {
    const days = calendarRangeAround('2026-07-09', 0, 2);
    const marked = markCalendarHasOrders(days, new Set(['2026-07-10']));
    expect(marked.find((d) => d.date === '2026-07-10')?.hasOrder).toBe(true);
    expect(marked.find((d) => d.date === '2026-07-09')?.hasOrder).toBe(false);
  });

  it('maps SHC statuses to five HomelyEats card states', () => {
    expect(mapShcStatusToDayCard('paid')).toBe('scheduled');
    expect(mapShcStatusToDayCard('collected')).toBe('delivered');
    expect(mapShcStatusToDayCard('completed')).toBe('delivered');
    expect(mapShcStatusToDayCard('cancelled')).toBe('canceled_by_kitchen');
    expect(mapTiffinStatusToDayCard('skipped')).toBe('skipped');
    expect(mapTiffinStatusToDayCard('indeterminate')).toBe('indeterminate');
  });

  it('shapes one-off and tiffin cards and filters by day', () => {
    const one = oneOffOrderToDayCard({
      id: 'ord_1',
      shc_status: 'paid',
      collection_date: '2026-07-10',
      collection_slot: '18:00-19:00',
      cook_name: 'Auntie Rose',
      items: [{ name: 'Nasi Lemak' }, { name: 'Acar' }],
    });
    expect(one.status).toBe('scheduled');
    expect(one.menuLines).toContain('Nasi Lemak');
    expect(one.kind).toBe('one_off');

    const tif = tiffinMealToDayCard(
      {
        id: 'meal_1',
        status: 'scheduled',
        collection_date: '2026-07-10',
        collection_slot: '18:00-19:00',
        product_id: 'dish_x',
        customizable: true,
      },
      { cookName: 'Auntie Doris', dishName: "Devil's Curry" }
    );
    expect(tif.customizable).toBe(true);
    expect(tif.menuPending).toBe(false);

    const pending = tiffinMealToDayCard({
      id: 'meal_2',
      status: 'scheduled',
      collection_date: '2026-07-11',
      product_id: '',
    });
    expect(pending.menuPending).toBe(true);

    // API-joined day menu (cook published) + extras
    const published = tiffinMealToDayCard({
      id: 'meal_3',
      status: 'scheduled',
      collection_date: '2026-07-12',
      product_id: 'dish_x',
      menu_pending: false,
      menu_lines: ['nasi lemak', 'extra:1 sambal'],
      customizable: true,
    });
    expect(published.menuPending).toBe(false);
    expect(published.menuLines).toEqual(['nasi lemak', 'extra:1 sambal']);

    const waitPublish = tiffinMealToDayCard({
      id: 'meal_4',
      status: 'scheduled',
      collection_date: '2026-07-13',
      product_id: 'dish_x',
      menu_pending: true,
      menu_lines: [],
    });
    expect(waitPublish.menuPending).toBe(true);
    expect(waitPublish.menuLines).toEqual([]);

    const all = mergeDayOrderCards([one], [tif]);
    expect(cardsForDate(all, '2026-07-10')).toHaveLength(2);
    expect(cardsForDate(all, '2026-07-11')).toHaveLength(0);
  });

  it('status chips and action labels match variants', () => {
    expect(dayOrderStatusChip('delivered').label).toMatch(/Collect|Deliver/i);
    expect(dayOrderStatusChip('skipped').label).toBe('Skipped');
    expect(dayOrderStatusChip('canceled_by_kitchen').label).toMatch(/Canceled/i);
    expect(
      primaryActionLabel({
        id: '1',
        kind: 'one_off',
        cookName: 'X',
        planTitle: 'Y',
        status: 'delivered',
        timeslot: '',
        collectionDate: '2026-07-01',
        menuLines: [],
        customizable: false,
        menuPending: false,
      })
    ).toBe('View');
    expect(
      primaryActionLabel({
        id: '2',
        kind: 'tiffin',
        cookName: 'X',
        planTitle: 'Y',
        status: 'scheduled',
        timeslot: '',
        collectionDate: '2026-07-20',
        menuLines: [],
        customizable: true,
        menuPending: false,
      })
    ).toBe('Customize');
  });

  it('customizable only when far enough before slot', () => {
    expect(isOrderCustomizable('delivered', '2026-07-20')).toBe(false);
    // far future scheduled should be customizable
    expect(isOrderCustomizable('scheduled', '2099-01-01')).toBe(true);
  });
});
