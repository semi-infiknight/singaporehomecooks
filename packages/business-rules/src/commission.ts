// 15% default per locked decisions + 00-locked-decisions.md. Versioned in future via shc_commission_rule (see commission-rule schema).

export const DEFAULT_COMMISSION_RATE = 0.15;

export function calculateCookEarnings(priceCents: number, rate = DEFAULT_COMMISSION_RATE): number {
  if (priceCents < 0) throw new Error('price must be non-negative');
  return Math.floor(priceCents * (1 - rate));
}

export function calculatePlatformFee(priceCents: number, rate = DEFAULT_COMMISSION_RATE): number {
  if (priceCents < 0) throw new Error('price must be non-negative');
  return Math.floor(priceCents * rate);
}

export function applyCommissionRule(priceCents: number, ruleRatePct: number): { cook: number; platform: number; total: number } {
  const rate = ruleRatePct / 100;
  const platform = calculatePlatformFee(priceCents, rate);
  const cook = priceCents - platform;
  return { cook, platform, total: priceCents };
}

export function validateCommissionRate(rate: number): boolean {
  return rate >= 0 && rate <= 1;
}
