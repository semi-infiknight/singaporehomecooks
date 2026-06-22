import { describe, it, expect } from 'vitest';
import { canSubmitReview } from './review';

describe('canSubmitReview', () => {
  it('allows collected and completed', () => {
    expect(canSubmitReview('collected')).toBe(true);
    expect(canSubmitReview('completed')).toBe(true);
  });

  it('blocks pre-collection states', () => {
    expect(canSubmitReview('paid')).toBe(false);
    expect(canSubmitReview('ready_for_collection')).toBe(false);
    expect(canSubmitReview('accepted')).toBe(false);
  });
});