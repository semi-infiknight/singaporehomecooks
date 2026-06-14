import { z } from 'zod';

// shc_review exact from blueprint/05-data-model/05-data-model.md + 08-marketplace-rules (post-collection only)
export const shcReviewSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  cook_id: z.string(),
  customer_id: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCReview = z.infer<typeof shcReviewSchema>;
