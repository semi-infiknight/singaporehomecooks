/**
 * Integration — shipped openOrderReviewTray (same path as mobile orders/[id].tsx).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider, useSHCTray, SHCTrayAction, openOrderReviewTray } from './index';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

function OrderScreenTrayHarness({
  orderId,
  submitReviewFn,
}: {
  orderId: string;
  submitReviewFn: ReturnType<typeof vi.fn>;
}) {
  const { openTray, dismiss } = useSHCTray();

  const openReview = () =>
    openOrderReviewTray(orderId, submitReviewFn, {
      openTray,
      dismiss,
      renderSuccess: ({ message, primaryLabel, testID }) => (
        <SHCTrayAction message={message} primaryLabel={primaryLabel} onPrimary={dismiss} testID={testID} />
      ),
      renderError: ({ id, message }) => (
        <SHCTrayAction
          message={message}
          primaryLabel="OK"
          onPrimary={dismiss}
          testID={id === 'dispute-error' ? 'dispute-error-tray' : 'review-error-tray'}
        />
      ),
    });

  return (
    <button type="button" data-testid="open-review-tray-btn" onClick={openReview}>
      Leave a review
    </button>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('openOrderReviewTray (shipped mobile screen path)', () => {
  afterEach(() => cleanup());

  it('submitReview → dismiss → review-success-tray visible', async () => {
    const submitReviewFn = vi.fn().mockResolvedValue({ id: 'rev-1' });
    const user = userEvent.setup();

    renderWithProviders(
      <SHCTrayProvider>
        <OrderScreenTrayHarness orderId="order-e2e-review" submitReviewFn={submitReviewFn} />
      </SHCTrayProvider>
    );

    await user.click(screen.getByTestId('open-review-tray-btn'));
    expect(screen.getByTestId('shc-tray-order-review')).toBeInTheDocument();

    const input = screen.getByTestId('review-body-input').querySelector('textarea')!;
    await user.type(input, 'Great laksa!');
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() => expect(submitReviewFn).toHaveBeenCalledWith('order-e2e-review', 5, 'Great laksa!'));
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
    expect(screen.getByTestId('shc-tray-review-success')).toBeInTheDocument();
  });
});