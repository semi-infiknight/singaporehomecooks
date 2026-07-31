/** PayNow polling helpers — tri-platform checkout + order detail. */

export const PAYMENT_POLL_INTERVAL_MS = 4000;
export const PAYMENT_POLL_SLOW_MS = 3 * 60 * 1000;
export const PAYMENT_POLL_TIMEOUT_MS = 5 * 60 * 1000;
export const PAYMENT_POLL_ERROR_THRESHOLD = 3;

export const ORDER_PAID_STATUSES = [
  'paid',
  'preparing',
  'ready_for_collection',
  'collected',
  'completed',
] as const;

export function isOrderPaidStatus(status: string): boolean {
  return (ORDER_PAID_STATUSES as readonly string[]).includes(String(status || '').toLowerCase());
}

export type PaymentPollPhase = 'waiting' | 'slow' | 'timeout' | 'error';

export function resolvePaymentPollPhase(
  elapsedMs: number,
  consecutiveErrors: number
): { phase: PaymentPollPhase; message?: string } {
  if (consecutiveErrors >= PAYMENT_POLL_ERROR_THRESHOLD) {
    return {
      phase: 'error',
      message: 'Having trouble checking payment status. Check your connection and tap Retry.',
    };
  }
  if (elapsedMs >= PAYMENT_POLL_TIMEOUT_MS) {
    return {
      phase: 'timeout',
      message:
        'Payment not confirmed yet. Complete PayNow in your banking app, then tap Retry or open order details.',
    };
  }
  if (elapsedMs >= PAYMENT_POLL_SLOW_MS) {
    return {
      phase: 'slow',
      message: 'Still waiting for PayNow confirmation — this can take a minute after you pay.',
    };
  }
  return { phase: 'waiting' };
}
