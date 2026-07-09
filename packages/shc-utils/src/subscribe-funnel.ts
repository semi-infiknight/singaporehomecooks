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
 * Fallback rows when ledger API is empty (new sub before first recharge write).
 */
export function subscriptionLedgerPreview(sub?: {
  meals_per_week?: number;
  deliveries_left?: number | null;
  expires_on?: string | null;
  flex_remaining?: number | null;
  status?: string | null;
  balance_cents?: number | null;
} | null): LedgerTxn[] {
  if (!sub) return [];
  const meals = Number(sub.meals_per_week) || 3;
  const left = sub.deliveries_left != null ? Number(sub.deliveries_left) : meals * 4;
  const exp = sub.expires_on ? String(sub.expires_on).slice(0, 10) : '—';
  const bal =
    sub.balance_cents != null && Number(sub.balance_cents) > 0
      ? `S$${(Number(sub.balance_cents) / 100).toFixed(2)}`
      : `S$${(meals * 11 * 4).toFixed(0)} est.`;
  return [
    {
      id: 'txn_balance',
      label: 'Plan wallet balance',
      amountLabel: bal,
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

/** Map API ledger rows → manage UI rows. Falls back to preview when empty. */
export function shapeTiffinLedgerForUi(
  entries: Array<Record<string, unknown>> | null | undefined,
  sub?: Parameters<typeof subscriptionLedgerPreview>[0]
): LedgerTxn[] {
  if (entries && entries.length > 0) {
    return entries.map((e, i) => {
      const cents = Number(e.amount_cents || 0);
      const kind = String(e.kind || 'adjust') as LedgerTxn['kind'];
      const created = e.created_at ? String(e.created_at).slice(0, 10) : '';
      const ref = e.paynow_ref ? String(e.paynow_ref) : '';
      let amountLabel = '—';
      if (cents !== 0) {
        const sign = cents < 0 ? '−' : '';
        amountLabel = `${sign}S$${Math.abs(cents / 100).toFixed(2)}`;
      } else if (Number(e.delta_deliveries || 0) !== 0) {
        amountLabel = `${Number(e.delta_deliveries) > 0 ? '+' : ''}${e.delta_deliveries} meals`;
      } else if (Number(e.delta_flex || 0) !== 0) {
        amountLabel = `${Number(e.delta_flex) > 0 ? '+' : ''}${e.delta_flex} flex`;
      }
      return {
        id: String(e.id || `led_${i}`),
        label: String(e.label || kind),
        amountLabel,
        dateLabel: ref ? `${created} · ${ref}` : created || kind,
        kind: (['recharge', 'meal', 'flex', 'adjust'].includes(kind) ? kind : 'adjust') as LedgerTxn['kind'],
      };
    });
  }
  return subscriptionLedgerPreview(sub);
}
