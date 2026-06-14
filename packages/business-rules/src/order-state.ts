import { SHCOrderStatus, validateOrderTransition, SHCErrorCode } from '@shc/types';

export function canTransition(from: SHCOrderStatus, to: SHCOrderStatus): boolean {
  const res = validateOrderTransition(from, to);
  return res.valid;
}

export function validateTransitionWithCode(from: SHCOrderStatus, to: SHCOrderStatus): { valid: boolean; error?: SHCErrorCode } {
  const res = validateOrderTransition(from, to);
  return res;
}

export const TERMINAL_STATES: SHCOrderStatus[] = ['completed', 'cancelled', 'resolved'];

export function isTerminal(state: SHCOrderStatus): boolean {
  return TERMINAL_STATES.includes(state);
}

export function getAllowedNext(from: SHCOrderStatus): SHCOrderStatus[] {
  // mirrored from order.ts validTransitions for rule exposure
  const map: Record<SHCOrderStatus, SHCOrderStatus[]> = {
    cart: ['paid'],
    paid: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready_for_collection', 'cancelled'],
    ready_for_collection: ['collected', 'cancelled'],
    collected: ['completed', 'disputed'],
    completed: [],
    cancelled: [],
    disputed: ['resolved', 'cancelled'],
    resolved: [],
  };
  return map[from] || [];
}
