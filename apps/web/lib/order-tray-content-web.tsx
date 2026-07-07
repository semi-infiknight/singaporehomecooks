'use client';

import React from 'react';
import { SHCButton } from './shc-tray-web';
import { useOrderReviewTrayMutation, useOrderDisputeTrayMutation } from '@shc/ui/order-tray-mutations';
import type {
  OrderReviewTrayContentProps,
  OrderDisputeTrayContentProps,
} from '@shc/ui/order-tray-opener-core';
import { DEFAULT_TRAY_LABELS } from '@shc/ui/order-tray-opener-core';

export function SHCOrderReviewTrayContentWeb({
  orderId,
  submitReviewFn,
  onSuccess,
  onError,
  labels = DEFAULT_TRAY_LABELS,
}: OrderReviewTrayContentProps) {
  const tray = useOrderReviewTrayMutation({ orderId, submitReviewFn, onSuccess, onError });

  return (
    <div data-testid="order-review-tray">
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => tray.setRating(n)}
            className={`text-[28px] leading-none ${n <= tray.rating ? 'text-[var(--shc-accent)]' : 'text-muted-foreground/40'}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={tray.reviewBody}
        onChange={(e) => tray.setReviewBody(e.target.value)}
        placeholder={labels.reviewPlaceholder}
        className="shc-input-gourmeat w-full mt-2 min-h-[72px] py-2"
        data-testid="review-body-input"
      />
      <SHCButton
        className="mt-2.5"
        appearance="customer"
        disabled={tray.isPending}
        onClick={tray.submit}
        testID="submit-review-btn"
      >
        {tray.isPending ? labels.reviewSubmitting : labels.reviewSubmit}
      </SHCButton>
    </div>
  );
}

export function SHCOrderDisputeTrayContentWeb({
  orderId,
  submitDisputeFn,
  onSuccess,
  onError,
  labels = DEFAULT_TRAY_LABELS,
}: OrderDisputeTrayContentProps) {
  const tray = useOrderDisputeTrayMutation({ orderId, submitDisputeFn, onSuccess, onError });

  return (
    <div data-testid="order-dispute-tray">
      <p className="text-xs text-muted-foreground mt-1">{labels.disputeHint}</p>
      <textarea
        value={tray.disputeNotes}
        onChange={(e) => tray.setDisputeNotes(e.target.value)}
        placeholder={labels.disputePlaceholder}
        className="shc-input-gourmeat w-full mt-2 min-h-[72px] py-2"
        data-testid="dispute-notes-input"
      />
      <SHCButton
        className="mt-2.5"
        appearance="customer"
        disabled={tray.isPending || !tray.canSubmit}
        onClick={tray.submit}
        testID="submit-dispute-btn"
      >
        {tray.isPending ? labels.disputeSubmitting : labels.disputeSubmit}
      </SHCButton>
    </div>
  );
}
