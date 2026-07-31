/**
 * My Orders day calendar + card variants (HomelyEats ref 25).
 * Merges one-time SHC orders + tiffin meal instances per collection date.
 */

export type DayOrderCardStatus =
  | 'indeterminate'
  | 'awaiting_payment'
  | 'scheduled'
  | 'delivered'
  | 'skipped'
  | 'canceled_by_kitchen';

export type DayOrderCard = {
  id: string;
  kind: 'one_off' | 'tiffin';
  cookName: string;
  planTitle: string;
  status: DayOrderCardStatus;
  timeslot: string;
  collectionDate: string;
  menuLines: string[];
  customizable: boolean;
  menuPending: boolean;
  /** deep link target */
  hrefOrderId?: string;
  managePath?: 'order' | 'tiffin' | 'pay';
};

export type CalendarDay = {
  date: string;
  label: string;
  dayNum: string;
  hasOrder: boolean;
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Calendar "today" in Singapore — matches collection_date on orders. */
export function todayIsoInSingapore(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(now);
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysToIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calendarRangeAround(todayIso: string, past = 3, future = 10): CalendarDay[] {
  const start = addDaysToIso(todayIso, -past);
  const out: CalendarDay[] = [];
  let c = start;
  const end = addDaysToIso(todayIso, future);
  while (c <= end) {
    const d = new Date(`${c}T12:00:00.000Z`);
    out.push({
      date: c,
      label: DAY_LABELS[d.getUTCDay()],
      dayNum: c.slice(8, 10),
      hasOrder: false,
    });
    c = addDaysToIso(c, 1);
  }
  return out;
}

export function markCalendarHasOrders(days: CalendarDay[], datesWithOrders: Set<string>): CalendarDay[] {
  return days.map((d) => ({ ...d, hasOrder: datesWithOrders.has(d.date) }));
}

/** Map SHC order pipeline status → day card status. */
export function mapShcStatusToDayCard(status: string, collectionDate?: string, nowIso?: string): DayOrderCardStatus {
  const s = String(status || '').toLowerCase();
  if (s === 'accepted') return 'awaiting_payment';
  if (s === 'cart') return 'scheduled';
  if (s === 'skipped') return 'skipped';
  if (s === 'canceled_by_kitchen' || s === 'cancelled' || s === 'canceled') {
    return s === 'canceled_by_kitchen' ? 'canceled_by_kitchen' : 'canceled_by_kitchen';
  }
  if (s === 'collected' || s === 'completed') return 'delivered';
  if (['paid', 'accepted', 'preparing', 'ready_for_collection'].includes(s)) return 'scheduled';
  // far future pending
  if (collectionDate && nowIso) {
    const daysAhead =
      (new Date(`${collectionDate}T12:00:00.000Z`).getTime() - new Date(`${nowIso}T12:00:00.000Z`).getTime()) /
      86400000;
    if (daysAhead > 14) return 'indeterminate';
  }
  return 'scheduled';
}

export function mapTiffinStatusToDayCard(status: string): DayOrderCardStatus {
  const s = String(status || '').toLowerCase();
  if (s === 'indeterminate') return 'indeterminate';
  if (s === 'skipped') return 'skipped';
  if (s === 'canceled_by_kitchen' || s === 'cancelled') return 'canceled_by_kitchen';
  if (s === 'delivered') return 'delivered';
  return 'scheduled';
}

export function formatTimeslot(slot?: string | null): string {
  if (!slot) return 'Collection slot TBC';
  // already "18:00-19:00" or "Sat 6pm"
  return String(slot).replace('-', ' – ');
}

/** Customizable if scheduled and within 8h window heuristic (date only when no slot parse). */
export function isOrderCustomizable(status: DayOrderCardStatus, collectionDate: string, now = new Date()): boolean {
  if (status !== 'scheduled' && status !== 'indeterminate') return false;
  const start = new Date(`${collectionDate}T18:00:00.000Z`);
  const hoursLeft = (start.getTime() - now.getTime()) / 3600000;
  return hoursLeft >= 8;
}

export function oneOffOrderToDayCard(order: Record<string, unknown>, nowIso?: string): DayOrderCard {
  const items = (Array.isArray(order.items) ? order.items : []) as Array<{ name?: string }>;
  const status = mapShcStatusToDayCard(String(order.shc_status || ''), String(order.collection_date || ''), nowIso);
  const collectionDate = String(order.collection_date || nowIso || toIsoDate(new Date()));
  const menuLines = items.map((i) => String(i.name || 'Dish')).filter(Boolean);
  return {
    id: String(order.id),
    kind: 'one_off',
    cookName: String(order.cook_name || order.cook_display_name || 'Home kitchen'),
    planTitle: menuLines[0] ? `${menuLines[0]}${menuLines.length > 1 ? ` +${menuLines.length - 1}` : ''}` : 'One-time order',
    status,
    timeslot: formatTimeslot(String(order.collection_slot || '')),
    collectionDate,
    menuLines,
    customizable: isOrderCustomizable(status, collectionDate),
    menuPending: menuLines.length === 0 && status === 'scheduled',
    hrefOrderId: String(order.id),
    managePath: status === 'awaiting_payment' ? 'pay' : 'order',
  };
}

export function tiffinMealToDayCard(
  meal: Record<string, unknown>,
  opts?: { cookName?: string; dishName?: string }
): DayOrderCard {
  const status = mapTiffinStatusToDayCard(String(meal.status || 'scheduled'));
  const collectionDate = String(meal.collection_date || '');
  const productId = String(meal.product_id || '');
  const fromApi = Array.isArray(meal.menu_lines)
    ? (meal.menu_lines as unknown[]).map((x) => String(x)).filter(Boolean)
    : null;
  const dishName = opts?.dishName || (productId ? `Meal · ${productId.slice(0, 12)}` : '');
  // Prefer API-joined day menu + extras; HomelyEats menu_pending when kitchen has not published
  const menuPending =
    typeof meal.menu_pending === 'boolean'
      ? meal.menu_pending
      : !fromApi?.length && (!dishName || !productId);
  const menuLines =
    fromApi != null
      ? fromApi
      : menuPending
        ? []
        : dishName
          ? [dishName]
          : [];
  return {
    id: String(meal.id || `tiffin_${collectionDate}`),
    kind: 'tiffin',
    cookName: opts?.cookName || String(meal.cook_name || 'Tiffin kitchen'),
    planTitle: 'Weekly tiffin collection',
    status,
    timeslot: formatTimeslot(String(meal.collection_slot || '18:00-19:00')),
    collectionDate,
    menuLines,
    customizable: Boolean(meal.customizable) || isOrderCustomizable(status, collectionDate),
    menuPending,
    managePath: 'tiffin',
  };
}

export function collectOrderDates(cards: DayOrderCard[]): Set<string> {
  return new Set(cards.map((c) => c.collectionDate).filter(Boolean));
}

export function cardsForDate(cards: DayOrderCard[], date: string): DayOrderCard[] {
  return cards
    .filter((c) => c.collectionDate === date)
    .sort((a, b) => a.timeslot.localeCompare(b.timeslot));
}

export function mergeDayOrderCards(oneOff: DayOrderCard[], tiffin: DayOrderCard[]): DayOrderCard[] {
  return [...tiffin, ...oneOff];
}

export function monthLabelForDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
}

export function dayOrderStatusChip(status: DayOrderCardStatus): {
  label: string;
  bg: string;
  color: string;
} {
  switch (status) {
    case 'awaiting_payment':
      return { label: 'Awaiting PayNow', bg: '#FFF8E1', color: '#F57F17' };
    case 'delivered':
      return { label: 'Collected', bg: '#E8F5E9', color: '#2E7D32' };
    case 'skipped':
      return { label: 'Skipped', bg: '#FFF3E0', color: '#E65100' };
    case 'canceled_by_kitchen':
      return { label: 'Canceled by kitchen', bg: '#FFEBEE', color: '#C62828' };
    case 'indeterminate':
      return { label: 'Upcoming', bg: '#F5F5F5', color: '#616161' };
    default:
      return { label: 'Scheduled', bg: '#E3F2FD', color: '#1565C0' };
  }
}

export function primaryActionLabel(card: DayOrderCard): string {
  if (card.status === 'awaiting_payment') return 'Pay now';
  if (card.status === 'delivered' || card.status === 'skipped' || card.status === 'canceled_by_kitchen') {
    return 'View';
  }
  if (card.customizable && card.status === 'scheduled') {
    return 'Customize';
  }
  return 'Manage';
}
