import { E2E_CART_SEED_ITEM } from './e2e-cart';
import type { SHCOrderStatus } from '@shc/types';

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

const REVIEW_ELIGIBLE: SHCOrderStatus[] = ['collected', 'completed'];

export function isMaestroE2eOrderId(orderId: string): boolean {
  return orderId === E2E_ORDER_SEED.id;
}

export function resolveOrderForDisplay<T extends Record<string, unknown>>(
  order: T | null | undefined,
  orderId: string,
  opts: { maestroE2e?: boolean } = {}
): T | null | undefined {
  if (order) return order;
  if (opts.maestroE2e && isMaestroE2eOrderId(orderId)) {
    return E2E_ORDER_SEED as unknown as T;
  }
  return order;
}

export function resolveReviewForDisplay<T>(
  review: T | null | undefined,
  orderId: string,
  opts: { maestroE2e?: boolean } = {}
): T | null | undefined {
  if (review) return review;
  if (opts.maestroE2e && isMaestroE2eOrderId(orderId)) return null;
  return review;
}

export function resolveDisputesForDisplay<T>(
  disputes: T[] | null | undefined,
  orderId: string,
  opts: { maestroE2e?: boolean } = {}
): T[] {
  if (disputes && disputes.length > 0) return disputes;
  if (opts.maestroE2e && isMaestroE2eOrderId(orderId)) return [];
  return disputes ?? [];
}

export function orderTrayActions(args: {
  order: { shc_status?: string } | null | undefined;
  review: unknown;
  disputes: unknown[];
}): { showReviewBtn: boolean; showDisputeBtn: boolean } {
  const status = String(args.order?.shc_status ?? '');
  const showReviewBtn = REVIEW_ELIGIBLE.includes(status as SHCOrderStatus) && !args.review;
  const showDisputeBtn = (args.disputes?.length ?? 0) === 0;
  return { showReviewBtn, showDisputeBtn };
}