/**
 * Web hook path — useOrderTrayTracking + web content component (same as OrderTrackingTraySectionWeb).
 */
import React, { useMemo, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SHCTrayProvider,
  SHCTrayAction,
  createOrderTrayFns,
  useOrderTrayTracking,
  useSHCTray,
} from './index';
import type { OrderReviewTrayContentProps } from './order-tray-opener-core';
import { E2E_ORDER_SEED, resolveOrderForDisplay, resolveReviewForDisplay, resolveDisputesForDisplay } from '@shc/utils';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

/** Mirrors apps/web/lib/order-tray-content-web.tsx DOM + shared useOrderReviewTrayMutation pattern. */
function WebReviewContentStub({
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
      <textarea data-testid="review-body-input" value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} />
      <button type="button" data-testid="submit-review-btn" onClick={() => reviewMut.mutate()}>
        Submit review
      </button>
    </div>
  );
}

const submitReview = vi.fn();
const submitOrderDispute = vi.fn();

function WebHookHarness({ orderId }: { orderId: string }) {
  const { openTray, dismiss } = useSHCTray();
  const order = resolveOrderForDisplay(E2E_ORDER_SEED, orderId, { maestroE2e: true });

  const trayFns = useMemo(
    () =>
      createOrderTrayFns({
        openTray,
        dismiss,
        renderSuccess: ({ message, primaryLabel, testID }) => (
          <SHCTrayAction message={message} primaryLabel={primaryLabel} onPrimary={dismiss} testID={testID} />
        ),
        renderError: ({ id, message }) => (
          <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} testID="review-error-tray" />
        ),
      }),
    [dismiss, openTray]
  );

  const { showReviewForm, openReviewTray } = useOrderTrayTracking({
    orderId,
    order: order!,
    existingReview: resolveReviewForDisplay(null, orderId, { maestroE2e: true }),
    disputes: resolveDisputesForDisplay([], orderId, { maestroE2e: true }),
    submitReview,
    submitOrderDispute,
    trayFns,
    ReviewContent: WebReviewContentStub,
  });

  if (!showReviewForm) return null;

  return (
    <button type="button" data-testid="open-review-tray-btn" onClick={openReviewTray}>
      Leave a review
    </button>
  );
}

describe('useOrderTrayTracking (web content path)', () => {
  afterEach(() => {
    cleanup();
    submitReview.mockReset();
  });

  it('web open-review-tray-btn → submit-review-btn → review-success-tray', async () => {
    submitReview.mockResolvedValue({ id: 'rev-web' });
    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <SHCTrayProvider queryClient={qc}>
          <WebHookHarness orderId="order-e2e-review" />
        </SHCTrayProvider>
      </QueryClientProvider>
    );

    await user.click(screen.getByTestId('open-review-tray-btn'));
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() => expect(submitReview).toHaveBeenCalledWith('order-e2e-review', 5, undefined));
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
  });
});