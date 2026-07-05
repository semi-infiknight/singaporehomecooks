import { E2E_CART_SEED_ITEM } from './e2e-cart';

/** Stable Maestro order for review + dispute tray flows (collected, no review/dispute yet). */
export const E2E_ORDER_SEED = {
  id: 'order-e2e-review',
  cook_id: 'cook_auntie_rose_tampines',
  items: [
    {
      product_id: E2E_CART_SEED_ITEM.id,
      productId: E2E_CART_SEED_ITEM.id,
      name: E2E_CART_SEED_ITEM.name,
      qty: 1,
      price: E2E_CART_SEED_ITEM.price,
    },
  ],
  total: E2E_CART_SEED_ITEM.price,
  shc_status: 'collected' as const,
  collection_date: '2026-07-05',
  collection_slot: '18:00-19:00',
  allergen_acked_at: new Date().toISOString(),
  pdpa_consent_at: new Date().toISOString(),
  customer_id: 'cust_demo',
  created_at: new Date().toISOString(),
};

export function resolveOrderForDisplay<T extends Record<string, unknown>>(
  order: T | null | undefined,
  orderId: string,
  opts: { dev?: boolean; maestroE2e?: boolean } = {}
): T | null | undefined {
  if (order) return order;
  if ((opts.dev || opts.maestroE2e) && orderId === E2E_ORDER_SEED.id) {
    return E2E_ORDER_SEED as unknown as T;
  }
  return order;
}