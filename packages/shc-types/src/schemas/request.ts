import { z } from 'zod';

// shc_request exact from blueprint/05-data-model/05-data-model.md (Phase 8)
export const RequestStatus = z.enum(['open', 'bidding', 'matched', 'closed']);
export type RequestStatus = z.infer<typeof RequestStatus>;

export const shcRequestSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  body: z.string().min(10),
  youtube_url: z.string().url().optional(),
  party_size: z.number().int().positive().optional(),
  budget_cents: z.number().int().nonnegative().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: RequestStatus,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCRequest = z.infer<typeof shcRequestSchema>;
