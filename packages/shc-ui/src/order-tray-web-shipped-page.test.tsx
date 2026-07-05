/**
 * Shipped web path — renders apps/web/app/orders/[id]/page.tsx
 * and clicks open-review-tray-btn from inside the full page.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { E2E_ORDER_SEED } from '@shc/utils';

const submitReviewMock = vi.fn();
const submitOrderDisputeMock = vi.fn();

vi.mock('../../../apps/web/lib/useOrder', () => ({
  useOrder: () => ({ data: undefined, isLoading: false, isFetching: false }),
  useChat: () => ({ messages: [], send: vi.fn() }),
  useReview: () => ({ review: null }),
  useOrderDisputes: () => ({ disputes: [] }),
}));

vi.mock('../../../apps/web/lib/api-client', () => ({
  submitReview: (...args: unknown[]) => submitReviewMock(...args),
  submitOrderDispute: (...args: unknown[]) => submitOrderDisputeMock(...args),
}));

vi.mock('../../../apps/web/app/components/SHCWebComponents', () => ({
  SHCCard: ({ children, ...props }: { children?: React.ReactNode }) => (
    <div data-testid="shc-card" {...props}>
      {children}
    </div>
  ),
  SHCButton: ({
    children,
    onClick,
    testID,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    testID?: string;
  }) => (
    <button type="button" data-testid={testID} onClick={onClick}>
      {children}
    </button>
  ),
  SHCSectionTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  GourmeatScreenHeader: ({ title }: { title?: string }) => <header>{title}</header>,
  SHCLoading: ({ label }: { label?: string }) => <div>{label}</div>,
  OrderTimeline: () => <div data-testid="order-timeline" />,
}));

import { SHCTrayProviderWeb } from '../../../apps/web/lib/shc-tray-web';
import TrackOrder from '@shc-web-order-page';

function renderShippedWebPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SHCTrayProviderWeb>
        <TrackOrder />
      </SHCTrayProviderWeb>
    </QueryClientProvider>
  );
}

describe('shipped web orders/[id] page', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MAESTRO_E2E = '1';
  });

  afterEach(() => {
    cleanup();
    submitReviewMock.mockReset();
    submitOrderDisputeMock.mockReset();
    delete process.env.NEXT_PUBLIC_MAESTRO_E2E;
  });

  it('page render → open-review-tray-btn → submit-review-btn → review-success-tray', async () => {
    submitReviewMock.mockResolvedValue({ id: 'e2e-review-web', order_id: E2E_ORDER_SEED.id, rating: 5 });
    const user = userEvent.setup();

    renderShippedWebPage();

    await waitFor(() => expect(screen.getByTestId('order-tracking-screen')).toBeInTheDocument());
    await user.click(screen.getByTestId('open-review-tray-btn'));
    await user.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() =>
      expect(submitReviewMock).toHaveBeenCalledWith(E2E_ORDER_SEED.id, 5, undefined)
    );
    await waitFor(() => expect(screen.getByTestId('review-success-tray')).toBeInTheDocument());
  });
});