/**
 * Integration tests — mount shipped SHCTrayProvider + SHCTrayOverlay (RN mocked in vitest.setup).
 */
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SHCTrayProvider, useSHCTray } from './tray';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

function OrderReviewTrayContentStub() {
  const [reviewBody, setReviewBody] = useState('');
  return (
    <div data-testid="order-review-tray">
      <textarea
        data-testid="review-body-input"
        value={reviewBody}
        onChange={(e) => setReviewBody(e.target.value)}
      />
      <output data-testid="review-body-visible">{reviewBody}</output>
    </div>
  );
}

function OrderDisputeTrayContentStub() {
  const [notes, setNotes] = useState('');
  return (
    <div data-testid="order-dispute-tray">
      <textarea
        data-testid="dispute-notes-input"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <output data-testid="dispute-notes-visible">{notes}</output>
    </div>
  );
}

function TrayTestApp({ onReady }: { onReady?: (open: ReturnType<typeof useSHCTray>['openTray']) => void }) {
  const { openTray } = useSHCTray();
  const [tick, setTick] = useState(0);
  React.useEffect(() => {
    onReady?.(openTray);
  }, [onReady, openTray]);
  return (
    <>
      <button
        type="button"
        data-testid="open-review-tray-btn"
        onClick={() =>
          openTray({ id: 'order-review', title: 'Leave a review', height: 'medium' }, () => (
            <OrderReviewTrayContentStub />
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
            <OrderDisputeTrayContentStub />
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

describe('SHCTrayProvider integration (shipped tray)', () => {
  afterEach(() => cleanup());

  it('review tray typing visible inside shc-tray-order-review after overlay re-render', async () => {
    const user = userEvent.setup();
    render(
      <SHCTrayProvider>
        <TrayTestApp />
      </SHCTrayProvider>
    );
    await user.click(screen.getByTestId('open-review-tray-btn'));
    expect(screen.getByTestId('shc-tray-order-review')).toBeInTheDocument();
    expect(screen.getByTestId('order-review-tray')).toBeInTheDocument();

    const input = screen.getByTestId('review-body-input');
    await user.type(input, 'Great laksa!');
    expect(input).toHaveValue('Great laksa!');

    await user.click(screen.getByTestId('bump-overlay'));
    expect(screen.getByTestId('review-body-input')).toHaveValue('Great laksa!');
    expect(screen.getByTestId('review-body-visible')).toHaveTextContent('Great laksa!');
  });

  it('dispute tray typing visible inside shc-tray-order-dispute', async () => {
    const user = userEvent.setup();
    render(
      <SHCTrayProvider>
        <TrayTestApp />
      </SHCTrayProvider>
    );
    await user.click(screen.getByTestId('open-dispute-tray-btn'));
    expect(screen.getByTestId('shc-tray-order-dispute')).toBeInTheDocument();
    const input = screen.getByTestId('dispute-notes-input');
    await user.type(input, 'Food arrived cold');
    expect(input).toHaveValue('Food arrived cold');
  });
});