import { z } from 'zod';

/** Cook-led batch (“Cooking soon”) — inverse of customer request dish. */
export const DropStatus = z.enum([
  'open',
  'paused',
  'sold_out',
  'closed',
  'cancelled_min_not_met',
]);
export type DropStatus = z.infer<typeof DropStatus>;

export const DropVisibility = z.enum(['marketplace', 'kitchen_only']);
export type DropVisibility = z.infer<typeof DropVisibility>;

export const shcDropSchema = z
  .object({
    id: z.string(),
    cook_id: z.string(),
    title: z.string().min(2).max(120),
    note: z.string().max(500).optional().nullable(),
    image_url: z.string().max(500).optional().nullable(),
    product_id: z.string().optional().nullable(),
    price_cents: z.number().int().positive(),
    min_qty: z.number().int().nonnegative().default(0),
    max_qty: z.number().int().positive(),
    ordered_qty: z.number().int().nonnegative().default(0),
    cook_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    collection_slot: z.string().min(1).max(40),
    order_by: z.string().min(1), // ISO datetime preferred
    status: DropStatus,
    visibility: DropVisibility.default('marketplace'),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .strict();

export type SHCDrop = z.infer<typeof shcDropSchema>;
