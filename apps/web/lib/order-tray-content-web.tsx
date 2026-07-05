'use client';

import React from 'react';
import { SHCButton } from '../app/components/SHCWebComponents';
import { useOrderReviewTrayMutation, useOrderDisputeTrayMutation } from '@shc/ui/order-tray-mutations';
import type {
  OrderReviewTrayContentProps,
  OrderDisputeTrayContentProps,
} from '@shc/ui/order-tray-opener-core';

export function SHCOrderReviewTrayContentWeb({
  orderId,
  submitReviewFn,
  onSuccess,
  onError,
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
            className={`text-[28px] leading-none ${n <= tray.rating ? 'text-[#FFB800]' : 'text-muted-foreground/40'}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={tray.reviewBody}
        onChange={(e) => tray.setReviewBody(e.target.value)}
        placeholder="Share your experience (optional)"
        className="shc-input w-full mt-2 min-h-[72px] py-2"
        data-testid="review-body-input"
      />
      <SHCButton
        className="mt-2.5"
        disabled={tray.isPending}
        onClick={tray.submit}
        data-testid="submit-review-btn"
      >
        {tray.isPending ? 'Submitting…' : 'Submit review'}
      </SHCButton>
    </div>
  );
}

export function SHCOrderDisputeTrayContentWeb({
  orderId,
  submitDisputeFn,
  onSuccess,
  onError,
}: OrderDisputeTrayContentProps) {
  const tray = useOrderDisputeTrayMutation({ orderId, submitDisputeFn, onSuccess, onError });

  return (
    <div data-testid="order-dispute-tray">
      <p className="text-xs text-[#5C5144] mt-1">
        Use this for food quality, collection, or safety issues that need ops review.
      </p>
      <textarea
        value={tray.disputeNotes}
        onChange={(e) => tray.setDisputeNotes(e.target.value)}
        placeholder="Tell ops what happened. Include timing, dish condition, or collection issue."
        className="shc-input w-full mt-2 min-h-[72px] py-2"
        data-testid="dispute-notes-input"
      />
      <SHCButton
        className="mt-2.5"
        disabled={tray.isPending || !tray.canSubmit}
        onClick={tray.submit}
        data-testid="submit-dispute-btn"
      >
        {tray.isPending ? 'Reporting…' : 'Report issue'}
      </SHCButton>
    </div>
  );
}