/**
 * Integration — shipped OrderTrackingTraySection (same path as mobile orders/[id].tsx).
 * Clicks open-review-tray-btn from orderTrayActions showReviewForm + real submitReview fn.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SHCTrayProvider,
  OrderTrackingTraySection,
} from './index';
import {
  E2E_ORDER_SEED,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
} from '@shc/utils';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

/** Same arity as apps/mobile-customer/lib/api-client submitReview export. */
const submitReview: (orderId: string, rating: number, body?: string) => Promise<unknown> = vi.fn();
const submitOrderDispute: (
  orderId: string,
  input: { type?: string; notes: string }
) => Promise<unknown> = vi.fn();

function ShippedOrderScreen({ orderId }: { orderId: string }) {
  const maestroE2e = true;
  const order = resolveOrderForDisplay(E2E_ORDER_SEED, orderId, { maestroE2e });
  const existingReview = resolveReviewForDisplay(null, orderId, { maestroE2e });
  const disputes = resolveDisputesForDisplay([], orderId, { maestroE2e });

  if (!order) return null;

  return (
    <OrderTrackingTraySection
      orderId={orderId}
      order={order}
      existingReview={existingReview}
      disputes={disputes}
      submitReview={submitReview}
      submitOrderDispute={submitOrderDispute}
    />
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

describe('OrderTrackingTraySection (shipped mobile orders/[id] path)', () => {
  afterEach(() => {
    cleanup();
    submitReview.mockReset();
    submitOrderDispute.mockReset();
  });

  it('showReviewForm → open-review-tray-btn → submitReview → review-success-tray', async () => {
    submitReview.mockResolvedValue({ id: 'rev-1' });
    const user = userEvent.setup();

    renderWithProviders(<ShippedOrderScreen orderId="order-e2e-review" />);

    const openBtn = await screen.findByTestId('open-review-tray-btn');
    expect(openBtn).toBeInTheDocument();

    await user.click(openBtn);
    expect(screen.getByTestId('shc-tray-order-review')).toBeInTheDocument();

    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() =>
      expect(submitReview).toHaveBeenCalledWith('order-e2e-review', 5, undefined)
    );
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
    expect(screen.getByTestId('shc-tray-review-success')).toBeInTheDocument();
  });
});