import { describe, expect, it } from 'vitest';
import {
  CUSTOM_REQUEST_COPY,
  parseCustomRequestDisplay,
  shcServingsBadgeLabel,
  shcGuestCountBadgeLabel,
  buildDefaultQuoteLines,
  validateClientQuoteLines,
  sumIncludedQuoteCents,
} from './custom-request';

describe('custom-request utils', () => {
  it('parses legacy single-dish request', () => {
    const parsed = parseCustomRequestDisplay({
      id: 'req_1',
      status: 'bidding',
      body: 'Hari Raya: Nasi lemak for family',
      party_size: 8,
      guest_count: 10,
      budget_cents: 12000,
      date: '2026-08-15',
    });
    expect(parsed.lines).toHaveLength(1);
    expect(parsed.lines[0].servings).toBe(8);
    expect(parsed.guest_count).toBe(10);
    expect(parsed.occasion).toBe('Hari Raya');
  });

  it('parses items_json multi-dish', () => {
    const parsed = parseCustomRequestDisplay({
      id: 'req_2',
      status: 'open',
      body: 'Birthday spread',
      items_json: JSON.stringify([
        { id: 'a', name: 'Laksa', servings: 6 },
        { id: 'b', name: 'Kueh', servings: 12 },
      ]),
    });
    expect(parsed.lines).toHaveLength(2);
    expect(parsed.lines[1].name).toBe('Kueh');
  });

  it('uses product copy constants', () => {
    expect(CUSTOM_REQUEST_COPY.cookBoardTitle).toBe('Custom requests');
    expect(shcServingsBadgeLabel(4)).toBe('4 servings');
    expect(shcGuestCountBadgeLabel(1)).toBe('1 guest');
  });

  it('builds default quote lines and validates client quote', () => {
    const lines = buildDefaultQuoteLines([
      { id: 'a', name: 'Laksa', servings: 6 },
      { id: 'b', name: 'Kueh', servings: 12 },
    ]);
    expect(lines).toHaveLength(2);
    expect(validateClientQuoteLines(lines).ok).toBe(false);
    lines[0].price_cents = 5000;
    lines[1].included = false;
    expect(validateClientQuoteLines(lines).ok).toBe(true);
    expect(sumIncludedQuoteCents(lines)).toBe(5000);
  });
});
