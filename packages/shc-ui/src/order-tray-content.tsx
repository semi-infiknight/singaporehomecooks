// Shipped order tray content — delegates to shared order-tray-mutations hooks.
// @ts-nocheck
import React from 'react';
import { SHCOrderReviewTrayForm, SHCOrderDisputeTrayForm } from './order-tray-forms';
import { useOrderReviewTrayMutation, useOrderDisputeTrayMutation } from './order-tray-mutations';
import type { SubmitReviewFn, SubmitDisputeFn, OrderTrayLabels } from './order-tray-opener-core';
import { DEFAULT_TRAY_LABELS } from './order-tray-opener-core';

export type { SubmitReviewFn, SubmitDisputeFn } from './order-tray-opener-core';

export function SHCOrderReviewTrayContent({
  orderId,
  submitReviewFn,
  onSuccess,
  onError,
  labels = DEFAULT_TRAY_LABELS,
}: {
  orderId: string;
  submitReviewFn: SubmitReviewFn;
  onSuccess: () => void;
  onError: (message: string) => void;
  labels?: OrderTrayLabels;
}) {
  const tray = useOrderReviewTrayMutation({ orderId, submitReviewFn, onSuccess, onError });

  return (
    <SHCOrderReviewTrayForm
      rating={tray.rating}
      onRatingChange={tray.setRating}
      reviewBody={tray.reviewBody}
      onReviewBodyChange={tray.setReviewBody}
      onSubmit={tray.submit}
      isPending={tray.isPending}
      labels={labels}
    />
  );
}

export function SHCOrderDisputeTrayContent({
  orderId,
  submitDisputeFn,
  onSuccess,
  onError,
  labels = DEFAULT_TRAY_LABELS,
}: {
  orderId: string;
  submitDisputeFn: SubmitDisputeFn;
  onSuccess: () => void;
  onError: (message: string) => void;
  labels?: OrderTrayLabels;
}) {
  const tray = useOrderDisputeTrayMutation({ orderId, submitDisputeFn, onSuccess, onError });

  return (
    <SHCOrderDisputeTrayForm
      disputeNotes={tray.disputeNotes}
      onDisputeNotesChange={tray.setDisputeNotes}
      onSubmit={tray.submit}
      isPending={tray.isPending}
      labels={labels}
    />
  );
}
