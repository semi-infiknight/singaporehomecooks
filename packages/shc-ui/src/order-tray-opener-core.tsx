// Platform-agnostic order tray open helpers — inject review/dispute content components.
// @ts-nocheck
import React, { type ComponentType, type ReactNode } from 'react';
import type { TrayFrame } from './family-values-core';

export type SubmitReviewFn = (orderId: string, rating: number, body?: string) => Promise<unknown>;
export type SubmitDisputeFn = (
  orderId: string,
  payload: { type: string; notes: string }
) => Promise<unknown>;

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
  ReviewContent: ComponentType<OrderReviewTrayContentProps>
): void {
  tray.openTray({ id: 'order-review', title: 'Leave a review', height: 'medium' }, () => (
    <ReviewContent
      orderId={orderId}
      submitReviewFn={submitReviewFn}
      onSuccess={() => {
        tray.openTray(
          { id: 'review-success', title: 'Thank you', height: 'compact' },
          () =>
            tray.renderSuccess({
              id: 'review-success',
              title: 'Thank you',
              message: 'Your review helps other families find trusted home cooks.',
              primaryLabel: 'Done',
              testID: 'review-success-tray',
            })
        );
      }}
      onError={(message) => {
        tray.openTray(
          { id: 'review-error', title: 'Review failed', height: 'compact' },
          () => tray.renderError({ id: 'review-error', title: 'Review failed', message })
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
  opts?: { onMessageCook?: () => void }
): void {
  tray.openTray({ id: 'order-dispute', title: 'Report an issue', height: 'medium' }, () => (
    <DisputeContent
      orderId={orderId}
      submitDisputeFn={submitDisputeFn}
      onSuccess={() => {
        tray.openTray(
          { id: 'dispute-success', title: 'Issue reported', height: 'compact' },
          () =>
            tray.renderSuccess({
              id: 'dispute-success',
              title: 'Issue reported',
              message: 'Ops will review this order and follow up with you.',
              primaryLabel: 'Got it',
              testID: 'dispute-success-tray',
              secondaryLabel: opts?.onMessageCook ? 'Message your cook' : undefined,
              onSecondary: opts?.onMessageCook,
            })
        );
      }}
      onError={(message) => {
        tray.openTray(
          { id: 'dispute-error', title: 'Could not report issue', height: 'compact' },
          () => tray.renderError({ id: 'dispute-error', title: 'Could not report issue', message })
        );
      }}
    />
  ));
}