import { z } from 'zod';

// shc_cook_expense exact from blueprint/05-data-model/05-data-model.md
export const shcCookExpenseSchema = z.object({
  id: z.string(),
  cook_id: z.string(),
  amount_cents: z.number().int().positive(),
  category: z.string(),
  receipt_key: z.string().optional(), // MinIO
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCCookExpense = z.infer<typeof shcCookExpenseSchema>;
