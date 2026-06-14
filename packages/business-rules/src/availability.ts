import { shcAvailabilitySchema, SHCAvailability } from '@shc/types';
import { validateMinMaxPortions } from './portions';

// Availability rule per 08-marketplace-rules.md + 05-data-model + 09 (visibility + slot checks)
export function isProductVisible(availability: unknown, cookStatus: string, cookAvailabilityPaused: boolean): { valid: boolean; error?: string; code?: string } {
  const parsed = shcAvailabilitySchema.safeParse(availability);
  if (!parsed.success) {
    return { valid: false, error: 'Invalid availability shape' };
  }
  const a = parsed.data;
  if (cookStatus !== 'active' || cookAvailabilityPaused || a.paused) {
    return { valid: false, error: 'Cook or product availability paused or cook not active', code: 'SHC-COOK-001' };
  }
  if (a.portions_per_day <= 0) {
    return { valid: false, error: 'No portions available', code: 'SHC-AVAIL-002' };
  }
  return { valid: true };
}

export function checkAvailabilityForDate(avail: SHCAvailability, dayOfWeek: number): { valid: boolean; error?: string; remaining?: number } {
  if (!avail.collection_days.includes(dayOfWeek)) {
    return { valid: false, error: 'SHC-AVAIL-001: No collection on this day' };
  }
  return { valid: true, remaining: avail.portions_per_day };
}

export function validateAvailabilityAndPortions(avail: SHCAvailability, requested: number, minQty: number, dayOfWeek: number): { valid: boolean; error?: string; code?: string } {
  const slot = checkAvailabilityForDate(avail, dayOfWeek);
  if (!slot.valid) return slot;
  const p = validateMinMaxPortions({ productMinQty: minQty, availablePortions: slot.remaining!, requested });
  if (!p.valid) return { valid: false, error: p.error, code: p.code };
  return { valid: true };
}

export function checkAvailability(portions: number, requested: number): { valid: boolean; error?: string } {
  if (requested > portions) return { valid: false, error: 'SHC-AVAIL-001: Portions exceeded' };
  return { valid: true };
}
