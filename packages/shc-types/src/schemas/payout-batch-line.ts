import { z } from 'zod';

export const PayoutBatchLineStatus = z.enum(['pending', 'approved', 'paid', 'skipped']);
export type PayoutBatchLineStatus = z.infer<typeof PayoutBatchLineStatus>;

export const shcPayoutBatchLineSchema = z
  .object({
    id: z.string(),
    batch_id: z.string(),
    cook_id: z.string(),
    amount_cents: z.number().int().nonnegative(),
    order_count: z.number().int().nonnegative().optional(),
    transfer_ref: z.string().optional(),
    status: PayoutBatchLineStatus.optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

export type SHCPayoutBatchLine = z.infer<typeof shcPayoutBatchLineSchema>;
