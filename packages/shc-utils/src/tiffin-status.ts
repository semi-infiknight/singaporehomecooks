/**
 * Tiffin meal status chip map — pure JS (no RN) for web + mobile parity.
 * Colors match packages/shc-ui/src/theme.ts shcColors tokens.
 */

export type TiffinOrderCardStatus =
  | 'indeterminate'
  | 'awaiting_payment'
  | 'scheduled'
  | 'delivered'
  | 'skipped'
  | 'canceled_by_kitchen';

export type TiffinMealStatusChip = {
  bg: string;
  text: string;
  color: string;
};

const TIFFIN_STATUS_COLORS = {
  awaiting_payment: { bg: '#FFF8E1', text: 'Awaiting PayNow', color: '#F57F17' },
  delivered: { bg: '#E8F5E9', text: 'Delivered', color: '#15803D' },
  skipped: { bg: '#FFF3E0', text: 'Skipped', color: '#E65100' },
  canceled_by_kitchen: { bg: '#FFEBEE', text: 'Canceled by kitchen', color: '#C62828' },
  indeterminate: { bg: '#F5F5F5', text: 'Upcoming', color: '#616161' },
  scheduled: { bg: '#E3F2FD', text: 'Scheduled', color: '#1565C0' },
} as const satisfies Record<string, TiffinMealStatusChip>;

/** Tri-platform meal status chip — shared by @shc/ui and web mirrors. */
export function tiffinMealStatusChip(status: TiffinOrderCardStatus): TiffinMealStatusChip {
  return TIFFIN_STATUS_COLORS[status] ?? TIFFIN_STATUS_COLORS.scheduled;
}
