/**
 * Integration — shipped SHCTrayProvider + SHCOrderReviewTrayContent (useMutation path).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SHCTrayProvider, useSHCTray } from './tray';
import { SHCOrderReviewTrayContent, SHCOrderDisputeTrayContent } from './order-tray-content';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

function TrayTestApp({
  submitReviewFn,
  submitDisputeFn,
  onReviewSuccess,
  onDisputeSuccess,
}: {
  submitReviewFn: ReturnType<typeof vi.fn>;
  submitDisputeFn: ReturnType<typeof vi.fn>;
  onReviewSuccess: () => void;
  onDisputeSuccess: () => void;
}) {
  const { openTray } = useSHCTray();
  const [tick, setTick] = React.useState(0);

  return (
    <>
      <button
        type="button"
        data-testid="open-review-tray-btn"
        onClick={() =>
          openTray({ id: 'order-review', title: 'Leave a review', height: 'medium' }, () => (
            <SHCOrderReviewTrayContent
              orderId="order-e2e-review"
              submitReviewFn={submitReviewFn}
              onSuccess={onReviewSuccess}
              onError={() => {}}
            />
          ))
        }
      >
        Leave a review
      </button>
      <button
        type="button"
        data-testid="open-dispute-tray-btn"
        onClick={() =>
          openTray({ id: 'order-dispute', title: 'Report an issue', height: 'medium' }, () => (
            <SHCOrderDisputeTrayContent
              orderId="order-e2e-review"
              submitDisputeFn={submitDisputeFn}
              onSuccess={onDisputeSuccess}
              onError={() => {}}
            />
          ))
        }
      >
        Report issue
      </button>
      <button type="button" data-testid="bump-overlay" onClick={() => setTick((t) => t + 1)}>
        bump {tick}
      </button>
    </>
  );
}

function renderWithProviders(ui: React.ReactElement, qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('SHCTrayProvider + SHCOrderReviewTrayContent (shipped mutation path)', () => {
  afterEach(() => cleanup());

  it('typing survives overlay re-render; submit calls injected submitReviewFn', async () => {
    const submitReviewFn = vi.fn().mockResolvedValue({ id: 'rev-1' });
    const onReviewSuccess = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SHCTrayProvider>
        <TrayTestApp
          submitReviewFn={submitReviewFn}
          submitDisputeFn={vi.fn()}
          onReviewSuccess={onReviewSuccess}
          onDisputeSuccess={vi.fn()}
        />
      </SHCTrayProvider>
    );

    await user.click(screen.getByTestId('open-review-tray-btn'));
    expect(screen.getByTestId('shc-tray-order-review')).toBeInTheDocument();

    const input = screen.getByTestId('review-body-input').querySelector('textarea')!;
    await user.type(input, 'Great laksa!');
    expect(input).toHaveValue('Great laksa!');

    await user.click(screen.getByTestId('bump-overlay'));
    expect(screen.getByTestId('review-body-input').querySelector('textarea')).toHaveValue('Great laksa!');

    await user.click(screen.getByTestId('submit-review-btn'));
    await waitFor(() => expect(submitReviewFn).toHaveBeenCalledWith('order-e2e-review', 5, 'Great laksa!'));
    await waitFor(() => expect(onReviewSuccess).toHaveBeenCalled());
  });

  it('dispute tray submit calls injected submitDisputeFn with trimmed notes', async () => {
    const submitDisputeFn = vi.fn().mockResolvedValue({ id: 'disp-1' });
    const onDisputeSuccess = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SHCTrayProvider>
        <TrayTestApp
          submitReviewFn={vi.fn()}
          submitDisputeFn={submitDisputeFn}
          onReviewSuccess={vi.fn()}
          onDisputeSuccess={onDisputeSuccess}
        />
      </SHCTrayProvider>
    );

    await user.click(screen.getByTestId('open-dispute-tray-btn'));
    const input = screen.getByTestId('dispute-notes-input').querySelector('textarea')!;
    await user.type(input, 'Food arrived cold');
    await user.click(screen.getByTestId('submit-dispute-btn'));

    await waitFor(() =>
      expect(submitDisputeFn).toHaveBeenCalledWith('order-e2e-review', {
        type: 'other',
        notes: 'Food arrived cold',
      })
    );
    await waitFor(() => expect(onDisputeSuccess).toHaveBeenCalled());
  });
});