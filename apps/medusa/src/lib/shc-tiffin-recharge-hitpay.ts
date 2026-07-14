/** HitPay reference: TRECH-{customerId}-{weeks}W (webhook completes recharge). */
export function tiffinRechargeHitPayReference(customerId: string, weeks: number): string {
  return `TRECH-${customerId}-${weeks}W`.slice(0, 120);
}

export function parseTiffinRechargeHitPayReference(ref: string): { customerId: string; weeks: number } | null {
  const m = String(ref || "").trim().match(/^TRECH-(.+)-(\d{1,2})W$/i);
  if (!m) return null;
  const weeks = parseInt(m[2], 10);
  if (!Number.isFinite(weeks) || weeks < 1 || weeks > 12) return null;
  return { customerId: m[1], weeks };
}
