// Shipped order tray open helpers — RN defaults (same callbacks as mobile orders/[id].tsx).
import { SHCOrderReviewTrayContent, SHCOrderDisputeTrayContent } from './order-tray-content';
import {
  openOrderReviewTray as openOrderReviewTrayCore,
  openOrderDisputeTray as openOrderDisputeTrayCore,
} from './order-tray-opener-core';
import type { OrderTrayOpenFns, SubmitReviewFn, SubmitDisputeFn } from './order-tray-opener-core';

export type {
  OrderTrayOpenFns,
  SubmitReviewFn,
  SubmitDisputeFn,
  OrderReviewTrayContentProps,
  OrderDisputeTrayContentProps,
} from './order-tray-opener-core';

export function openOrderReviewTray(
  orderId: string,
  submitReviewFn: SubmitReviewFn,
  tray: OrderTrayOpenFns
): void {
  openOrderReviewTrayCore(orderId, submitReviewFn, tray, SHCOrderReviewTrayContent);
}

export function openOrderDisputeTray(
  orderId: string,
  submitDisputeFn: SubmitDisputeFn,
  tray: OrderTrayOpenFns,
  opts?: { onMessageCook?: () => void }
): void {
  openOrderDisputeTrayCore(orderId, submitDisputeFn, tray, SHCOrderDisputeTrayContent, opts);
}