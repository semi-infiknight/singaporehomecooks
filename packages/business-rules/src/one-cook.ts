import { SHCOrderStatus } from '@shc/types';

export interface CartItem { cookId: string; productId: string; qty: number; }

export function enforceOneCookPerCart(items: CartItem[]): { valid: boolean; error?: string; code?: string } {
  if (items.length === 0) return { valid: true };
  const cookIds = new Set(items.map(i => i.cookId));
  if (cookIds.size > 1) {
    return { valid: false, error: 'SHC-CART-001: One cook per cart enforced per 08-marketplace-rules.md', code: 'SHC-CART-001' };
  }
  return { valid: true };
}

export function enforceOneCookOnAdd(currentCookId: string | null, newCookId: string): { valid: boolean; error?: string; code?: string } {
  if (!currentCookId) return { valid: true };
  if (currentCookId !== newCookId) {
    return { valid: false, error: 'Only products from the same cook allowed in cart.', code: 'SHC-CART-001' };
  }
  return { valid: true };
}

// For order meta validation (one cook enforced)
export function enforceOneCookForOrder(orderCookId: string | undefined, lineItemCooks: string[]): { valid: boolean; error?: string } {
  if (!orderCookId && lineItemCooks.length === 0) return { valid: true };
  const unique = new Set(lineItemCooks);
  if (unique.size > 1 || (orderCookId && unique.size > 0 && !unique.has(orderCookId))) {
    return { valid: false, error: 'SHC-CART-001: One cook per order (MVP rule)' };
  }
  return { valid: true };
}
