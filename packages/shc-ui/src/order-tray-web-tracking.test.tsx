/**
 * Shipped web section path — OrderTrackingTraySectionWeb + useSHCTrayWeb + real web content.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { E2E_ORDER_SEED, resolveOrderForDisplay, resolveReviewForDisplay, resolveDisputesForDisplay } from '@shc/utils';
import { SHCTrayProviderWeb } from '../../../apps/web/lib/shc-tray-web';
import { OrderTrackingTraySectionWeb } from '../../../apps/web/lib/order-tray-section-web';

const submitReview = vi.fn();
const submitOrderDispute = vi.fn();

function renderWebSection(orderId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SHCTrayProviderWeb>
        <OrderTrackingTraySectionWeb
          orderId={orderId}
          order={resolveOrderForDisplay(E2E_ORDER_SEED, orderId, { maestroE2e: true })!}
          existingReview={resolveReviewForDisplay(null, orderId, { maestroE2e: true })}
          disputes={resolveDisputesForDisplay([], orderId, { maestroE2e: true })}
          submitReview={submitReview}
          submitOrderDispute={submitOrderDispute}
        />
      </SHCTrayProviderWeb>
    </QueryClientProvider>
  );
}

describe('OrderTrackingTraySectionWeb (shipped web section)', () => {
  afterEach(() => {
    cleanup();
    submitReview.mockReset();
    submitOrderDispute.mockReset();
  });

  it('open-review-tray-btn → submit-review-btn → review-success-tray via real web content', async () => {
    submitReview.mockResolvedValue({ id: 'rev-web' });
    const user = userEvent.setup();

    renderWebSection(E2E_ORDER_SEED.id);

    await user.click(screen.getByTestId('open-review-tray-btn'));
    expect(screen.getByTestId('order-review-tray')).toBeInTheDocument();
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() => expect(submitReview).toHaveBeenCalledWith(E2E_ORDER_SEED.id, 5, undefined));
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
  });
});