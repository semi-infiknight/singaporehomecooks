/** Cooking soon / batch display helpers (web + mobile). */

import { DROP_CUSTOMER_WINDOW_DAYS, dropCookDateWithinDays } from '@shc/business-rules';

export { DROP_CUSTOMER_WINDOW_DAYS, dropCookDateWithinDays };

/** Customer home/kitchen: open batches cooking within the next 7 days. */
export function filterCustomerCookingSoonDrops<T extends { cook_date?: string; status?: string }>(
  drops: T[],
  now = new Date()
): T[] {
  if (!Array.isArray(drops)) return [];
  return drops.filter((d) => {
    if (d.status && d.status !== 'open' && d.status !== 'sold_out') return false;
    return dropCookDateWithinDays(String(d.cook_date || ''), DROP_CUSTOMER_WINDOW_DAYS, now);
  });
}

export function formatDropCookDate(cookDate: string, now = new Date()): string {
  if (!cookDate) return '—';
  const d = new Date(`${cookDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return cookDate;
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = d.toISOString().slice(0, 10);
  if (day === today.toISOString().slice(0, 10)) return 'Today';
  if (day === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDropOrderBy(orderBy: string): string {
  const t = Date.parse(orderBy);
  if (Number.isNaN(t)) return orderBy;
  return new Date(t).toLocaleString('en-SG', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDropPrice(priceCents: number | undefined, price?: number): string {
  if (price != null && !Number.isNaN(price)) return `S$${Number(price).toFixed(2)}`;
  if (priceCents != null) return `S$${(Number(priceCents) / 100).toFixed(2)}`;
  return '—';
}

export function defaultOrderByTonight(hoursFromNow = 8): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow, 0, 0, 0);
  return d.toISOString();
}

export function defaultCookDateTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
