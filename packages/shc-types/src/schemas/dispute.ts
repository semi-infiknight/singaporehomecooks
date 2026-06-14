import { z } from 'zod';

// shc_dispute exact from blueprint/05-data-model/05-data-model.md + 09-order-state
export const DisputeType = z.enum(['customer_complaint', 'cook_cancelled_late', 'quality', 'other']);
export type DisputeType = z.infer<typeof DisputeType>;

export const DisputeStatus = z.enum(['open', 'resolved', 'cancelled']);
export type DisputeStatus = z.infer<typeof DisputeStatus>;

export const shcDisputeSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  raised_by: z.enum(['customer', 'cook', 'ops']),
  type: DisputeType,
  status: DisputeStatus,
  notes: z.string().optional(),
  resolution: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCDispute = z.infer<typeof shcDisputeSchema>;
