import { z } from 'zod';

// shc_payout_batch exact from blueprint/05-data-model/05-data-model.md
export const PayoutBatchStatus = z.enum(['pending', 'approved', 'paid']);
export type PayoutBatchStatus = z.infer<typeof PayoutBatchStatus>;

export const shcPayoutBatchSchema = z.object({
  id: z.string(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: PayoutBatchStatus,
  total_cents: z.number().int().nonnegative(),
  transfer_ref: z.string().optional(),
  approved_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCPayoutBatch = z.infer<typeof shcPayoutBatchSchema>;
