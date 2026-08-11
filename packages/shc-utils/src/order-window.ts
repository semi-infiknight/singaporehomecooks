/**
 * Order-ahead guardrails for one-time dish listings.
 * Cooks set min lead (days and/or hours) + optional cutoff clock on the prior day.
 * Customers only see collection date/slot options that remain orderable "now".
 */

export type OrderWindowRules = {
  collection_days: number[];
  time_slots: string[];
  paused?: boolean;
  /** Calendar days before collection the order must be placed (0 = same-day ok if hours allow). */
  min_order_lead_days?: number;
  /** Hours before collection slot start the order must be placed. */
  min_order_lead_hours?: number;
  /** Clock on the lead-day before collection, e.g. "14:00" = by 2pm that day. */
  order_cutoff_time?: string;
};

export type CollectionSlotOption = { date: string; slot: string };

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SLOT = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;

export function parseOrderCutoffTime(raw: unknown): string | undefined {
  const s = String(raw || '').trim();
  if (!HHMM.test(s)) return undefined;
  return s;
}

export function coerceLeadDays(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(30, Math.floor(n));
}

export function coerceLeadHours(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(24 * 14, Math.floor(n));
}

export function normalizeOrderWindowRules(
  raw: Partial<OrderWindowRules> | null | undefined
): OrderWindowRules {
  const days = Array.isArray(raw?.collection_days)
    ? raw!.collection_days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  const slots = Array.isArray(raw?.time_slots)
    ? raw!.time_slots.map((s) => String(s || '').trim()).filter((s) => SLOT.test(s))
    : [];
  return {
    collection_days: days.length ? [...new Set(days)].sort((a, b) => a - b) : [],
    time_slots: slots.length ? [...new Set(slots)] : [],
    paused: Boolean(raw?.paused),
    min_order_lead_days: coerceLeadDays(raw?.min_order_lead_days),
    min_order_lead_hours: coerceLeadHours(raw?.min_order_lead_hours),
    order_cutoff_time: parseOrderCutoffTime(raw?.order_cutoff_time),
  };
}

function ymdParts(ymd: string): { y: number; m: number; d: number } | null {
  if (!YMD.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** Weekday 0=Sun … 6=Sat for a YYYY-MM-DD (UTC calendar day — tests pass fixed now in UTC). */
export function weekdayFromYmd(ymd: string): number {
  const p = ymdParts(ymd);
  if (!p) return -1;
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

export function addDaysYmd(ymd: string, delta: number): string {
  const p = ymdParts(ymd);
  if (!p) return ymd;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + delta));
  return dt.toISOString().slice(0, 10);
}

export function ymdFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Instant for ymd + HH:MM as UTC (deterministic; pair tests with UTC `now`). */
export function instantFromYmdHm(ymd: string, hm: string): Date | null {
  const p = ymdParts(ymd);
  const m = String(hm || '').match(HHMM);
  if (!p || !m) return null;
  return new Date(Date.UTC(p.y, p.m - 1, p.d, Number(m[1]), Number(m[2]), 0, 0));
}

export function slotStartHm(slot: string): string | null {
  const m = String(slot || '').trim().match(SLOT);
  return m ? m[1] : null;
}

/**
 * Latest instant a customer may place an order for this collection date+slot.
 * Returns null when the option is structurally invalid (bad day/slot).
 */
export function orderDeadlineForCollection(
  collectionDate: string,
  collectionSlot: string,
  rulesInput: Partial<OrderWindowRules>
): Date | null {
  const rules = normalizeOrderWindowRules(rulesInput);
  if (rules.paused) return null;
  const dow = weekdayFromYmd(collectionDate);
  if (dow < 0 || !rules.collection_days.includes(dow)) return null;
  if (!rules.time_slots.includes(collectionSlot)) return null;
  const startHm = slotStartHm(collectionSlot);
  if (!startHm) return null;

  const deadlines: Date[] = [];

  const leadDays = rules.min_order_lead_days ?? 0;
  if (leadDays > 0) {
    const leadYmd = addDaysYmd(collectionDate, -leadDays);
    const cutoff = rules.order_cutoff_time || '23:59';
    const dayDeadline = instantFromYmdHm(leadYmd, cutoff);
    if (dayDeadline) deadlines.push(dayDeadline);
  }

  const leadHours = rules.min_order_lead_hours ?? 0;
  if (leadHours > 0) {
    const slotStart = instantFromYmdHm(collectionDate, startHm);
    if (slotStart) {
      deadlines.push(new Date(slotStart.getTime() - leadHours * 60 * 60 * 1000));
    }
  }

  // No lead rules: still require order before collection slot starts
  if (!deadlines.length) {
    const slotStart = instantFromYmdHm(collectionDate, startHm);
    return slotStart;
  }

  // Most restrictive = earliest deadline
  return deadlines.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b));
}

export function isCollectionOptionOrderable(
  collectionDate: string,
  collectionSlot: string,
  rulesInput: Partial<OrderWindowRules>,
  now: Date = new Date()
): boolean {
  const deadline = orderDeadlineForCollection(collectionDate, collectionSlot, rulesInput);
  if (!deadline) return false;
  // Must collect on/after "today" in the same calendar model as slots
  const today = ymdFromDate(now);
  if (collectionDate < today) return false;
  return now.getTime() <= deadline.getTime();
}

export function listEligibleCollectionSlots(
  rulesInput: Partial<OrderWindowRules>,
  now: Date = new Date(),
  opts?: { daysAhead?: number; horizonStartOffsetDays?: number }
): CollectionSlotOption[] {
  const rules = normalizeOrderWindowRules(rulesInput);
  if (rules.paused || !rules.collection_days.length || !rules.time_slots.length) return [];

  const daysAhead = Math.min(60, Math.max(1, opts?.daysAhead ?? 14));
  const startOffset = Math.max(0, opts?.horizonStartOffsetDays ?? 0);
  const today = ymdFromDate(now);
  const out: CollectionSlotOption[] = [];

  for (let i = startOffset; i <= daysAhead; i++) {
    const date = addDaysYmd(today, i);
    const dow = weekdayFromYmd(date);
    if (!rules.collection_days.includes(dow)) continue;
    for (const slot of rules.time_slots) {
      if (isCollectionOptionOrderable(date, slot, rules, now)) {
        out.push({ date, slot });
      }
    }
  }
  return out;
}

/** Plain-language guardrails for product/checkout (before order). */
export function orderWindowCustomerCopy(rulesInput: Partial<OrderWindowRules> | null | undefined): string {
  const rules = normalizeOrderWindowRules(rulesInput || {});
  const parts: string[] = [];
  const days = rules.min_order_lead_days ?? 0;
  const hours = rules.min_order_lead_hours ?? 0;
  const cutoff = rules.order_cutoff_time;

  if (days > 0 && cutoff) {
    const [hh, mm] = cutoff.split(':').map(Number);
    const h12 = hh % 12 || 12;
    const ampm = hh < 12 ? 'am' : 'pm';
    const timeLabel = mm === 0 ? `${h12}${ampm}` : `${h12}:${String(mm).padStart(2, '0')}${ampm}`;
    parts.push(
      days === 1
        ? `Order by ${timeLabel} the day before collection`
        : `Order at least ${days} days ahead, by ${timeLabel} on the lead day`
    );
  } else if (days > 0) {
    parts.push(days === 1 ? 'Order at least 1 day before collection' : `Order at least ${days} days before collection`);
  }

  if (hours > 0) {
    parts.push(hours === 1 ? 'Order at least 1 hour before your collection slot' : `Order at least ${hours} hours before your collection slot`);
  }

  if (!parts.length) {
    return 'Pick a collection date and time offered by this kitchen.';
  }
  return parts.join(' · ');
}

/** Cook editor helper copy for the rules they just set. */
export function orderWindowCookSummary(rulesInput: Partial<OrderWindowRules> | null | undefined): string {
  return orderWindowCustomerCopy(rulesInput);
}

/** Extract order-window fields from a product / listing / availability blob. */
export function orderWindowRulesFromProduct(product: Record<string, unknown> | null | undefined): OrderWindowRules {
  const avail = (product?.shc_availability || product?.availability || product || {}) as Record<string, unknown>;
  return normalizeOrderWindowRules({
    collection_days: (avail.collection_days as number[]) || [],
    time_slots: (avail.time_slots as string[]) || [],
    paused: Boolean(avail.paused ?? product?.paused),
    min_order_lead_days: avail.min_order_lead_days as number | undefined,
    min_order_lead_hours: avail.min_order_lead_hours as number | undefined,
    order_cutoff_time: avail.order_cutoff_time as string | undefined,
  });
}
