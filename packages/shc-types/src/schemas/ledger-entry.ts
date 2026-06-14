import { z } from 'zod';

// shc_ledger_entry exact from blueprint/05-data-model/05-data-model.md (double-entry)
export const shcLedgerEntrySchema = z.object({
  id: z.string(),
  order_id: z.string().optional(),
  debit_account: z.string(),
  credit_account: z.string(),
  amount_cents: z.number().int().positive(),
  batch_id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCLedgerEntry = z.infer<typeof shcLedgerEntrySchema>;
