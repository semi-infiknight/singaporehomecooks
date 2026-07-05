/**
 * Integration tests — shipped SHCTrayProvider + shipped order tray forms.
 */
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SHCTrayProvider, useSHCTray } from './tray';
import { SHCOrderReviewTrayForm, SHCOrderDisputeTrayForm } from './order-tray-forms';

vi.mock('./icons', () => ({ SHCIcon: () => null }));

function TrayTestApp() {
  const { openTray } = useSHCTray();
  const [tick, setTick] = useState(0);

  return (
    <>
      <button
        type="button"
        data-testid="open-review-tray-btn"
        onClick={() =>
          openTray({ id: 'order-review', title: 'Leave a review', height: 'medium' }, () => (
            <ReviewTrayHarness />
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
            <DisputeTrayHarness />
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

function ReviewTrayHarness() {
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  return (
    <SHCOrderReviewTrayForm
      rating={rating}
      onRatingChange={setRating}
      reviewBody={reviewBody}
      onReviewBodyChange={setReviewBody}
      onSubmit={() => {}}
    />
  );
}

function DisputeTrayHarness() {
  const [disputeNotes, setDisputeNotes] = useState('');
  return (
    <SHCOrderDisputeTrayForm
      disputeNotes={disputeNotes}
      onDisputeNotesChange={setDisputeNotes}
      onSubmit={() => {}}
    />
  );
}

describe('SHCTrayProvider integration (shipped tray + order forms)', () => {
  afterEach(() => cleanup());

  it('review tray typing survives overlay re-render via contentMap render fn', async () => {
    const user = userEvent.setup();
    render(
      <SHCTrayProvider>
        <TrayTestApp />
      </SHCTrayProvider>
    );
    await user.click(screen.getByTestId('open-review-tray-btn'));
    expect(screen.getByTestId('shc-tray-order-review')).toBeInTheDocument();
    expect(screen.getByTestId('order-review-tray')).toBeInTheDocument();

    const input = screen.getByTestId('review-body-input').querySelector('textarea')!;
    await user.type(input, 'Great laksa!');
    expect(input).toHaveValue('Great laksa!');

    await user.click(screen.getByTestId('bump-overlay'));
    expect(screen.getByTestId('review-body-input').querySelector('textarea')).toHaveValue('Great laksa!');
  });

  it('dispute tray typing inside shc-tray-order-dispute with shipped form', async () => {
    const user = userEvent.setup();
    render(
      <SHCTrayProvider>
        <TrayTestApp />
      </SHCTrayProvider>
    );
    await user.click(screen.getByTestId('open-dispute-tray-btn'));
    expect(screen.getByTestId('shc-tray-order-dispute')).toBeInTheDocument();
    const input = screen.getByTestId('dispute-notes-input').querySelector('textarea')!;
    await user.type(input, 'Food arrived cold');
    expect(input).toHaveValue('Food arrived cold');
    expect(screen.getByTestId('submit-dispute-btn')).toBeInTheDocument();
  });
});