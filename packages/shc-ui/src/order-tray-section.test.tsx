/**
 * Section-level — OrderTrackingTraySection renders open-review-tray-btn from E2E seed.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider, OrderTrackingTraySection } from './index';
import { E2E_ORDER_SEED, resolveOrderForDisplay, resolveReviewForDisplay, resolveDisputesForDisplay } from '@shc/utils';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

const submitReview = vi.fn();
const submitOrderDispute = vi.fn();

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SHCTrayProvider queryClient={qc}>{ui}</SHCTrayProvider>
    </QueryClientProvider>
  );
}

describe('OrderTrackingTraySection', () => {
  afterEach(() => {
    cleanup();
    submitReview.mockReset();
    submitOrderDispute.mockReset();
  });

  it('open-review-tray-btn → submit-review-btn → review-success-tray', async () => {
    submitReview.mockResolvedValue({ id: 'rev-1' });
    const user = userEvent.setup();
    const orderId = 'order-e2e-review';

    renderWithProviders(
      <OrderTrackingTraySection
        orderId={orderId}
        order={resolveOrderForDisplay(E2E_ORDER_SEED, orderId, { maestroE2e: true })!}
        existingReview={resolveReviewForDisplay(null, orderId, { maestroE2e: true })}
        disputes={resolveDisputesForDisplay([], orderId, { maestroE2e: true })}
        submitReview={submitReview}
        submitOrderDispute={submitOrderDispute}
      />
    );

    await user.click(screen.getByTestId('open-review-tray-btn'));
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() => expect(submitReview).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
  });
});