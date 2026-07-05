'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SHCButton } from '../app/components/SHCWebComponents';
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
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const qc = useQueryClient();
  const reviewMut = useMutation({
    mutationFn: () => submitReviewFn(orderId, rating, reviewBody || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', orderId] });
      onSuccess();
    },
    onError: (e: Error) => onError(e?.message || 'Could not submit review'),
  });

  return (
    <div data-testid="order-review-tray">
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-[28px] leading-none ${n <= rating ? 'text-[#FFB800]' : 'text-muted-foreground/40'}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={reviewBody}
        onChange={(e) => setReviewBody(e.target.value)}
        placeholder="Share your experience (optional)"
        className="shc-input w-full mt-2 min-h-[72px] py-2"
        data-testid="review-body-input"
      />
      <SHCButton
        className="mt-2.5"
        disabled={reviewMut.isPending}
        onClick={() => reviewMut.mutate()}
        data-testid="submit-review-btn"
      >
        {reviewMut.isPending ? 'Submitting…' : 'Submit review'}
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
  const [disputeNotes, setDisputeNotes] = useState('');
  const qc = useQueryClient();
  const disputeMut = useMutation({
    mutationFn: () => submitDisputeFn(orderId, { type: 'other', notes: disputeNotes.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-disputes', orderId] });
      onSuccess();
    },
    onError: (e: Error) => onError(e?.message || 'Please try again.'),
  });

  return (
    <div data-testid="order-dispute-tray">
      <p className="text-xs text-[#5C5144] mt-1">
        Use this for food quality, collection, or safety issues that need ops review.
      </p>
      <textarea
        value={disputeNotes}
        onChange={(e) => setDisputeNotes(e.target.value)}
        placeholder="Tell ops what happened. Include timing, dish condition, or collection issue."
        className="shc-input w-full mt-2 min-h-[72px] py-2"
        data-testid="dispute-notes-input"
      />
      <SHCButton
        className="mt-2.5"
        disabled={disputeMut.isPending || disputeNotes.trim().length < 5}
        onClick={() => disputeMut.mutate()}
        data-testid="submit-dispute-btn"
      >
        {disputeMut.isPending ? 'Reporting…' : 'Report issue'}
      </SHCButton>
    </div>
  );
}