import { z } from 'zod';
import { shcAvailabilitySchema } from '@shc/types';

// portions rule (separate from availability per task req) - min/max, exceed checks
// 08-marketplace-rules + production-hardening graceful degradation on fail

export interface PortionsContext {
  productMinQty: number;
  availablePortions: number;
  requested: number;
}

export function validateMinMaxPortions(ctx: PortionsContext): { valid: boolean; error?: string; code?: string } {
  if (ctx.requested < ctx.productMinQty) {
    return { valid: false, error: `Minimum quantity ${ctx.productMinQty} required`, code: 'SHC-CART-002' };
  }
  if (ctx.requested > ctx.availablePortions) {
    return { valid: false, error: `Only ${ctx.availablePortions} portions available`, code: 'SHC-AVAIL-002' };
  }
  if (ctx.requested <= 0) {
    return { valid: false, error: 'Requested portions must be positive', code: 'SHC-PORTIONS-001' };
  }
  return { valid: true };
}

export function computeRemainingPortions(available: number, booked: number): number {
  return Math.max(0, available - booked);
}

export const portionsValidationSchema = z.object({
  minQty: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  requested: z.number().int().positive(),
}).refine((d) => d.requested >= d.minQty && d.requested <= d.available, {
  message: 'Portions out of bounds (min/max)',
  path: ['requested'],
});
