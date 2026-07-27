/** Cook earnings screen — shared copy, formatters, and expense helpers (tri-platform). */

export const COOK_EARNINGS_IRAS_NOTE =
  'Platform fees and cook expenses are tracked for IRAS records. Annual exports remain an ops workflow.';

export const COOK_EARNINGS_CREATE_LISTINGS_CTA = 'Create more listings for earnings';

export const COOK_EARNINGS_EXPENSE_EMPTY =
  'No expenses yet. Log ingredient receipts as you buy for orders.';

export const COOK_EARNINGS_EXPENSE_HISTORY_LIMIT = 5;

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

export function cookEarningsWeekTotal(earnings: CookEarningsView): number {
  return earnings.thisWeek ?? 0;
}

export function cookEarningsOrderCount(earnings: CookEarningsView): number {
  return earnings.orders_count ?? earnings.orders ?? 0;
}

export function cookEarningsProjectedDisplay(earnings: CookEarningsView): number {
  return earnings.projectedPayout || cookEarningsWeekTotal(earnings);
}

/** Whole-dollar display for year total (matches mobile earnings screen). */
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
