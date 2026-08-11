import { z } from 'zod';

// shc_availability exact from blueprint/05-data-model/05-data-model.md (Contracts Track)
export const shcAvailabilitySchema = z.object({
  product_id: z.string(),
  portions_per_day: z.number().int().positive(),
  collection_days: z.array(z.number().int().min(0).max(6)),
  time_slots: z.array(z.string()),
  paused: z.boolean(),
  /** Calendar days before collection the order must be placed. */
  min_order_lead_days: z.number().int().min(0).max(30).optional(),
  /** Hours before collection slot start the order must be placed. */
  min_order_lead_hours: z.number().int().min(0).max(336).optional(),
  /** Clock (HH:MM) on the lead day before collection, e.g. "14:00". */
  order_cutoff_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCAvailability = z.infer<typeof shcAvailabilitySchema>;

// For portions rule usage (e.g. check remaining)
export const portionsCheckInputSchema = z.object({
  product_id: z.string(),
  requested_qty: z.number().int().positive(),
  collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();
export type PortionsCheckInput = z.infer<typeof portionsCheckInputSchema>;
