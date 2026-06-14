import { CookStatus, SHCErrorCode } from '@shc/types';

// cook-status-gates rule per 08-marketplace-rules, 05 shc_cook.status, 07-auth, compliance
// Gates actions like accept order, request payout, list products. Uses compliance docs implicitly via status.

export interface CookGateContext {
  status: string;
  availabilityPaused: boolean;
  hasVerifiedCompliance?: boolean;
}

export function canCookListProducts(ctx: CookGateContext): { valid: boolean; error?: string; code?: SHCErrorCode } {
  if (ctx.status !== 'active') {
    return { valid: false, error: 'Cook must be active to list products', code: 'SHC-COOK-001' };
  }
  if (ctx.availabilityPaused) {
    return { valid: false, error: 'Availability paused for this cook', code: 'SHC-COOK-001' };
  }
  return { valid: true };
}

export function canCookAcceptOrder(ctx: CookGateContext): { valid: boolean; error?: string; code?: SHCErrorCode } {
  if (ctx.status !== 'active') {
    return { valid: false, error: 'Cook status does not allow accepting orders (SHC-COOK-001)', code: 'SHC-COOK-001' };
  }
  if (ctx.availabilityPaused) {
    return { valid: false, error: 'Cook has paused availability', code: 'SHC-AVAIL-001' };
  }
  if (ctx.hasVerifiedCompliance === false) {
    return { valid: false, error: 'Compliance docs required and not verified', code: 'SHC-COMPLIANCE-002' };
  }
  return { valid: true };
}

export function canCookRequestPayout(ctx: CookGateContext): { valid: boolean; error?: string; code?: SHCErrorCode } {
  if (ctx.status !== 'active') {
    return { valid: false, error: 'Cook not active; cannot request payout', code: 'SHC-COOK-001' };
  }
  if (ctx.hasVerifiedCompliance === false) {
    return { valid: false, error: 'Verified SFA/WSQ required for payouts', code: 'SHC-COMPLIANCE-002' };
  }
  return { valid: true };
}

export function validateCookStatusTransition(from: string, to: string): { valid: boolean; error?: string } {
  const allowed: Record<string, string[]> = {
    pending: ['active', 'suspended'],
    active: ['paused', 'suspended'],
    paused: ['active', 'suspended'],
    suspended: [],
  };
  if (!allowed[from]?.includes(to)) {
    return { valid: false, error: `Invalid cook status transition ${from} -> ${to}` };
  }
  return { valid: true };
}
