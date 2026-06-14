import { z } from 'zod';

// shc_bid exact from blueprint/05-data-model/05-data-model.md (Phase 8)
export const BidStatus = z.enum(['pending', 'accepted', 'rejected']);
export type BidStatus = z.infer<typeof BidStatus>;

export const shcBidSchema = z.object({
  id: z.string(),
  request_id: z.string(),
  cook_id: z.string(),
  price_cents: z.number().int().positive(),
  message: z.string().optional(),
  status: BidStatus,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCBid = z.infer<typeof shcBidSchema>;
