import type { SHCOrderStatus } from '@shc/types';

const REVIEW_ELIGIBLE: SHCOrderStatus[] = ['collected', 'completed'];

/** Post-collection review only — blueprint 08-marketplace-rules */
export function canSubmitReview(
  orderStatus: SHCOrderStatus,
  eligibleStatuses: readonly string[] = REVIEW_ELIGIBLE
): boolean {
  return eligibleStatuses.includes(orderStatus);
}