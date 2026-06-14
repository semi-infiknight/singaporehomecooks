import { SHCErrorCode } from '@shc/types';

export function validateMinQty(productMinQty: number, requestedQty: number): { valid: boolean; error?: string; code?: SHCErrorCode } {
  if (requestedQty < productMinQty) {
    return { valid: false, error: `Minimum order quantity is ${productMinQty}`, code: 'SHC-CART-002' };
  }
  if (requestedQty <= 0) {
    return { valid: false, error: 'Quantity must be positive', code: 'SHC-PORTIONS-001' };
  }
  return { valid: true };
}

export function validateMinQtyForProduct(product: { min_qty: number }, qty: number) {
  return validateMinQty(product.min_qty, qty);
}
