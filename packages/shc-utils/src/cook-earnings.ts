import { calculateCookEarnings } from '@shc/business-rules';
import {
  businessRulesCommissionRate,
  defaultBusinessRulesConfig,
  type BusinessRulesConfig,
} from './business-rules-config';

/** Cook earnings screen — shared copy, formatters, and expense helpers (tri-platform). */

export const COOK_EARNINGS_IRAS_NOTE =
  'Platform fees and cook expenses are tracked for IRAS records. Annual exports remain an ops workflow.';

export const COOK_EARNINGS_CREATE_LISTINGS_CTA = 'Create more listings for earnings';

export const COOK_EARNINGS_EXPENSE_EMPTY =
  'No expenses yet. Log ingredient receipts as you buy for orders.';

export const COOK_EARNINGS_EXPENSE_HISTORY_LIMIT = 5;

export type CookEarningsSummary = {
  cook_id?: string;
  this_week_cents: number;
  projected_payout_cents: number;
  gross_cents: number;
  platform_fee_cents: number;
  orders_count: number;
  commission_rate_pct?: number;
};

/** @deprecated Legacy API shape — prefer CookEarningsSummary via resolveCookEarningsSummary */
export type CookEarningsView = {
  thisWeek?: number;
  projectedPayout?: number;
  orders_count?: number;
  orders?: number;
};

export type CookExpenseRow = {
  id: string;
  amount_cents: number;
  category: string;
  date: string;
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

export function cookEarningsWeekTotal(earnings: CookEarningsView | CookEarningsSummary): number {
  if ('this_week_cents' in earnings) return earnings.this_week_cents;
  return earnings.thisWeek ?? 0;
}

export function cookEarningsOrderCount(earnings: CookEarningsView | CookEarningsSummary): number {
  if ('orders_count' in earnings && earnings.orders_count != null) return earnings.orders_count;
  return (earnings as CookEarningsView).orders_count ?? (earnings as CookEarningsView).orders ?? 0;
}

export function cookEarningsProjectedDisplay(earnings: CookEarningsView | CookEarningsSummary): number {
  if ('projected_payout_cents' in earnings) return earnings.projected_payout_cents;
  const view = earnings as CookEarningsView;
  return view.projectedPayout || cookEarningsWeekTotal(view);
}

export function defaultCommissionRatePct(): number {
  return defaultBusinessRulesConfig().commission.default_rate_pct;
}

export function commissionRateFromConfig(config?: BusinessRulesConfig | null): number {
  return businessRulesCommissionRate(config ?? defaultBusinessRulesConfig());
}

export function cookEarningsPreviewFromDollars(
  totalDollars: number,
  rate = commissionRateFromConfig()
): number {
  const cents = Math.round(Math.max(0, totalDollars) * 100);
  return calculateCookEarnings(cents, rate) / 100;
}

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

export function formatCookExpenseTotalDollars(totalCents: number): string {
  return `S$${Math.round(totalCents / 100)}`;
}

export function formatCookExpenseRowAmount(amountCents: number): string {
  return `S$${(amountCents / 100).toFixed(2)}`;
}

export function recentCookExpenses<T extends { date?: string }>(
  rows: T[],
  limit = COOK_EARNINGS_EXPENSE_HISTORY_LIMIT
): T[] {
  return [...rows].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, limit);
}

export function parseExpenseAmountToCents(amountDollars: string): number | null {
  const amount = Number(amountDollars);
  if (!amount || amount <= 0 || !Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

export function defaultExpenseCategory(category: string): string {
  return category.trim() || 'ingredients';
}

export function todayExpenseDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}
