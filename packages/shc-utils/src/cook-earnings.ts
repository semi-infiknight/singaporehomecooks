import { calculateCookEarnings } from '@shc/business-rules';
import {
  businessRulesCommissionRate,
  defaultBusinessRulesConfig,
  type BusinessRulesConfig,
} from './business-rules-config';

export type CookEarningsSummary = {
  cook_id?: string;
  this_week_cents: number;
  projected_payout_cents: number;
  gross_cents: number;
  platform_fee_cents: number;
  orders_count: number;
  commission_rate_pct?: number;
};

/** Normalize API payload — prefers explicit *_cents fields from ledger-backed route. */
export function resolveCookEarningsSummary(raw: Record<string, unknown> | null | undefined): CookEarningsSummary {
  if (!raw || typeof raw !== 'object') {
    return {
      this_week_cents: 0,
      projected_payout_cents: 0,
      gross_cents: 0,
      platform_fee_cents: 0,
      orders_count: 0,
    };
  }

  if (raw.this_week_cents != null) {
    const thisWeekCents = Math.max(0, Number(raw.this_week_cents) || 0);
    return {
      cook_id: typeof raw.cook_id === 'string' ? raw.cook_id : undefined,
      this_week_cents: thisWeekCents,
      projected_payout_cents: Math.max(0, Number(raw.projected_payout_cents ?? thisWeekCents) || 0),
      gross_cents: Math.max(0, Number(raw.gross_cents ?? 0) || 0),
      platform_fee_cents: Math.max(0, Number(raw.platform_fee_cents ?? 0) || 0),
      orders_count: Math.max(0, Number(raw.orders_count ?? raw.orders ?? 0) || 0),
      commission_rate_pct:
        raw.commission_rate_pct != null ? Number(raw.commission_rate_pct) : undefined,
    };
  }

  // Legacy: route historically returned ledger cents in `thisWeek` without conversion.
  const legacyCents = Math.max(0, Number(raw.thisWeek ?? 0) || 0);
  return {
    cook_id: typeof raw.cook_id === 'string' ? raw.cook_id : undefined,
    this_week_cents: legacyCents,
    projected_payout_cents: Math.max(0, Number(raw.projectedPayout ?? legacyCents) || 0),
    gross_cents: Math.max(0, Number(raw.gross ?? legacyCents) || 0),
    platform_fee_cents: 0,
    orders_count: Math.max(0, Number(raw.orders_count ?? raw.orders ?? 0) || 0),
  };
}

export function defaultCommissionRatePct(): number {
  return defaultBusinessRulesConfig().commission.default_rate_pct;
}

export function commissionRateFromConfig(config?: BusinessRulesConfig | null): number {
  return businessRulesCommissionRate(config ?? defaultBusinessRulesConfig());
}

/** Cook share preview from order total in dollars (listing / cart UI). */
export function cookEarningsPreviewFromDollars(
  totalDollars: number,
  rate = commissionRateFromConfig()
): number {
  const cents = Math.round(Math.max(0, totalDollars) * 100);
  return calculateCookEarnings(cents, rate) / 100;
}

/** Cook share preview from order total in cents (ledger-aligned). */
export function cookEarningsPreviewFromCents(
  totalCents: number,
  rate = commissionRateFromConfig()
): number {
  return calculateCookEarnings(Math.max(0, totalCents), rate);
}

export function formatCookEarningsDisplay(cents: number): string {
  return `S$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

export function formatCookEarningsDisplayCompact(cents: number): string {
  const dollars = Math.max(0, cents) / 100;
  return dollars % 1 === 0 ? `S$${dollars.toFixed(0)}` : `S$${dollars.toFixed(2)}`;
}
