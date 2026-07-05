// Shared order tray mutation + state — single path for RN content and web content.
// @ts-nocheck
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isMaestroE2eOrderId } from '@shc/utils';
import type { SubmitReviewFn, SubmitDisputeFn } from './order-tray-opener-core';

export function useOrderReviewTrayMutation(args: {
  orderId: string;
  submitReviewFn: SubmitReviewFn;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const { orderId, submitReviewFn, onSuccess, onError } = args;
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

  return {
    rating,
    setRating,
    reviewBody,
    setReviewBody,
    submit: () => reviewMut.mutate(),
    isPending: reviewMut.isPending,
  };
}

export function useOrderDisputeTrayMutation(args: {
  orderId: string;
  submitDisputeFn: SubmitDisputeFn;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const { orderId, submitDisputeFn, onSuccess, onError } = args;
  const [disputeNotes, setDisputeNotes] = useState(
    (process.env.EXPO_PUBLIC_MAESTRO_E2E === '1' || process.env.NEXT_PUBLIC_MAESTRO_E2E === '1') &&
      isMaestroE2eOrderId(orderId)
      ? 'E2E dispute notes for ops'
      : ''
  );
  const qc = useQueryClient();
  const disputeMut = useMutation({
    mutationFn: () => submitDisputeFn(orderId, { type: 'other', notes: disputeNotes.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-disputes', orderId] });
      onSuccess();
    },
    onError: (e: Error) => onError(e?.message || 'Please try again.'),
  });

  return {
    disputeNotes,
    setDisputeNotes,
    submit: () => disputeMut.mutate(),
    isPending: disputeMut.isPending,
    canSubmit: disputeNotes.trim().length >= 5,
  };
}