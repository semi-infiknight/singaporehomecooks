/** S$50 platform minimum — matches platform_config minimum_order_value (Decisions_Log 29I). */
export const DEFAULT_MINIMUM_ORDER_CENTS = 5000;
export const TASTING_PORTION_MAX_CENTS = 800;

export type MinimumOrderLine = {
  tasting_portion?: boolean;
  price_cents?: number;
};

export type MinimumOrderContext = {
  totalCents: number;
  lines: MinimumOrderLine[];
  minimumCents?: number;
};

export function isTastingPortionLine(line: MinimumOrderLine): boolean {
  if (line.tasting_portion === true) return true;
  if (typeof line.price_cents === 'number' && line.price_cents > 0 && line.price_cents <= TASTING_PORTION_MAX_CENTS) {
    return true;
  }
  return false;
}

/** Block checkout when non-tasting cart total is below platform minimum. */
export function enforceMinimumOrder(ctx: MinimumOrderContext): { valid: boolean; error?: string; code?: string } {
  const minimum = ctx.minimumCents ?? DEFAULT_MINIMUM_ORDER_CENTS;
  const hasNonTasting = ctx.lines.some((line) => !isTastingPortionLine(line));
  if (!hasNonTasting) return { valid: true };
  if (ctx.totalCents >= minimum) return { valid: true };
  const dollars = (minimum / 100).toFixed(0);
  return {
    valid: false,
    code: 'SHC-CART-004',
    error: `Minimum order is S$${dollars}. Please add more portions or select a different listing.`,
  };
}
