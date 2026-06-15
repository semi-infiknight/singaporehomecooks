/**
 * In-memory server cart for /store/shc/cart (local dev parity with mock-service).
 * Production: replace with Medusa core cart + SHC validation middleware.
 */
export type ShcCartItem = { product_id: string; name: string; qty: number; price: number; cook_id: string };
export type ShcCart = { items: ShcCartItem[]; cookId: string | null };

const carts = new Map<string, ShcCart>();

export function getCart(customerId: string): ShcCart {
  if (!carts.has(customerId)) carts.set(customerId, { items: [], cookId: null });
  return carts.get(customerId)!;
}

export function clearCart(customerId: string): ShcCart {
  const empty = { items: [], cookId: null };
  carts.set(customerId, empty);
  return empty;
}

export function addToCart(
  customerId: string,
  item: ShcCartItem,
  opts?: { enforceOneCook?: boolean }
): ShcCart {
  const cart = getCart(customerId);
  if (opts?.enforceOneCook !== false) {
    if (cart.cookId && cart.cookId !== item.cook_id) {
      throw new Error("SHC-CART-002: One cook per cart — clear cart before adding from another cook");
    }
    if (!cart.cookId) cart.cookId = item.cook_id;
  }
  const existing = cart.items.find((i) => i.product_id === item.product_id);
  if (existing) existing.qty += item.qty;
  else cart.items.push({ ...item });
  return cart;
}