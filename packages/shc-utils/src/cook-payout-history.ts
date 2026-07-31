import type { CookPayoutSnapshot } from './cook-payout';

export type CookPayoutHistoryRow = CookPayoutSnapshot & {
  batch_id?: string;
  status?: string;
  order_count?: number;
};

export function formatCookPayoutHistoryRow(row: CookPayoutHistoryRow): string {
  const amount = `S$${((row.amount_cents || 0) / 100).toFixed(2)}`;
  const ref = row.transfer_ref ? ` · Ref ${row.transfer_ref}` : '';
  const week = row.week_start ? ` · Week ${row.week_start}` : '';
  return `${amount}${ref}${week}`;
}
