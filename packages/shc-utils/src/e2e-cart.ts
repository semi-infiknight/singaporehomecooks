/** Stable Maestro checkout seed when API cart is empty. */
export const E2E_CART_SEED_ITEM = {
  id: 'dish_nasi_lemak_prawn_001',
  productId: 'dish_nasi_lemak_prawn_001',
  name: 'Nasi Lemak Sambal Prawn',
  price: 14,
  qty: 1,
  allergens: ['shellfish'],
} as const;

export function resolveCartForDisplay<T extends { items?: Array<Record<string, unknown>> }>(
  cart: T,
  opts: { dev?: boolean; maestroE2e?: boolean } = {}
): T {
  if ((cart.items?.length ?? 0) > 0) return cart;
  if (opts.dev || opts.maestroE2e) {
    return { ...cart, items: [E2E_CART_SEED_ITEM as unknown as Record<string, unknown>] } as T;
  }
  return cart;
}