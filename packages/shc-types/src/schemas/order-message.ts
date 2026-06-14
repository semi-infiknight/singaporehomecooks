import { z } from 'zod';

// shc_order_message exact from blueprint/05-data-model/05-data-model.md
export const SenderActor = z.enum(['customer', 'cook', 'ops']);
export type SenderActor = z.infer<typeof SenderActor>;

export const shcOrderMessageSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  sender_actor: SenderActor,
  sender_id: z.string(),
  body: z.string().min(1).max(2000),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCOrderMessage = z.infer<typeof shcOrderMessageSchema>;
