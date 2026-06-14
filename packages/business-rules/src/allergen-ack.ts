import { z } from 'zod';
import { SHCErrorCode } from '@shc/types';

export const allergenAckSchema = z.object({
  allergen_acked_at: z.string().datetime().nullable().optional(),
});

export function requiresAllergenAck(meta: { allergen_acked_at?: string | null }): boolean {
  return !meta.allergen_acked_at;
}

export function validateAllergenAckForCheckout(meta: { allergen_acked_at?: string | null }): { valid: boolean; error?: string; code?: SHCErrorCode } {
  if (requiresAllergenAck(meta)) {
    return { valid: false, error: 'Allergen acknowledgment is mandatory before checkout (08-marketplace-rules.md)', code: 'SHC-CART-003' };
  }
  return { valid: true };
}

export function ackAllergens(meta: { allergen_acked_at?: string | null }, ackTime: string): { meta: any; valid: boolean } {
  return { meta: { ...meta, allergen_acked_at: ackTime }, valid: true };
}
