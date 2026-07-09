/**
 * Subscribe funnel trust + social proof copy (HomelyEats Wave 4 / paper wireframe).
 * Pure helpers — no I/O.
 */

export type SubscribeTrustChip = {
  id: string;
  label: string;
  detail: string;
};

/** Trust chips shown on kitchen subscribe + confirm (allergen · collection · one kitchen). */
export function subscribeTrustChips(opts?: {
  area?: string | null;
  cookName?: string | null;
}): SubscribeTrustChip[] {
  const area = opts?.area?.trim();
  const cook = opts?.cookName?.trim() || 'this kitchen';
  return [
    {
      id: 'one_kitchen',
      label: 'One kitchen plan',
      detail: `All meals come from ${cook} only — no multi-kitchen cart.`,
    },
    {
      id: 'collection',
      label: 'HDB collection',
      detail: area
        ? `Collect near ${area}. Exact address shared 2h before your slot.`
        : 'Collect from the cook’s HDB lobby. Address released 2h before your slot.',
    },
    {
      id: 'allergens',
      label: 'Allergen notes',
      detail: 'Every dish lists allergens. Home kitchen — cross-contamination possible.',
    },
    {
      id: 'flex',
      label: 'Flex days',
      detail: 'Skip or pause with flex days; your plan expiry extends so you don’t lose meals.',
    },
  ];
}

export function subscribeConfirmSteps(): Array<{ id: string; title: string; body: string }> {
  return [
    {
      id: 'plan',
      title: '1 · Pick your meals',
      body: 'Choose which days and dishes repeat each week.',
    },
    {
      id: 'pay',
      title: '2 · Pay with PayNow',
      body: 'First cycle charge on confirm. Reference matches your order.',
    },
    {
      id: 'collect',
      title: '3 · Collect on slot day',
      body: 'Address unlocks 2h before. Chat opens after payment confirm.',
    },
  ];
}

/** Format subscriber social proof for kitchen cards. */
export function kitchenSubscriberLabel(count?: number | null): string {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 'Be the first subscriber';
  if (n === 1) return '1 subscriber';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k subscribers`;
  return `${Math.floor(n)} subscribers`;
}

export type LedgerTxn = {
  id: string;
  label: string;
  amountLabel: string;
  dateLabel: string;
  kind: 'recharge' | 'meal' | 'flex' | 'adjust';
};

/**
 * Demo ledger rows for Manage “Recent transactions” until PayU ledger exists.
 * Seeded from subscription fields so UI is never empty when sub is active.
 */
export function subscriptionLedgerPreview(sub?: {
  meals_per_week?: number;
  deliveries_left?: number | null;
  expires_on?: string | null;
  flex_remaining?: number | null;
  status?: string | null;
} | null): LedgerTxn[] {
  if (!sub) return [];
  const meals = Number(sub.meals_per_week) || 3;
  const left = sub.deliveries_left != null ? Number(sub.deliveries_left) : meals * 4;
  const exp = sub.expires_on ? String(sub.expires_on).slice(0, 10) : '—';
  return [
    {
      id: 'txn_recharge',
      label: 'Plan period · weekly tiffin',
      amountLabel: `S$${(meals * 11).toFixed(0)} est.`,
      dateLabel: exp !== '—' ? `Period to ${exp}` : 'Current period',
      kind: 'recharge',
    },
    {
      id: 'txn_meals',
      label: 'Meal deliveries remaining',
      amountLabel: `${left} left`,
      dateLabel: `${meals}/wk cadence`,
      kind: 'meal',
    },
    {
      id: 'txn_flex',
      label: 'Flex days remaining',
      amountLabel: `${sub.flex_remaining ?? '—'} flex`,
      dateLabel: sub.status === 'paused' ? 'Paused window' : 'Skip / pause budget',
      kind: 'flex',
    },
  ];
}
