/**
 * Cook-side tiffin OS helpers (paper wireframe kitchen ops mirror).
 * Pure — menu publish dates, metrics strip, op feedback copy.
 * No business-rules import (keeps @shc/utils leaf-friendly).
 */

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function addDaysIsoLocal(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextMondayIso(from = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export type CookOpsDay = {
  date: string;
  dayOfWeek: number;
  shortLabel: string;
  /** e.g. "Mon 14 Jul" */
  label: string;
};

/** Next N collection dates matching kitchen collection_days (0=Sun … 6=Sat). */
export function cookOpsCollectionDates(opts: {
  collectionDays?: number[];
  fromDate?: Date;
  count?: number;
}): CookOpsDay[] {
  const allowed =
    opts.collectionDays && opts.collectionDays.length
      ? new Set(opts.collectionDays)
      : new Set([1, 2, 3, 4, 5]);
  const count = Math.min(14, Math.max(1, opts.count ?? 7));
  const start = opts.fromDate ?? new Date();
  // Start from tomorrow so cooks plan ahead (not mid-service today)
  let cursor = addDaysIsoLocal(start.toISOString().slice(0, 10), 1);
  const out: CookOpsDay[] = [];
  for (let i = 0; i < 28 && out.length < count; i++) {
    const d = new Date(`${cursor}T12:00:00.000Z`);
    const dow = d.getUTCDay();
    if (allowed.has(dow)) {
      const mon = d.toLocaleString('en-SG', { month: 'short', timeZone: 'UTC' });
      const dayNum = d.getUTCDate();
      out.push({
        date: cursor,
        dayOfWeek: dow,
        shortLabel: DAY_LABELS[dow],
        label: `${DAY_LABELS[dow]} ${dayNum} ${mon}`,
      });
    }
    cursor = addDaysIsoLocal(cursor, 1);
  }
  // Fallback: next Monday if no days matched
  if (out.length === 0) {
    const mon = nextMondayIso(new Date(Date.now() + 86400000));
    out.push({
      date: mon,
      dayOfWeek: 1,
      shortLabel: 'Mon',
      label: `Mon ${mon.slice(5)}`,
    });
  }
  return out;
}

export type CookTiffinMetrics = {
  enabled: boolean;
  eligibleCount: number;
  collectionDayCount: number;
  subscriberCount: number | null;
  statusLabel: string;
  statusDetail: string;
};

export function cookTiffinMetrics(input: {
  enabled?: boolean;
  eligibleProductIds?: string[];
  collectionDays?: number[];
  subscriberCount?: number | null;
}): CookTiffinMetrics {
  const enabled = !!input.enabled;
  const eligibleCount = (input.eligibleProductIds || []).length;
  const collectionDayCount = (input.collectionDays || []).length;
  const subscriberCount =
    input.subscriberCount != null && Number.isFinite(Number(input.subscriberCount))
      ? Number(input.subscriberCount)
      : null;
  return {
    enabled,
    eligibleCount,
    collectionDayCount,
    subscriberCount,
    statusLabel: enabled ? 'Live on tiffin browse' : 'Hidden from customers',
    statusDetail: enabled
      ? `${eligibleCount} dish${eligibleCount === 1 ? '' : 'es'} · ${collectionDayCount} collection day${collectionDayCount === 1 ? '' : 's'}`
      : 'Turn on visibility and save to accept subscribers',
  };
}

export function cookMenuPublishSuccessCopy(date: string, dishCount: number): string {
  return `Menu published for ${date} · ${dishCount} dish${dishCount === 1 ? '' : 'es'}. Customers see it on My orders.`;
}

export function cookDayCancelSuccessCopy(date: string): string {
  return `Kitchen day canceled for ${date}. Customer meal cards show “Canceled by kitchen”.`;
}

export function cookTiffinEmptyDishesCopy(): {
  title: string;
  body: string;
  ctaLabel: string;
} {
  return {
    title: 'No listings for tiffin yet',
    body: 'Publish a dish listing first, then mark it eligible for weekly plans.',
    ctaLabel: 'Create listing',
  };
}
