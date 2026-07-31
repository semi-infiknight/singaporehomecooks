import { z } from 'zod';

// Full SHCErrorCode enum matching ERROR_CODES.md (Contracts Track source of truth)
// All codes used in production code must be listed here and in blueprint/ERROR_CODES.md
export const SHCErrorCode = z.enum([
  'SHC-AUTH-001',
  'SHC-ORDER-001',
  'SHC-ORDER-002',
  'SHC-ORDER-003',
  'SHC-ORDER-004',
  'SHC-CART-001',
  'SHC-CART-002',
  'SHC-CART-003',
  'SHC-PAY-001',
  'SHC-PAY-002',
  'SHC-COMPLIANCE-001',
  'SHC-COMPLIANCE-002',
  'SHC-AVAIL-001',
  'SHC-AVAIL-002',
  'SHC-DISPUTE-001',
  'SHC-DISPUTE-002',
  'SHC-COMMISSION-001',
  'SHC-PAYOUT-001',
  'SHC-LEDGER-001',
  'SHC-REVIEW-001',
  'SHC-COOK-001',
  'SHC-PORTIONS-001',
  'SHC-REQ-001',
  'SHC-GENERIC-001',
]);

export type SHCErrorCode = z.infer<typeof SHCErrorCode>;

// Map with human descriptions (for formatError, UI, ops runbook). Keep in sync with ERROR_CODES.md
export const SHCErrorCodes: Record<SHCErrorCode, string> = {
  'SHC-AUTH-001': 'Invalid or expired token',
  'SHC-ORDER-001': 'Invalid state transition attempted',
  'SHC-ORDER-002': 'Cook acceptance window expired',
  'SHC-ORDER-003': 'Order not in valid state for this action',
  'SHC-ORDER-004': 'Collection slot is in the past or invalid',
  'SHC-CART-001': 'Multiple cooks detected in cart',
  'SHC-CART-002': 'Minimum quantity not met for product',
  'SHC-CART-003': 'Allergen acknowledgment is required before checkout',
  'SHC-PAY-001': 'PayNow reference already used',
  'SHC-PAY-002': 'PayNow provider unavailable',
  'SHC-COMPLIANCE-001': 'Cook missing required SFA/WSQ doc',
  'SHC-COMPLIANCE-002': 'Cook compliance docs not verified for this action',
  'SHC-AVAIL-001': 'Requested slot no longer available',
  'SHC-AVAIL-002': 'Requested portions exceed available for the day/slot',
  'SHC-DISPUTE-001': 'Dispute window closed',
  'SHC-DISPUTE-002': 'Invalid dispute type, raised_by or status',
  'SHC-COMMISSION-001': 'No matching commission rule for version/effective date',
  'SHC-PAYOUT-001': 'Payout batch already processed or invalid status for approval',
  'SHC-LEDGER-001': 'Ledger entry would violate double-entry balance or missing accounts',
  'SHC-REVIEW-001': 'Reviews only allowed for orders in collected or later state; one per order',
  'SHC-COOK-001': 'Cook status does not permit this action (must be active, not paused/suspended)',
  'SHC-PORTIONS-001': 'Portions validation failed (min/max or availability)',
  'SHC-REQ-001': 'Custom request bid window closed or invalid status',
  'SHC-GENERIC-001': 'An unexpected error occurred',
} as const;

export interface SHCError {
  code: SHCErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export function createSHCError(code: SHCErrorCode, message: string, details?: Record<string, unknown>): SHCError {
  return { code, message, details };
}

/** Flatten Zod `format()` trees from API `error.details` into user-facing strings. */
function collectZodDetailMessages(details: unknown): string[] {
  if (!details || typeof details !== 'object') return [];
  const obj = details as Record<string, unknown>;
  const messages: string[] = [];
  if (Array.isArray(obj._errors)) {
    for (const entry of obj._errors) {
      if (typeof entry === 'string' && entry.trim()) messages.push(entry.trim());
    }
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_errors') continue;
    messages.push(...collectZodDetailMessages(value));
  }
  return messages;
}

/** Prefer field-level validation copy over generic API messages like "Invalid listing". */
export function formatShcErrorUserMessage(message: string, details?: Record<string, unknown>): string {
  const detailMessages = details ? [...new Set(collectZodDetailMessages(details))] : [];
  if (detailMessages.length === 0) return message;
  const generic =
    !message.trim() ||
    message === 'Invalid listing' ||
    message === SHCErrorCodes['SHC-GENERIC-001'];
  if (generic) return detailMessages.join(' ');
  return `${message} ${detailMessages.join(' ')}`.trim();
}

export function formatError(code: SHCErrorCode, message?: string, details?: Record<string, unknown>): { error: SHCError } {
  // Enforce only known codes at runtime for production hardening (see production-hardening.md)
  const parsed = SHCErrorCode.safeParse(code);
  if (!parsed.success) {
    throw new Error(`Unknown SHCErrorCode: ${code}. All codes must be registered in ERROR_CODES.md and shc-types.`);
  }
  const baseMessage = message || SHCErrorCodes[parsed.data];
  return {
    error: {
      code: parsed.data,
      message: baseMessage,
      details,
    },
  };
}
