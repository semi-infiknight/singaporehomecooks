/**
 * Hook-level — useOrderTrayTracking with injected tray provider (canonical contract).
 */
import React, { useMemo } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SHCTrayProvider,
  useSHCTray,
  SHCTrayAction,
  createOrderTrayFns,
  useOrderTrayTracking,
} from './index';
import { E2E_ORDER_SEED, resolveOrderForDisplay, resolveReviewForDisplay, resolveDisputesForDisplay } from '@shc/utils';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

const submitReview = vi.fn();
const submitOrderDispute = vi.fn();

function HookHarness({ orderId }: { orderId: string }) {
  const { openTray, dismiss } = useSHCTray();
  const order = resolveOrderForDisplay(E2E_ORDER_SEED, orderId, { maestroE2e: true });
  const existingReview = resolveReviewForDisplay(null, orderId, { maestroE2e: true });
  const disputes = resolveDisputesForDisplay([], orderId, { maestroE2e: true });

  const trayFns = useMemo(
    () =>
      createOrderTrayFns({
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
      }),
    [dismiss, openTray]
  );

  const { showReviewForm, openReviewTray } = useOrderTrayTracking({
    orderId,
    order: order!,
    existingReview,
    disputes,
    submitReview,
    submitOrderDispute,
    trayFns,
  });

  if (!showReviewForm) return null;

  return (
    <button type="button" data-testid="open-review-tray-btn" onClick={openReviewTray}>
      Leave a review
    </button>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SHCTrayProvider queryClient={qc}>{ui}</SHCTrayProvider>
    </QueryClientProvider>
  );
}

describe('useOrderTrayTracking', () => {
  afterEach(() => {
    cleanup();
    submitReview.mockReset();
    submitOrderDispute.mockReset();
  });

  it('orderTrayActions showReviewForm → openReviewTray → submitReview → review-success-tray', async () => {
    submitReview.mockResolvedValue({ id: 'rev-1' });
    const user = userEvent.setup();

    renderWithProviders(<HookHarness orderId="order-e2e-review" />);

    await user.click(screen.getByTestId('open-review-tray-btn'));
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() => expect(submitReview).toHaveBeenCalledWith('order-e2e-review', 5, undefined));
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
  });
});