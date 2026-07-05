import { E2E_CART_SEED_ITEM } from './e2e-cart';

/** Stable discover product for offline morph/playwright evidence when API returns empty. */
export const OFFLINE_DISCOVER_PRODUCT = {
  id: E2E_CART_SEED_ITEM.id,
  name: E2E_CART_SEED_ITEM.name,
  price: E2E_CART_SEED_ITEM.price,
  cook_name: 'Auntie Siti',
  cook_id: 'cook_auntie_siti_001',
  cuisine: 'Malay',
  rating: 4.8,
  allergens: E2E_CART_SEED_ITEM.allergens,
  min_qty: 1,
} as const;

export function resolveDiscoverProductsForDisplay<T extends { id?: string }>(
  products: T[],
  opts: { evidence?: boolean } = {}
): T[] {
  if (products.length > 0) return products;
  if (opts.evidence) return [OFFLINE_DISCOVER_PRODUCT as unknown as T];
  return products;
}

export function resolveProductForDisplay<T>(
  product: T | null | undefined,
  productId: string,
  opts: { evidence?: boolean } = {}
): T | null | undefined {
  if (product) return product;
  if (opts.evidence && productId === OFFLINE_DISCOVER_PRODUCT.id) {
    return OFFLINE_DISCOVER_PRODUCT as unknown as T;
  }
  return product;
}

export function isFamilyValuesEvidenceMode(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FAMILY_VALUES_EVIDENCE === '1') {
    return true;
  }
  return false;
}