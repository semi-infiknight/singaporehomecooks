/**
 * Collaboration Board bid helpers (cook → customer recipe requests).
 * UI enters dollars (S$); API stores price_cents.
 */

/** Parse cook-entered bid amount in SGD dollars → integer cents. */
export function parseBidDollarsToCents(raw: string | number | null | undefined): {
  ok: true;
  cents: number;
} | { ok: false; message: string } {
  if (raw == null || raw === '') {
    return { ok: false, message: 'Enter a bid amount in S$.' };
  }
  const cleaned = String(raw)
    .trim()
    .replace(/S\$/gi, '')
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '');
  if (!cleaned) {
    return { ok: false, message: 'Enter a bid amount in S$.' };
  }
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return { ok: false, message: 'Bid must be a positive amount in S$.' };
  }
  if (dollars > 100_000) {
    return { ok: false, message: 'Bid amount looks too high. Check the figure.' };
  }
  const cents = Math.round(dollars * 100);
  if (cents < 1) {
    return { ok: false, message: 'Bid must be at least S$0.01.' };
  }
  return { ok: true, cents };
}

export function formatBidCentsAsDollars(cents: number): string {
  const n = Math.max(0, Math.floor(Number(cents) || 0));
  return `S$${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}
