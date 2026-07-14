/**
 * Cooking soon / cook batch rules — capacity, deadlines, fill rate.
 */

/** Marketplace horizon: only show batches cooking today through +N days (inclusive). */
export const DROP_CUSTOMER_WINDOW_DAYS = 7;

/**
 * cook_date is YYYY-MM-DD (local calendar). True when cook day is today..today+daysInclusive.
 * Past cook dates and dates beyond the window are excluded for customer feeds.
 */
export function dropCookDateWithinDays(
  cookDate: string,
  daysInclusive = DROP_CUSTOMER_WINDOW_DAYS,
  now = new Date()
): boolean {
  if (!cookDate || !/^\d{4}-\d{2}-\d{2}$/.test(cookDate)) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, Math.floor(daysInclusive)));
  end.setHours(23, 59, 59, 999);
  // Parse as local noon to avoid UTC day-shift
  const cook = new Date(`${cookDate}T12:00:00`);
  if (Number.isNaN(cook.getTime())) return false;
  return cook.getTime() >= start.getTime() && cook.getTime() <= end.getTime();
}

export function dropRemainingQty(maxQty: number, orderedQty: number): number {
  return Math.max(0, Math.floor(maxQty) - Math.max(0, Math.floor(orderedQty)));
}

export function dropCanOrder(
  status: string,
  maxQty: number,
  orderedQty: number,
  orderByIso: string,
  now = new Date()
): { ok: boolean; reason?: string; remaining: number } {
  const remaining = dropRemainingQty(maxQty, orderedQty);
  if (status !== 'open') {
    return { ok: false, reason: `Batch is ${status.replace(/_/g, ' ')}`, remaining };
  }
  if (remaining <= 0) {
    return { ok: false, reason: 'Sold out', remaining: 0 };
  }
  const deadline = Date.parse(orderByIso);
  if (!Number.isNaN(deadline) && now.getTime() > deadline) {
    return { ok: false, reason: 'Order window closed', remaining };
  }
  return { ok: true, remaining };
}

export function dropClampOrderQty(qty: number, remaining: number): number {
  const q = Math.floor(qty);
  if (q < 1) return 0;
  return Math.min(q, remaining);
}

/** After order_by: if min not met → cancel; else close open batches. */
export function dropPostDeadlineStatus(
  status: string,
  orderedQty: number,
  minQty: number,
  orderByIso: string,
  now = new Date()
): string | null {
  if (status !== 'open' && status !== 'paused') return null;
  const deadline = Date.parse(orderByIso);
  if (Number.isNaN(deadline) || now.getTime() <= deadline) return null;
  if (orderedQty < minQty) return 'cancelled_min_not_met';
  return 'closed';
}

export function dropFillRate(orderedQty: number, maxQty: number): number {
  if (maxQty <= 0) return 0;
  return Math.min(1, orderedQty / maxQty);
}
