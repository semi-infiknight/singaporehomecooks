/**
 * Cook orders day calendar — mirrors customer My Orders strip, keyed on collection_date.
 */
import { calendarRangeAround, todayIsoInSingapore, type CalendarDay } from './my-orders';

export function cookOrderCollectionDate(
  order: { collection_date?: string | null },
  fallbackIso = todayIsoInSingapore()
): string {
  const raw = String(order.collection_date || '').slice(0, 10);
  return raw || fallbackIso;
}

export function collectCookOrderDates(
  orders: Array<{ collection_date?: string | null; shc_status?: string; status?: string }>
): Set<string> {
  const out = new Set<string>();
  for (const o of orders) {
    const status = String(o.shc_status || o.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') continue;
    out.add(cookOrderCollectionDate(o));
  }
  return out;
}

export function filterCookOrdersByDate<T extends { collection_date?: string | null }>(
  orders: T[],
  dateIso: string,
  fallbackIso = todayIsoInSingapore()
): T[] {
  return orders.filter((o) => cookOrderCollectionDate(o, fallbackIso) === dateIso);
}

export type CookCalendarStripDay = CalendarDay & { hasMeal: boolean; hasOrder: boolean };

export function buildCookCalendarDays(
  todayIso: string,
  orderDates: Set<string>,
  past = 3,
  future = 14
): CookCalendarStripDay[] {
  return calendarRangeAround(todayIso, past, future).map((d) => ({
    ...d,
    hasMeal: orderDates.has(d.date),
    hasOrder: orderDates.has(d.date),
  }));
}

export function emptyCookOrdersDayCopy(opts: { isToday: boolean }): { title: string; body: string } {
  return opts.isToday
    ? {
        title: 'No collections today',
        body: 'New orders appear on their collection day. Check other dates on the calendar.',
      }
    : {
        title: 'No orders this day',
        body: 'Pick another date above, or browse custom requests from Home.',
      };
}
