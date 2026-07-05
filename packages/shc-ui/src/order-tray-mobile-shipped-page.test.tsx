/**
 * Shipped mobile path — renders apps/mobile-customer/app/(customer)/orders/[id].tsx
 * and clicks open-review-tray-btn from inside the full page.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider } from './tray';
import { E2E_ORDER_SEED } from '@shc/utils';

const submitReviewMock = vi.fn();
const submitOrderDisputeMock = vi.fn();

vi.mock('../../../apps/mobile-customer/hooks/useOrder', () => ({
  useOrder: () => ({ data: undefined, isFetching: false }),
}));

vi.mock('../../../apps/mobile-customer/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Maestro Guest' } }),
}));

vi.mock('../../../apps/mobile-customer/lib/api-client', () => ({
  getReview: vi.fn().mockResolvedValue(null),
  getOrderDisputes: vi.fn().mockResolvedValue([]),
  submitReview: (...args: unknown[]) => submitReviewMock(...args),
  submitOrderDispute: (...args: unknown[]) => submitOrderDisputeMock(...args),
}));

vi.mock('./icons', () => ({ SHCIcon: () => null }));

import OrderTracking from '@shc-mobile-order-page';

function renderShippedMobilePage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SHCTrayProvider queryClient={qc}>
        <OrderTracking />
      </SHCTrayProvider>
    </QueryClientProvider>
  );
}

describe('shipped mobile orders/[id] page', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_MAESTRO_E2E = '1';
  });

  afterEach(() => {
    cleanup();
    submitReviewMock.mockReset();
    submitOrderDisputeMock.mockReset();
    delete process.env.EXPO_PUBLIC_MAESTRO_E2E;
  });

  it('page render → open-review-tray-btn → submit-review-btn → review-success-tray', async () => {
    submitReviewMock.mockResolvedValue({ id: 'e2e-review', order_id: E2E_ORDER_SEED.id, rating: 5 });
    const user = userEvent.setup();

    renderShippedMobilePage();

    await waitFor(() => expect(screen.getByTestId('order-tracking-screen')).toBeTruthy());
    await user.click(screen.getByTestId('open-review-tray-btn'));
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() =>
      expect(submitReviewMock).toHaveBeenCalledWith(E2E_ORDER_SEED.id, 5, undefined)
    );
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeTruthy());
  });
});