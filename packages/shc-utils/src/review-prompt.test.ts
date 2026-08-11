import { describe, expect, it } from 'vitest';
import {
  REVIEW_DIMENSIONS,
  REVIEW_PROMPT_DELAY_MS,
  buildReviewPromptCopy,
  formatReviewBodyWithDimensions,
  isReviewPromptDue,
  normalizeDimensionScores,
  orderIdFromReviewPromptType,
  overallRatingFromDimensions,
  parseDimensionsFromReviewBody,
  reviewPromptNotificationType,
  shouldSendReviewPrompt,
} from './review-prompt';

describe('review prompt timing', () => {
  const collectedAt = '2026-08-10T12:00:00.000Z';
  const collectedMs = Date.parse(collectedAt);

  it('is not due before the delay', () => {
    expect(isReviewPromptDue(collectedAt, collectedMs + REVIEW_PROMPT_DELAY_MS - 1)).toBe(false);
  });

  it('is due at or after one hour', () => {
    expect(isReviewPromptDue(collectedAt, collectedMs + REVIEW_PROMPT_DELAY_MS)).toBe(true);
    expect(isReviewPromptDue(collectedAt, collectedMs + REVIEW_PROMPT_DELAY_MS + 60_000)).toBe(true);
  });

  it('worker gate requires collected status, no review, not already prompted, and delay', () => {
    const base = {
      shcStatus: 'collected',
      collectedAt,
      hasReview: false,
      alreadyPrompted: false,
      nowMs: collectedMs + REVIEW_PROMPT_DELAY_MS,
    };
    expect(shouldSendReviewPrompt(base)).toBe(true);
    expect(shouldSendReviewPrompt({ ...base, hasReview: true })).toBe(false);
    expect(shouldSendReviewPrompt({ ...base, alreadyPrompted: true })).toBe(false);
    expect(shouldSendReviewPrompt({ ...base, shcStatus: 'preparing' })).toBe(false);
    expect(
      shouldSendReviewPrompt({ ...base, nowMs: collectedMs + REVIEW_PROMPT_DELAY_MS - 1 })
    ).toBe(false);
  });
});

describe('review dimensions', () => {
  it('exposes the product criteria set', () => {
    const ids = REVIEW_DIMENSIONS.map((d) => d.id);
    expect(ids).toEqual(['taste', 'communication', 'presentation', 'quantity', 'oily', 'spicy']);
  });

  it('normalizes and averages dimension scores', () => {
    const scores = normalizeDimensionScores({
      taste: 5,
      communication: 4,
      presentation: 5,
      quantity: 3,
      oily: 2,
      spicy: 4,
      // @ts-expect-error intentional junk
      bogus: 9,
    });
    expect(scores.taste).toBe(5);
    expect(overallRatingFromDimensions(scores)).toBe(4); // mean 3.83 → 4
  });

  it('round-trips dimensions through body text', () => {
    const body = formatReviewBodyWithDimensions('Loved the gravy', {
      taste: 5,
      communication: 4,
      presentation: 5,
      quantity: 4,
      oily: 2,
      spicy: 3,
    });
    expect(body).toMatch(/Taste of food: 5\/5/);
    expect(body).toMatch(/How oily: 2\/5/);
    expect(body).toMatch(/Loved the gravy/);
    const parsed = parseDimensionsFromReviewBody(body);
    expect(parsed.taste).toBe(5);
    expect(parsed.oily).toBe(2);
    expect(parsed.spicy).toBe(3);
  });
});

describe('notification helpers', () => {
  it('builds typed prompt notifications', () => {
    expect(reviewPromptNotificationType('ord_123')).toBe('review_prompt:ord_123');
    expect(orderIdFromReviewPromptType('review_prompt:ord_123')).toBe('ord_123');
    const copy = buildReviewPromptCopy({
      cookName: "Auntie Mei",
      dishSummary: 'Nasi Lemak',
      orderRef: 'ABC123',
    });
    expect(copy.title).toMatch(/meal/i);
    expect(copy.body).toMatch(/taste/i);
    expect(copy.body).toMatch(/Auntie Mei/);
  });
});
