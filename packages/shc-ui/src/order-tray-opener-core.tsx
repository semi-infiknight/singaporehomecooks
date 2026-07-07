// Platform-agnostic order tray open helpers — inject review/dispute content components.
// @ts-nocheck
import React, { type ComponentType, type ReactNode } from 'react';
import type { TrayFrame } from './family-values-core';

export type SubmitReviewFn = (orderId: string, rating: number, body?: string) => Promise<unknown>;
export type SubmitDisputeFn = (
  orderId: string,
  payload: { type: string; notes: string }
) => Promise<unknown>;

export type OrderTrayLabels = {
  leaveReview: string;
  reportIssue: string;
  reviewTitle: string;
  reviewThanksTitle: string;
  reviewThanksBody: string;
  reviewDone: string;
  reviewFailed: string;
  disputeTitle: string;
  disputeReportedTitle: string;
  disputeReportedBody: string;
  disputeGotIt: string;
  disputeMessageCook: string;
  disputeFailed: string;
  ok: string;
};

export const DEFAULT_TRAY_LABELS: OrderTrayLabels = {
  leaveReview: 'Leave a review',
  reportIssue: 'Report an issue',
  reviewTitle: 'Leave a review',
  reviewThanksTitle: 'Thank you',
  reviewThanksBody: 'Your review helps other families find trusted home cooks.',
  reviewDone: 'Done',
  reviewFailed: 'Review failed',
  disputeTitle: 'Report an issue',
  disputeReportedTitle: 'Issue reported',
  disputeReportedBody: 'Ops will review this order and follow up with you.',
  disputeGotIt: 'Got it',
  disputeMessageCook: 'Message your cook',
  disputeFailed: 'Could not report issue',
  ok: 'OK',
};

export type OrderTrayOpenFns = {
  openTray: (frame: TrayFrame, content: () => ReactNode) => void;
  dismiss: () => void;
  renderSuccess: (args: {
    id: string;
    title: string;
    message: string;
    primaryLabel: string;
    testID: string;
    secondaryLabel?: string;
    onSecondary?: () => void;
  }) => ReactNode;
  renderError: (args: { id: string; title: string; message: string }) => ReactNode;
};

export type OrderReviewTrayContentProps = {
  orderId: string;
  submitReviewFn: SubmitReviewFn;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export type OrderDisputeTrayContentProps = {
  orderId: string;
  submitDisputeFn: SubmitDisputeFn;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function openOrderReviewTray(
  orderId: string,
  submitReviewFn: SubmitReviewFn,
  tray: OrderTrayOpenFns,
  ReviewContent: ComponentType<OrderReviewTrayContentProps>,
  labels: OrderTrayLabels = DEFAULT_TRAY_LABELS
): void {
  tray.openTray({ id: 'order-review', title: labels.reviewTitle, height: 'medium' }, () => (
    <ReviewContent
      orderId={orderId}
      submitReviewFn={submitReviewFn}
      onSuccess={() => {
        tray.openTray(
          { id: 'review-success', title: labels.reviewThanksTitle, height: 'compact' },
          () =>
            tray.renderSuccess({
              id: 'review-success',
              title: labels.reviewThanksTitle,
              message: labels.reviewThanksBody,
              primaryLabel: labels.reviewDone,
              testID: 'review-success-tray',
            })
        );
      }}
      onError={(message) => {
        tray.openTray(
          { id: 'review-error', title: labels.reviewFailed, height: 'compact' },
          () => tray.renderError({ id: 'review-error', title: labels.reviewFailed, message })
        );
      }}
    />
  ));
}

export function openOrderDisputeTray(
  orderId: string,
  submitDisputeFn: SubmitDisputeFn,
  tray: OrderTrayOpenFns,
  DisputeContent: ComponentType<OrderDisputeTrayContentProps>,
  opts?: { onMessageCook?: () => void; labels?: OrderTrayLabels }
): void {
  const labels = opts?.labels ?? DEFAULT_TRAY_LABELS;
  tray.openTray({ id: 'order-dispute', title: labels.disputeTitle, height: 'medium' }, () => (
    <DisputeContent
      orderId={orderId}
      submitDisputeFn={submitDisputeFn}
      onSuccess={() => {
        tray.openTray(
          { id: 'dispute-success', title: labels.disputeReportedTitle, height: 'compact' },
          () =>
            tray.renderSuccess({
              id: 'dispute-success',
              title: labels.disputeReportedTitle,
              message: labels.disputeReportedBody,
              primaryLabel: labels.disputeGotIt,
              testID: 'dispute-success-tray',
              secondaryLabel: opts?.onMessageCook ? labels.disputeMessageCook : undefined,
              onSecondary: opts?.onMessageCook,
            })
        );
      }}
      onError={(message) => {
        tray.openTray(
          { id: 'dispute-error', title: labels.disputeFailed, height: 'compact' },
          () => tray.renderError({ id: 'dispute-error', title: labels.disputeFailed, message })
        );
      }}
    />
  ));
}
