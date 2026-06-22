/** Normalize cart line items from API (snake_case or camelCase). */
export type CartLineInput = {
  qty?: number;
  quantity?: number;
  price?: number;
  unit_price?: number;
  unitPrice?: number;
};

export type CartSummary = {
  itemCount: number;
  total: number;
  totalLabel: string;
  countLabel: string;
  badgeLabel: string;
  hasItems: boolean;
  previewName?: string;
};

export function formatSGD(amount: number): string {
  if (!Number.isFinite(amount)) return 'S$0.00';
  return `S$${amount.toFixed(2)}`;
}

/** First line item product id from Medusa cart (snake_case or camelCase). */
export function getFirstCartProductId(items: unknown[] = []): string | undefined {
  const first = items[0] as Record<string, unknown> | undefined;
  if (!first) return undefined;
  const id = first.product_id ?? first.productId;
  return id != null && String(id) ? String(id) : undefined;
}

export function summarizeCart(items: CartLineInput[] = [], previewName?: string): CartSummary {
  let itemCount = 0;
  let total = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.qty ?? item.quantity ?? 0)));
    const price = Number(item.price ?? item.unit_price ?? item.unitPrice ?? 0);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) continue;
    itemCount += qty;
    total += price * qty;
  }

  const badgeLabel = itemCount > 99 ? '99+' : String(itemCount);
  const countLabel = itemCount === 1 ? '1 item' : `${badgeLabel} items`;

  return {
    itemCount,
    total,
    totalLabel: formatSGD(total),
    countLabel,
    badgeLabel,
    hasItems: itemCount > 0,
    previewName,
  };
}