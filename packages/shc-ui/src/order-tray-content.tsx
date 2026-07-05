// Shipped order tray content — useState + useMutation + query invalidation (same path as mobile screen).
// @ts-nocheck
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SHCOrderReviewTrayForm, SHCOrderDisputeTrayForm } from './order-tray-forms';

export type SubmitReviewFn = (orderId: string, rating: number, body?: string) => Promise<unknown>;
export type SubmitDisputeFn = (
  orderId: string,
  payload: { type: string; notes: string }
) => Promise<unknown>;

export function SHCOrderReviewTrayContent({
  orderId,
  submitReviewFn,
  onSuccess,
  onError,
}: {
  orderId: string;
  submitReviewFn: SubmitReviewFn;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
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
    <SHCOrderReviewTrayForm
      rating={rating}
      onRatingChange={setRating}
      reviewBody={reviewBody}
      onReviewBodyChange={setReviewBody}
      onSubmit={() => reviewMut.mutate()}
      isPending={reviewMut.isPending}
    />
  );
}

export function SHCOrderDisputeTrayContent({
  orderId,
  submitDisputeFn,
  onSuccess,
  onError,
}: {
  orderId: string;
  submitDisputeFn: SubmitDisputeFn;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
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
    <SHCOrderDisputeTrayForm
      disputeNotes={disputeNotes}
      onDisputeNotesChange={setDisputeNotes}
      onSubmit={() => disputeMut.mutate()}
      isPending={disputeMut.isPending}
    />
  );
}