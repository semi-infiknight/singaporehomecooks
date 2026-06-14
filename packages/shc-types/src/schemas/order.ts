import { z } from 'zod';
import { SHCErrorCode } from '../errors';

// Order status enum from blueprint/09-order-state.md exactly
export const SHCOrderStatus = z.enum([
  'cart',
  'paid',
  'accepted',
  'preparing',
  'ready_for_collection',
  'collected',
  'completed',
  'cancelled',
  'disputed',
  'resolved',
]);
export type SHCOrderStatus = z.infer<typeof SHCOrderStatus>;

// shc_order_meta per 05-data-model.md (exact full columns)
export const shcOrderMetaSchema = z.object({
  order_id: z.string(),
  cook_id: z.string(),
  collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  collection_slot: z.string(), // e.g. "18:00-19:00"
  allergen_acked_at: z.string().datetime().optional(),
  address_released_at: z.string().datetime().optional(),
  paynow_reference: z.string().optional(),
  shc_status: SHCOrderStatus,
  // audit
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCOrderMeta = z.infer<typeof shcOrderMetaSchema>;

// State transition validation per 09-order-state.md
const validTransitions: Record<SHCOrderStatus, SHCOrderStatus[]> = {
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

export const orderStateTransitionSchema = z.object({
  from: SHCOrderStatus,
  to: SHCOrderStatus,
}).refine(
  (data) => validTransitions[data.from]?.includes(data.to),
  (data) => ({
    message: `Invalid transition from ${data.from} to ${data.to} - see 09-order-state.md`,
    path: ['to'],
  })
);

export type OrderStateTransition = z.infer<typeof orderStateTransitionSchema>;

// Helper to validate transition (used by workflows)
export function validateOrderTransition(from: SHCOrderStatus, to: SHCOrderStatus): { valid: boolean; error?: SHCErrorCode } {
  const result = orderStateTransitionSchema.safeParse({ from, to });
  if (result.success) return { valid: true };
  return { valid: false, error: 'SHC-ORDER-001' };
}
